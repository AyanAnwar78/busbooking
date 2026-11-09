import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import SeatLayout from '../components/SeatLayout';
import { Bus, Clock, Calendar, MapPin, AlertCircle, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function SeatSelectPage() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [passengerDetails, setPassengerDetails] = useState({});
  const [selectedBoarding, setSelectedBoarding] = useState('');
  const [selectedDropping, setSelectedDropping] = useState('');
  const [contactPhone, setContactPhone] = useState(user?.phone || '');
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [conflictError, setConflictError] = useState('');

  useEffect(() => {
    fetchTripDetails();
  }, [id]);

  useEffect(() => {
    if (user) {
      if (!contactPhone && user.phone) setContactPhone(user.phone);
      if (!contactEmail && user.email) setContactEmail(user.email);
    }
  }, [user]);

  const fetchTripDetails = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/trips/${id}`);
      const tripData = res.data.trip;
      setTrip(tripData);

      if (tripData.route?.boardingPoints?.length > 0) {
        setSelectedBoarding(tripData.route.boardingPoints[0].name);
      }
      if (tripData.route?.droppingPoints?.length > 0) {
        setSelectedDropping(tripData.route.droppingPoints[0].name);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load trip details');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSeat = (seat) => {
    setConflictError('');
    const seatNo = seat.seatNumber;

    if (selectedSeats.includes(seatNo)) {
      // Remove
      setSelectedSeats(selectedSeats.filter((s) => s !== seatNo));
      const updated = { ...passengerDetails };
      delete updated[seatNo];
      setPassengerDetails(updated);
    } else {
      // Add (up to max 6)
      if (selectedSeats.length >= 6) {
        alert('You can select a maximum of 6 seats per booking.');
        return;
      }
      setSelectedSeats([...selectedSeats, seatNo]);
      setPassengerDetails({
        ...passengerDetails,
        [seatNo]: {
          name: selectedSeats.length === 0 && user ? user.name : '',
          age: 25,
          gender: 'Male',
          seatNumber: seatNo
        }
      });
    }
  };

  const handlePassengerChange = (seatNo, field, val) => {
    setPassengerDetails({
      ...passengerDetails,
      [seatNo]: {
        ...passengerDetails[seatNo],
        [field]: val
      }
    });
  };

  // Compute total amount
  const totalAmount = selectedSeats.reduce((sum, seatNo) => {
    const sObj = trip?.seats?.find((s) => s.seatNumber === seatNo);
    return sum + (sObj?.fare || trip?.baseFare || 0);
  }, 0);

  const handleBookTicket = async (e) => {
    e.preventDefault();
    setConflictError('');

    if (!isAuthenticated) {
      navigate('/login', { state: { from: `/trip/${id}` } });
      return;
    }

    if (selectedSeats.length === 0) {
      alert('Please select at least one seat from the layout.');
      return;
    }

    // Validate passenger fields
    const passengersList = [];
    for (const seatNo of selectedSeats) {
      const p = passengerDetails[seatNo];
      if (!p || !p.name.trim()) {
        alert(`Please enter passenger name for seat ${seatNo}.`);
        return;
      }
      passengersList.push({
        name: p.name.trim(),
        age: Number(p.age) || 25,
        gender: p.gender || 'Male',
        seatNumber: seatNo
      });
    }

    const boardingObj = trip.route?.boardingPoints?.find((b) => b.name === selectedBoarding) || {
      name: selectedBoarding,
      time: trip.departureTime
    };

    const droppingObj = trip.route?.droppingPoints?.find((d) => d.name === selectedDropping) || {
      name: selectedDropping,
      time: trip.arrivalTime
    };

    setBookingLoading(true);
    try {
      const res = await api.post('/bookings', {
        tripId: trip._id,
        seatNumbers: selectedSeats,
        passengerDetails: passengersList,
        boardingPoint: boardingObj,
        droppingPoint: droppingObj,
        contactPhone,
        contactEmail
      });

      const confirmedPNR = res.data.booking.pnr;
      navigate(`/booking-confirmed/${confirmedPNR}`);
    } catch (err) {
      if (err.response?.status === 409) {
        // Concurrency / Race Condition Conflict!
        setConflictError(
          'Seat conflict: One or more selected seats were just confirmed by another customer. Please select another seat.'
        );
        // Refresh trip seat status
        fetchTripDetails();
        setSelectedSeats([]);
      } else {
        alert(err.response?.data?.message || 'Failed to complete booking');
      }
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-800 p-6 rounded-2xl max-w-xl mx-auto my-12 text-center">
        <AlertCircle className="w-8 h-8 mx-auto mb-2 text-rose-600" />
        <h3 className="font-bold text-base mb-1">Error Loading Trip</h3>
        <p className="text-xs mb-4">{error || 'Trip not found'}</p>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-bold"
        >
          Return to Home
        </button>
      </div>
    );
  }

  const depDate = new Date(trip.departureTime);
  const arrDate = new Date(trip.arrivalTime);

  return (
    <div className="space-y-8">
      {/* Trip Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 text-xl">
                {trip.route?.origin} → {trip.route?.destination}
              </span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                {trip.operator?.name}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5" />
              <span>{depDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
              <span>•</span>
              <Clock className="w-3.5 h-3.5" />
              <span>Departs {depDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <span>•</span>
              <span>{trip.bus?.busType} ({trip.bus?.busNumber})</span>
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 uppercase font-semibold">Base Fare</span>
            <div className="text-2xl font-extrabold text-emerald-600">₹{trip.baseFare}</div>
          </div>
        </div>
      </div>

      {/* Concurrency Conflict Banner if triggered */}
      {conflictError && (
        <div className="bg-amber-50 border-2 border-amber-400 text-amber-900 p-4 rounded-xl flex items-center gap-3 animate-bounce">
          <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0" />
          <div className="text-xs">
            <strong className="block text-sm font-bold">Seat Double-Booking Prevented:</strong>
            {conflictError}
          </div>
        </div>
      )}

      {/* Main Grid: Interactive Seat Layout on Left, Checkout Form on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Seat Map Layout */}
        <div className="lg:col-span-6 space-y-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="font-bold text-slate-900 text-sm">Select Your Preferred Seats</h3>
            <span className="text-xs text-slate-500">
              Selected: <strong className="text-emerald-600">{selectedSeats.length}</strong> / 6
            </span>
          </div>

          <SeatLayout
            seats={trip.seats || []}
            selectedSeats={selectedSeats}
            onToggleSeat={handleToggleSeat}
          />
        </div>

        {/* Right: Boarding Points & Passenger Checkout */}
        <div className="lg:col-span-6">
          <form
            onSubmit={handleBookTicket}
            className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6"
          >
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Booking Summary</h3>
              <div className="text-right">
                <span className="text-xs text-slate-400">Total Payable:</span>
                <div className="text-xl font-extrabold text-emerald-600">₹{totalAmount}</div>
              </div>
            </div>

            {/* Boarding and Dropping Point Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Boarding Point
                </label>
                <select
                  required
                  value={selectedBoarding}
                  onChange={(e) => setSelectedBoarding(e.target.value)}
                  className="w-full text-xs font-bold text-slate-800 px-3 py-2.5 border border-slate-300 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="" disabled>-- Select Boarding Point --</option>
                  {trip.route?.boardingPoints?.map((bp, i) => (
                    <option key={i} value={bp.name} className="text-slate-800 font-semibold py-1">
                      {bp.name} {bp.landmark ? `(${bp.landmark})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Dropping Point
                </label>
                <select
                  required
                  value={selectedDropping}
                  onChange={(e) => setSelectedDropping(e.target.value)}
                  className="w-full text-xs font-bold text-slate-800 px-3 py-2.5 border border-slate-300 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="" disabled>-- Select Dropping Point --</option>
                  {trip.route?.droppingPoints?.map((dp, i) => (
                    <option key={i} value={dp.name} className="text-slate-800 font-semibold py-1">
                      {dp.name} {dp.landmark ? `(${dp.landmark})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dynamic Passenger Forms */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-3">
                Passenger Details ({selectedSeats.length > 0 ? selectedSeats.join(', ') : 'None Selected'})
              </label>

              {selectedSeats.length === 0 ? (
                <div className="bg-slate-50 border border-dashed border-slate-200 rounded-xl p-6 text-center text-xs text-slate-500">
                  Please click on the bus seats on the left to add passengers.
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedSeats.map((seatNo) => {
                    const p = passengerDetails[seatNo] || {};
                    return (
                      <div key={seatNo} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                            Seat {seatNo}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="sm:col-span-2">
                            <input
                              type="text"
                              required
                              placeholder="Full Name"
                              value={p.name || ''}
                              onChange={(e) => handlePassengerChange(seatNo, 'name', e.target.value)}
                              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="number"
                              required
                              min="1"
                              max="120"
                              placeholder="Age"
                              value={p.age || 25}
                              onChange={(e) => handlePassengerChange(seatNo, 'age', e.target.value)}
                              className="w-full text-xs px-2 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white text-center"
                            />

                            <select
                              value={p.gender || 'Male'}
                              onChange={(e) => handlePassengerChange(seatNo, 'gender', e.target.value)}
                              className="w-full text-xs font-semibold text-slate-800 px-2 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white cursor-pointer"
                            >
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Other">Other</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Contact Details */}
            <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Contact Mobile Phone
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 9876543210"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Ticket Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="passenger@example.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={selectedSeats.length === 0 || bookingLoading}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {bookingLoading ? (
                <span>Confirming Booking...</span>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Confirm Booking & Generate PNR (₹{totalAmount})</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

