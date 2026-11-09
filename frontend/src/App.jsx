import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

import HomePage from './pages/HomePage';
import SearchResultsPage from './pages/SearchResultsPage';
import SeatSelectPage from './pages/SeatSelectPage';
import BookingConfirmationPage from './pages/BookingConfirmationPage';
import MyBookingsPage from './pages/MyBookingsPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ManifestPage from './pages/ManifestPage';
import AuditLogsPage from './pages/AuditLogsPage';
import FleetManagementPage from './pages/FleetManagementPage';
import RouteManagementPage from './pages/RouteManagementPage';
import OperatorTripsPage from './pages/OperatorTripsPage';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchResultsPage />} />
          <Route path="/trip/:id" element={<SeatSelectPage />} />
          <Route path="/booking-confirmed/:pnr" element={<BookingConfirmationPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected Customer Routes */}
          <Route
            path="/my-bookings"
            element={
              <ProtectedRoute>
                <MyBookingsPage />
              </ProtectedRoute>
            }
          />

          {/* Protected Operator & Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['operator', 'admin']}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manifest/:tripId"
            element={
              <ProtectedRoute allowedRoles={['operator', 'admin']}>
                <ManifestPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/operator/trips"
            element={
              <ProtectedRoute allowedRoles={['operator', 'admin']}>
                <OperatorTripsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/operator/buses"
            element={
              <ProtectedRoute allowedRoles={['operator', 'admin']}>
                <FleetManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/operator/routes"
            element={
              <ProtectedRoute allowedRoles={['operator', 'admin']}>
                <RouteManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/audit-logs"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AuditLogsPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

