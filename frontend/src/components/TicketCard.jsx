import React, { useState } from 'react';
import { Ticket, Bus, Calendar, Clock, MapPin, User, AlertCircle, ArrowRight, Printer, XCircle } from 'lucide-react';

export default function TicketCard({ booking, onCancel }) {
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('Personal plan change');
  const [cancelling, setCancelling] = useState(false);

  const isCancelled = booking.status === 'CANCELLED';
  const trip = booking.trip;
  const route = trip?.route;
  const operator = trip?.operator;
  const bus = trip?.bus;

  const depDate = trip ? new Date(trip.departureTime) : new Date(booking.createdAt);
  const arrDate = trip ? new Date(trip.arrivalTime) : new Date(booking.createdAt);

  // Cancellation refund preview calculation
  const hoursUntilDeparture = trip
    ? (new Date(trip.departureTime).getTime() - Date.now()) / (1000 * 60 * 60)
    : 0;

  let expectedRefundPct = 0;
  if (hoursUntilDeparture >= 24) expectedRefundPct = 90;
  else if (hoursUntilDeparture >= 12) expectedRefundPct = 50;
  else expectedRefundPct = 0;

  const expectedRefundAmount = Math.round((booking.totalAmount * expectedRefundPct) / 100);

  const handleConfirmCancel = async () => {
    setCancelling(true);
    try {
      await onCancel(booking._id, cancelReason);
      setShowCancelModal(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel booking');
    } finally {
      setCancelling(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={`bg-white rounded-2xl border ${isCancelled ? 'border-rose-200 opacity-90' : 'border-slate-200'} shadow-sm overflow-hidden mb-6 transition`}>
      {/* Ticket Header Banner */}
      <div className={`px-6 py-4 flex flex-wrap justify-between items-center gap-4 ${isCancelled ? 'bg-rose-50 text-rose-900 border-b border-rose-100' : 'bg-slate-900 text-white'}`}>
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl ${isCancelled ? 'bg-rose-200 text-rose-800' : 'bg-emerald-500/20 text-emerald-400'}`}>
            <Ticket className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-semibold tracking-wider uppercase opacity-75">PNR Reference</span>
            <h3 className="text-lg font-extrabold font-mono tracking-wider">{booking.pnr}</h3>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider ${
              isCancelled
                ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/30'
                : 'bg-emerald-500 text-white shadow-sm shadow-emerald-500/30'
            }`}
          >
            {booking.status}
          </span>
          <button
            onClick={handlePrint}
            title="Print Ticket"
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Operator & Bus Details */}
        <div className="flex flex-wrap justify-between items-center pb-4 mb-6 border-b border-slate-100 gap-4">
          <div>
            <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Bus className="w-4 h-4 text-emerald-600" />
              {operator?.name || 'Bus Operator'}
            </h4>
            <p className="text-xs text-slate-500">
              {bus?.busType || 'AC Express'} • Vehicle #{bus?.busNumber || 'N/A'}
            </p>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 uppercase font-bold">Total Fare</span>
            <div className="text-xl font-extrabold text-emerald-600">₹{booking.totalAmount}</div>
          </div>
        </div>

        {/* Journey Timeline */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 bg-slate-50 p-4 rounded-xl">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase">Departure</span>
            <div className="text-lg font-bold text-slate-900">{route?.origin || 'Origin'}</div>
            <div className="text-xs text-slate-600 flex items-center gap-1 mt-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {depDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="text-xs text-slate-500 mt-1 font-medium">
              {booking.boardingPoint?.name}
            </div>
          </div>

          <div className="flex flex-col items-center justify-center text-center">
            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              {route?.estimatedDurationMinutes ? `${Math.floor(route.estimatedDurationMinutes / 60)}h ${route.estimatedDurationMinutes % 60}m` : 'Direct Route'}
            </span>
            <div className="w-full flex items-center justify-center my-2">
              <div className="h-0.5 w-1/3 bg-slate-300"></div>
              <ArrowRight className="w-4 h-4 text-slate-400 mx-2" />
              <div className="h-0.5 w-1/3 bg-slate-300"></div>
            </div>
            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {depDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
          </div>

          <div className="text-right md:text-right">
            <span className="text-xs font-semibold text-slate-400 uppercase">Arrival</span>
            <div className="text-lg font-bold text-slate-900">{route?.destination || 'Destination'}</div>
            <div className="text-xs text-slate-600 flex items-center gap-1 justify-end mt-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {arrDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="text-xs text-slate-500 mt-1 font-medium">
              {booking.droppingPoint?.name}
            </div>
          </div>
        </div>

        {/* Passenger Manifest and Seats */}
        <div className="border border-slate-200 rounded-xl overflow-hidden mb-6">
          <div className="bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 uppercase tracking-wider flex justify-between items-center">
            <span>Passenger Details ({booking.passengerDetails?.length || 0})</span>
            <span>Allocated Seats: {booking.seatNumbers?.join(', ')}</span>
          </div>
          <div className="divide-y divide-slate-100">
            {booking.passengerDetails?.map((p, idx) => (
              <div key={idx} className="px-4 py-3 flex justify-between items-center text-sm">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" />
                  <span className="font-semibold text-slate-900">{p.name}</span>
                  <span className="text-xs text-slate-500">({p.gender}, {p.age} yrs)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Seat:</span>
                  <span className="font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {p.seatNumber}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cancellation Details Banner if already cancelled */}
        {isCancelled && booking.cancellationDetails && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl mb-4 text-xs text-rose-900">
            <div className="font-bold flex items-center gap-1 text-sm mb-1 text-rose-700">
              <AlertCircle className="w-4 h-4" />
              Ticket Cancelled
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
              <div>
                <span className="text-slate-500">Refund Percentage:</span>
                <p className="font-bold">{booking.cancellationDetails.refundPercentage}%</p>
              </div>
              <div>
                <span className="text-slate-500">Refund Amount:</span>
                <p className="font-bold text-emerald-700">₹{booking.cancellationDetails.refundAmount}</p>
              </div>
              <div>
                <span className="text-slate-500">Cancellation Fee:</span>
                <p className="font-bold text-rose-700">₹{booking.cancellationDetails.cancellationFee}</p>
              </div>
              <div>
                <span className="text-slate-500">Refund Status:</span>
                <p className="font-bold uppercase">{booking.cancellationDetails.refundStatus}</p>
              </div>
            </div>
          </div>
        )}

        {/* Action: Cancel Ticket Button */}
        {!isCancelled && onCancel && (
          <div className="flex justify-end pt-2">
            <button
              onClick={() => setShowCancelModal(true)}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 border border-rose-200 hover:bg-rose-50 px-4 py-2 rounded-lg transition flex items-center gap-1.5"
            >
              <XCircle className="w-4 h-4" />
              Cancel Booking & Request Refund
            </button>
          </div>
        )}
      </div>

      {/* Cancellation Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Cancel Ticket ({booking.pnr})?</h3>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              According to the trip cancellation policy, seats will be released back to the general pool immediately.
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-xs text-amber-900">
              <div className="font-bold mb-1">Estimated Refund Calculation:</div>
              <ul className="space-y-1">
                <li>• Hours before departure: <strong>{hoursUntilDeparture > 0 ? hoursUntilDeparture.toFixed(1) : 0} hrs</strong></li>
                <li>• Applicable Refund Rate: <strong>{expectedRefundPct}%</strong></li>
                <li>• Estimated Refund Amount: <strong className="text-emerald-700">₹{expectedRefundAmount}</strong></li>
                <li>• Cancellation Fee: <strong className="text-rose-700">₹{booking.totalAmount - expectedRefundAmount}</strong></li>
              </ul>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Cancellation</label>
              <input
                type="text"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
                placeholder="Enter cancellation reason"
              />
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Go Back
              </button>
              <button
                type="button"
                disabled={cancelling}
                onClick={handleConfirmCancel}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm shadow-rose-600/30 transition disabled:opacity-50"
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

