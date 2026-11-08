import React, { useState, useEffect } from 'react';
import api from '../api/client';
import TicketCard from '../components/TicketCard';
import { Ticket, AlertCircle, RefreshCw } from 'lucide-react';

export default function MyBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('ALL');

  const fetchBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/bookings/my');
      setBookings(res.data.bookings || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load booking history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = async (bookingId, reason) => {
    await api.patch(`/bookings/${bookingId}/cancel`, { reason });
    fetchBookings();
  };

  const filteredBookings = bookings.filter((b) => {
    if (filter === 'CONFIRMED') return b.status === 'CONFIRMED';
    if (filter === 'CANCELLED') return b.status === 'CANCELLED';
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 flex items-center gap-2">
            <Ticket className="w-6 h-6 text-emerald-600" />
            <span>My Bookings & Tickets</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Review your passenger manifests, download confirmed e-tickets, and manage cancellations.
          </p>
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-2">
          {['ALL', 'CONFIRMED', 'CANCELLED'].map((st) => (
            <button
              key={st}
              onClick={() => setFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filter === st
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
          <button
            onClick={fetchBookings}
            title="Refresh"
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-600"></div>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-6 rounded-2xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-sm">
          <Ticket className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 mb-1">No Tickets Found</h3>
          <p className="text-xs text-slate-500 mb-6">You have no {filter !== 'ALL' ? filter.toLowerCase() : ''} bookings yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((b) => (
            <TicketCard key={b._id} booking={b} onCancel={handleCancelBooking} />
          ))}
        </div>
      )}
    </div>
  );
}

