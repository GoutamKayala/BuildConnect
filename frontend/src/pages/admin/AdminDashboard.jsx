import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import {
  Users,
  ShieldCheck,
  Briefcase,
  DollarSign,
  FileCheck,
  Activity,
  AlertTriangle,
} from 'lucide-react';

export const AdminDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/metrics').then((res) => {
      setMetrics(res.data.metrics);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-20 text-slate-400">Loading admin control center...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 shadow-xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Platform Admin Control Panel</span>
          <h1 className="text-3xl font-extrabold mt-1">System Overview & Management</h1>
          <p className="text-sm text-slate-400 mt-1">Review worker verification documents, suspend accounts, and inspect security audit logs.</p>
        </div>

        <div className="flex gap-3">
          <Link
            to="/admin/verifications"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow transition flex items-center gap-1.5"
          >
            <FileCheck className="w-4 h-4" /> Review Pending Verification ({metrics?.pendingVerificationsCount || 0})
          </Link>
          <Link
            to="/admin/audit-logs"
            className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-700 transition flex items-center gap-1.5"
          >
            <Activity className="w-4 h-4" /> View Audit Logs
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">{metrics?.totalUsers}</div>
            <div className="text-xs text-slate-500 font-medium">Total Registered Users</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">{metrics?.verifiedWorkersCount}</div>
            <div className="text-xs text-slate-500 font-medium">Verified Workers</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">{metrics?.activeProjectsCount}</div>
            <div className="text-xs text-slate-500 font-medium">Active Projects</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">INR {(metrics?.totalVolume || 0).toLocaleString()}</div>
            <div className="text-xs text-slate-500 font-medium">Processed Escrow Volume</div>
          </div>
        </div>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link to="/admin/users" className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-blue-400 transition shadow-sm space-y-2">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" /> User Management
          </h3>
          <p className="text-xs text-slate-500">Inspect client and worker profiles, change user status (ACTIVE vs SUSPENDED).</p>
        </Link>

        <Link to="/admin/verifications" className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-emerald-400 transition shadow-sm space-y-2">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-emerald-600" /> Worker Verification Queue
          </h3>
          <p className="text-xs text-slate-500">Review submitted GST, Aadhaar, and trade licenses to grant verified badges.</p>
        </Link>

        <Link to="/admin/audit-logs" className="bg-white p-6 rounded-2xl border border-slate-200 hover:border-purple-400 transition shadow-sm space-y-2">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-600" /> Immutable Audit Trail
          </h3>
          <p className="text-xs text-slate-500">System event stream tracking OAuth logins, quote changes, and location releases.</p>
        </Link>
      </div>
    </div>
  );
};
