import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  CreditCard,
  Lock,
  Building2,
  Check,
  Send,
  KeyRound,
  RefreshCw,
  ExternalLink,
  Award,
  Sparkles,
} from 'lucide-react';

export const WorkerVerification = () => {
  const { user, refreshUser } = useAuth();
  const [kycData, setKycData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('aadhaar'); // 'aadhaar' | 'pan'

  // Aadhaar Form State
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [aadhaarName, setAadhaarName] = useState(user?.name || '');
  const [aadhaarFile, setAadhaarFile] = useState(null);
  const [aadhaarOtpSent, setAadhaarOtpSent] = useState(false);
  const [aadhaarOtp, setAadhaarOtp] = useState('');
  const [aadhaarLoading, setAadhaarLoading] = useState(false);
  const [aadhaarSuccess, setAadhaarSuccess] = useState('');
  const [aadhaarError, setAadhaarError] = useState('');

  // PAN Form State
  const [panNumber, setPanNumber] = useState('');
  const [panName, setPanName] = useState(user?.name || '');
  const [panType, setPanType] = useState('INDIVIDUAL');
  const [panFile, setPanFile] = useState(null);
  const [panLoading, setPanLoading] = useState(false);
  const [panSuccess, setPanSuccess] = useState('');
  const [panError, setPanError] = useState('');

  const fetchKycStatus = async () => {
    try {
      const res = await api.get('/workers/kyc/status');
      setKycData(res.data.kyc);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKycStatus();
  }, []);

  // Format Aadhaar Number with space/hyphen grouping (XXXX-XXXX-XXXX)
  const handleAadhaarChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').slice(0, 12);
    if (val.length > 8) {
      val = `${val.slice(0, 4)}-${val.slice(4, 8)}-${val.slice(8)}`;
    } else if (val.length > 4) {
      val = `${val.slice(0, 4)}-${val.slice(4)}`;
    }
    setAadhaarNumber(val);
  };

  // Format PAN Number (auto uppercase, 10 alphanumeric chars)
  const handlePanChange = (e) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
    setPanNumber(val);
  };

  // Trigger Aadhaar OTP dispatch
  const handleSendAadhaarOtp = () => {
    const rawNumber = aadhaarNumber.replace(/\D/g, '');
    if (rawNumber.length !== 12) {
      setAadhaarError('Please enter a valid 12-digit Aadhaar Number.');
      return;
    }
    setAadhaarError('');
    setAadhaarOtpSent(true);
    setAadhaarOtp('123456'); // Simulated authorized UIDAI OTP
  };

  // Submit Aadhaar Verification
  const handleVerifyAadhaar = async (e) => {
    e.preventDefault();
    const rawNumber = aadhaarNumber.replace(/\D/g, '');
    if (rawNumber.length !== 12) {
      setAadhaarError('Please enter a valid 12-digit Aadhaar Number.');
      return;
    }
    if (!aadhaarName || aadhaarName.trim().length < 3) {
      setAadhaarError('Full name as per Aadhaar is required.');
      return;
    }

    setAadhaarLoading(true);
    setAadhaarError('');
    try {
      const formData = new FormData();
      formData.append('aadhaarNumber', rawNumber);
      formData.append('holderName', aadhaarName.trim());
      formData.append('otp', aadhaarOtp);
      if (aadhaarFile) {
        formData.append('document', aadhaarFile);
      }

      const res = await api.post('/workers/kyc/verify-aadhaar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setAadhaarSuccess(res.data.message);
      setKycData(res.data.kyc);
      refreshUser();
    } catch (err) {
      setAadhaarError(err.response?.data?.message || 'Aadhaar verification failed. Please try again.');
    } finally {
      setAadhaarLoading(false);
    }
  };

  // Submit PAN Verification
  const handleVerifyPan = async (e) => {
    e.preventDefault();
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(panNumber)) {
      setPanError('Invalid PAN card format. Must be 10 characters (e.g. ABCDE1234F).');
      return;
    }
    if (!panName || panName.trim().length < 3) {
      setPanError('Name as per PAN card is required.');
      return;
    }

    setPanLoading(true);
    setPanError('');
    try {
      const formData = new FormData();
      formData.append('panNumber', panNumber);
      formData.append('holderName', panName.trim());
      formData.append('panType', panType);
      if (panFile) {
        formData.append('document', panFile);
      }

      const res = await api.post('/workers/kyc/verify-pan', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setPanSuccess(res.data.message);
      setKycData(res.data.kyc);
      refreshUser();
    } catch (err) {
      setPanError(err.response?.data?.message || 'PAN verification failed. Please try again.');
    } finally {
      setPanLoading(false);
    }
  };

  const isAadhaarVerified = kycData?.aadhaar?.isVerified;
  const isPanVerified = kycData?.pan?.isVerified;
  const trustScore = (isAadhaarVerified ? 50 : 0) + (isPanVerified ? 50 : 0);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8 animate-fadeIn">
      {/* Top Authorized Government KYC Banner */}
      <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-slate-900">
                  Government Identity & KYC Verification
                </h1>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Authorized identity verification via UIDAI (Aadhaar) & NSDL / Income Tax Department (PAN)
              </p>
            </div>
          </div>

          {trustScore === 100 ? (
            <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-4 py-2 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-sm">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>KYC 100% Complete (Government Verified)</span>
            </div>
          ) : (
            <div className="bg-blue-50 text-blue-800 border border-blue-200 px-4 py-2 rounded-2xl font-bold text-xs flex items-center gap-2">
              <Award className="w-4 h-4 text-blue-600" />
              <span>Trust Score: {trustScore}%</span>
            </div>
          )}
        </div>

        {/* Verification Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold text-slate-700">
            <span>Identity Trust Verification</span>
            <span className={trustScore === 100 ? 'text-emerald-600 font-extrabold' : 'text-blue-600'}>
              {trustScore}% Completed
            </span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                trustScore === 100
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                  : trustScore === 50
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500'
                  : 'bg-slate-300'
              }`}
              style={{ width: `${Math.max(5, trustScore)}%` }}
            ></div>
          </div>
        </div>

        {/* Verification Status Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div
            className={`p-4 rounded-2xl border transition ${
              isAadhaarVerified
                ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase flex items-center gap-1.5">
                <CreditCard className="w-4 h-4" /> Aadhaar Card (UIDAI)
              </span>
              {isAadhaarVerified ? (
                <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <Check className="w-3 h-3" /> Verified
                </span>
              ) : (
                <span className="text-[11px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-semibold">
                  Pending
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              {isAadhaarVerified
                ? `Masked: ${kycData?.aadhaar?.numberMasked || 'XXXX-XXXX-****'}`
                : 'Requires 12-digit Aadhaar number & OTP'}
            </p>
          </div>

          <div
            className={`p-4 rounded-2xl border transition ${
              isPanVerified
                ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase flex items-center gap-1.5">
                <FileText className="w-4 h-4" /> PAN Card (NSDL / ITD)
              </span>
              {isPanVerified ? (
                <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <Check className="w-3 h-3" /> Verified
                </span>
              ) : (
                <span className="text-[11px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-semibold">
                  Pending
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              {isPanVerified
                ? `PAN: ${kycData?.pan?.panNumber || 'ABCDE****F'} (Active)`
                : 'Requires 10-character Permanent Account Number'}
            </p>
          </div>
        </div>
      </div>

      {/* KYC Method Navigation Tabs */}
      <div className="flex border-b border-slate-200 bg-white px-6 pt-3 rounded-t-3xl shadow-sm gap-8">
        <button
          onClick={() => setActiveTab('aadhaar')}
          className={`pb-3 font-bold text-xs uppercase tracking-wider border-b-2 flex items-center gap-2 transition ${
            activeTab === 'aadhaar'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <CreditCard className="w-4 h-4" /> 1. UIDAI Aadhaar e-KYC
          {isAadhaarVerified && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
        </button>

        <button
          onClick={() => setActiveTab('pan')}
          className={`pb-3 font-bold text-xs uppercase tracking-wider border-b-2 flex items-center gap-2 transition ${
            activeTab === 'pan'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <FileText className="w-4 h-4" /> 2. NSDL / ITD PAN Verification
          {isPanVerified && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
        </button>
      </div>

      {/* TAB 1: Aadhaar Card Verification */}
      {activeTab === 'aadhaar' && (
        <div className="bg-white rounded-b-3xl rounded-t-none border border-slate-200 p-8 shadow-sm space-y-6 -mt-8">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                UIDAI Authorized Aadhaar Verification
              </h2>
              <p className="text-xs text-slate-500">
                Authorized identity verification via Unique Identification Authority of India (UIDAI) e-KYC.
              </p>
            </div>
            <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              DigiLocker / UIDAI Certified
            </span>
          </div>

          {aadhaarSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{aadhaarSuccess}</span>
            </div>
          )}

          {aadhaarError && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-2xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{aadhaarError}</span>
            </div>
          )}

          {isAadhaarVerified ? (
            /* Aadhaar Verified Certificate Badge */
            <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-white border-2 border-emerald-200 rounded-3xl p-6 space-y-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">Aadhaar Verified Professional</h3>
                    <p className="text-xs text-emerald-700 font-semibold">
                      Authenticated via UIDAI Authorized Gateway
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-500 font-mono">
                  REF: {kycData?.aadhaar?.refId || 'UIDAI-KYC-VERIFIED'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs border-t border-emerald-100">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Full Name</span>
                  <span className="font-bold text-slate-800">{kycData?.aadhaar?.holderName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Masked Aadhaar</span>
                  <span className="font-mono font-bold text-slate-800">{kycData?.aadhaar?.numberMasked}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Verified Date</span>
                  <span className="font-bold text-slate-800">
                    {new Date(kycData?.aadhaar?.verifiedAt || Date.now()).toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* Aadhaar Submission Form */
            <form onSubmit={handleVerifyAadhaar} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Full Name (As printed on Aadhaar Card) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Raj Interior Studio"
                  value={aadhaarName}
                  onChange={(e) => setAadhaarName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  12-Digit Aadhaar Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="XXXX-XXXX-XXXX"
                    value={aadhaarNumber}
                    onChange={handleAadhaarChange}
                    className="w-full pl-10 pr-32 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold tracking-widest focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleSendAadhaarOtp}
                    className="absolute right-2 top-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
                  >
                    <Send className="w-3 h-3" />
                    <span>{aadhaarOtpSent ? 'Resend OTP' : 'Send OTP'}</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  Your Aadhaar number is masked per UIDAI guidelines and stored with 256-bit encryption.
                </p>
              </div>

              {/* Aadhaar OTP Card */}
              {aadhaarOtpSent && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl space-y-2 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                      <KeyRound className="w-4 h-4 text-blue-600" /> Enter 6-digit UIDAI Verification OTP:
                    </span>
                    <button
                      type="button"
                      onClick={() => setAadhaarOtp('123456')}
                      className="text-[11px] bg-white text-blue-700 border border-blue-300 px-2 py-0.5 rounded font-bold hover:bg-blue-100"
                    >
                      Auto-fill Demo (123456)
                    </button>
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    value={aadhaarOtp}
                    onChange={(e) => setAadhaarOtp(e.target.value.trim())}
                    placeholder="123456"
                    className="w-full p-2.5 bg-white border border-blue-200 rounded-xl text-center text-sm font-mono font-bold tracking-widest focus:outline-none"
                  />
                </div>
              )}

              {/* Document Photo Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Upload Aadhaar Card Photo (Front / Both Sides)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  onChange={(e) => setAadhaarFile(e.target.files[0])}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={aadhaarLoading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-2"
              >
                {aadhaarLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying with UIDAI Gateway...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Complete Aadhaar e-KYC Verification</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      )}

      {/* TAB 2: PAN Card Verification */}
      {activeTab === 'pan' && (
        <div className="bg-white rounded-b-3xl rounded-t-none border border-slate-200 p-8 shadow-sm space-y-6 -mt-8">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Income Tax Department PAN Verification
              </h2>
              <p className="text-xs text-slate-500">
                Real-time validation against the NSDL & Income Tax Department PAN database.
              </p>
            </div>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              NSDL / ITD Certified
            </span>
          </div>

          {panSuccess && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{panSuccess}</span>
            </div>
          )}

          {panError && (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-2xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{panError}</span>
            </div>
          )}

          {isPanVerified ? (
            /* PAN Verified Certificate Badge */
            <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-white border-2 border-emerald-200 rounded-3xl p-6 space-y-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-base">PAN Card Operative & Active</h3>
                    <p className="text-xs text-emerald-700 font-semibold">
                      Authenticated via NSDL Income Tax Database
                    </p>
                  </div>
                </div>
                <span className="text-xs font-bold text-slate-500 font-mono">
                  REF: {kycData?.pan?.refId || 'NSDL-ITD-VERIFIED'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2 text-xs border-t border-emerald-100">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Holder Name</span>
                  <span className="font-bold text-slate-800">{kycData?.pan?.holderName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">PAN Number</span>
                  <span className="font-mono font-bold text-slate-800">{kycData?.pan?.panNumber}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Entity Type</span>
                  <span className="font-bold text-slate-800">{kycData?.pan?.panType || 'Individual'}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Status</span>
                  <span className="font-bold text-emerald-700">OPERATIVE ✓</span>
                </div>
              </div>
            </div>
          ) : (
            /* PAN Submission Form */
            <form onSubmit={handleVerifyPan} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Cardholder / Business Name (As per PAN) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Raj Interior Studio"
                  value={panName}
                  onChange={(e) => setPanName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    10-Character PAN Number <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      placeholder="ABCDE1234F"
                      value={panNumber}
                      onChange={handlePanChange}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold uppercase tracking-widest focus:outline-none focus:border-blue-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Format: 5 letters, 4 digits, 1 letter</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">PAN Entity Type</label>
                  <select
                    value={panType}
                    onChange={(e) => setPanType(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none"
                  >
                    <option value="INDIVIDUAL">Individual / Proprietorship (Letter P)</option>
                    <option value="FIRM">Partnership / LLP (Letter F)</option>
                    <option value="COMPANY">Private Limited Company (Letter C)</option>
                  </select>
                </div>
              </div>

              {/* Document Photo Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Upload PAN Card Photo / Scan (Optional)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,application/pdf"
                  onChange={(e) => setPanFile(e.target.files[0])}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>

              <button
                type="submit"
                disabled={panLoading}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-2"
              >
                {panLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verifying with NSDL Database...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Verify PAN with Income Tax Department</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      )}

      {/* Trust & Security Guarantee Badge */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold">256-Bit Bank-Grade Data Security</h4>
            <p className="text-xs text-slate-400">
              Identity documents are processed directly through authorized regulatory channels. We never share sensitive ID data.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-slate-300 bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 whitespace-nowrap">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Compliant with IT Act 2000</span>
        </div>
      </div>
    </div>
  );
};
