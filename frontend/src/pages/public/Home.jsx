import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { StarRating } from '../../components/StarRating';
import { StatusBadge } from '../../components/StatusBadge';
import {
  Search,
  ShieldCheck,
  CheckCircle2,
  Lock,
  FileText,
  MapPin,
  ArrowRight,
  Sparkles,
  ChevronRight,
  Palette,
  Hammer,
  Zap,
  Droplet,
  Layers,
  LayoutGrid,
} from 'lucide-react';
import { Avatar } from '../../components/Avatar';

export const Home = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [workers, setWorkers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/workers?limit=6&verifiedOnly=true').then((res) => {
      setWorkers(res.data.workers || []);
    }).catch(() => {});
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    navigate(`/workers?search=${encodeURIComponent(searchQuery)}&category=${encodeURIComponent(selectedCategory)}`);
  };

  const serviceCategories = [
    { name: 'Interior Design', icon: Palette, color: 'bg-purple-100 text-purple-600', count: '120+ Pros' },
    { name: 'Modular Kitchen', icon: LayoutGrid, color: 'bg-blue-100 text-blue-600', count: '85+ Pros' },
    { name: 'Carpentry', icon: Hammer, color: 'bg-amber-100 text-amber-600', count: '150+ Pros' },
    { name: 'False Ceiling', icon: Layers, color: 'bg-emerald-100 text-emerald-600', count: '90+ Pros' },
    { name: 'Electrical Work', icon: Zap, color: 'bg-yellow-100 text-yellow-600', count: '110+ Pros' },
    { name: 'Plumbing', icon: Droplet, color: 'bg-cyan-100 text-cyan-600', count: '75+ Pros' },
  ];

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-blue-50/60 via-slate-50 to-white pt-16 pb-24 border-b border-slate-100 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100/80 text-blue-700 font-semibold text-xs border border-blue-200">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Verified Home Services & Interior Professionals</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
              Connect with Trusted <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                Interior & Home Workers
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
              Discover verified designers, carpenters, contractors, and home specialists. Share requirements, inspect sites safely with location privacy, approve itemized quotes, and release milestone payments securely.
            </p>

            {/* Search Bar */}
            <form onSubmit={handleSearchSubmit} className="bg-white p-2.5 sm:p-3 rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-200 flex flex-col md:flex-row gap-3 max-w-2xl mx-auto mt-6 sm:mt-8">
              <div className="flex-1 flex items-center gap-3 px-3 py-2 md:py-0">
                <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="e.g. Interior Designer, Carpenter..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-slate-900 placeholder:text-slate-400 bg-transparent text-sm font-medium focus:outline-none"
                />
              </div>

              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-50 text-slate-700 text-sm font-medium px-4 py-3 rounded-xl border border-slate-200 focus:outline-none"
              >
                <option value="">All Services</option>
                <option value="Interior Design">Interior Design</option>
                <option value="Modular Kitchen">Modular Kitchen</option>
                <option value="Carpentry">Carpentry</option>
                <option value="False Ceiling">False Ceiling</option>
                <option value="Painting">Painting</option>
              </select>

              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl shadow-md shadow-blue-500/20 transition text-sm flex items-center justify-center gap-2"
              >
                Search Professionals
              </button>
            </form>

            {/* Trust highlights */}
            <div className="pt-6 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-slate-500 font-medium">
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-500" /> ID Verified Professionals</span>
              <span className="flex items-center gap-1.5"><Lock className="w-4 h-4 text-blue-500" /> Privacy-First Location Release</span>
              <span className="flex items-center gap-1.5"><FileText className="w-4 h-4 text-purple-500" /> Escrow Milestone Payments</span>
            </div>
          </div>
        </div>
      </section>

      {/* Service Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-8 sm:mb-10">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Explore Service Categories</h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">Hire top specialists for every phase of home building & renovation</p>
          </div>
          <Link to="/categories" className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
            View All Categories <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-5">
          {serviceCategories.map((cat, idx) => {
            const Icon = cat.icon;
            return (
              <Link
                key={idx}
                to={`/workers?category=${encodeURIComponent(cat.name)}`}
                className="group bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 hover:border-blue-400 hover:shadow-lg transition duration-200 text-center flex flex-col items-center"
              >
                <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl ${cat.color} flex items-center justify-center mb-3 group-hover:scale-110 transition duration-200`}>
                  <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-600 transition">{cat.name}</h3>
                <span className="text-[11px] sm:text-xs text-slate-400 mt-1">{cat.count}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Featured Verified Workers Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-8 sm:mb-10">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Featured Verified Professionals</h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">Browse background-verified contractors with real client reviews</p>
          </div>
          <Link to="/workers" className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
            Browse All Workers <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {workers.map((worker) => (
            <div key={worker._id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition">
              <div className="flex items-start gap-4">
                <Avatar
                  src={worker.user?.avatarUrl}
                  name={worker.businessName || worker.user?.name}
                  size="lg"
                  className="rounded-2xl"
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-slate-900">{worker.businessName}</h3>
                    {worker.verificationStatus === 'VERIFIED' && (
                      <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{worker.user?.name}</p>
                  <div className="mt-2">
                    <StarRating rating={worker.avgRating} count={worker.reviewsCount} />
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {worker.categories.slice(0, 3).map((c, i) => (
                  <span key={i} className="text-xs bg-slate-100 text-slate-700 font-medium px-2.5 py-1 rounded-md">
                    {c}
                  </span>
                ))}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {worker.city}</span>
                <span className="font-semibold text-slate-700">{worker.experienceYears} Years Exp.</span>
              </div>

              <Link
                to={`/workers/${worker._id}`}
                className="mt-5 w-full block text-center text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 py-2.5 rounded-xl transition"
              >
                View Profile & Quote
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* How it Works / Trust Pillars */}
      <section className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <h2 className="text-3xl font-extrabold">Engineered for Security & Transparency</h2>
            <p className="text-slate-400 text-sm mt-2">Unlike simple directories, BuildConnect protects both clients and workers every step of the project.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-700">
              <div className="w-12 h-12 bg-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">Location Privacy</h3>
              <p className="text-xs text-slate-400 leading-relaxed">Exact project address is masked until client grants site inspection authorization.</p>
            </div>

            <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-700">
              <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">Itemized Quotation</h3>
              <p className="text-xs text-slate-400 leading-relaxed">Transparent line items for material and labour with version audit history.</p>
            </div>

            <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-700">
              <div className="w-12 h-12 bg-purple-500/20 text-purple-400 rounded-xl flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">Legal E-Signature</h3>
              <p className="text-xs text-slate-400 leading-relaxed">Auto-generated contracts with timestamped IP audit records before work begins.</p>
            </div>

            <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-700">
              <div className="w-12 h-12 bg-amber-500/20 text-amber-400 rounded-xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-lg mb-2">Milestone Escrow</h3>
              <p className="text-xs text-slate-400 leading-relaxed">Payments are locked in escrow and released only upon client milestone approval.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
