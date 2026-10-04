import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { StatusBadge } from '../../components/StatusBadge';
import { FileCheck, ShieldCheck, XCircle, CheckCircle } from 'lucide-react';

export const AdminVerifications = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchVerifications = async () => {
    try {
      const res = await api.get('/admin/verifications');
      setDocuments(res.data.documents || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications();
  }, []);

  const handleReview = async (docId, status) => {
    const reviewNotes = prompt(`Review notes for marking as ${status}:`, 'Verified by platform admin.');
    try {
      await api.patch(`/admin/verifications/${docId}`, {
        status,
        reviewNotes,
      });
      alert(`Document marked as ${status}`);
      fetchVerifications();
    } catch (err) {
      alert('Failed to update verification status');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-extrabold text-slate-900">Worker Verification Queue</h1>
        <p className="text-xs text-slate-500">Review uploaded identity and business documents to issue verified badges</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs min-w-[640px]">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
            <tr>
              <th className="p-4">Worker</th>
              <th className="p-4">Document Type</th>
              <th className="p-4">File Name</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {documents.map((doc) => (
              <tr key={doc._id} className="hover:bg-slate-50/50">
                <td className="p-4 font-bold text-slate-900">{doc.worker?.name || 'Worker'}</td>
                <td className="p-4 text-slate-700 font-medium">{doc.documentType}</td>
                <td className="p-4">
                  <a
                    href={`/api/files/download/${doc.fileKey}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 font-bold hover:underline"
                  >
                    {doc.originalName}
                  </a>
                </td>
                <td className="p-4"><StatusBadge status={doc.status} /></td>
                <td className="p-4 text-right space-x-2">
                  {doc.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleReview(doc._id, 'VERIFIED')}
                        className="px-3 py-1 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 shadow-sm"
                      >
                        Approve & Verify
                      </button>
                      <button
                        onClick={() => handleReview(doc._id, 'REJECTED')}
                        className="px-3 py-1 bg-rose-50 text-rose-600 font-bold rounded-lg border border-rose-200 hover:bg-rose-100"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
};
