import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/client';
import TicketCard from '../components/TicketCard';
import { CheckCircle2, Ticket, ArrowLeft, Bus } from 'lucide-react';

export default function BookingConfirmationPage() {
  const { pnr } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTicket = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/bookings/ticket/${pnr}`);
        setBooking(res.data.booking);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch ticket');
      } finally {
        setLoading(false);
      }
    };
    if (pnr) fetchTicket();
  }, [pnr]);

  const handleCancelBooking = async (bookingId, reason) => {
    const res = await api.patch(`/bookings/${bookingId}/cancel`, { reason });
    setBooking(res.data.booking);
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white rounded-2xl border border-slate-200 text-center">
        <h3 className="text-lg font-bold text-slate-800 mb-2">Ticket Not Found</h3>
        <p className="text-xs text-slate-500 mb-6">{error || 'Unable to retrieve ticket with reference ' + pnr}</p>
        <Link to="/" className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold">
          Go to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Success Notification Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white p-6 rounded-2xl shadow-lg flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
        <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
          <CheckCircle2 className="w-7 h-7 text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-extrabold tracking-tight">Booking Confirmed Successfully!</h2>
          <p className="text-xs text-emerald-100 mt-1">
            Your e-ticket has been generated and confirmed with unique reference <strong>{booking.pnr}</strong>.
          </p>
        </div>
        <Link
          to="/my-bookings"
          className="px-4 py-2 bg-white text-emerald-700 hover:bg-emerald-50 rounded-xl text-xs font-bold shadow-sm transition"
        >
          View All My Bookings
        </Link>
      </div>

      {/* Ticket Card Component */}
      <TicketCard booking={booking} onCancel={handleCancelBooking} />

      <div className="flex justify-between items-center pt-4">
        <Link
          to="/"
          className="text-xs font-semibold text-slate-600 hover:text-emerald-600 flex items-center gap-1.5 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Book Another Journey</span>
        </Link>
      </div>
    </div>
  );
}

