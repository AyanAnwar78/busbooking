import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { Bus, Clock, Calendar, ArrowRight, Filter, AlertCircle, Sparkles, MapPin } from 'lucide-react';

export default function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const origin = searchParams.get('origin') || '';
  const destination = searchParams.get('destination') || '';
  const date = searchParams.get('date') || '';

  const [trips, setTrips] = useState([]);
  const [isAlternativeDate, setIsAlternativeDate] = useState(false);
  const [nextAvailableDate, setNextAvailableDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBusType, setSelectedBusType] = useState('ALL');
  const [sortBy, setSortBy] = useState('departure');

  const navigate = useNavigate();

  useEffect(() => {
    const fetchTrips = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get('/trips/search', {
          params: { origin, destination, date, sortBy }
        });
        setTrips(res.data.trips || []);
        setIsAlternativeDate(!!res.data.isAlternativeDate);
        setNextAvailableDate(res.data.nextAvailableDate || null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to search trips. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (origin && destination) {
      fetchTrips();
    }
  }, [origin, destination, date, sortBy]);

  const filteredTrips = trips.filter((t) => {
    if (selectedBusType === 'ALL') return true;
    return t.bus?.busType === selectedBusType;
  });

  const busTypes = ['ALL', ...new Set(trips.map((t) => t.bus?.busType).filter(Boolean))];

  return (
    <div className="space-y-8">
      {/* Route Header Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Search Results</span>
            <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-3 mt-1">
              <span>{origin}</span>
              <ArrowRight className="w-5 h-5 text-emerald-600" />
              <span>{destination}</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{date ? new Date(date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }) : 'All Dates'}</span>
              <span>•</span>
              <span className="font-semibold text-emerald-600">{filteredTrips.length} Trips Available</span>
            </p>
          </div>

          <Link
            to="/"
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-xl transition"
          >
            Modify Search
          </Link>
        </div>

        {/* Quick Travel Date Switcher */}
        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-100 flex-wrap">
          <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Select Travel Date:</span>
          </span>
          <input
            type="date"
            value={date}
            onChange={(e) => navigate(`/search?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&date=${e.target.value}`)}
            className="text-xs font-bold text-slate-800 border border-slate-300 rounded-xl px-3 py-1.5 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer shadow-sm"
          />
          <button
            type="button"
            onClick={() => {
              const base = date ? new Date(date) : new Date();
              base.setDate(base.getDate() + 1);
              const nextStr = base.toISOString().split('T')[0];
              navigate(`/search?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&date=${nextStr}`);
            }}
            className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3.5 py-1.5 rounded-xl transition"
          >
            +1 Day Next ➔
          </button>
        </div>
      </div>

      {/* Main Content with Sidebar Filters */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center gap-2 font-bold text-slate-900 text-sm pb-4 mb-4 border-b border-slate-100">
              <Filter className="w-4 h-4 text-emerald-600" />
              <span>Filter & Sort</span>
            </div>

            {/* Sort Order */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full text-xs font-bold text-slate-800 px-3 py-2.5 border border-slate-300 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                <option value="departure">Departure Time (Earliest First)</option>
                <option value="fare">Base Fare (Lowest First)</option>
              </select>
            </div>

            {/* Bus Type Filter */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Bus Type</label>
              <div className="space-y-1.5">
                {busTypes.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedBusType(type)}
                    className={`w-full text-left text-xs px-3 py-2 rounded-lg transition font-medium ${
                      selectedBusType === type
                        ? 'bg-emerald-600 text-white font-bold shadow-sm'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {type === 'ALL' ? 'All Bus Types' : type}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Trips List */}
        <div className="lg:col-span-3 space-y-4">
          {/* Alternative Date Notification Banner */}
          {isAlternativeDate && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/90 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-xl mt-0.5 flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    No scheduled buses on {date ? new Date(date).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }) : 'selected date'}.
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Showing next available departures on or after that date starting on{' '}
                    <strong className="text-amber-900 font-bold">
                      {nextAvailableDate ? new Date(nextAvailableDate).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' }) : 'upcoming days'}
                    </strong>:
                  </p>
                </div>
              </div>

              {nextAvailableDate && (
                <button
                  type="button"
                  onClick={() => {
                    navigate(`/search?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&date=${nextAvailableDate}`);
                  }}
                  className="text-xs font-bold px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl shadow-sm transition whitespace-nowrap"
                >
                  Switch Date to {new Date(nextAvailableDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} ➔
                </button>
              )}
            </div>
          )}

          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse space-y-4">
                  <div className="h-4 bg-slate-200 rounded w-1/4"></div>
                  <div className="h-8 bg-slate-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 p-6 rounded-2xl flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          ) : filteredTrips.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
              <Bus className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800 mb-1">No Scheduled Trips Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mb-6">
                No active departures were found for {origin} ➔ {destination} on or after this date. Try viewing all dates or search another route!
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => navigate(`/search?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}`)}
                  className="px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl shadow-sm hover:bg-slate-800 transition"
                >
                  View All Dates for this Route
                </button>
                <Link
                  to="/"
                  className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-sm hover:bg-emerald-700 transition"
                >
                  Search Another Route
                </Link>
              </div>
            </div>
          ) : (
            filteredTrips.map((trip) => {
              const depDate = new Date(trip.departureTime);
              const arrDate = new Date(trip.arrivalTime);

              return (
                <div
                  key={trip._id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-emerald-400 transition"
                >
                  <div className="flex flex-wrap justify-between items-start gap-4 pb-4 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-base">{trip.operator?.name || 'Bus Operator'}</span>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          ★ {trip.operator?.rating || 4.5}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {trip.bus?.busType} • Vehicle #{trip.bus?.busNumber}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-xs text-slate-400 font-medium">Starting from</span>
                      <div className="text-2xl font-extrabold text-emerald-600">₹{trip.baseFare}</div>
                    </div>
                  </div>

                  {/* Trip Timing & Boarding */}
                  <div className="py-4 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-xs font-semibold text-slate-400 uppercase">Departure</span>
                        <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {depDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <div className="text-lg font-bold text-slate-900">
                        {depDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="text-xs text-slate-500 truncate" title={trip.route?.origin}>
                        {trip.route?.origin}
                      </div>
                    </div>

                    <div className="text-center">
                      <span className="text-xs font-semibold text-slate-500">{trip.durationFormatted || 'Direct'}</span>
                      <div className="flex items-center justify-center my-1">
                        <div className="h-0.5 w-12 bg-slate-200"></div>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 mx-1" />
                        <div className="h-0.5 w-12 bg-slate-200"></div>
                      </div>
                      <span className="text-[10px] text-slate-400">Regular Service</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-xs font-semibold text-slate-400 uppercase">Arrival</span>
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          {arrDate.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                      <div className="text-lg font-bold text-slate-900">
                        {arrDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="text-xs text-slate-500 truncate" title={trip.route?.destination}>
                        {trip.route?.destination}
                      </div>
                    </div>

                    <div className="flex flex-col items-end justify-center">
                      <span className={`text-xs font-bold mb-2 ${trip.availableSeats <= 5 ? 'text-amber-600' : 'text-slate-600'}`}>
                        {trip.availableSeats} Seats Available
                      </span>
                      <button
                        onClick={() => navigate(`/trip/${trip._id}`)}
                        className="w-full md:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm shadow-emerald-600/30 transition flex items-center justify-center gap-1.5"
                      >
                        <span>Select Seats</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Amenities */}
                  {trip.bus?.amenities && trip.bus.amenities.length > 0 && (
                    <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                      {trip.bus.amenities.slice(0, 4).map((am, idx) => (
                        <span key={idx} className="text-[10px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                          {am}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

