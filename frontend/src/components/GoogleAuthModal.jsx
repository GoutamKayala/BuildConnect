import React, { useState, useEffect } from 'react';
import { GoogleIcon, GmailIcon } from './GoogleIcon';
import {
  X,
  ShieldCheck,
  ArrowRight,
  ExternalLink,
  KeyRound,
  CheckCircle2,
  Sparkles,
  Smartphone,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import {
  getGoogleClientId,
  saveGoogleClientId,
  isGoogleClientIdValid,
  launchGoogleAccountChooser,
} from '../services/googleAuth';

export const GoogleAuthModal = ({
  isOpen,
  onClose,
  onSelectAccount,
  defaultRole = 'CLIENT',
}) => {
  const [activeTab, setActiveTab] = useState('device'); // 'device' or 'manual'
  const [clientIdInput, setClientIdInput] = useState('');
  const [customName, setCustomName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState(defaultRole);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Load configured Google Client ID if available
  useEffect(() => {
    if (!isOpen) return;
    setError('');
    setSuccessMsg('');
    getGoogleClientId().then((id) => {
      if (id) setClientIdInput(id);
    });

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Launch Google's native account chooser with device accounts
  const handleLaunchGooglePopup = async (e) => {
    e?.preventDefault();
    setError('');
    setSuccessMsg('');

    const targetClientId = clientIdInput.trim();
    if (!targetClientId) {
      setError('Please provide your Google OAuth 2.0 Client ID to show device accounts.');
      return;
    }

    if (!isGoogleClientIdValid(targetClientId)) {
      setError(
        'Please enter a valid Google Client ID (usually ending with .apps.googleusercontent.com from Google Cloud Console).'
      );
      return;
    }

    // Save for future 1-click usage
    saveGoogleClientId(targetClientId);

    setLoading(true);
    try {
      await launchGoogleAccountChooser({
        clientId: targetClientId,
        role: selectedRole,
        onSuccess: async (accountData) => {
          setLoading(false);
          await onSelectAccount(accountData);
          onClose();
        },
        onError: (err) => {
          setLoading(false);
          setError(
            typeof err === 'string'
              ? err
              : 'Google OAuth failed. Please check that Authorized JavaScript Origins in Google Cloud Console includes: ' +
                  window.location.origin
          );
        },
      });
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Could not launch Google Sign-In popup.');
    }
  };

  // Direct personal Google/Gmail login
  const handleDirectGmailSubmit = async (e) => {
    e.preventDefault();
    if (!customEmail || !customName) {
      setError('Please provide both your name and personal Gmail address.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await onSelectAccount({
        name: customName.trim(),
        email: customEmail.toLowerCase().trim(),
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(customName)}&background=2563eb&color=fff`,
        role: selectedRole,
        googleId: `google_${customEmail.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_')}`,
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:p-6 pb-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
              <GoogleIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">Sign in with Google</h2>
              <p className="text-xs text-slate-500">Access BuildConnect with your Google account</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-100 bg-slate-50/70 p-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={() => { setActiveTab('device'); setError(''); }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'device'
                ? 'bg-white text-blue-600 shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Smartphone className="w-4 h-4 text-blue-600" />
            <span>Show Device Accounts</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('manual'); setError(''); }}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'manual'
                ? 'bg-white text-blue-600 shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GmailIcon className="w-4 h-4 text-red-500" />
            <span>Enter Your Gmail</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
              <div className="leading-snug">{error}</div>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Role selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Sign in as</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedRole('CLIENT')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition text-center ${
                  selectedRole === 'CLIENT'
                    ? 'bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-500/20'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                🏠 Client (Homeowner)
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('WORKER')}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition text-center ${
                  selectedRole === 'WORKER'
                    ? 'bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-500/20'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                🔨 Professional / Worker
              </button>
            </div>
          </div>

          {activeTab === 'device' ? (
            /* TAB 1: Real Native Device Account Chooser via Google Identity Services */
            <form onSubmit={handleLaunchGooglePopup} className="space-y-4">
              <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-4 text-xs text-slate-600 space-y-2">
                <div className="flex items-center gap-2 font-bold text-blue-900">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>Google Device Account Chooser</span>
                </div>
                <p className="leading-relaxed">
                  Google’s native popup will open with <strong className="text-slate-900">all Google accounts signed into this device/browser</strong>, allowing you to select your account with 1 tap.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-blue-600" /> Google OAuth Client ID
                  </label>
                  <a
                    href="https://console.cloud.google.com/apis/credentials"
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                  >
                    Google Cloud Console <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <input
                  type="text"
                  placeholder="e.g. 1234567890-abcdefgh.apps.googleusercontent.com"
                  value={clientIdInput}
                  onChange={(e) => setClientIdInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-blue-500"
                />
                <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                  Make sure <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">{window.location.origin}</code> is added to <strong>Authorized JavaScript origins</strong> in your Google Cloud credentials.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <span>Opening Google Account Chooser...</span>
                ) : (
                  <>
                    <GoogleIcon className="w-4 h-4" />
                    <span>Choose from Device Google Accounts</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* TAB 2: Direct Gmail Sign In (for instant testing without needing Google Cloud credentials) */
            <form onSubmit={handleDirectGmailSubmit} className="space-y-3.5">
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-xs text-slate-600">
                <p className="leading-relaxed">
                  Enter your real personal Google / Gmail address to sign in immediately without needing to configure Google Cloud OAuth credentials.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Your Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Morgan"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Your Personal Gmail Address</label>
                <div className="relative">
                  <GmailIcon className="w-4 h-4 absolute left-3 top-3 text-red-500" />
                  <input
                    type="email"
                    required
                    placeholder="yourname@gmail.com"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2"
              >
                {loading ? 'Authenticating...' : 'Continue with this Gmail'} <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* Privacy Note */}
          <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span>Google verifies your identity securely and shares your name and email with BuildConnect.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
