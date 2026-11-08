import React from 'react';
import { Bus, ShieldCheck, Clock, Award } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 mt-20 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 text-white font-extrabold text-xl mb-4">
              <Bus className="w-6 h-6 text-emerald-400" />
              <span>Bus<span className="text-emerald-400">Go</span> System</span>
            </div>
            <p className="text-sm text-slate-400 max-w-sm mb-4 leading-relaxed">
              Full-Stack Bus Booking Management System featuring atomic concurrency-safe seat booking, real-time manifests, operator analytics, and automated cancellation rules.
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> 100% Concurrency Safe
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-emerald-400" /> Real-time Manifests
              </span>
              <span className="flex items-center gap-1">
                <Award className="w-4 h-4 text-emerald-400" /> RBAC Protected
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-white text-sm font-semibold mb-3 tracking-wider uppercase">Demo Accounts</h4>
            <ul className="text-xs space-y-2 text-slate-400 font-mono">
              <li><strong className="text-emerald-400">Admin:</strong> admin@busbooking.com</li>
              <li><strong className="text-emerald-400">Operator:</strong> operator@kallada.com</li>
              <li><strong className="text-emerald-400">Customer:</strong> john@example.com</li>
              <li><strong className="text-slate-300">Password:</strong> *Password@123</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white text-sm font-semibold mb-3 tracking-wider uppercase">Quick Links</h4>
            <ul className="text-xs space-y-2">
              <li><a href="/api/health" target="_blank" rel="noreferrer" className="hover:text-emerald-400 transition">API Health Check</a></li>
              <li><a href="/admin" className="hover:text-emerald-400 transition">Operator Reporting</a></li>
              <li><a href="/my-bookings" className="hover:text-emerald-400 transition">Customer Ticket History</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500">
          <p>© 2026 BusGo Management System. Full-Stack Web Development Assessment Submission.</p>
          <p className="mt-2 sm:mt-0 font-medium text-slate-400">Built with MERN Stack + Tailwind CSS</p>
        </div>
      </div>
    </footer>
  );
}

