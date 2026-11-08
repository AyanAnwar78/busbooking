import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Bus, Ticket, User, LogOut, LayoutDashboard, FileSpreadsheet, ShieldAlert } from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, isOperator, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Bus className="w-6 h-6" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900">
                Bus<span className="text-emerald-600">Go</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Enterprise
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1 sm:gap-4">
            <Link
              to="/"
              className="text-sm font-medium text-slate-600 hover:text-emerald-600 px-3 py-2 rounded-lg transition hover:bg-slate-50"
            >
              Search Trips
            </Link>

            {isAuthenticated && (
              <Link
                to="/my-bookings"
                className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-emerald-600 px-3 py-2 rounded-lg transition hover:bg-slate-50"
              >
                <Ticket className="w-4 h-4 text-emerald-600" />
                <span>My Bookings</span>
              </Link>
            )}

            {isOperator && (
              <Link
                to="/admin"
                className="flex items-center gap-1.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 px-3 py-2 rounded-lg transition"
              >
                <LayoutDashboard className="w-4 h-4 text-emerald-600" />
                <span>Operator Portal</span>
              </Link>
            )}

            {/* Auth section */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 ml-2">
              {isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <div className="hidden md:flex flex-col text-right">
                    <span className="text-sm font-semibold text-slate-800 leading-tight">
                      {user.name}
                    </span>
                    <span className="text-xs uppercase tracking-wider font-bold text-emerald-600">
                      {user.role}
                    </span>
                  </div>
                  <button
                    onClick={handleLogout}
                    title="Logout"
                    className="p-2 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="text-sm font-semibold text-slate-700 hover:text-emerald-600 px-3 py-2 rounded-lg transition"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 px-4 py-2 rounded-lg shadow-sm shadow-emerald-600/30 transition"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      </div>
    </header>
  );
}
