import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { StarRating } from '../../components/StarRating';
import { Modal } from '../../components/Modal';
import {
  ShieldCheck,
  MapPin,
  Clock,
  Briefcase,
  MessageSquare,
  Send,
  Calendar,
  CheckCircle2,
  Image as ImageIcon,
  Heart,
  Grid,
  Layers,
  X,
} from 'lucide-react';
import { Avatar } from '../../components/Avatar';

export const WorkerDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [worker, setWorker] = useState(null);
  const [portfolio, setPortfolio] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [isSiteLocationModalOpen, setIsSiteLocationModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [projectTitle, setProjectTitle] = useState('');
  const [projectDesc, setProjectDesc] = useState('');
  const [category, setCategory] = useState('');
  const [budget, setBudget] = useState('');
  const [city, setCity] = useState('');

  // Site Location Form State
  const [siteStreet, setSiteStreet] = useState('');
  const [siteLandmark, setSiteLandmark] = useState('');
  const [siteArea, setSiteArea] = useState('');
  const [siteCity, setSiteCity] = useState('');
  const [sitePincode, setSitePincode] = useState('');
  const [siteDate, setSiteDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  });
  const [siteTime, setSiteTime] = useState('11:00 AM');
  const [siteNotes, setSiteNotes] = useState('');
  const [siteCoords, setSiteCoords] = useState(null);
  const [detectingGps, setDetectingGps] = useState(false);
  const [locationSending, setLocationSending] = useState(false);

  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setSiteCoords({ lat: latitude, lng: longitude });
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          const data = await res.json();
          if (data && data.address) {
            const addr = data.address;
            setSiteCity(addr.city || addr.town || addr.state_district || '');
            setSiteArea(addr.suburb || addr.neighbourhood || addr.road || '');
            setSitePincode(addr.postcode || '');
            if (addr.road || addr.building) {
              setSiteStreet(`${addr.building || ''} ${addr.road || ''}`.trim());
            }
          }
        } catch (e) {
          console.error(e);
        } finally {
          setDetectingGps(false);
        }
      },
      (err) => {
        console.error(err);
        alert('Could not retrieve GPS location: ' + err.message);
        setDetectingGps(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSendSiteLocationSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    if (!siteStreet || !siteCity) {
      alert('Please enter street address and city.');
      return;
    }

    setLocationSending(true);
    try {
      const res = await api.post('/conversations/messages', {
        recipientId: worker.user._id,
        messageType: 'LOCATION_SHARE',
        content: `📍 I have shared my project site location for inspection. Looking forward to meeting on ${siteDate} at ${siteTime}.`,
        locationData: {
          address: siteStreet,
          landmark: siteLandmark,
          area: siteArea,
          city: siteCity,
          pincode: sitePincode,
          coordinates: siteCoords,
          visitDate: siteDate,
          visitTime: siteTime,
          notes: siteNotes,
          status: 'PENDING',
        },
        metadata: {
          projectTitle: `${category || worker.categories[0]} Project at ${siteArea || siteCity}`,
          category: category || worker.categories[0],
        },
      });

      setIsSiteLocationModalOpen(false);
      navigate(`/client/messages?conversationId=${res.data.conversationId}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send site location');
    } finally {
      setLocationSending(false);
    }
  };

  const handleLikePost = async (postId, e) => {
    if (e) e.stopPropagation();
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      const res = await api.post(`/workers/portfolio/${postId}/like`);
      setPortfolio((prev) =>
        prev.map((item) =>
          item._id === postId
            ? { ...item, likesCount: res.data.likesCount, isLiked: res.data.liked }
            : item
        )
      );
      if (selectedPost && selectedPost._id === postId) {
        setSelectedPost((prev) => ({
          ...prev,
          likesCount: res.data.likesCount,
          isLiked: res.data.liked,
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    api.get(`/workers/${id}`).then((res) => {
      setWorker(res.data.worker);
      setPortfolio(res.data.portfolio || []);
      setReviews(res.data.reviews || []);
      if (res.data.worker?.categories?.length) {
        setCategory(res.data.worker.categories[0]);
      }
      if (res.data.worker?.city) {
        setCity(res.data.worker.city);
      }
    }).catch(console.error).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!selectedPost && !isQuoteModalOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedPost(null);
        setIsQuoteModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPost, isQuoteModalOpen]);

  const handleStartProjectSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const res = await api.post('/projects', {
        title: projectTitle,
        description: projectDesc,
        category,
        estimatedBudget: budget,
        publicLocation: { city },
        assignedWorkerId: worker.user._id,
      });

      setIsQuoteModalOpen(false);
      navigate(`/client/projects/${res.data.project._id}`);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to request project quote');
    }
  };

  const handleContactWorker = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      const res = await api.post('/conversations/messages', {
        recipientId: worker.user._id,
        content: `Hi ${worker.user.name}, I am interested in your ${worker.categories[0]} services.`,
      });
      navigate(`/client/messages?conversationId=${res.data.conversationId}`);
    } catch (err) {
      alert('Failed to initiate message');
    }
  };

  if (loading) return <div className="text-center py-20 text-slate-400">Loading worker profile...</div>;
  if (!worker) return <div className="text-center py-20 text-slate-500">Worker profile not found.</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Banner Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
            <Avatar
              src={worker.user?.avatarUrl}
              name={worker.businessName || worker.user?.name}
              size="xl"
              className="rounded-2xl"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold text-slate-900">{worker.businessName}</h1>
                {worker.verificationStatus === 'VERIFIED' && (
                  <div className="flex items-center gap-1 bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full border border-emerald-200">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" /> Verified Pro
                  </div>
                )}
              </div>
              <p className="text-sm text-slate-500 mt-1">{worker.user?.name} • {worker.experienceYears} Years Experience</p>
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-600">
                <StarRating rating={worker.avgRating} count={worker.reviewsCount} />
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {worker.city}</span>
                <span className="flex items-center gap-1"><Briefcase className="w-3.5 h-3.5 text-slate-400" /> {worker.completedProjectsCount} Completed</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <button
              onClick={handleContactWorker}
              className="px-5 py-3 rounded-xl border border-slate-200 text-slate-800 font-bold text-sm hover:bg-slate-50 flex items-center justify-center gap-2 transition"
            >
              <MessageSquare className="w-4 h-4 text-blue-600" /> Chat & Inquire Pricing
            </button>
            <button
              onClick={() => setIsSiteLocationModalOpen(true)}
              className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition"
            >
              <MapPin className="w-4 h-4" /> Send Location & Book Visit
            </button>
            <button
              onClick={() => setIsQuoteModalOpen(true)}
              className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition"
            >
              <Send className="w-4 h-4" /> Request Quote
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: About & Portfolio */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* About */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900">About the Business</h2>
            <p className="text-slate-600 text-sm leading-relaxed">{worker.description || 'No description provided.'}</p>
            
            <div className="pt-4 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">Services Offered</h3>
              <div className="flex flex-wrap gap-2">
                {worker.categories.map((cat, i) => (
                  <span key={i} className="bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-lg border border-blue-100">
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Portfolio Projects Instagram Showcase Gallery */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-blue-600" /> Showcase Portfolio ({portfolio.length} Projects)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Explore completed client projects, photos, and materials</p>
              </div>
            </div>

            {portfolio.length === 0 ? (
              <p className="text-slate-400 text-sm">No portfolio items added yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {portfolio.map((item) => {
                  const firstImg = item.images?.[0]?.url || 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=600';
                  return (
                    <div
                      key={item._id}
                      onClick={() => setSelectedPost(item)}
                      className="group relative aspect-square bg-slate-100 rounded-2xl overflow-hidden cursor-pointer shadow-sm border border-slate-200"
                    >
                      <img
                        src={firstImg}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />

                      {item.images?.length > 1 && (
                        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1 z-10">
                          <Layers className="w-3 h-3" /> {item.images.length}
                        </div>
                      )}

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition duration-200 flex flex-col items-center justify-center text-white p-3 space-y-1.5 text-center">
                        <h4 className="font-bold text-xs line-clamp-1">{item.title}</h4>
                        <span className="text-[10px] bg-white/20 backdrop-blur px-2 py-0.5 rounded-full">
                          {item.category}
                        </span>
                        <div className="flex items-center gap-3 text-xs font-bold pt-1">
                          <button
                            type="button"
                            onClick={(e) => handleLikePost(item._id, e)}
                            className="flex items-center gap-1 hover:text-rose-400 transition"
                          >
                            <Heart className={`w-3.5 h-3.5 ${item.isLiked ? 'fill-rose-500 text-rose-500' : 'fill-white text-white'}`} />
                            <span>{item.likesCount || 0}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Reviews Section */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-6">
            <h2 className="text-lg font-bold text-slate-900">Client Reviews ({reviews.length})</h2>
            {reviews.length === 0 ? (
              <p className="text-slate-400 text-sm">No reviews submitted yet.</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((rev) => (
                  <div key={rev._id} className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={rev.reviewer?.avatarUrl}
                          name={rev.reviewer?.name}
                          size="sm"
                        />
                        <span className="font-bold text-sm text-slate-800">{rev.reviewer?.name || 'Verified Client'}</span>
                      </div>
                      <StarRating rating={rev.rating} />
                    </div>
                    <p className="text-xs text-slate-600 italic">"{rev.comment}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          {/* Transparent Pricing & Rate Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Service Rates & Pricing</h3>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                Verified Pricing
              </span>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-600 font-medium">Standard Daily Labor</span>
                <span className="font-extrabold text-slate-900">₹{worker.pricingInfo?.dailyRate || 1200} / day</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-600 font-medium">Hourly Consultation</span>
                <span className="font-extrabold text-slate-900">₹{worker.pricingInfo?.hourlyRate || 250} / hr</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/70 border border-emerald-100">
                <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Physical Site Inspection
                </div>
                <span className="font-black text-emerald-700 uppercase text-xs">FREE</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <span className="text-slate-600 font-medium">Typical Project Range</span>
                <span className="font-bold text-slate-800">{worker.pricingInfo?.avgProjectBudget || '₹25,000 - ₹2,50,000'}</span>
              </div>
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={() => setIsSiteLocationModalOpen(true)}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition"
              >
                <MapPin className="w-4 h-4" /> Send Location & Book Free Site Inspection
              </button>
              <button
                type="button"
                onClick={handleContactWorker}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl flex items-center justify-center gap-1.5 transition"
              >
                <MessageSquare className="w-3.5 h-3.5 text-blue-600" /> Chat With Worker to Inquire Details
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
            <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider">Service Coverage</h3>
            <div className="text-sm text-slate-600 space-y-2">
              <div><strong className="text-slate-800">Operational City:</strong> {worker.city}</div>
              <div><strong className="text-slate-800">Coverage Radius:</strong> {worker.serviceRadiusKm} km</div>
              <div><strong className="text-slate-800">Site Response:</strong> Same-day / Next-day visits available</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quote Request Modal */}
      <Modal isOpen={isQuoteModalOpen} onClose={() => setIsQuoteModalOpen(false)} title={`Request Quote from ${worker.businessName}`}>
        <form onSubmit={handleStartProjectSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Project Title</label>
            <input
              type="text"
              required
              placeholder="e.g. 3BHK Living Room & Kitchen Renovation"
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Service Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              >
                {worker.categories.map((c, i) => (
                  <option key={i} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Est. Budget (INR)</label>
              <input
                type="number"
                placeholder="e.g. 500000"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Description & Requirements</label>
            <textarea
              rows={4}
              required
              placeholder="Describe your property, timeline, and required work in detail..."
              value={projectDesc}
              onChange={(e) => setProjectDesc(e.target.value)}
              className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
            ></textarea>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition"
          >
            Submit Project Request
          </button>
        </form>
      </Modal>

      {/* Send Location & Book Site Inspection Modal */}
      <Modal
        isOpen={isSiteLocationModalOpen}
        onClose={() => setIsSiteLocationModalOpen(false)}
        title="📍 Send Site Location & Schedule On-Site Inspection"
      >
        <form onSubmit={handleSendSiteLocationSubmit} className="space-y-4">
          <p className="text-xs text-slate-500">
            Send your site location to <strong>{worker.businessName}</strong>. The worker will visit your site, inspect conditions, measure dimensions, analyze the work, and prepare an itemized deal quotation.
          </p>

          <button
            type="button"
            onClick={handleDetectGps}
            disabled={detectingGps}
            className="w-full py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl border border-emerald-200 flex items-center justify-center gap-2 transition"
          >
            <MapPin className="w-4 h-4 text-emerald-600" />
            {detectingGps ? 'Detecting High-Accuracy GPS...' : 'Auto-Detect My Current GPS Location'}
          </button>

          {siteCoords && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center justify-between">
              <span className="font-bold">
                📍 Pinpoint GPS: {Number(siteCoords.lat).toFixed(6)}, {Number(siteCoords.lng).toFixed(6)}
              </span>
              <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full font-bold">
                Accurate to ~3m
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Site Address (Flat / House No., Building / Complex, Street) *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Flat 304, Green Heights, Jubilee Hills Rd 36"
                value={siteStreet}
                onChange={(e) => setSiteStreet(e.target.value)}
                className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Landmark</label>
              <input
                type="text"
                placeholder="e.g. Near Metro Pillar 124"
                value={siteLandmark}
                onChange={(e) => setSiteLandmark(e.target.value)}
                className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Area / Locality</label>
              <input
                type="text"
                placeholder="e.g. Jubilee Hills"
                value={siteArea}
                onChange={(e) => setSiteArea(e.target.value)}
                className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">City *</label>
              <input
                type="text"
                required
                placeholder="City"
                value={siteCity}
                onChange={(e) => setSiteCity(e.target.value)}
                className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Pincode</label>
              <input
                type="text"
                placeholder="e.g. 500033"
                value={sitePincode}
                onChange={(e) => setSitePincode(e.target.value)}
                className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Preferred Visit Date *</label>
              <input
                type="date"
                required
                value={siteDate}
                onChange={(e) => setSiteDate(e.target.value)}
                className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Preferred Time *</label>
              <select
                value={siteTime}
                onChange={(e) => setSiteTime(e.target.value)}
                className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              >
                <option value="10:00 AM">Morning (10:00 AM)</option>
                <option value="11:30 AM">Late Morning (11:30 AM)</option>
                <option value="02:30 PM">Afternoon (02:30 PM)</option>
                <option value="04:30 PM">Evening (04:30 PM)</option>
                <option value="06:00 PM">Late Evening (06:00 PM)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Notes / Work Scope for Inspection</label>
            <textarea
              rows={2}
              placeholder="e.g. Need measurement for complete modular kitchen cabinetry and living room wall paneling."
              value={siteNotes}
              onChange={(e) => setSiteNotes(e.target.value)}
              className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={locationSending}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md shadow-emerald-500/20 transition flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            {locationSending ? 'Sending Site Details...' : 'Send Location & Open Chat with Worker'}
          </button>
        </form>
      </Modal>

      {/* Instagram-Style Post Lightbox Modal */}
      {selectedPost && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn"
          onClick={() => setSelectedPost(null)}
        >
          <div
            className="bg-white rounded-3xl overflow-hidden max-w-4xl w-full flex flex-col md:flex-row max-h-[90vh] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left: Image Container */}
            <div className="md:w-3/5 bg-slate-950 flex items-center justify-center relative min-h-[300px]">
              <img
                src={selectedPost.images?.[0]?.url || 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800'}
                alt={selectedPost.title}
                className="max-h-[80vh] w-full object-contain"
              />
            </div>

            {/* Right: Social Post Details */}
            <div className="md:w-2/5 p-6 flex flex-col justify-between overflow-y-auto space-y-4">
              <div className="space-y-4">
                {/* Author Header */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={worker?.user?.avatarUrl}
                      name={worker?.businessName}
                      size="md"
                    />
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">
                        {worker?.businessName}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {selectedPost.locationCity || worker?.city}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedPost(null)}
                    className="p-1 rounded-full text-slate-400 hover:text-slate-700"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Post Content */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-blue-600 uppercase bg-blue-50 px-2 py-0.5 rounded">
                    {selectedPost.category}
                  </span>
                  <h3 className="font-extrabold text-sm text-slate-900">{selectedPost.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{selectedPost.description}</p>
                </div>

                {/* Materials & Details */}
                {selectedPost.materialsUsed?.length > 0 && (
                  <div className="pt-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase block mb-1">
                      Materials & Specifications:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {selectedPost.materialsUsed.map((m, idx) => (
                        <span key={idx} className="text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {selectedPost.budgetRange && (
                  <div className="text-xs text-slate-600">
                    <strong className="text-slate-800">Budget Range:</strong> {selectedPost.budgetRange}
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <button
                    onClick={(e) => handleLikePost(selectedPost._id, e)}
                    className={`flex items-center gap-2 text-sm font-bold transition ${
                      selectedPost.isLiked ? 'text-rose-600' : 'text-slate-700 hover:text-rose-600'
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${selectedPost.isLiked ? 'fill-rose-600' : ''}`} />
                    <span>{selectedPost.likesCount || 0} Likes</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedPost(null);
                      setIsQuoteModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition"
                  >
                    Enquire Similar Work
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
