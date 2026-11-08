import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="max-w-2xl mx-auto my-16 p-8 bg-white rounded-2xl shadow-sm border border-slate-200 text-center">
        <h2 className="text-2xl font-bold text-rose-600 mb-2">Access Denied</h2>
        <p className="text-slate-600 mb-6">
          Your account role (<code className="font-mono bg-slate-100 px-2 py-0.5 rounded text-rose-700">{user.role}</code>) does not have permission to view this section.
        </p>
        <Navigate to="/" replace />
      </div>
    );
  }

  return children;
}

