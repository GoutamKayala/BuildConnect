import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Activity } from 'lucide-react';

export const AdminAuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/audit-logs').then((res) => {
      setLogs(res.data.logs || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <h1 className="text-2xl font-extrabold text-slate-900">Immutable Audit Logs</h1>
        <p className="text-xs text-slate-500">Security audit stream tracking all authentication, quotation, contract, and payment events</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs min-w-[640px]">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
            <tr>
              <th className="p-4">Timestamp</th>
              <th className="p-4">Actor</th>
              <th className="p-4">Action Event</th>
              <th className="p-4">Resource</th>
              <th className="p-4">IP Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
            {logs.map((log) => (
              <tr key={log._id} className="hover:bg-slate-50/50">
                <td className="p-4 text-slate-500">{new Date(log.timestamp).toLocaleString()}</td>
                <td className="p-4 font-bold text-slate-800">{log.actor?.name || 'System'}</td>
                <td className="p-4"><span className="bg-blue-50 text-blue-800 font-bold px-2 py-0.5 rounded">{log.action}</span></td>
                <td className="p-4 text-slate-600">{log.resource} ({log.resourceId || 'N/A'})</td>
                <td className="p-4 text-slate-400">{log.ipAddress || '::1'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
};
