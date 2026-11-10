import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';
import { Search, MapPin, Calendar, Bus, ArrowRight, ShieldCheck, Zap, Users, Sparkles } from 'lucide-react';

export default function HomePage() {
  const [cities, setCities] = useState([
    'Bangalore', 'Hyderabad', 'Chennai', 'Mumbai', 'Pune', 'Goa', 'Delhi', 'Jaipur', 'Ahmedabad', 'Kolkata'
  ]);
  const [origin, setOrigin] = useState('Bangalore');
  const [destination, setDestination] = useState('Hyderabad');
  const [date, setDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/routes/cities')
      .then((res) => {
        if (res.data?.cities && res.data.cities.length > 0) {
          setCities(res.data.cities);
        }
      })
      .catch((err) => console.log('Using default cities list', err));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!origin || !destination) return;
    navigate(`/search?origin=${encodeURIComponent(origin)}&destination=${encodeURIComponent(destination)}&date=${date}`);
  };

  const popularRoutes = [
    {
      origin: 'Bangalore',
      dest: 'Hyderabad',
      duration: '9h',
      fare: '₹1,100',
      busType: 'Volvo Multi-Axle AC Sleeper',
      image: 'https://i.pinimg.com/736x/48/3b/82/483b828dbad6d4a4c3e328df649b63bf.jpg'
    },
    {
      origin: 'Bangalore',
      dest: 'Chennai',
      duration: '6h 30m',
      fare: '₹750',
      busType: 'Scania Executive Seater',
      image: 'https://i.pinimg.com/736x/30/53/b3/3053b3bdafdd8312e2be53501a80d492.jpg'
    },
    {
      origin: 'Mumbai',
      dest: 'Pune',
      duration: '3h 30m',
      fare: '₹450',
      busType: 'Mercedes Intercity Express',
      image: 'https://i.pinimg.com/1200x/6b/23/8a/6b238a7c0361534c6c428c38c9c83831.jpg'
    },
    {
      origin: 'Delhi',
      dest: 'Jaipur',
      duration: '5h',
      fare: '₹650',
      busType: 'BharatBenz Ultra Luxury Coach',
      image: 'https://i.pinimg.com/736x/be/87/5a/be875a311068dc900e505ada4839efeb.jpg'
    }
  ];

  const fleetShowcase = [
    {
      title: 'Volvo B11R Multi-Axle Sleeper',
      tag: 'Ultra Luxury Sleeper',
      image: 'https://i.pinimg.com/736x/48/3b/82/483b828dbad6d4a4c3e328df649b63bf.jpg',
      description: 'Ergonomic individual berths, ambient soft lighting, noise-cancellation cabin, and high-speed USB-C charging points.',
      features: 'Full Sleeper • Individual AC • WiFi'
    },
    {
      title: 'Scania Metrolink HD Coach',
      tag: 'Executive Class',
      image: 'https://i.pinimg.com/736x/30/53/b3/3053b3bdafdd8312e2be53501a80d492.jpg',
      description: 'Plush 2x2 calf-supported recliner seats with electronic back adjusters and individual reading illumination.',
      features: 'Push-back Seater • Air Suspension'
    },
    {
      title: 'Mercedes-Benz Intercity Glider',
      tag: 'High-Speed Intercity',
      image: 'https://i.pinimg.com/1200x/6b/23/8a/6b238a7c0361534c6c428c38c9c83831.jpg',
      description: 'Aerodynamic grand touring body engineered for ultra-smooth highway cruising and maximum passenger safety.',
      features: 'Panoramic Windows • Emergency Exits'
    },
    {
      title: 'BharatBenz High-Deck Express',
      tag: 'Regional Touring',
      image: 'https://i.pinimg.com/736x/be/87/5a/be875a311068dc900e505ada4839efeb.jpg',
      description: 'High-deck vantage seating with large luggage compartments and GPS-tracked intelligent climate control.',
      features: 'Large Luggage Hold • CCTV Security'
    }
  ];

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 text-white p-8 md:p-16 shadow-2xl border border-slate-800">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"></div>

        <div className="relative max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold mb-6 border border-emerald-500/30">
            <Sparkles className="w-3.5 h-3.5" /> Next-Gen Bus Booking Management
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-tight mb-4">
            Reliable journeys, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">zero double bookings</span>.
          </h1>
          <p className="text-base md:text-lg text-slate-300 mb-8 leading-relaxed">
            Search scheduled routes, pick your exact seats with interactive maps, and manage tickets with guaranteed concurrency protection and instant automated refunds.
          </p>

          {/* Search Bar Form */}
          <form
            onSubmit={handleSearch}
            className="bg-white p-4 md:p-5 rounded-2xl shadow-xl border border-slate-200 text-slate-900 grid grid-cols-1 md:grid-cols-4 gap-4"
          >
            {/* Origin Dropdown */}
            <div className="relative">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                From (Origin)
              </label>
              <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:bg-white transition">
                <MapPin className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <select
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="w-full bg-transparent text-sm font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  {cities.map((city) => (
                    <option key={`orig-${city}`} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Destination Dropdown */}
            <div className="relative">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                To (Destination)
              </label>
              <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:bg-white transition">
                <MapPin className="w-4 h-4 text-teal-600 flex-shrink-0" />
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full bg-transparent text-sm font-bold text-slate-800 focus:outline-none cursor-pointer"
                >
                  {cities.map((city) => (
                    <option key={`dest-${city}`} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Travel Date */}
            <div className="relative">
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                Date of Travel
              </label>
              <div className="flex items-center gap-2 border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:bg-white transition">
                <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-transparent text-sm font-semibold text-slate-800 focus:outline-none"
                />
              </div>
            </div>

            {/* Search Button */}
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition transform active:scale-95"
              >
                <Search className="w-4 h-4" />
                <span>Search Trips</span>
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Quick Route Shortcuts with Fleet Photos */}
      <section>
        <div className="flex flex-wrap justify-between items-center mb-6 gap-2">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Featured Popular Routes</h2>
            <p className="text-xs text-slate-500">Popular intercity travel corridors served daily by luxury fleets.</p>
          </div>
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            Daily Express Services
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {popularRoutes.map((rt, i) => (
            <div
              key={i}
              onClick={() => {
                setOrigin(rt.origin);
                setDestination(rt.dest);
                navigate(`/search?origin=${encodeURIComponent(rt.origin)}&destination=${encodeURIComponent(rt.dest)}&date=${date}`);
              }}
              className="group cursor-pointer bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-emerald-500 transition-all duration-300 flex flex-col"
            >
              <div className="relative h-36 overflow-hidden bg-slate-900">
                <img
                  src={rt.image}
                  alt={`${rt.origin} to ${rt.dest}`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
                <span className="absolute bottom-2.5 left-3 text-[10px] font-bold text-white bg-slate-900/80 backdrop-blur-sm px-2.5 py-0.5 rounded-full border border-white/20">
                  {rt.busType}
                </span>
                <span className="absolute top-2.5 right-3 text-xs font-extrabold text-emerald-300 bg-emerald-950/90 px-2.5 py-1 rounded-full border border-emerald-500/30">
                  {rt.fare}
                </span>
              </div>

              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-slate-900 font-extrabold text-sm">
                    <span>{rt.origin}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-600 group-hover:translate-x-1 transition" />
                    <span>{rt.dest}</span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <span>⏱️ {rt.duration}</span>
                  <span className="font-bold text-emerald-600 group-hover:underline">Book Seat →</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Fleet Showcase Gallery */}
      <section className="space-y-6">
        <div className="flex flex-wrap justify-between items-end gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 mb-2">
              <Sparkles className="w-3.5 h-3.5" /> Premium Travel Standards
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Next-Generation Fleet Experience
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Top-tier multi-axle buses engineered for comfort, safety, and smooth long-distance transit.
            </p>
          </div>
          <button
            onClick={() => {
              setOrigin('Bangalore');
              setDestination('Hyderabad');
              navigate(`/search?origin=Bangalore&destination=Hyderabad&date=${date}`);
            }}
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
          >
            <span>Explore All Fleet Routes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {fleetShowcase.map((item, index) => (
            <div
              key={index}
              className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-emerald-400 transition-all duration-300 flex flex-col"
            >
              <div className="relative h-44 overflow-hidden bg-slate-900">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
                <span className="absolute bottom-2.5 left-3 text-[10px] font-bold text-white bg-slate-900/80 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/20">
                  {item.tag}
                </span>
              </div>
              <div className="p-4 flex-1 flex flex-col justify-between space-y-2.5">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-700 transition">
                    {item.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    {item.description}
                  </p>
                </div>
                <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] font-semibold text-emerald-700">
                  <span>{item.features}</span>
                  <span className="group-hover:translate-x-1 transition font-bold">Book ➔</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Core Architectural Pillars */}
      <section className="bg-slate-100/70 border border-slate-200 rounded-3xl p-8 md:p-12">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Engineered for Data Integrity</h2>
          <p className="text-sm text-slate-600">
            Adhering to strict enterprise requirements, our solution addresses high concurrency and operational workflows out-of-the-box.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">Concurrency & Integrity</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Atomic document matching eliminates race conditions. Even under simultaneous bookings for the exact same seat, only 1 passenger succeeds while the other receives an instant 409 Conflict.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center mb-4">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">Configurable Refunds</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Automated multi-tier cancellation policies (&gt;24h = 90%, 12–24h = 50%, &lt;12h = 0%). Cancelled seats return to the booking pool in real-time.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center mb-4">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">Live Manifest & Analytics</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Operators can access real-time passenger manifests, vehicle occupancy rates, revenue reconciliation, and comprehensive audit trails for all actions.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

