import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Users,
  Ticket,
  TrendingUp,
  FileSpreadsheet,
  Bus,
  PlusCircle,
  ShieldAlert,
  Calendar,
  Clock,
  ArrowRight
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [occupancyData, setOccupancyData] = useState(null);
  const [buses, setBuses] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Form states for scheduling a new trip
  const [selectedBus, setSelectedBus] = useState('');
  const [selectedRoute, setSelectedRoute] = useState('');
  const [depTime, setDepTime] = useState('');
  const [arrTime, setArrTime] = useState('');
  const [baseFare, setBaseFare] = useState(1000);
  const [creatingTrip, setCreatingTrip] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, occRes, busRes, routeRes] = await Promise.all([
        api.get('/reports/dashboard').catch(() => ({ data: { stats: null } })),
        api.get('/reports/occupancy').catch(() => ({ data: null })),
        api.get('/buses').catch(() => ({ data: { buses: [] } })),
        api.get('/routes').catch(() => ({ data: { routes: [] } }))
      ]);

      setStats(statsRes.data?.stats || null);
      setOccupancyData(occRes.data || null);
      const loadedBuses = busRes.data?.buses || [];
      const loadedRoutes = routeRes.data?.routes || [];
      setBuses(loadedBuses);
      setRoutes(loadedRoutes);

      if (loadedBuses.length > 0 && !selectedBus) setSelectedBus(loadedBuses[0]._id);
      if (loadedRoutes.length > 0 && !selectedRoute) setSelectedRoute(loadedRoutes[0]._id);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

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
    } catch (err) {
      console.error('Error refreshing modal buses/routes:', err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleCreateTrip = async (e) => {
    e.preventDefault();
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
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create trip');
    } finally {
      setCreatingTrip(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              {user.role} Operations
            </span>
            <span className="text-xs text-slate-400">Reconciled in Real-Time</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">Fleet Occupancy & Operator Reporting</h1>
          <p className="text-xs text-slate-500">
            Real-time occupancy summaries, live trip manifests, and audit log tracking.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/audit-logs"
            className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3.5 py-2 rounded-xl transition"
          >
            <ShieldAlert className="w-4 h-4 text-slate-500" />
            <span>Audit Trail</span>
          </Link>

          <button
            onClick={handleOpenScheduleModal}
            className="flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-xl shadow-md shadow-emerald-600/30 transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Schedule New Trip</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Revenue</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            ₹{stats?.totalRevenue?.toLocaleString() || 0}
          </div>
          <span className="text-[11px] text-slate-400 font-medium">Reconciled from confirmed tickets</span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Fleet Occupancy</span>
            <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-teal-700">
            {occupancyData?.summary?.overallOccupancyRate || 0}%
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            {occupancyData?.summary?.totalBookedSeats || 0} of {occupancyData?.summary?.totalCapacity || 0} seats booked
          </span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Trips</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Bus className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-indigo-700">
            {stats?.activeTrips || 0}
          </div>
          <span className="text-[11px] text-slate-400 font-medium">Scheduled & Boarding now</span>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Confirmed Tickets</span>
            <div className="p-2 rounded-xl bg-slate-50 text-slate-600">
              <Ticket className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900">
            {stats?.confirmedBookings || 0}
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            Cancellation Rate: {stats?.cancellationRate || 0}%
          </span>
        </div>
      </div>

      {/* Acceptance Test 5: Route & Trip Occupancy Reconciliation Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">Route Schedules & Occupancy Reconciliation</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live capacity breakdown per scheduled bus. Click manifest to view confirmed passenger manifests.
            </p>
          </div>
          <span className="text-xs font-bold text-slate-600">
            {occupancyData?.reports?.length || 0} Scheduled Trips
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-100/70 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Trip Code</th>
                <th className="py-3 px-4">Operator</th>
                <th className="py-3 px-4">Route</th>
                <th className="py-3 px-4">Departure Time</th>
                <th className="py-3 px-4 text-center">Occupancy Rate</th>
                <th className="py-3 px-4 text-center">Seats (Booked / Total)</th>
                <th className="py-3 px-4 text-right">Revenue</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {occupancyData?.reports?.map((rep) => (
                <tr key={rep.tripId} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                    {rep.tripCode}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-700">
                    {rep.operator}
                  </td>
                  <td className="py-3.5 px-4 font-medium text-slate-800">
                    {rep.route}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">
                    {new Date(rep.departureTime).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[11px] ${
                        rep.occupancyRate >= 75
                          ? 'bg-emerald-100 text-emerald-800'
                          : rep.occupancyRate >= 30
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {rep.occupancyRate}%
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                    {rep.bookedSeats} / {rep.totalSeats}
                  </td>
                  <td className="py-3.5 px-4 text-right font-extrabold text-emerald-600">
                    ₹{rep.revenue}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <Link
                      to={`/manifest/${rep.tripId}`}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 transition"
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
      </div>

      {/* Fleet Vehicles Overview */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-wrap justify-between items-center bg-slate-50 gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Bus className="w-5 h-5 text-emerald-600" />
              <h3 className="font-extrabold text-slate-900 text-base">Fleet Vehicles ({buses.length})</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Registered operational vehicles available for trip assignment and scheduling.
            </p>
          </div>
          <Link
            to="/operator/buses"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 px-3.5 py-2 rounded-xl transition shadow-sm"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Manage Fleet / Add Bus</span>
          </Link>
        </div>

        <div className="p-6">
          {buses.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No buses currently registered. Click "Manage Fleet / Add Bus" to register a bus.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {buses.map((b) => (
                <div key={b._id} className="bg-slate-50 rounded-xl border border-slate-200 p-4 hover:border-emerald-400 transition">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {b.operator?.name || 'Fleet Operator'}
                      </span>
                      <h4 className="font-mono font-extrabold text-slate-900 text-base mt-1">{b.busNumber}</h4>
                    </div>
                    <span className="text-xs font-bold text-slate-700 bg-white px-2 py-1 rounded-lg border border-slate-200">
                      {b.totalSeats} Seats
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60">
                    <span>{b.busType}</span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Active in Fleet
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Schedule Trip Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Schedule New Fleet Trip</h3>
            <p className="text-xs text-slate-500 mb-6">
              Assign a bus, route, departure schedule, and base fare.
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
                    <span>No active buses in database.</span>
                    <Link to="/fleet" className="underline font-bold text-emerald-600 hover:text-emerald-700">Add Bus in Fleet →</Link>
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
                    <span>No active routes found in database.</span>
                    <Link to="/routes" className="underline font-bold text-emerald-600 hover:text-emerald-700">Add Route in Routes →</Link>
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

