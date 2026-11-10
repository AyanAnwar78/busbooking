import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { MapPin, PlusCircle, ArrowLeft, Clock, ArrowRight, Trash2, Plus } from 'lucide-react';

export default function RouteManagementPage() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [cities, setCities] = useState([]);
  const [origin, setOrigin] = useState('');
  const [customOrigin, setCustomOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [customDestination, setCustomDestination] = useState('');
  const [distanceKm, setDistanceKm] = useState(300);
  const [estimatedDurationMinutes, setEstimatedDurationMinutes] = useState(360);

  const [boardingPoints, setBoardingPoints] = useState([
    { name: '', landmark: '', timeOffsetMinutes: 0 }
  ]);
  const [droppingPoints, setDroppingPoints] = useState([
    { name: '', landmark: '', timeOffsetMinutes: 360 }
  ]);
  const [creating, setCreating] = useState(false);

  const fetchRoutes = async () => {
    setLoading(true);
    try {
      const [routeRes, cityRes] = await Promise.all([
        api.get('/routes'),
        api.get('/routes/cities').catch(() => ({ data: { cities: [] } }))
      ]);
      setRoutes(routeRes.data.routes || []);
      const loadedCities = cityRes.data?.cities || [];
      setCities(loadedCities);
      if (loadedCities.length > 1 && !origin) {
        setOrigin(loadedCities[0]);
        setDestination(loadedCities[1]);
        setBoardingPoints([{ name: `${loadedCities[0]} Main Bus Terminal`, landmark: 'Platform 1', timeOffsetMinutes: 0 }]);
        setDroppingPoints([{ name: `${loadedCities[1]} City Hub`, landmark: 'Central Station', timeOffsetMinutes: 360 }]);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load routes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoutes();
  }, []);

  const handleAddBoardingPoint = () => {
    setBoardingPoints([...boardingPoints, { name: '', landmark: '', timeOffsetMinutes: 30 }]);
  };

  const handleRemoveBoardingPoint = (index) => {
    setBoardingPoints(boardingPoints.filter((_, i) => i !== index));
  };

  const handleBoardingChange = (index, field, value) => {
    const updated = [...boardingPoints];
    updated[index][field] = field === 'timeOffsetMinutes' ? Number(value) : value;
    setBoardingPoints(updated);
  };

  const handleAddDroppingPoint = () => {
    setDroppingPoints([...droppingPoints, { name: '', landmark: '', timeOffsetMinutes: estimatedDurationMinutes }]);
  };

  const handleRemoveDroppingPoint = (index) => {
    setDroppingPoints(droppingPoints.filter((_, i) => i !== index));
  };

  const handleDroppingChange = (index, field, value) => {
    const updated = [...droppingPoints];
    updated[index][field] = field === 'timeOffsetMinutes' ? Number(value) : value;
    setDroppingPoints(updated);
  };

  const handleCreateRoute = async (e) => {
    e.preventDefault();
    const finalOrigin = origin === '__custom__' ? customOrigin.trim() : origin.trim();
    const finalDestination = destination === '__custom__' ? customDestination.trim() : destination.trim();

    if (!finalOrigin || !finalDestination) {
      alert('Please select or specify origin and destination cities.');
      return;
    }

    if (finalOrigin.toLowerCase() === finalDestination.toLowerCase()) {
      alert('Origin and Destination cities cannot be identical.');
      return;
    }

    // Filter out empty stop points
    const validBoarding = boardingPoints.filter((b) => b.name.trim() !== '');
    const validDropping = droppingPoints.filter((d) => d.name.trim() !== '');

    if (validBoarding.length === 0 || validDropping.length === 0) {
      alert('Please specify at least one boarding point and one dropping point.');
      return;
    }

    setCreating(true);
    try {
      await api.post('/routes', {
        origin: finalOrigin,
        destination: finalDestination,
        distanceKm: Number(distanceKm),
        estimatedDurationMinutes: Number(estimatedDurationMinutes),
        boardingPoints: validBoarding,
        droppingPoints: validDropping
      });
      alert('Route created successfully!');
      setShowAddModal(false);
      setCustomOrigin('');
      setCustomDestination('');
      fetchRoutes();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create route');
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
          <span>Create New Route</span>
        </button>
      </div>

      {/* Title Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-wrap justify-between items-center gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <MapPin className="w-6 h-6 text-emerald-600" />
              <h1 className="text-2xl font-extrabold text-slate-900">Operational Routes & Stops</h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Configure origin-destination corridors, highway distance, travel duration, and intermediate boarding/dropping points.
            </p>
          </div>

          <div className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl">
            Active Corridors: <span className="text-emerald-700">{routes.length}</span> Routes
          </div>
        </div>

        {loading ? (
          <div className="min-h-[30vh] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-600"></div>
          </div>
        ) : error ? (
          <div className="p-4 bg-rose-50 text-rose-700 text-xs rounded-xl">{error}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {routes.map((rt) => {
              const hours = Math.floor(rt.estimatedDurationMinutes / 60);
              const mins = rt.estimatedDurationMinutes % 60;

              return (
                <div
                  key={rt._id}
                  className="bg-slate-50 hover:bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md hover:border-emerald-400 transition"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-2 text-lg font-bold text-slate-900">
                      <span>{rt.origin}</span>
                      <ArrowRight className="w-4 h-4 text-emerald-600" />
                      <span>{rt.destination}</span>
                    </div>

                    <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                      {rt.distanceKm} km
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-500 mb-4 pb-3 border-b border-slate-200/60">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      Duration: {hours}h {mins > 0 ? `${mins}m` : ''}
                    </span>
                    <span>•</span>
                    <span>{rt.boardingPoints?.length || 0} Boarding Stops</span>
                    <span>•</span>
                    <span>{rt.droppingPoints?.length || 0} Drop Stops</span>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div>
                      <span className="font-bold text-slate-700 block mb-1">Boarding Points:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {rt.boardingPoints?.map((bp, i) => (
                          <span
                            key={i}
                            className="bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600 text-[11px]"
                          >
                            {bp.name} (+{bp.timeOffsetMinutes}m)
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="font-bold text-slate-700 block mb-1">Dropping Points:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {rt.droppingPoints?.map((dp, i) => (
                          <span
                            key={i}
                            className="bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600 text-[11px]"
                          >
                            {dp.name} (+{dp.timeOffsetMinutes}m)
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Route Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-bold text-slate-900 mb-1">Create New Corridor Route</h3>
            <p className="text-xs text-slate-500 mb-6">
              Define the highway corridor with boarding points and drop locations.
            </p>

            <form onSubmit={handleCreateRoute} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Origin City</label>
                  <select
                    required
                    value={origin}
                    onChange={(e) => {
                      const val = e.target.value;
                      setOrigin(val);
                      if (val !== '__custom__' && val) {
                        handleBoardingChange(0, 'name', `${val} Central Bus Terminal`);
                        handleBoardingChange(0, 'landmark', 'Platform 1');
                      }
                    }}
                    className="w-full text-xs font-bold text-slate-800 px-3 py-2.5 border border-slate-300 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="">-- Choose Origin City --</option>
                    {cities.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                    <option value="__custom__">➕ + Enter Custom City...</option>
                  </select>

                  {origin === '__custom__' && (
                    <input
                      type="text"
                      required
                      placeholder="Type custom origin city name..."
                      value={customOrigin}
                      onChange={(e) => {
                        setCustomOrigin(e.target.value);
                        handleBoardingChange(0, 'name', `${e.target.value} Main Bus Terminal`);
                      }}
                      className="mt-2 w-full text-xs font-semibold px-3 py-2 border border-emerald-300 rounded-lg bg-emerald-50/50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Destination City</label>
                  <select
                    required
                    value={destination}
                    onChange={(e) => {
                      const val = e.target.value;
                      setDestination(val);
                      if (val !== '__custom__' && val) {
                        handleDroppingChange(0, 'name', `${val} City Hub`);
                        handleDroppingChange(0, 'landmark', 'Central Station');
                      }
                    }}
                    className="w-full text-xs font-bold text-slate-800 px-3 py-2.5 border border-slate-300 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="">-- Choose Destination City --</option>
                    {cities.map((city) => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                    <option value="__custom__">➕ + Enter Custom City...</option>
                  </select>

                  {destination === '__custom__' && (
                    <input
                      type="text"
                      required
                      placeholder="Type custom destination city name..."
                      value={customDestination}
                      onChange={(e) => {
                        setCustomDestination(e.target.value);
                        handleDroppingChange(0, 'name', `${e.target.value} City Hub`);
                      }}
                      className="mt-2 w-full text-xs font-semibold px-3 py-2 border border-emerald-300 rounded-lg bg-emerald-50/50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Distance (km)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={distanceKm}
                    onChange={(e) => setDistanceKm(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Estimated Duration (Mins)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={estimatedDurationMinutes}
                    onChange={(e) => setEstimatedDurationMinutes(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Boarding Points Section */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-slate-700 uppercase">Boarding Points</label>
                  <button
                    type="button"
                    onClick={handleAddBoardingPoint}
                    className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Stop
                  </button>
                </div>

                <div className="space-y-2">
                  {boardingPoints.map((bp, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Stop Name (e.g. Swargate Bus Stand)"
                        value={bp.name}
                        onChange={(e) => handleBoardingChange(i, 'name', e.target.value)}
                        className="flex-1 text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                      />
                      <input
                        type="text"
                        placeholder="Landmark"
                        value={bp.landmark}
                        onChange={(e) => handleBoardingChange(i, 'landmark', e.target.value)}
                        className="w-28 text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                      />
                      <input
                        type="number"
                        placeholder="+Mins"
                        title="Time offset from departure in minutes"
                        value={bp.timeOffsetMinutes}
                        onChange={(e) => handleBoardingChange(i, 'timeOffsetMinutes', e.target.value)}
                        className="w-16 text-xs px-2 py-1.5 border border-slate-300 rounded-lg bg-white text-center"
                      />
                      {boardingPoints.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveBoardingPoint(i)}
                          className="text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Dropping Points Section */}
              <div className="pt-2 border-t border-slate-100">
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-slate-700 uppercase">Dropping Points</label>
                  <button
                    type="button"
                    onClick={handleAddDroppingPoint}
                    className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Stop
                  </button>
                </div>

                <div className="space-y-2">
                  {droppingPoints.map((dp, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Drop Name (e.g. Panaji Bus Terminal)"
                        value={dp.name}
                        onChange={(e) => handleDroppingChange(i, 'name', e.target.value)}
                        className="flex-1 text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                      />
                      <input
                        type="text"
                        placeholder="Landmark"
                        value={dp.landmark}
                        onChange={(e) => handleDroppingChange(i, 'landmark', e.target.value)}
                        className="w-28 text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                      />
                      <input
                        type="number"
                        placeholder="+Mins"
                        title="Time offset from departure in minutes"
                        value={dp.timeOffsetMinutes}
                        onChange={(e) => handleDroppingChange(i, 'timeOffsetMinutes', e.target.value)}
                        className="w-16 text-xs px-2 py-1.5 border border-slate-300 rounded-lg bg-white text-center"
                      />
                      {droppingPoints.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveDroppingPoint(i)}
                          className="text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
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
                  {creating ? 'Saving...' : 'Save Route'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

