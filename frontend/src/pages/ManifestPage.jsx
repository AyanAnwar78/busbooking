import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import { FileSpreadsheet, ArrowLeft, Printer, Search, Bus, CheckCircle2, User, Phone } from 'lucide-react';

export default function ManifestPage() {
  const { tripId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchManifest = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/reports/manifest/${tripId}`);
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch manifest');
      } finally {
        setLoading(false);
      }
    };

    if (tripId) fetchManifest();
  }, [tripId]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white rounded-2xl border border-slate-200 text-center">
        <h3 className="text-lg font-bold text-slate-800 mb-2">Manifest Not Found</h3>
        <p className="text-xs text-slate-500 mb-6">{error || 'Unable to retrieve passenger manifest.'}</p>
        <Link to="/admin" className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  const { trip, manifest } = data;
  const filteredPassengers = manifest.passengers.filter((p) => {
    const query = searchTerm.toLowerCase();
    return (
      p.passengerName.toLowerCase().includes(query) ||
      p.seatNumber.toLowerCase().includes(query) ||
      p.pnr.toLowerCase().includes(query) ||
      p.contactPhone.includes(query)
    );
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Bar */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <Link
          to="/admin"
          className="text-xs font-semibold text-slate-600 hover:text-emerald-700 flex items-center gap-1.5 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Fleet Dashboard</span>
        </Link>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow-sm"
        >
          <Printer className="w-4 h-4" />
          <span>Print Passenger Manifest</span>
        </button>
      </div>

      {/* Manifest Trip Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-wrap justify-between items-start gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                Official Passenger Manifest
              </span>
              <span className="font-mono text-xs font-bold text-slate-400">{trip.tripCode}</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 mt-2">{trip.route}</h1>
            <p className="text-xs text-slate-500 mt-1">
              Operator: <strong className="text-slate-800">{trip.operatorName}</strong> • Vehicle:{' '}
              <strong className="text-slate-800">{trip.busNumber}</strong> ({trip.busType})
            </p>
          </div>

          <div className="flex gap-4 text-center">
            <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 min-w-[90px]">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Capacity</span>
              <div className="text-lg font-extrabold text-slate-800">{trip.totalSeats}</div>
            </div>
            <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-200 min-w-[90px]">
              <span className="text-[10px] font-bold text-emerald-700 uppercase">Confirmed</span>
              <div className="text-lg font-extrabold text-emerald-700">{trip.bookedSeats}</div>
            </div>
            <div className="bg-teal-50 p-3 rounded-2xl border border-teal-200 min-w-[90px]">
              <span className="text-[10px] font-bold text-teal-700 uppercase">Occupancy</span>
              <div className="text-lg font-extrabold text-teal-700">{trip.occupancyPercentage}%</div>
            </div>
          </div>
        </div>

        {/* Departure/Arrival info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 text-xs text-slate-600 border-b border-slate-100">
          <div>
            <span className="text-slate-400 font-semibold uppercase text-[10px]">Scheduled Departure:</span>
            <p className="font-bold text-slate-800">
              {new Date(trip.departureTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          </div>
          <div>
            <span className="text-slate-400 font-semibold uppercase text-[10px]">Estimated Arrival:</span>
            <p className="font-bold text-slate-800">
              {new Date(trip.arrivalTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
            </p>
          </div>
        </div>

        {/* Search bar inside manifest */}
        <div className="pt-6 flex flex-wrap justify-between items-center gap-4">
          <div className="relative max-w-sm w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search passenger, seat, PNR or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <span className="text-xs text-slate-500">
            Showing <strong>{filteredPassengers.length}</strong> of {manifest.totalConfirmedPassengers} confirmed passengers
          </span>
        </div>
      </div>

      {/* Manifest Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100/70 text-slate-700 uppercase font-bold text-[10px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 text-center">Seat</th>
                <th className="py-3 px-4">Passenger Name</th>
                <th className="py-3 px-4 text-center">Age / Sex</th>
                <th className="py-3 px-4 font-mono">PNR</th>
                <th className="py-3 px-4">Boarding Point</th>
                <th className="py-3 px-4">Dropping Point</th>
                <th className="py-3 px-4">Booker & Phone</th>
                <th className="py-3 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPassengers.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-8 text-center text-slate-400 text-xs">
                    No confirmed passengers matching search.
                  </td>
                </tr>
              ) : (
                filteredPassengers.map((p, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-extrabold border border-emerald-200">
                        {p.seatNumber}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {p.passengerName}
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-500">
                      {p.age} / {p.gender}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-800">
                      {p.pnr}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{p.boardingPoint}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{p.droppingPoint}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800">{p.bookerName}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        {p.contactPhone}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

