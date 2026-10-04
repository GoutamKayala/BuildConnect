import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/StatusBadge';
import { Modal } from '../../components/Modal';
import {
  Briefcase,
  ShieldCheck,
  Plus,
  ArrowRight,
  MapPin,
  DollarSign,
  FileText,
  AlertCircle,
  MessageSquare,
  Landmark,
  Check,
  CheckCircle2,
  Lock,
  User,
} from 'lucide-react';

export const WorkerDashboard = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  // Payout info state (Only Worker)
  const [payoutInfo, setPayoutInfo] = useState(null);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [payoutForm, setPayoutForm] = useState({
    upiId: '',
    bankName: '',
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    accountType: 'SAVINGS',
  });
  const [savingPayout, setSavingPayout] = useState(false);

  useEffect(() => {
    api.get('/projects').then((res) => {
      setProjects(res.data.projects || []);
    }).catch(console.error).finally(() => setLoading(false));

    api.get('/workers/payout-settings').then((res) => {
      if (res.data.payoutInfo) {
        setPayoutInfo(res.data.payoutInfo);
        setPayoutForm({
          upiId: res.data.payoutInfo.upiId || '',
          bankName: res.data.payoutInfo.bankName || '',
          accountHolderName: res.data.payoutInfo.accountHolderName || user?.name || '',
          accountNumber: res.data.payoutInfo.accountNumber || '',
          ifscCode: res.data.payoutInfo.ifscCode || '',
          accountType: res.data.payoutInfo.accountType || 'SAVINGS',
        });
      }
    }).catch(console.error);
  }, [user]);

  const handleSavePayout = async (e) => {
    e.preventDefault();
    setSavingPayout(true);
    try {
      const res = await api.post('/workers/payout-settings', payoutForm);
      setPayoutInfo(res.data.payoutInfo);
      setIsPayoutModalOpen(false);
      alert('✅ Bank & UPI Payout settings updated successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update payout settings');
    } finally {
      setSavingPayout(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white rounded-3xl p-8 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-400">Professional Worker Workspace</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">Hello, {user?.name}!</h1>
          <p className="text-sm text-slate-300 mt-1">Manage project requests, inspect site locations, submit itemized quotes, and collect milestone payments.</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            to="/worker/profile"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm px-4 py-2.5 rounded-xl shadow-md transition flex items-center gap-1.5"
          >
            <User className="w-4 h-4" /> Edit Profile
          </Link>
          <Link
            to="/worker/messages"
            className="bg-white/10 hover:bg-white/20 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition backdrop-blur-sm flex items-center gap-1.5"
          >
            <MessageSquare className="w-4 h-4 text-blue-400" /> Messages & Deals
          </Link>
          <button
            type="button"
            onClick={() => setIsPayoutModalOpen(true)}
            className="bg-white/10 hover:bg-white/20 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition backdrop-blur-sm flex items-center gap-1.5"
          >
            <Landmark className="w-4 h-4 text-emerald-400" /> Payout Settings (Bank/UPI)
          </button>
          <Link
            to="/worker/portfolio"
            className="bg-white/10 hover:bg-white/20 text-white font-bold text-sm px-4 py-2.5 rounded-xl transition backdrop-blur-sm"
          >
            Manage Portfolio
          </Link>
          <Link
            to="/worker/verification"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-4 py-2.5 rounded-xl shadow-md transition flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4" /> Identity Verification
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">{projects.length}</div>
            <div className="text-xs text-slate-500 font-medium">Assigned & Requested Projects</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">{user?.isVerified ? 'VERIFIED' : 'PENDING'}</div>
            <div className="text-xs text-slate-500 font-medium">Identity Verification</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">Milestone Escrow</div>
            <div className="text-xs text-slate-500 font-medium">Payment Protection Active</div>
          </div>
        </div>

        {/* Payout Destination Status Card */}
        <div
          onClick={() => setIsPayoutModalOpen(true)}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 cursor-pointer hover:border-emerald-400 transition"
        >
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
            <Landmark className="w-6 h-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-extrabold text-slate-900 truncate">
              {payoutInfo?.isConfigured
                ? payoutInfo.upiId || payoutInfo.bankName
                : 'Configure Payout'}
            </div>
            <div className="text-xs text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
              {payoutInfo?.isConfigured ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" /> Payout Active
                </>
              ) : (
                'Add Bank or UPI'
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bank & UPI Payout Notice Widget */}
      <div className="bg-gradient-to-r from-blue-50 to-slate-50 border border-blue-200 rounded-3xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-500/20">
            <Landmark className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-base">Direct Worker Bank & UPI Payout Destination</h3>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
              BuildConnect protects your payouts through secure milestone escrow. The platform charges the client a 5% secure maintenance fee, ensuring you receive 100% of your quoted price directly to your Bank Account or UPI upon milestone approval.
            </p>
            <div className="flex items-center gap-3 mt-2 text-xs font-bold text-slate-700">
              <span>Current Destination:</span>
              <span className="bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-blue-700">
                {payoutInfo?.upiId
                  ? `UPI: ${payoutInfo.upiId}`
                  : payoutInfo?.bankName
                  ? `${payoutInfo.bankName} (•••• ${payoutInfo.accountNumber?.slice(-4)})`
                  : 'Not Configured Yet'}
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsPayoutModalOpen(true)}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition whitespace-nowrap"
        >
          {payoutInfo?.isConfigured ? 'Edit Payout Info' : 'Setup Bank / UPI'}
        </button>
      </div>

      {/* Client Project Requests Table */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 space-y-4 shadow-sm">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Incoming Client Requests & Leads</h2>
            <p className="text-xs text-slate-500">Clients requesting site visits, inspections, and project deals.</p>
          </div>
          <span className="text-xs bg-slate-100 text-slate-700 font-bold px-3 py-1 rounded-full">{projects.length} total</span>
        </div>

        {loading ? (
          <div className="text-center py-10 text-slate-400">Loading client requests...</div>
        ) : projects.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            No active project requests assigned to you. Make sure your profile & portfolio are updated.
          </div>
        ) : (
          <div className="space-y-4">
            {projects.map((project) => (
              <div key={project._id} className="p-5 rounded-2xl border border-slate-200 hover:border-blue-300 transition flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-slate-900 text-base">{project.title}</h3>
                    <StatusBadge status={project.status} />
                  </div>
                  <p className="text-xs text-slate-500">Client: <strong className="text-slate-800">{project.client?.name}</strong> • Category: {project.category}</p>
                  <p className="text-xs text-slate-400 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {project.publicLocation?.city}</p>
                </div>

                <div className="flex items-center gap-2">
                  <Link
                    to="/worker/messages"
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Open Chat & Map
                  </Link>
                  <Link
                    to={`/worker/projects/${project._id}`}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1"
                  >
                    Manage Project <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payout Settings Modal */}
      <Modal
        isOpen={isPayoutModalOpen}
        onClose={() => setIsPayoutModalOpen(false)}
        title="💳 Manage Bank Account & UPI Payout Details"
      >
        <form onSubmit={handleSavePayout} className="space-y-4">
          <p className="text-xs text-slate-500">
            Enter your Bank Account or UPI ID where approved milestone payments will be credited directly. Only you have access to configure this.
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                UPI ID (Google Pay, PhonePe, Paytm, BHIM)
              </label>
              <input
                type="text"
                placeholder="e.g. raj@upi or 9876543210@paytm"
                value={payoutForm.upiId}
                onChange={(e) => setPayoutForm({ ...payoutForm, upiId: e.target.value })}
                className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>

            <div className="text-center font-bold text-slate-400 text-xs uppercase">— OR DIRECT BANK TRANSFER —</div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Bank Name</label>
                <input
                  type="text"
                  placeholder="e.g. HDFC Bank, SBI, ICICI"
                  value={payoutForm.bankName}
                  onChange={(e) => setPayoutForm({ ...payoutForm, bankName: e.target.value })}
                  className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Account Holder Name</label>
                <input
                  type="text"
                  placeholder="Name as per Passbook"
                  value={payoutForm.accountHolderName}
                  onChange={(e) => setPayoutForm({ ...payoutForm, accountHolderName: e.target.value })}
                  className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Account Number</label>
                <input
                  type="password"
                  placeholder="e.g. 5010023456789"
                  value={payoutForm.accountNumber}
                  onChange={(e) => setPayoutForm({ ...payoutForm, accountNumber: e.target.value })}
                  className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">IFSC Code</label>
                <input
                  type="text"
                  placeholder="e.g. HDFC0001234"
                  value={payoutForm.ifscCode}
                  onChange={(e) => setPayoutForm({ ...payoutForm, ifscCode: e.target.value.toUpperCase() })}
                  className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none uppercase"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Account Type</label>
              <select
                value={payoutForm.accountType}
                onChange={(e) => setPayoutForm({ ...payoutForm, accountType: e.target.value })}
                className="w-full p-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              >
                <option value="SAVINGS">Savings Account</option>
                <option value="CURRENT">Current / Business Account</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={savingPayout}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Check className="w-4 h-4" />
            {savingPayout ? 'Saving Payout Settings...' : 'Save Payout Details'}
          </button>
        </form>
      </Modal>
    </div>
  );
};
