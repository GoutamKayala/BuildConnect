import React from 'react';

export const HowItWorks = () => (
  <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
    <h1 className="text-3xl font-extrabold text-slate-900 text-center">How BuildConnect Works</h1>
    <div className="space-y-6 text-sm text-slate-600 leading-relaxed bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
      <div className="space-y-2">
        <h3 className="font-bold text-slate-900 text-base">1. Search & Compare Professionals</h3>
        <p>Clients search through verified worker profiles, inspect completed portfolio images, and review authentic ratings.</p>
      </div>
      <div className="space-y-2">
        <h3 className="font-bold text-slate-900 text-base">2. Staged Location Sharing & Site Visit</h3>
        <p>Clients create projects with public city/area details. When a worker requests a site inspection, the client explicitly grants address access.</p>
      </div>
      <div className="space-y-2">
        <h3 className="font-bold text-slate-900 text-base">3. Transparent Itemized Quotations</h3>
        <p>Workers generate itemized quotes detailing material costs, labour, taxes, and terms. Every change creates an audit log.</p>
      </div>
      <div className="space-y-2">
        <h3 className="font-bold text-slate-900 text-base">4. Contract Signing & Escrow Payments</h3>
        <p>Once accepted, a legal e-sign agreement is generated. Milestone payments are held in escrow and released only upon client approval.</p>
      </div>
    </div>
  </div>
);

export const About = () => (
  <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
    <h1 className="text-3xl font-extrabold text-slate-900 text-center">About BuildConnect</h1>
    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-sm text-slate-600 space-y-4 leading-relaxed">
      <p>BuildConnect is a production-ready marketplace platform engineered to solve trust and security challenges in the home renovation and interior design sector.</p>
      <p>We combine strict identity verification, privacy-first location masking, itemized quotation auditing, e-sign agreements, and milestone payment protection.</p>
    </div>
  </div>
);

export const Privacy = () => (
  <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
    <h1 className="text-3xl font-extrabold text-slate-900 text-center">Privacy Policy & Location Release</h1>
    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-sm text-slate-600 space-y-4 leading-relaxed">
      <p>We respect client privacy. Exact street addresses are never publicly visible on the platform and are released to workers only upon explicit client site visit approval.</p>
      <p>Identity documents uploaded for worker verification are stored in secure object storage and are visible exclusively to authorized platform administrators.</p>
    </div>
  </div>
);

export const Terms = () => (
  <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
    <h1 className="text-3xl font-extrabold text-slate-900 text-center">Terms of Service</h1>
    <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-sm text-slate-600 space-y-4 leading-relaxed">
      <p>By using BuildConnect, users agree to transparent milestone agreements, legally binding e-signatures, and platform audit logging.</p>
    </div>
  </div>
);
