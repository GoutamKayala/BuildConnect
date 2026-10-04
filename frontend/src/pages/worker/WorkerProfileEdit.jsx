import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Avatar } from '../../components/Avatar';
import { LocationSelector } from '../../components/LocationSelector';
import {
  Briefcase,
  Camera,
  Upload,
  Trash2,
  User,
  Phone,
  MapPin,
  Clock,
  DollarSign,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Plus,
  X,
  Layers,
  ArrowLeft,
} from 'lucide-react';

const AVAILABLE_CATEGORIES = [
  'Interior Design',
  'Modular Kitchen',
  'False Ceiling',
  'Carpentry',
  'Painting',
  'Flooring',
  'Civil Work',
  'Electrical',
  'Plumbing',
  'Architecture',
  'Waterproofing',
  'Furniture',
];

export const WorkerProfileEdit = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [workerProfileId, setWorkerProfileId] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [description, setDescription] = useState('');
  const [categories, setCategories] = useState([]);
  const [experienceYears, setExperienceYears] = useState(1);
  const [city, setCity] = useState('Hyderabad');
  const [serviceRadiusKm, setServiceRadiusKm] = useState(25);
  const [serviceAreas, setServiceAreas] = useState([]);
  const [newAreaInput, setNewAreaInput] = useState('');
  const [hourlyRate, setHourlyRate] = useState(500);
  const [avgProjectBudget, setAvgProjectBudget] = useState('₹1,00,000 - ₹5,00,000');
  const [availabilityStatus, setAvailabilityStatus] = useState('AVAILABLE');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get('/workers/profile/me');
      const w = res.data.worker;
      if (w) {
        setWorkerProfileId(w._id);
        setBusinessName(w.businessName || '');
        setDescription(w.description || '');
        setCategories(w.categories || ['Interior Design']);
        setExperienceYears(w.experienceYears ?? 1);
        setCity(w.city || user?.city || 'Hyderabad');
        setServiceRadiusKm(w.serviceRadiusKm ?? 25);
        setServiceAreas(w.serviceAreas || []);
        setHourlyRate(w.pricingInfo?.hourlyRate ?? 500);
        setAvgProjectBudget(w.pricingInfo?.avgProjectBudget || '₹1,00,000 - ₹5,00,000');
        setAvailabilityStatus(w.availabilityStatus || 'AVAILABLE');
      }
      if (w?.user) {
        setName(w.user.name || user?.name || '');
        setPhone(w.user.phone || user?.phone || '');
        setAvatarUrl(w.user.avatarUrl || user?.avatarUrl || '');
      } else if (user) {
        setName(user.name || '');
        setPhone(user.phone || '');
        setAvatarUrl(user.avatarUrl || '');
      }
    } catch (err) {
      console.error(err);
      setError('Could not load worker profile.');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image file size must be under 5MB.');
      return;
    }

    setError('');
    setUploadingPhoto(true);

    try {
      const formData = new FormData();
      formData.append('files', file);

      const res = await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const uploadedUrl = res.data.url || res.data.urls?.[0];
      if (uploadedUrl) {
        setAvatarUrl(uploadedUrl);
        setSuccess('Photo uploaded! Remember to save your changes.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to upload photo.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    setAvatarUrl('');
    setSuccess('Photo removed. A clean default avatar with your initials will be displayed.');
  };

  const toggleCategory = (cat) => {
    if (categories.includes(cat)) {
      if (categories.length === 1) {
        setError('At least one specialization category is required.');
        return;
      }
      setCategories(categories.filter((c) => c !== cat));
    } else {
      setCategories([...categories, cat]);
    }
  };

  const handleAddArea = (e) => {
    e.preventDefault();
    const trimmed = newAreaInput.trim();
    if (!trimmed) return;
    if (serviceAreas.includes(trimmed)) {
      setNewAreaInput('');
      return;
    }
    setServiceAreas([...serviceAreas, trimmed]);
    setNewAreaInput('');
  };

  const handleRemoveArea = (areaToRemove) => {
    setServiceAreas(serviceAreas.filter((a) => a !== areaToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Full name is required.');
      return;
    }
    if (!businessName.trim()) {
      setError('Business or Studio name is required.');
      return;
    }
    if (categories.length === 0) {
      setError('Please select at least one specialization category.');
      return;
    }

    setError('');
    setSaving(true);
    setSuccess('');

    try {
      await api.put('/workers/profile', {
        name: name.trim(),
        phone: phone.trim(),
        avatarUrl: avatarUrl.trim(),
        businessName: businessName.trim(),
        description: description.trim(),
        categories,
        experienceYears: Number(experienceYears),
        city: city.trim(),
        serviceRadiusKm: Number(serviceRadiusKm),
        serviceAreas,
        pricingInfo: {
          hourlyRate: Number(hourlyRate),
          avgProjectBudget: avgProjectBudget.trim(),
        },
        availabilityStatus,
      });

      await refreshUser();
      setSuccess('Worker profile updated successfully! ✓');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update worker profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600 mb-3" />
        <p className="font-semibold text-sm">Loading your professional profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fadeIn">
      {/* Top Navigation & Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Link
            to="/worker/dashboard"
            className="text-xs font-bold text-slate-500 hover:text-blue-600 flex items-center gap-1.5 transition mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Edit Worker Profile
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Keep your business details, portfolio services, pricing, and operating areas up to date.
          </p>
        </div>

        {workerProfileId && (
          <Link
            to={`/workers/${workerProfileId}`}
            target="_blank"
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-xs"
          >
            <ExternalLink className="w-3.5 h-3.5" /> View Public Profile
          </Link>
        )}
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold rounded-2xl flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Profile Image & Avatar Card */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base border-b border-slate-100 pb-3">
            <Camera className="w-5 h-5 text-blue-600" />
            <h2>Profile Photo & Identity</h2>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="relative group">
              <Avatar src={avatarUrl} name={name || businessName} size="2xl" />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="absolute inset-0 rounded-full bg-black/45 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition backdrop-blur-xs cursor-pointer"
                title="Click to upload profile photo"
              >
                {uploadingPhoto ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <>
                    <Camera className="w-6 h-6" />
                    <span className="text-[10px] font-bold mt-1">Change</span>
                  </>
                )}
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePhotoUpload}
              accept="image/*"
              className="hidden"
            />

            <div className="space-y-2 text-center sm:text-left flex-1">
              <h3 className="text-sm font-bold text-slate-800">Professional Profile Picture</h3>
              <p className="text-xs text-slate-500">
                {avatarUrl
                  ? 'Your custom photo is active and shown to prospective clients.'
                  : 'No custom photo uploaded. A clean default avatar with your initials is currently shown.'}
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
                >
                  {uploadingPhoto ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  <span>{avatarUrl ? 'Upload New Photo' : 'Add Profile Photo'}</span>
                </button>

                {avatarUrl && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 font-bold text-xs rounded-xl border border-slate-200 hover:border-rose-200 transition flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove Photo</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Basic Business Information */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base border-b border-slate-100 pb-3">
            <Briefcase className="w-5 h-5 text-blue-600" />
            <h2>Business & Contact Details</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Contact Person Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rajesh Kumar"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Business / Studio Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Briefcase className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Raj Interior Studio & Modular Work"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Direct Contact Phone
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Experience (Years)
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
              About Business & Services Bio
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell clients about your expertise, team size, materials used, past luxury or residential projects, and turnaround guarantees..."
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Specialization Categories */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base border-b border-slate-100 pb-3">
            <Layers className="w-5 h-5 text-blue-600" />
            <h2>Specialization Services & Categories</h2>
          </div>
          <p className="text-xs text-slate-500">
            Select all categories you specialize in. Clients search and filter workers based on these categories.
          </p>

          <div className="flex flex-wrap gap-2.5 pt-2">
            {AVAILABLE_CATEGORIES.map((cat) => {
              const selected = categories.includes(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                    selected
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {selected && <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>{cat}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Location & Coverage */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base border-b border-slate-100 pb-3">
            <MapPin className="w-5 h-5 text-blue-600" />
            <h2>Operating City & Service Radius</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <LocationSelector
                value={city}
                onChange={(c) => setCity(c)}
                label="Base Operating City"
                placeholder="Type 2+ letters (e.g. Hy, Ba, Mu...)"
                showMap={false}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Service Radius (km from base)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="5"
                  max="100"
                  value={serviceRadiusKm}
                  onChange={(e) => setServiceRadiusKm(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500"
                />
                <span className="absolute right-3.5 top-2.5 text-xs text-slate-400 font-bold">KM</span>
              </div>
            </div>
          </div>

          {/* Service Areas Tag List */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase">
              Key Localities & Service Areas Covered
            </label>

            <div className="flex gap-2">
              <input
                type="text"
                value={newAreaInput}
                onChange={(e) => setNewAreaInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddArea(e);
                  }
                }}
                placeholder="Add locality (e.g. Jubilee Hills, Gachibowli, Whitefield...)"
                className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleAddArea}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-1">
              {serviceAreas.length === 0 ? (
                <span className="text-xs text-slate-400 italic">No specific localities added yet. All city areas covered.</span>
              ) : (
                serviceAreas.map((area) => (
                  <span
                    key={area}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 text-slate-800 rounded-lg text-xs font-semibold border border-slate-200"
                  >
                    <span>{area}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveArea(area)}
                      className="text-slate-400 hover:text-rose-600 transition"
                      title="Remove locality"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Pricing & Availability */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base border-b border-slate-100 pb-3">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <h2>Pricing & Current Availability</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Hourly / Consultation Rate (₹)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-slate-400 font-bold text-sm">₹</span>
                <input
                  type="number"
                  min="0"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  placeholder="500"
                  className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Typical Project Budget Range
              </label>
              <input
                type="text"
                value={avgProjectBudget}
                onChange={(e) => setAvgProjectBudget(e.target.value)}
                placeholder="e.g. ₹2,00,000 - ₹10,00,000"
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Availability Status
              </label>
              <select
                value={availabilityStatus}
                onChange={(e) => setAvailabilityStatus(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-blue-500"
              >
                <option value="AVAILABLE">🟢 Available (Accepting Projects)</option>
                <option value="BUSY">🟡 Busy (Few slots left)</option>
                <option value="UNAVAILABLE">🔴 Unavailable (Not accepting)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Submit Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-900 text-white p-6 rounded-3xl shadow-xl">
          <div>
            <h3 className="font-extrabold text-base">Ready to publish updates?</h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Changes reflect immediately on your public profile and quotes.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Link
              to="/worker/dashboard"
              className="flex-1 sm:flex-none text-center px-5 py-3 text-xs font-bold text-slate-300 hover:text-white rounded-xl transition"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 sm:flex-none px-7 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>{saving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
