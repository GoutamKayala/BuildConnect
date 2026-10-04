import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import {
  MapPin,
  Lock,
  Unlock,
  FileText,
  CheckCircle2,
  Calendar,
  MessageSquare,
  DollarSign,
  ShieldCheck,
  Award,
  Star,
  Loader2,
  Sparkles,
  AlertCircle,
  Check,
} from 'lucide-react';
import { Avatar } from '../../components/Avatar';

export const ClientProjectDetail = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [quotation, setQuotation] = useState(null);
  const [agreement, setAgreement] = useState(null);
  const [milestones, setMilestones] = useState([]);
  // Review state
  const [review, setReview] = useState(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [completingProject, setCompletingProject] = useState(false);

  // E-Sign modal state
  const [isSigning, setIsSigning] = useState(false);

  const fetchProjectData = async () => {
    try {
      const pRes = await api.get(`/projects/${id}`);
      setProject(pRes.data.project);

      const qRes = await api.get(`/quotes/project/${id}`);
      if (qRes.data.quotations?.length) {
        setQuotation(qRes.data.quotations[0]);
      }

      const aRes = await api.get(`/agreements/project/${id}`);
      setAgreement(aRes.data.agreement);

      const mRes = await api.get(`/milestones/project/${id}`);
      setMilestones(mRes.data.milestones || []);

      try {
        const revRes = await api.get(`/reviews/project/${id}`);
        if (revRes.data.review) {
          setReview(revRes.data.review);
        }
      } catch (e) {}
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjectData();
  }, [id]);

  const handleCompleteProject = async () => {
    if (!window.confirm('Are you sure all project deliverables are finished and you want to mark this project as COMPLETED?')) {
      return;
    }
    setCompletingProject(true);
    try {
      await api.patch(`/projects/${id}/stage`, { status: 'COMPLETED', stage: 'COMPLETION' });
      await fetchProjectData();
      setIsReviewModalOpen(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to complete project');
    } finally {
      setCompletingProject(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      setReviewError('Please provide a review feedback comment.');
      return;
    }
    setReviewError('');
    setSubmittingReview(true);
    try {
      const res = await api.post('/reviews', {
        projectId: id,
        rating,
        comment: comment.trim(),
      });
      setReview(res.data.review);
      setIsReviewModalOpen(false);
      alert('🌟 Thank you! Your review has been submitted successfully.');
      fetchProjectData();
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleShareLocation = async () => {
    try {
      await api.post(`/projects/${id}/share-location`);
      alert('Exact location authorization granted to worker!');
      fetchProjectData();
    } catch (err) {
      alert('Failed to authorize location');
    }
  };

  const handleQuoteAction = async (status) => {
    if (!quotation) return;
    try {
      await api.patch(`/quotes/${quotation._id}/status`, { status });
      alert(`Quotation ${status}`);
      if (status === 'ACCEPTED') {
        // Auto create agreement
        await api.post('/agreements', { quotationId: quotation._id });
      }
      fetchProjectData();
    } catch (err) {
      alert('Failed to update quote status');
    }
  };

  const handleSignAgreement = async () => {
    if (!agreement) return;
    setIsSigning(true);
    try {
      await api.post(`/agreements/${agreement._id}/sign`);
      alert('Agreement signed successfully!');
      fetchProjectData();
    } catch (err) {
      alert('Failed to sign agreement');
    } finally {
      setIsSigning(false);
    }
  };

  const handlePayMilestone = async (milestoneId) => {
    try {
      await api.post('/payments/process', { milestoneId, provider: 'SIMULATED' });
      alert('Milestone payment completed successfully!');
      fetchProjectData();
    } catch (err) {
      alert('Payment failed');
    }
  };

  if (loading) return <div className="text-center py-20 text-slate-400">Loading project workspace...</div>;
  if (!project) return <div className="text-center py-20 text-slate-500">Project not found.</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-slate-900">{project.title}</h1>
              <StatusBadge status={project.status} />
            </div>
            <p className="text-xs text-slate-500 mt-1">Category: {project.category} • Property: {project.propertyType}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link
              to={`/client/messages?projectId=${project._id}`}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4" /> Open Chat Workspace
            </Link>

            {project.status !== 'COMPLETED' ? (
              <button
                type="button"
                onClick={handleCompleteProject}
                disabled={completingProject}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition"
              >
                {completingProject ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>Mark Project Completed</span>
              </button>
            ) : review ? (
              <button
                type="button"
                onClick={() => {
                  setRating(review.rating);
                  setComment(review.comment);
                  setIsReviewModalOpen(true);
                }}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition"
              >
                <Star className="w-4 h-4 fill-white" /> Edit Review ({review.rating}★)
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(true)}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2 transition"
              >
                <Star className="w-4 h-4 fill-white" /> Leave Review & Rating
              </button>
            )}
          </div>
        </div>

        {/* Location Privacy Shield Card */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
          <div className="flex items-center gap-3">
            {project.locationSharedWithWorker ? (
              <Unlock className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <Lock className="w-5 h-5 text-amber-600 flex-shrink-0" />
            )}
            <div>
              <div className="font-bold text-slate-800">
                {project.locationSharedWithWorker ? 'Exact Location Shared' : 'Location Privacy Shield Active'}
              </div>
              <p className="text-slate-500">
                {project.locationSharedWithWorker
                  ? `Address: ${project.exactAddress?.street || 'Authorized'}`
                  : `Public location shown as ${project.publicLocation?.city}. Exact street address is hidden.`}
              </p>
            </div>
          </div>

          {!project.locationSharedWithWorker && (
            <button
              onClick={handleShareLocation}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm transition"
            >
              Share Exact Location for Site Visit
            </button>
          )}
        </div>
      </div>

      {/* Completed Project Review & Rating Section */}
      {project.status === 'COMPLETED' && (
        <div className="space-y-4">
          {review ? (
            <div className="bg-gradient-to-r from-amber-50 via-white to-amber-50/50 border border-amber-200/90 p-6 rounded-3xl shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-extrabold text-xl shadow-md shadow-amber-500/20">
                    ★
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`w-5 h-5 ${
                            s <= review.rating ? 'fill-amber-400 text-amber-500' : 'text-slate-300'
                          }`}
                        />
                      ))}
                      <span className="ml-2 font-extrabold text-slate-900 text-sm">
                        {review.rating} / 5.0
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-600 mt-1">
                      Your verified review for {project.assignedWorker?.name}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setRating(review.rating);
                    setComment(review.comment);
                    setIsReviewModalOpen(true);
                  }}
                  className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 font-bold text-xs rounded-xl transition"
                >
                  Edit Feedback
                </button>
              </div>

              <div className="bg-white/90 p-4 rounded-2xl border border-amber-100 text-sm text-slate-800 leading-relaxed italic">
                "{review.comment}"
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-amber-400 text-slate-900 flex items-center justify-center flex-shrink-0 font-extrabold text-2xl shadow-lg">
                  ⭐
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Project Finished
                  </span>
                  <h3 className="font-extrabold text-lg sm:text-xl mt-0.5">
                    How was your experience with {project.assignedWorker?.name || 'your worker'}?
                  </h3>
                  <p className="text-xs text-slate-300 mt-1">
                    Your rating and feedback helps keep BuildConnect transparent, trusted, and rewarding for great craftsmanship.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setRating(5);
                  setComment('');
                  setIsReviewModalOpen(true);
                }}
                className="px-6 py-3 bg-amber-400 hover:bg-amber-300 text-slate-900 font-extrabold text-xs rounded-xl shadow-lg transition flex items-center gap-2 whitespace-nowrap self-stretch sm:self-auto justify-center"
              >
                <Star className="w-4 h-4 fill-slate-900" /> Leave Worker Review
              </button>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Itemized Quotation Inspector */}
          {quotation && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <div>
                  <h2 className="font-bold text-slate-900 text-base">Quotation #{quotation.quoteNumber}</h2>
                  <p className="text-xs text-slate-500">Submitted by Worker • Version {quotation.version}</p>
                </div>
                <StatusBadge status={quotation.status} />
              </div>

              {/* Items List */}
              <div className="space-y-2">
                {quotation.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl text-xs">
                    <div>
                      <div className="font-bold text-slate-800">{item.title}</div>
                      <div className="text-slate-500">{item.quantity} {item.unit} @ INR {item.unitPrice.toLocaleString()}</div>
                    </div>
                    <div className="font-bold text-slate-900">INR {item.totalPrice.toLocaleString()}</div>
                  </div>
                ))}
              </div>

              <div className="pt-3 border-t border-slate-100 text-xs space-y-1 text-right">
                <div>Subtotal: INR {quotation.subtotal.toLocaleString()}</div>
                <div>Tax (18%): INR {quotation.taxAmount.toLocaleString()}</div>
                <div className="text-sm font-extrabold text-blue-600">Grand Total: INR {quotation.grandTotal.toLocaleString()}</div>
              </div>

              {quotation.status === 'SENT' && (
                <div className="pt-4 border-t border-slate-100 flex gap-3">
                  <button
                    onClick={() => handleQuoteAction('ACCEPTED')}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition"
                  >
                    Accept Quotation
                  </button>
                  <button
                    onClick={() => handleQuoteAction('REJECTED')}
                    className="flex-1 py-2.5 bg-rose-50 text-rose-700 font-bold text-xs rounded-xl border border-rose-200 hover:bg-rose-100 transition"
                  >
                    Reject Quotation
                  </button>
                </div>
              )}
            </div>
          )}

          {/* E-Signature Agreement Panel */}
          {agreement && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-600" /> Project Contract Agreement
                </h2>
                <StatusBadge status={agreement.status} />
              </div>

              <p className="text-xs text-slate-600 leading-relaxed bg-purple-50/50 p-4 rounded-xl border border-purple-100">
                {agreement.scopeOfWork}
              </p>

              <div className="text-xs space-y-1">
                <div>Client Signed: {agreement.signedByClientAt ? new Date(agreement.signedByClientAt).toLocaleDateString() : 'Pending Signature'}</div>
                <div>Worker Signed: {agreement.signedByWorkerAt ? new Date(agreement.signedByWorkerAt).toLocaleDateString() : 'Pending Signature'}</div>
              </div>

              {!agreement.signedByClientAt && (
                <button
                  onClick={handleSignAgreement}
                  disabled={isSigning}
                  className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow transition"
                >
                  {isSigning ? 'Processing Signature...' : 'E-Sign Contract Agreement'}
                </button>
              )}
            </div>
          )}

          {/* Milestones & Escrow Payments */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h2 className="font-bold text-slate-900 text-base">Project Milestones & Payment Schedule</h2>
            {milestones.length === 0 ? (
              <p className="text-xs text-slate-400">Milestones will be generated upon contract acceptance.</p>
            ) : (
              <div className="space-y-3">
                {milestones.map((m) => (
                  <div key={m._id} className="p-4 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-800">{m.title}</span>
                      <StatusBadge status={m.paymentStatus} />
                    </div>
                    <p className="text-xs text-slate-500">{m.description}</p>
                    <div className="flex justify-between items-center pt-2 text-xs">
                      <span className="font-bold text-slate-900">INR {m.amount.toLocaleString()}</span>
                      {m.paymentStatus === 'PAYABLE' && (
                        <button
                          onClick={() => handlePayMilestone(m._id)}
                          className="px-3 py-1.5 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 shadow-sm"
                        >
                          Approve & Pay Milestone
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar Details */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
            <h3 className="font-bold text-slate-900 text-sm">Assigned Professional</h3>
            {project.assignedWorker ? (
              <div className="flex items-center gap-3">
                <Avatar
                  src={project.assignedWorker.avatarUrl}
                  name={project.assignedWorker.name}
                  size="md"
                />
                <div>
                  <div className="font-bold text-sm text-slate-800">{project.assignedWorker.name}</div>
                  <div className="text-xs text-slate-500">{project.assignedWorker.phone || project.assignedWorker.email}</div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">Worker not yet assigned.</p>
            )}
          </div>
        </div>
      </div>

      {/* Review & Rating Modal */}
      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title={review ? 'Update Project Review' : 'Rate & Review Your Experience'}
        maxWidth="max-w-lg"
      >
        <form onSubmit={handleSubmitReview} className="space-y-6">
          {reviewError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{reviewError}</span>
            </div>
          )}

          <div className="text-center p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
            <Avatar
              src={project.assignedWorker?.avatarUrl}
              name={project.assignedWorker?.name}
              size="xl"
              className="mx-auto"
            />
            <div>
              <h3 className="font-extrabold text-base text-slate-900">
                {project.assignedWorker?.name}
              </h3>
              <p className="text-xs text-slate-500">{project.title}</p>
            </div>

            {/* Interactive Stars */}
            <div className="flex items-center justify-center gap-2 pt-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRating(s)}
                  onMouseEnter={() => setHoverRating(s)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 text-slate-300 hover:scale-120 transition transform focus:outline-none cursor-pointer"
                >
                  <Star
                    className={`w-8 h-8 transition-colors ${
                      s <= (hoverRating || rating)
                        ? 'fill-amber-400 text-amber-500'
                        : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>

            <div className="text-xs font-bold text-amber-600">
              {(hoverRating || rating) === 1 && '1 Star — Poor Experience'}
              {(hoverRating || rating) === 2 && '2 Stars — Fair / Needs Improvement'}
              {(hoverRating || rating) === 3 && '3 Stars — Good & Satisfactory'}
              {(hoverRating || rating) === 4 && '4 Stars — Very Good Quality'}
              {(hoverRating || rating) === 5 && '5 Stars — Exceptional Craftsmanship!'}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
              Review Feedback & Comments <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={4}
              required
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Describe work quality, punctuality, communication, cleanliness of site, accuracy of quote, and final execution..."
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsReviewModalOpen(false)}
              className="px-5 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-900 rounded-xl border border-slate-200 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submittingReview}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5"
            >
              {submittingReview ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Check className="w-3.5 h-3.5" />
              )}
              <span>{review ? 'Update Review' : 'Submit Review'}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
