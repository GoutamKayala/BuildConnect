import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { StatusBadge } from '../../components/StatusBadge';
import { Users, Search, Ban, CheckCircle2 } from 'lucide-react';
import { Avatar } from '../../components/Avatar';

export const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await api.get(`/admin/users?search=${encodeURIComponent(search)}`);
      setUsers(res.data.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search]);

  const handleStatusChange = async (userId, newStatus) => {
    try {
      await api.patch(`/admin/users/${userId}/status`, { status: newStatus });
      alert(`User status changed to ${newStatus}`);
      fetchUsers();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">User Management</h1>
          <p className="text-xs text-slate-500">Monitor registered Clients, Workers, and System Administrators</p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left text-xs min-w-[640px]">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase">
            <tr>
              <th className="p-4">User</th>
              <th className="p-4">Role</th>
              <th className="p-4">City</th>
              <th className="p-4">Verification</th>
              <th className="p-4">Account Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map((u) => (
              <tr key={u._id} className="hover:bg-slate-50/50">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <Avatar
                      src={u.avatarUrl}
                      name={u.name}
                      size="sm"
                    />
                    <div>
                      <div className="font-bold text-slate-900">{u.name}</div>
                      <div className="text-slate-400 text-[11px]">{u.email}</div>
                    </div>
                  </div>
                </td>
                <td className="p-4 font-bold text-slate-700">{u.role}</td>
                <td className="p-4 text-slate-600">{u.city || 'N/A'}</td>
                <td className="p-4">{u.isVerified ? <span className="text-emerald-600 font-bold">VERIFIED</span> : <span className="text-slate-400">UNVERIFIED</span>}</td>
                <td className="p-4"><StatusBadge status={u.status} /></td>
                <td className="p-4 text-right">
                  {u.status === 'ACTIVE' ? (
                    <button
                      onClick={() => handleStatusChange(u._id, 'SUSPENDED')}
                      className="px-3 py-1 bg-rose-50 text-rose-600 font-bold rounded-lg hover:bg-rose-100 border border-rose-200"
                    >
                      Suspend
                    </button>
                  ) : (
                    <button
                      onClick={() => handleStatusChange(u._id, 'ACTIVE')}
                      className="px-3 py-1 bg-emerald-50 text-emerald-600 font-bold rounded-lg hover:bg-emerald-100 border border-emerald-200"
                    >
                      Activate
                    </button>
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
