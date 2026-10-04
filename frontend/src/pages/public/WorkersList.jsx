import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { StarRating } from '../../components/StarRating';
import { ShieldCheck, MapPin, Search, Filter, Briefcase, Award, MessageSquare, Tag, ChevronDown } from 'lucide-react';
import { LocationSelector } from '../../components/LocationSelector';
import { Avatar } from '../../components/Avatar';

export const WorkersList = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [verifiedOnly, setVerifiedOnly] = useState(searchParams.get('verifiedOnly') === 'true');
  const [minRating, setMinRating] = useState(searchParams.get('minRating') || '');
  const [sortBy, setSortBy] = useState('rating');

  const handleDirectChat = async (worker, e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      const res = await api.post('/conversations/messages', {
        recipientId: worker.user?._id || worker.user,
        content: `Hi ${worker.user?.name || worker.businessName}, I saw your profile on BuildConnect and would like to discuss my project requirements and pricing details.`,
      });
      navigate(`/client/messages?conversationId=${res.data.conversationId}`);
    } catch (err) {
      console.error(err);
      navigate('/client/messages');
    }
  };

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (city) params.append('city', city);
      if (search) params.append('search', search);
      if (verifiedOnly) params.append('verifiedOnly', 'true');
      if (minRating) params.append('minRating', minRating);
      params.append('sortBy', sortBy);

      const res = await api.get(`/workers?${params.toString()}`);
      setWorkers(res.data.workers || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, [category, city, search, verifiedOnly, minRating, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900">Find Verified Workers & Professionals</h1>
        <p className="text-slate-500 text-sm mt-1">Search, compare ratings, view portfolios, and hire home experts</p>
      </div>

      {/* Mobile Filters Toggle Button */}
      <button
        type="button"
        onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
        className="w-full lg:hidden flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-200 text-sm font-bold text-slate-800 shadow-sm mb-6"
      >
        <span className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-blue-600" />
          <span>Filters & Search {(category || city || verifiedOnly) ? '• Active' : ''}</span>
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${mobileFiltersOpen ? 'rotate-180' : ''}`} />
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className={`bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 h-fit ${mobileFiltersOpen ? 'block' : 'hidden lg:block'}`}>
          <div className="flex items-center justify-between font-bold text-slate-900 text-base pb-3 border-b border-slate-100">
            <span className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-blue-600" /> Filter Professionals
            </span>
            {(category || city || search || verifiedOnly || minRating) && (
              <button
                type="button"
                onClick={() => {
                  setCategory('');
                  setCity('');
                  setSearch('');
                  setVerifiedOnly(false);
                  setMinRating('');
                }}
                className="text-xs text-blue-600 hover:underline font-semibold"
              >
                Reset
              </button>
            )}
          </div>

          {/* Search Input */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase">Keyword Search</label>
            <div className="relative mt-2">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search business name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase">Service Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full mt-2 p-2.5 text-sm bg-slate-50 rounded-xl border border-slate-200 focus:outline-none"
            >
              <option value="">All Categories</option>
              <option value="Interior Design">Interior Design</option>
              <option value="Modular Kitchen">Modular Kitchen</option>
              <option value="Carpentry">Carpentry</option>
              <option value="False Ceiling">False Ceiling</option>
              <option value="Painting">Painting</option>
              <option value="Electrical Work">Electrical Work</option>
              <option value="Plumbing">Plumbing</option>
            </select>
          </div>

            {/* City Location Autocomplete & Map */}
            <div>
              <LocationSelector
                value={city}
                onChange={(newCity) => setCity(newCity)}
                label="Location / City"
                placeholder="Type 2+ letters (e.g. Hy, Ba...)"
                showMap={true}
              />
            </div>

          {/* Verified Only */}
          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4 text-emerald-500" /> Verified Pros Only</span>
            </label>
          </div>
        </div>

        {/* Results Main Grid */}
        <div className="lg:col-span-3 space-y-6">
          {/* Sorting Bar */}
          <div className="bg-white px-6 py-3 rounded-2xl border border-slate-200 flex flex-col sm:flex-row justify-between items-center text-sm gap-3">
            <span className="text-slate-600 font-medium">Found <strong className="text-slate-900">{workers.length}</strong> professionals</span>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-slate-50 text-slate-700 font-medium text-xs px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none"
              >
                <option value="rating">Highest Rated</option>
                <option value="experience">Most Experienced</option>
                <option value="recent">Recently Active</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-20 text-slate-400">Loading professionals...</div>
          ) : workers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
              No workers match your filter criteria. Try clearing filters.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {workers.map((worker) => (
                <div key={worker._id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                  <div>
                    <div className="flex items-start gap-4">
                      <Avatar
                        src={worker.user?.avatarUrl}
                        name={worker.businessName || worker.user?.name}
                        size="lg"
                        className="rounded-2xl"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-bold text-slate-900 text-lg leading-snug">{worker.businessName}</h3>
                          {worker.verificationStatus === 'VERIFIED' && (
                            <ShieldCheck className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{worker.user?.name}</p>
                        <div className="mt-2">
                          <StarRating rating={worker.avgRating} count={worker.reviewsCount} />
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2 mt-4 leading-relaxed">{worker.description}</p>

                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {worker.categories.map((c, i) => (
                        <span key={i} className="text-xs bg-slate-100 text-slate-700 font-medium px-2.5 py-1 rounded-md">
                          {c}
                        </span>
                      ))}
                    </div>

                    {/* Pricing Information Bar */}
                    <div className="mt-4 bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-center justify-between text-xs">
                      <div>
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Standard Rate</div>
                        <div className="font-extrabold text-slate-900 text-sm">
                          ₹{worker.pricingInfo?.dailyRate || 1200} <span className="text-xs font-normal text-slate-500">/ day</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Site Inspection</div>
                        <span className="inline-block bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                          Free Site Visit
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {worker.city}</span>
                      <span className="font-semibold text-slate-700 flex items-center gap-1"><Award className="w-3.5 h-3.5 text-amber-500" /> {worker.experienceYears} Yrs Exp.</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={(e) => handleDirectChat(worker, e)}
                        className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 py-2.5 rounded-xl transition"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-blue-600" /> Chat & Inquire
                      </button>
                      <Link
                        to={`/workers/${worker._id}`}
                        className="w-full text-center text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 py-2.5 rounded-xl transition shadow-sm flex items-center justify-center"
                      >
                        Details & Rates
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
