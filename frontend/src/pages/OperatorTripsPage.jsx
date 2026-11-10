import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { Bus, Calendar, Clock, ArrowLeft, PlusCircle, FileSpreadsheet, RefreshCw, AlertCircle } from 'lucide-react';

export default function OperatorTripsPage() {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [updatingId, setUpdatingId] = useState(null);

  // Schedule Trip Modal State
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [selectedBus, setSelectedBus] = useState('');
  const [selectedRoute, setSelectedRoute] = useState('');
  const [depTime, setDepTime] = useState('');
  const [arrTime, setArrTime] = useState('');
  const [baseFare, setBaseFare] = useState(1000);
  const [creatingTrip, setCreatingTrip] = useState(false);

  const handleOpenScheduleModal = async () => {
    setShowScheduleModal(true);
    try {
      const [busRes, routeRes] = await Promise.all([
        api.get('/buses').catch(() => ({ data: { buses: [] } })),
        api.get('/routes').catch(() => ({ data: { routes: [] } }))
      ]);
      const loadedBuses = busRes.data?.buses || [];
      const loadedRoutes = routeRes.data?.routes || [];
      setBuses(loadedBuses);
      setRoutes(loadedRoutes);
      if (loadedBuses.length > 0 && (!selectedBus || !loadedBuses.find(b => b._id === selectedBus))) {
        setSelectedBus(loadedBuses[0]._id);
      }
      if (loadedRoutes.length > 0 && (!selectedRoute || !loadedRoutes.find(r => r._id === selectedRoute))) {
        setSelectedRoute(loadedRoutes[0]._id);
      }
    } catch (e) {
      console.error('Error refreshing modal buses/routes:', e);
    }
  };

  const handleCreateTrip = async (e) => {
    e.preventDefault();
    if (!selectedBus || !selectedRoute || !depTime || !arrTime) {
      alert('Please fill out all required trip fields.');
      return;
    }
    setCreatingTrip(true);
    try {
      await api.post('/trips', {
        busId: selectedBus,
        routeId: selectedRoute,
        departureTime: new Date(depTime),
        arrivalTime: new Date(arrTime),
        baseFare: Number(baseFare)
      });
      alert('Trip scheduled successfully!');
      setShowScheduleModal(false);
      setDepTime('');
      setArrTime('');
      fetchTrips();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create trip');
    } finally {
      setCreatingTrip(false);
    }
  };

  const fetchTrips = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/trips', {
        params: { status: statusFilter === 'ALL' ? undefined : statusFilter }
      });
      setTrips(res.data.trips || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load trips');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
  }, [statusFilter]);

  const handleStatusChange = async (tripId, newStatus) => {
    setUpdatingId(tripId);
    try {
      await api.patch(`/trips/${tripId}/status`, { status: newStatus });
      fetchTrips();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update trip status');
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'BOARDING':
        return 'bg-amber-100 text-amber-800 border-amber-200 animate-pulse';
      case 'IN_TRANSIT':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'COMPLETED':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'CANCELLED':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <Link
          to="/admin"
          className="text-xs font-semibold text-slate-600 hover:text-emerald-700 flex items-center gap-1.5 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Fleet Dashboard</span>
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchTrips}
            title="Refresh"
            className="p-2 text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={handleOpenScheduleModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-emerald-600/30"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Schedule New Trip</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-wrap justify-between items-center gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Bus className="w-6 h-6 text-emerald-600" />
              <h1 className="text-2xl font-extrabold text-slate-900">Trip Schedules & Dispatch</h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Dispatch status transitions, real-time seat availability, and live passenger manifests.
            </p>
          </div>

          {/* Status Tabs */}
          <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-2xl">
            {['ALL', 'SCHEDULED', 'BOARDING', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                  statusFilter === st
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="min-h-[30vh] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-600"></div>
          </div>
        ) : error ? (
          <div className="p-4 bg-rose-50 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        ) : trips.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">No trips found matching filter.</div>
        ) : (
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100/70 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Trip Code</th>
                  <th className="py-3 px-4">Route</th>
                  <th className="py-3 px-4">Bus & Operator</th>
                  <th className="py-3 px-4">Departure Time</th>
                  <th className="py-3 px-4 text-center">Available Seats</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Dispatch Control</th>
                  <th className="py-3 px-4 text-center">Manifest</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {trips.map((trip) => (
                  <tr key={trip._id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                      {trip.tripCode}
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {trip.route ? `${trip.route.origin} → ${trip.route.destination}` : 'Route'}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800">{trip.operator?.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {trip.bus?.busNumber} ({trip.bus?.busType})
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      <div>
                        {new Date(trip.departureTime).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(trip.departureTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="font-bold text-slate-800">
                        {trip.availableSeatCount} / {trip.totalSeats}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(
                          trip.status
                        )}`}
                      >
                        {trip.status}
                      </span>
                    </td>

                    {/* Change Status Dropdown */}
                    <td className="py-3.5 px-4 text-center">
                      <select
                        disabled={updatingId === trip._id}
                        value={trip.status}
                        onChange={(e) => handleStatusChange(trip._id, e.target.value)}
                        className="text-xs font-bold text-slate-800 px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                      >
                        <option value="SCHEDULED">SCHEDULED</option>
                        <option value="BOARDING">BOARDING</option>
                        <option value="IN_TRANSIT">IN_TRANSIT</option>
                        <option value="COMPLETED">COMPLETED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <Link
                        to={`/manifest/${trip._id}`}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-lg border border-emerald-200 transition"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" />
                        <span>Manifest</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Schedule Trip Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Schedule New Fleet Trip</h3>
            <p className="text-xs text-slate-500 mb-6">
              Assign a bus, route corridor, departure schedule, and base fare.
            </p>

            <form onSubmit={handleCreateTrip} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Select Bus {buses.length > 0 && <span className="text-slate-400 font-normal">({buses.length} in fleet)</span>}
                </label>
                <select
                  required
                  value={selectedBus}
                  onChange={(e) => setSelectedBus(e.target.value)}
                  className="w-full text-xs font-bold text-slate-800 px-3 py-2.5 border border-slate-300 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="">
                    {buses.length > 0 ? '-- Select a Vehicle from Fleet --' : 'No buses available in fleet'}
                  </option>
                  {buses.map((b) => (
                    <option key={b._id} value={b._id} className="text-slate-800 font-semibold py-1">
                      {b.busNumber} • {b.busType} ({b.totalSeats} seats)
                    </option>
                  ))}
                </select>
                {buses.length === 0 && (
                  <div className="flex items-center justify-between text-[11px] text-amber-600 mt-1 font-medium">
                    <span>No active buses found.</span>
                    <Link to="/operator/buses" className="underline font-bold text-emerald-600 hover:text-emerald-700">Add Bus in Fleet →</Link>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Select Route {routes.length > 0 && <span className="text-slate-400 font-normal">({routes.length} corridors)</span>}
                </label>
                <select
                  required
                  value={selectedRoute}
                  onChange={(e) => setSelectedRoute(e.target.value)}
                  className="w-full text-xs font-bold text-slate-800 px-3 py-2.5 border border-slate-300 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                >
                  <option value="">
                    {routes.length > 0 ? '-- Select Route Corridor --' : 'No routes available'}
                  </option>
                  {routes.map((r) => (
                    <option key={r._id} value={r._id} className="text-slate-800 font-semibold py-1">
                      {r.origin} → {r.destination} ({r.distanceKm} km, {Math.floor(r.estimatedDurationMinutes / 60)}h)
                    </option>
                  ))}
                </select>
                {routes.length === 0 && (
                  <div className="flex items-center justify-between text-[11px] text-amber-600 mt-1 font-medium">
                    <span>No active routes found.</span>
                    <Link to="/operator/routes" className="underline font-bold text-emerald-600 hover:text-emerald-700">Add Route in Routes →</Link>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Departure Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={depTime}
                    onChange={(e) => setDepTime(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Arrival Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={arrTime}
                    onChange={(e) => setArrTime(e.target.value)}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Base Seat Fare (₹)</label>
                <input
                  type="number"
                  required
                  min="100"
                  value={baseFare}
                  onChange={(e) => setBaseFare(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingTrip}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm shadow-emerald-600/30 transition disabled:opacity-50"
                >
                  {creatingTrip ? 'Scheduling...' : 'Confirm Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

