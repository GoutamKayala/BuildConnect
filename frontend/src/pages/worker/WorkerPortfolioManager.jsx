import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { Modal } from '../../components/Modal';
import { LocationSelector } from '../../components/LocationSelector';
import {
  Plus,
  Trash2,
  Image as ImageIcon,
  Heart,
  MessageCircle,
  Share2,
  Grid,
  SquareCheck,
  Upload,
  X,
  ShieldCheck,
  MapPin,
  Sparkles,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Award,
} from 'lucide-react';
import { Avatar } from '../../components/Avatar';

export const WorkerPortfolioManager = () => {
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState([]);
  const [workerProfile, setWorkerProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('grid'); // 'grid' | 'feed'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null); // for Instagram lightbox modal

  // Form state for creating a new post
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Interior Design');
  const [description, setDescription] = useState('');
  const [locationCity, setLocationCity] = useState('');
  const [budgetRange, setBudgetRange] = useState('');
  const [materials, setMaterials] = useState('');
  const [tags, setTags] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const fetchWorkerData = async () => {
    try {
      const res = await api.get(`/workers/${user.id}`);
      setPortfolio(res.data.portfolio || []);
      setWorkerProfile(res.data.worker || null);
      if (res.data.worker?.city) {
        setLocationCity(res.data.worker.city);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) fetchWorkerData();
  }, [user]);

  useEffect(() => {
    if (!selectedPost && !isModalOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedPost(null);
        setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPost, isModalOpen]);

  // Handle local file selection for direct photo upload
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setSelectedFiles((prev) => [...prev, ...files]);

    // Create local object URLs for instant preview
    const newPreviews = files.map((file) => ({
      file,
      url: URL.createObjectURL(file),
      name: file.name,
    }));
    setPreviewUrls((prev) => [...prev, ...newPreviews]);
  };

  const handleRemovePhoto = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();

    if (selectedFiles.length === 0) {
      alert('Please upload at least one photo for your post!');
      return;
    }

    setUploading(true);
    try {
      // 1. Upload files directly to backend
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append('files', file);
      });

      const uploadRes = await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const uploadedUrls = uploadRes.data.urls || [uploadRes.data.url];
      const imagesPayload = uploadedUrls.map((url) => ({
        url,
        caption: title,
      }));

      // 2. Create the portfolio post with the uploaded images
      await api.post('/workers/portfolio', {
        title,
        category,
        description,
        locationCity,
        budgetRange,
        images: imagesPayload,
        materialsUsed: materials ? materials.split(',').map((m) => m.trim()) : [],
        tags: tags ? tags.split(' ').map((t) => (t.startsWith('#') ? t : `#${t}`)) : [],
      });

      // Reset form
      setIsModalOpen(false);
      setTitle('');
      setDescription('');
      setMaterials('');
      setTags('');
      setBudgetRange('');
      setSelectedFiles([]);
      setPreviewUrls([]);
      fetchWorkerData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || 'Failed to publish post. Please check files and try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleLikePost = async (postId, e) => {
    if (e) e.stopPropagation();
    try {
      const res = await api.post(`/workers/portfolio/${postId}/like`);
      // Update local state
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
      console.error('Like error:', err);
    }
  };

  const handleDelete = async (itemId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Delete this post from your portfolio?')) return;
    try {
      await api.delete(`/workers/portfolio/${itemId}`);
      if (selectedPost?._id === itemId) setSelectedPost(null);
      fetchWorkerData();
    } catch (err) {
      alert('Failed to delete post');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      {/* Instagram-Style Profile Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
          {/* Avatar with Instagram-style gradient border */}
          <div className="relative group">
            <div className="w-28 h-28 md:w-36 md:h-36 rounded-full p-1 bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 shadow-md flex items-center justify-center">
              <Avatar
                src={user?.avatarUrl}
                name={workerProfile?.businessName || user?.name}
                size="2xl"
                className="w-full h-full border-2 border-white"
              />
            </div>
            {workerProfile?.verificationStatus === 'VERIFIED' && (
              <div
                className="absolute bottom-1 right-2 bg-blue-600 text-white p-1.5 rounded-full border-2 border-white shadow-sm"
                title="Verified Professional"
              >
                <ShieldCheck className="w-4 h-4" />
              </div>
            )}
          </div>

          {/* Profile Information & Actions */}
          <div className="flex-1 text-center md:text-left space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <div className="flex items-center justify-center md:justify-start gap-2">
                  <h1 className="text-2xl font-black text-slate-900">
                    {workerProfile?.businessName || user?.name}
                  </h1>
                  {workerProfile?.verificationStatus === 'VERIFIED' && (
                    <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Verified
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  @{user?.name?.toLowerCase().replace(/\s+/g, '.') || 'pro.creator'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-2 transition"
                >
                  <Plus className="w-4 h-4" /> Create New Post
                </button>
                <Link
                  to={`/workers/${user?.id}`}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Public View
                </Link>
              </div>
            </div>

            {/* Social Stats Strip */}
            <div className="flex items-center justify-center md:justify-start gap-6 sm:gap-8 pt-1 text-slate-800 border-y border-slate-100 py-3">
              <div>
                <span className="font-extrabold text-base text-slate-900 block">{portfolio.length}</span>
                <span className="text-xs text-slate-500 font-medium">Posts</span>
              </div>
              <div>
                <span className="font-extrabold text-base text-slate-900 block">
                  {workerProfile?.completedProjectsCount || 38}
                </span>
                <span className="text-xs text-slate-500 font-medium">Projects Completed</span>
              </div>
              <div>
                <span className="font-extrabold text-base text-slate-900 block flex items-center gap-1">
                  ★ {workerProfile?.avgRating || 4.9}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {workerProfile?.reviewsCount || 24} Reviews
                </span>
              </div>
              <div>
                <span className="font-extrabold text-base text-slate-900 block">
                  {workerProfile?.experienceYears || 8} Yrs
                </span>
                <span className="text-xs text-slate-500 font-medium">Experience</span>
              </div>
            </div>

            {/* Bio & Details */}
            <div className="space-y-2 text-xs">
              <p className="text-slate-600 leading-relaxed max-w-2xl">
                {workerProfile?.description ||
                  'Turnkey interior contractor & modular designer. We transform empty spaces into luxurious homes.'}
              </p>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-1">
                {workerProfile?.city && (
                  <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-blue-500" /> {workerProfile.city}
                  </span>
                )}
                {workerProfile?.categories?.map((cat, i) => (
                  <span key={i} className="bg-blue-50 text-blue-700 px-2.5 py-1 rounded-lg font-semibold">
                    {cat}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* View Toggle Bar (Grid vs Feed) */}
        <div className="mt-8 pt-4 border-t border-slate-200 flex justify-center gap-8 text-xs font-bold uppercase tracking-wider">
          <button
            onClick={() => setActiveTab('grid')}
            className={`flex items-center gap-2 py-2 border-t-2 -mt-[18px] transition ${
              activeTab === 'grid'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Grid className="w-4 h-4" /> Grid Posts ({portfolio.length})
          </button>
          <button
            onClick={() => setActiveTab('feed')}
            className={`flex items-center gap-2 py-2 border-t-2 -mt-[18px] transition ${
              activeTab === 'feed'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Layers className="w-4 h-4" /> Social Feed
          </button>
        </div>
      </div>

      {/* Content Section */}
      {loading ? (
        <div className="text-center py-20 text-slate-400">Loading portfolio posts...</div>
      ) : portfolio.length === 0 ? (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <ImageIcon className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-slate-800 text-lg">No Work Posts Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Upload high-resolution photos of your completed projects directly from your device to impress prospective clients!
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Post Your First Project
          </button>
        </div>
      ) : activeTab === 'grid' ? (
        /* Instagram 3-Column Square Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
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

                {/* Multiple Images Indicator */}
                {item.images?.length > 1 && (
                  <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-sm text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 z-10">
                    <Layers className="w-3 h-3" /> {item.images.length}
                  </div>
                )}

                {/* Hover Overlay with stats */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition duration-200 flex flex-col items-center justify-center text-white p-4 space-y-2 text-center">
                  <h4 className="font-bold text-sm line-clamp-1">{item.title}</h4>
                  <span className="text-[11px] bg-white/20 backdrop-blur px-2.5 py-0.5 rounded-full">
                    {item.category}
                  </span>
                  <div className="flex items-center gap-4 text-xs font-bold pt-2">
                    <span className="flex items-center gap-1.5">
                      <Heart className="w-4 h-4 fill-white text-white" /> {item.likesCount || 0}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MessageCircle className="w-4 h-4 fill-white text-white" /> View
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Instagram Feed View (Cards) */
        <div className="max-w-xl mx-auto space-y-6">
          {portfolio.map((item) => (
            <div key={item._id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
              {/* Post Header */}
              <div className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar
                    src={user?.avatarUrl}
                    name={workerProfile?.businessName || user?.name}
                    size="sm"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-xs text-slate-900">
                        {workerProfile?.businessName || user?.name}
                      </span>
                      {workerProfile?.verificationStatus === 'VERIFIED' && (
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400">
                      {item.locationCity ? `${item.locationCity} • ` : ''}
                      {item.category}
                    </span>
                  </div>
                </div>

                <button
                  onClick={(e) => handleDelete(item._id, e)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                  title="Delete post"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Post Photo */}
              <div className="relative bg-slate-900 aspect-video sm:aspect-square flex items-center justify-center overflow-hidden">
                <img
                  src={item.images?.[0]?.url || 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800'}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Action Bar */}
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={(e) => handleLikePost(item._id, e)}
                      className={`flex items-center gap-1.5 text-sm font-bold transition ${
                        item.isLiked ? 'text-rose-600' : 'text-slate-700 hover:text-rose-600'
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${item.isLiked ? 'fill-rose-600' : ''}`} />
                      <span>{item.likesCount || 0}</span>
                    </button>
                    <button
                      onClick={() => setSelectedPost(item)}
                      className="text-slate-600 hover:text-blue-600"
                    >
                      <MessageCircle className="w-5 h-5" />
                    </button>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {new Date(item.createdAt || Date.now()).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                </div>

                {/* Caption & Description */}
                <div className="space-y-1 text-xs">
                  <p className="text-slate-900 font-bold">{item.title}</p>
                  <p className="text-slate-600 leading-relaxed">{item.description}</p>
                </div>

                {/* Materials Used & Tags */}
                {item.materialsUsed?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {item.materialsUsed.map((mat, i) => (
                      <span key={i} className="text-[11px] bg-slate-100 text-slate-600 font-medium px-2 py-0.5 rounded-md">
                        {mat}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

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
                      src={user?.avatarUrl}
                      name={workerProfile?.businessName || user?.name}
                      size="sm"
                    />
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">
                        {workerProfile?.businessName || user?.name}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {selectedPost.locationCity || 'Verified Contractor'}
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
                    onClick={(e) => handleDelete(selectedPost._id, e)}
                    className="text-xs text-rose-600 hover:bg-rose-50 px-2.5 py-1 rounded-lg font-semibold transition flex items-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete Post
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* "Create New Post" Modal with Direct Photo Upload */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Work Post">
        <form onSubmit={handleAddSubmit} className="space-y-4">
          {/* Direct Photo Upload Drag & Drop Zone */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Project Photos <span className="text-rose-500">* (Select directly from device)</span>
            </label>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
            />

            {previewUrls.length === 0 ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-6 text-center cursor-pointer bg-slate-50/50 hover:bg-blue-50/20 transition space-y-2"
              >
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-xs font-bold text-blue-600 hover:underline">
                    Click to browse photos
                  </span>{' '}
                  <span className="text-xs text-slate-500">from your computer</span>
                </div>
                <p className="text-[11px] text-slate-400">Supports JPG, PNG, WEBP up to 10MB each</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {previewUrls.map((p, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group">
                      <img src={p.url} alt="upload preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemovePhoto(idx)}
                        className="absolute top-1 right-1 p-1 bg-black/70 hover:bg-rose-600 text-white rounded-full transition"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      {idx === 0 && (
                        <span className="absolute bottom-1 left-1 bg-blue-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                          Cover
                        </span>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-500 flex flex-col items-center justify-center text-slate-500 hover:text-blue-600 text-xs font-bold transition"
                  >
                    <Plus className="w-5 h-5 mb-1" /> Add More
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Post Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Luxury 3BHK Italian Marble Living Room"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Service Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
              >
                <option value="Interior Design">Interior Design</option>
                <option value="Modular Kitchen">Modular Kitchen</option>
                <option value="Carpentry">Carpentry</option>
                <option value="False Ceiling">False Ceiling</option>
                <option value="Painting">Painting</option>
                <option value="Flooring">Flooring</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Approx. Budget</label>
              <input
                type="text"
                placeholder="e.g. ₹5,50,000"
                value={budgetRange}
                onChange={(e) => setBudgetRange(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
              />
            </div>
          </div>

          {/* Location Autocomplete with Map Preview */}
          <div>
            <LocationSelector
              value={locationCity}
              onChange={(c) => setLocationCity(c)}
              label="Project Location"
              placeholder="Type 2+ letters (e.g. Banjara Hills, Hyderabad)"
              showMap={false}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Caption / Description
            </label>
            <textarea
              rows={3}
              placeholder="Tell clients about the design concept, timeline, challenges resolved..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500"
            ></textarea>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Materials Used (comma separated)
            </label>
            <input
              type="text"
              placeholder="e.g. Teak Veneer, Quartz Island, Blum Hardware"
              value={materials}
              onChange={(e) => setMaterials(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-md text-xs transition flex items-center justify-center gap-2"
          >
            {uploading ? 'Uploading Photos & Publishing...' : 'Publish Post to Showcase'}
          </button>
        </form>
      </Modal>
    </div>
  );
};
