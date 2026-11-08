import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { ShieldAlert, ArrowLeft, RefreshCw, Clock, User, Filter } from 'lucide-react';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionFilter, setActionFilter] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/audit', {
        params: { action: actionFilter || undefined }
      });
      setLogs(res.data.logs || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionFilter]);

  const getActionBadge = (action) => {
    if (action.includes('CANCEL')) {
      return 'bg-rose-100 text-rose-800 border-rose-200';
    }
    if (action.includes('BOOKING')) {
      return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    }
    if (action.includes('TRIP')) {
      return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    }
    return 'bg-slate-100 text-slate-800 border-slate-200';
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <Link
          to="/admin"
          className="text-xs font-semibold text-slate-600 hover:text-emerald-700 flex items-center gap-1.5 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Fleet Dashboard</span>
        </Link>

        <button
          onClick={fetchLogs}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Audit Trail</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-wrap justify-between items-center gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-emerald-600" />
              <h1 className="text-xl font-extrabold text-slate-900">Enterprise Audit Trail</h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Immutable ledger of material business events, bookings, trip creations, and refund executions.
            </p>
          </div>

          <div>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="text-xs font-semibold px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Actions</option>
              <option value="BOOKING_CREATED">BOOKING_CREATED</option>
              <option value="BOOKING_CANCELLED">BOOKING_CANCELLED</option>
              <option value="TRIP_CREATED">TRIP_CREATED</option>
              <option value="USER_REGISTERED">USER_REGISTERED</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="min-h-[40vh] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-600"></div>
          </div>
        ) : error ? (
          <div className="text-center py-12 text-rose-600 text-xs">{error}</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">No audit records found.</div>
        ) : (
          <div className="divide-y divide-slate-100 mt-4">
            {logs.map((log) => (
              <div key={log._id} className="py-4 flex flex-wrap justify-between items-start gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${getActionBadge(
                        log.action
                      )}`}
                    >
                      {log.action}
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      Entity: {log.entityType} ({log.entityId})
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {log.performedBy?.name} ({log.performedBy?.role})
                    </span>
                    <span>•</span>
                    <span className="font-mono text-slate-400">{log.performedBy?.email}</span>
                  </div>

                  {log.details && (
                    <pre className="text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-200 font-mono text-slate-700 mt-2 max-w-xl overflow-x-auto">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  )}
                </div>

                <div className="text-right text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    {new Date(log.timestamp).toLocaleString([], {
                      dateStyle: 'medium',
                      timeStyle: 'medium'
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

