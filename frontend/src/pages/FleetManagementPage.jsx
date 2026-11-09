import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { Bus, PlusCircle, ArrowLeft, CheckCircle2, ShieldCheck, Sparkles, Filter } from 'lucide-react';

export default function FleetManagementPage() {
  const [buses, setBuses] = useState([]);
  const [operators, setOperators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [busNumber, setBusNumber] = useState('');
  const [operatorId, setOperatorId] = useState('');
  const [busType, setBusType] = useState('AC Seater (2+2)');
  const [totalSeats, setTotalSeats] = useState(40);
  const [layoutType, setLayoutType] = useState('2x2');
  const [selectedAmenities, setSelectedAmenities] = useState(['WiFi', 'Charging Point', 'Water Bottle']);
  const [creating, setCreating] = useState(false);

  const availableAmenities = [
    'WiFi',
    'Charging Point',
    'Water Bottle',
    'Blanket',
    'Reading Light',
    'Personal TV',
    'Emergency Exit',
    'CCTV'
  ];

  const fetchData = async () => {
    setLoading(true);
    try {
      const [busRes, optRes] = await Promise.all([
        api.get('/buses'),
        api.get('/operators')
      ]);
      setBuses(busRes.data.buses || []);
      setOperators(optRes.data.operators || []);
      if (optRes.data.operators?.length > 0) {
        setOperatorId(optRes.data.operators[0]._id);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load fleet');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleAmenity = (amenity) => {
    if (selectedAmenities.includes(amenity)) {
      setSelectedAmenities(selectedAmenities.filter((a) => a !== amenity));
    } else {
      setSelectedAmenities([...selectedAmenities, amenity]);
    }
  };

  const handleCreateBus = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/buses', {
        busNumber: busNumber.trim().toUpperCase(),
        operatorId,
        busType,
        totalSeats: Number(totalSeats),
        layoutType,
        amenities: selectedAmenities
      });
      alert('Bus added to fleet successfully!');
      setShowAddModal(false);
      setBusNumber('');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create bus');
    } finally {
      setCreating(false);
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

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-md shadow-emerald-600/30"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Register New Vehicle</span>
        </button>
      </div>

      {/* Title Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-wrap justify-between items-center gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <Bus className="w-6 h-6 text-emerald-600" />
              <h1 className="text-2xl font-extrabold text-slate-900">Fleet Vehicles & Layouts</h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Manage operators, bus registration numbers, seat configurations, and luxury amenities.
            </p>
          </div>

          <div className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl">
            Total Fleet: <span className="text-emerald-700">{buses.length}</span> Active Vehicles
          </div>
        </div>

        {loading ? (
          <div className="min-h-[30vh] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-600"></div>
          </div>
        ) : error ? (
          <div className="p-4 bg-rose-50 text-rose-700 text-xs rounded-xl">{error}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {buses.map((bus) => (
              <div
                key={bus._id}
                className="bg-slate-50 hover:bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-emerald-400 transition"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {bus.operator?.name || 'Operator'}
                    </span>
                    <h3 className="text-lg font-extrabold font-mono text-slate-900 mt-1">{bus.busNumber}</h3>
                  </div>
                  <span className="text-xs font-bold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                    {bus.totalSeats} Seats
                  </span>
                </div>

                <div className="text-xs text-slate-600 space-y-1 mb-4">
                  <div>
                    Type: <strong className="text-slate-800">{bus.busType}</strong>
                  </div>
                  <div>
                    Layout: <strong className="text-slate-800">{bus.layoutType}</strong>
                  </div>
                </div>

                {/* Amenities Chips */}
                {bus.amenities && bus.amenities.length > 0 && (
                  <div className="pt-3 border-t border-slate-200/60 flex flex-wrap gap-1.5">
                    {bus.amenities.map((am, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-medium text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200"
                      >
                        {am}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Bus Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Register New Bus to Fleet</h3>
            <p className="text-xs text-slate-500 mb-6">
              The system will automatically generate standard 2x2 or sleeper seat layouts.
            </p>

            <form onSubmit={handleCreateBus} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Vehicle Registration Number
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. KA-05-MK-9988"
                  value={busNumber}
                  onChange={(e) => setBusNumber(e.target.value)}
                  className="w-full text-xs font-mono font-bold uppercase px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Operator</label>
                <select
                  required
                  value={operatorId}
                  onChange={(e) => setOperatorId(e.target.value)}
                  className="w-full text-xs font-medium px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {operators.map((opt) => (
                    <option key={opt._id} value={opt._id}>
                      {opt.name} ({opt.licenseNumber || 'Licensed'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Bus Type</label>
                  <select
                    value={busType}
                    onChange={(e) => setBusType(e.target.value)}
                    className="w-full text-xs font-medium px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="AC Seater (2+2)">AC Seater (2+2)</option>
                    <option value="AC Sleeper (2+1)">AC Sleeper (2+1)</option>
                    <option value="Non-AC Seater (2+2)">Non-AC Seater (2+2)</option>
                    <option value="Volvo Multi-Axle AC">Volvo Multi-Axle AC</option>
                    <option value="Electric AC Seater">Electric AC Seater</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Total Capacity</label>
                  <input
                    type="number"
                    required
                    min="10"
                    max="60"
                    value={totalSeats}
                    onChange={(e) => setTotalSeats(e.target.value)}
                    className="w-full text-xs font-bold px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-2">Amenities</label>
                <div className="grid grid-cols-2 gap-2">
                  {availableAmenities.map((am) => (
                    <label
                      key={am}
                      className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer bg-slate-50 p-2 rounded-lg border border-slate-200/80 hover:bg-slate-100"
                    >
                      <input
                        type="checkbox"
                        checked={selectedAmenities.includes(am)}
                        onChange={() => handleToggleAmenity(am)}
                        className="rounded text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>{am}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm shadow-emerald-600/30 transition disabled:opacity-50"
                >
                  {creating ? 'Registering...' : 'Register Bus'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
