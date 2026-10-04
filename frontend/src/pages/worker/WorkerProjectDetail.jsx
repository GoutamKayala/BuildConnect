import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import {
  MapPin,
  Lock,
  Unlock,
  Plus,
  Send,
  FileText,
  MessageSquare,
  CheckCircle2,
  Calendar,
  Layers,
  Star,
  Award,
} from 'lucide-react';
import { Avatar } from '../../components/Avatar';

export const WorkerProjectDetail = () => {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [quotations, setQuotations] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);

  // Quote generator modal state
  const [isQuoteModalOpen, setIsQuoteModalOpen] = useState(false);
  const [quoteItems, setQuoteItems] = useState([
    { title: '', quantity: 1, unit: 'sq ft', unitPrice: 0, labourCost: 0, materialCost: 0 },
  ]);
  const [taxAmount, setTaxAmount] = useState(0);
  const [discountAmount, setDiscountAmount] = useState(0);

  const fetchProjectData = async () => {
    try {
      const pRes = await api.get(`/projects/${id}`);
      setProject(pRes.data.project);

      const qRes = await api.get(`/quotes/project/${id}`);
      setQuotations(qRes.data.quotations || []);

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

  const handleRequestSiteVisit = async () => {
    try {
      await api.post(`/projects/${id}/site-visits`, {
        projectId: id,
        notes: 'Requesting site visit inspection to finalize quotation measurements.',
      });
      alert('Site visit requested to client!');
      fetchProjectData();
    } catch (err) {
      alert('Failed to request site visit');
    }
  };

  const handleAddQuoteItem = () => {
    setQuoteItems([
      ...quoteItems,
      { title: '', quantity: 1, unit: 'sq ft', unitPrice: 0, labourCost: 0, materialCost: 0 },
    ]);
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...quoteItems];
    updated[index][field] = value;
    setQuoteItems(updated);
  };

  const handleCreateQuoteSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/quotes', {
        projectId: id,
        items: quoteItems,
        taxAmount,
        discountAmount,
      });

      setIsQuoteModalOpen(false);
      alert('Quotation generated and sent to client!');
      fetchProjectData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit quotation');
    }
  };

  const handleUpdateMilestoneStatus = async (milestoneId, status, completionPercentage) => {
    try {
      await api.patch(`/milestones/${milestoneId}/status`, {
        status,
        completionPercentage,
      });
      alert(`Milestone updated to ${status}`);
      fetchProjectData();
    } catch (err) {
      alert('Failed to update milestone status');
    }
  };

  if (loading) return <div className="text-center py-20 text-slate-400">Loading project workspace...</div>;
  if (!project) return <div className="text-center py-20 text-slate-500">Project not found.</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Workspace Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-slate-900">{project.title}</h1>
              <StatusBadge status={project.status} />
            </div>
            <p className="text-xs text-slate-500 mt-1">Client: {project.client?.name} • Category: {project.category}</p>
          </div>

          <div className="flex gap-3">
            <Link
              to={`/worker/messages?projectId=${project._id}`}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-2"
            >
              <MessageSquare className="w-4 h-4 text-blue-600" /> Chat with Client
            </Link>
            <button
              onClick={() => setIsQuoteModalOpen(true)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-2"
            >
              <Send className="w-4 h-4" /> Create Quotation
            </button>
          </div>
        </div>

        {/* Location Authorization Box */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs">
          <div className="flex items-center gap-3">
            {project.locationSharedWithWorker ? (
              <Unlock className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            ) : (
              <Lock className="w-5 h-5 text-amber-600 flex-shrink-0" />
            )}
            <div>
              <div className="font-bold text-slate-800">
                {project.locationSharedWithWorker ? 'Authorized Full Address Access' : 'Location Masked by Client Privacy'}
              </div>
              <p className="text-slate-500">
                {project.locationSharedWithWorker
                  ? `Address: ${project.exactAddress?.street || ''}, ${project.exactAddress?.landmark || ''}, ${project.publicLocation?.city}`
                  : `City: ${project.publicLocation?.city}. Request a site visit for exact location access.`}
              </p>
            </div>
          </div>

          {!project.locationSharedWithWorker && (
            <button
              onClick={handleRequestSiteVisit}
              className="px-4 py-2 bg-blue-600 text-white font-bold rounded-xl shadow-sm hover:bg-blue-700 transition"
            >
              Request Site Visit Inspection
            </button>
          )}
        </div>

        {/* Completed Client Review Display */}
        {review && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-2xl border border-amber-200 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-600" />
                <span className="font-extrabold text-amber-900 text-sm">Client Verified Review & Rating</span>
              </div>
              <div className="flex items-center gap-1 bg-amber-500 text-white px-2.5 py-1 rounded-full text-xs font-bold">
                <Star className="w-3.5 h-3.5 fill-white" />
                <span>{review.rating}.0 / 5.0</span>
              </div>
            </div>
            <p className="text-slate-700 italic text-sm">"{review.comment}"</p>
            <div className="text-[11px] text-slate-500 font-medium">
              Submitted by {review.reviewer?.name || 'Client'} • {new Date(review.createdAt).toLocaleDateString()}
            </div>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Quotations History */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h2 className="font-bold text-slate-900 text-base">Generated Quotations</h2>
            {quotations.length === 0 ? (
              <p className="text-xs text-slate-400">No quotation generated yet. Click "Create Quotation" above.</p>
            ) : (
              <div className="space-y-4">
                {quotations.map((q) => (
                  <div key={q._id} className="p-4 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-800">Quote #{q.quoteNumber} (v{q.version})</span>
                      <StatusBadge status={q.status} />
                    </div>
                    <div className="text-xs font-extrabold text-blue-600 pt-1">
                      Grand Total: INR {q.grandTotal.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Milestone Progress & Submission Panel */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h2 className="font-bold text-slate-900 text-base">Work Milestones & Progress Tracking</h2>
            {milestones.length === 0 ? (
              <p className="text-xs text-slate-400">Milestones will appear once contract is active.</p>
            ) : (
              <div className="space-y-4">
                {milestones.map((m) => (
                  <div key={m._id} className="p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-800">{m.title}</span>
                      <StatusBadge status={m.status} />
                    </div>
                    <p className="text-xs text-slate-500">{m.description}</p>
                    <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-100">
                      <span className="font-bold text-slate-900">INR {m.amount.toLocaleString()}</span>
                      {m.status !== 'COMPLETED' && (
                        <button
                          onClick={() => handleUpdateMilestoneStatus(m._id, 'SUBMITTED', 100)}
                          className="px-3 py-1.5 bg-blue-600 text-white font-bold rounded-lg text-xs hover:bg-blue-700"
                        >
                          Submit Work for Review
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 space-y-3">
            <h3 className="font-bold text-slate-900 text-sm">Client Information</h3>
            <div className="text-xs text-slate-600 space-y-1">
              <div><strong className="text-slate-800">Name:</strong> {project.client?.name}</div>
              <div><strong className="text-slate-800">Phone:</strong> {project.client?.phone || 'Hidden until contract'}</div>
              <div><strong className="text-slate-800">City:</strong> {project.publicLocation?.city}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Itemized Quote Generator Modal */}
      <Modal isOpen={isQuoteModalOpen} onClose={() => setIsQuoteModalOpen(false)} title="Generate Itemized Quotation">
        <form onSubmit={handleCreateQuoteSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          {quoteItems.map((item, idx) => (
            <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
              <div className="font-bold text-slate-800">Line Item #{idx + 1}</div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Item Title / Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Teak veneer wall panelling"
                  value={item.title}
                  onChange={(e) => handleItemChange(idx, 'title', e.target.value)}
                  className="w-full p-2 bg-white border border-slate-200 rounded-lg"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Quantity</label>
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Unit</label>
                  <input
                    type="text"
                    value={item.unit}
                    onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Unit Price</label>
                  <input
                    type="number"
                    value={item.unitPrice}
                    onChange={(e) => handleItemChange(idx, 'unitPrice', Number(e.target.value))}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Labour Cost (INR)</label>
                  <input
                    type="number"
                    value={item.labourCost}
                    onChange={(e) => handleItemChange(idx, 'labourCost', Number(e.target.value))}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Material Cost (INR)</label>
                  <input
                    type="number"
                    value={item.materialCost}
                    onChange={(e) => handleItemChange(idx, 'materialCost', Number(e.target.value))}
                    className="w-full p-2 bg-white border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={handleAddQuoteItem}
            className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
          >
            + Add Another Line Item
          </button>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Tax Amount (INR)</label>
              <input
                type="number"
                value={taxAmount}
                onChange={(e) => setTaxAmount(Number(e.target.value))}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Discount (INR)</label>
              <input
                type="number"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(Number(e.target.value))}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow text-xs"
          >
            Send Quotation to Client
          </button>
        </form>
      </Modal>
    </div>
  );
};
