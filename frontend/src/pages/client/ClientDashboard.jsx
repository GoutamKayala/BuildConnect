import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import { StatusBadge } from '../../components/StatusBadge';
import {
  Briefcase,
  FileText,
  Clock,
  CheckCircle2,
  Plus,
  ArrowRight,
  ShieldCheck,
  MapPin,
} from 'lucide-react';

export const ClientDashboard = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/projects').then((res) => {
      setProjects(res.data.projects || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const activeProjects = projects.filter((p) => p.status !== 'COMPLETED' && p.status !== 'CANCELLED');
  const completedProjects = projects.filter((p) => p.status === 'COMPLETED');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-3xl p-8 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-300">Client Workspace</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">Hello, {user?.name}!</h1>
          <p className="text-sm text-blue-200 mt-1">Track your home design projects, site visit inspections, quotes, and milestone payments.</p>
        </div>
        <Link
          to="/workers"
          className="bg-white text-blue-900 hover:bg-blue-50 font-bold text-sm px-5 py-3 rounded-xl shadow-md flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" /> Start New Project
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">{activeProjects.length}</div>
            <div className="text-xs text-slate-500 font-medium">Active Projects</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">{completedProjects.length}</div>
            <div className="text-xs text-slate-500 font-medium">Completed Handovers</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-2xl font-extrabold text-slate-900">{projects.length}</div>
            <div className="text-xs text-slate-500 font-medium">Total Project History</div>
          </div>
        </div>
      </div>

      {/* Active Projects Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <div className="flex justify-between items-center pb-4 border-b border-slate-100">
          <h2 className="text-lg font-bold text-slate-900">Your Active Projects</h2>
          <Link to="/client/projects" className="text-xs font-bold text-blue-600 hover:underline">View All</Link>
        </div>

        {loading ? (
          <div className="text-center py-10 text-slate-400">Loading active projects...</div>
        ) : activeProjects.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <p>You have no active projects currently.</p>
            <Link to="/workers" className="mt-3 inline-block text-xs font-bold text-blue-600">Find workers & post requirements →</Link>
          </div>
        ) : (
          <div className="space-y-4">
            {activeProjects.map((project) => (
              <div key={project._id} className="p-5 rounded-2xl border border-slate-200 hover:border-blue-300 transition flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-slate-900 text-base">{project.title}</h3>
                    <StatusBadge status={project.status} />
                  </div>
                  <p className="text-xs text-slate-500">{project.category} • Stage: <strong className="text-slate-700">{project.stage}</strong></p>
                  <p className="text-xs text-slate-400 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {project.publicLocation?.city}</p>
                </div>

                <div className="flex items-center gap-2">
                  {project.status === 'COMPLETED' && (
                    project.stage === 'REVIEWED' ? (
                      <span className="px-3 py-1.5 bg-amber-50 text-amber-700 font-bold text-xs rounded-xl border border-amber-200 flex items-center gap-1">
                        ★ Reviewed
                      </span>
                    ) : (
                      <Link
                        to={`/client/projects/${project._id}`}
                        className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-900 font-bold text-xs rounded-xl transition flex items-center gap-1 shadow-xs"
                      >
                        ★ Review Worker
                      </Link>
                    )
                  )}
                  <Link
                    to={`/client/projects/${project._id}`}
                    className="px-4 py-2 bg-blue-50 text-blue-700 font-bold text-xs rounded-xl hover:bg-blue-100 transition flex items-center gap-1"
                  >
                    Manage Workspace <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
