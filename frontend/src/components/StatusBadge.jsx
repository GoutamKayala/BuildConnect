import React from 'react';

export const StatusBadge = ({ status }) => {
  const styles = {
    // Project & Verification Statuses
    VERIFIED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    PENDING: 'bg-amber-100 text-amber-800 border-amber-200',
    REJECTED: 'bg-rose-100 text-rose-800 border-rose-200',
    IN_PROGRESS: 'bg-blue-100 text-blue-800 border-blue-200',
    COMPLETED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    CANCELLED: 'bg-slate-100 text-slate-700 border-slate-200',

    // Quotation Statuses
    DRAFT: 'bg-slate-100 text-slate-700 border-slate-200',
    SENT: 'bg-blue-100 text-blue-800 border-blue-200',
    ACCEPTED: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    MODIFICATION_REQUESTED: 'bg-purple-100 text-purple-800 border-purple-200',

    // Payment Statuses
    PAID: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    UNPAID: 'bg-amber-100 text-amber-800 border-amber-200',
    PAYABLE: 'bg-blue-100 text-blue-800 border-blue-200',
    ACTIVE: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  };

  const formatted = status ? status.replace(/_/g, ' ') : 'UNKNOWN';

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
        styles[status] || 'bg-slate-100 text-slate-700 border-slate-200'
      }`}
    >
      {formatted}
    </span>
  );
};
