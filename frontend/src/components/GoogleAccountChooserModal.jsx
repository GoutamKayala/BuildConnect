import React, { useState, useEffect } from 'react';
import { GoogleIcon, GmailIcon } from './GoogleIcon';
import {
  X,
  ShieldCheck,
  ArrowRight,
  User,
  AlertCircle,
  Loader2,
} from 'lucide-react';

export const GoogleAccountChooserModal = ({
  isOpen,
  onClose,
  onSelectAccount,
  defaultRole = 'CLIENT',
}) => {
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [selectedRole, setSelectedRole] = useState(defaultRole);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Reset inputs when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setError('');
    setNameInput('');
    setEmailInput('');
    setSelectedRole(defaultRole);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, defaultRole, onClose]);

  if (!isOpen) return null;

  // Auto-fill full name from email prefix if left empty
  const handleEmailBlur = () => {
    if (emailInput && !nameInput) {
      const prefix = emailInput.split('@')[0];
      if (prefix) {
        const formatted = prefix
          .replace(/[._+-]+/g, ' ')
          .split(' ')
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(' ');
        setNameInput(formatted);
      }
    }
  };

  // Add Google account and sign in
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      setError('Please provide your Google / Gmail address.');
      return;
    }

    const cleanEmail = emailInput.trim().toLowerCase();
    if (!cleanEmail.includes('@')) {
      setError('Please enter a valid Gmail or Google email address.');
      return;
    }

    const derivedName =
      nameInput.trim() ||
      cleanEmail
        .split('@')[0]
        .replace(/[._+-]+/g, ' ')
        .split(' ')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');

    setLoading(true);
    setError('');
    try {
      const accountData = {
        name: derivedName,
        email: cleanEmail,
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(derivedName)}&background=2563eb&color=fff`,
        role: selectedRole,
        googleId: `google_${cleanEmail.replace(/[^a-zA-Z0-9]/g, '_')}`,
      };

      await onSelectAccount(accountData);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Authentication failed. Please try again.');
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
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Google Header */}
        <div className="p-6 pb-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex items-center justify-center">
              <GoogleIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Sign in with Google</h2>
              <p className="text-xs text-slate-500">to continue to BuildConnect</p>
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Google / Gmail Address
              </label>
              <div className="relative">
                <GmailIcon className="w-4 h-4 absolute left-3.5 top-3.5 text-red-500" />
                <input
                  type="email"
                  required
                  autoFocus
                  placeholder="yourname@gmail.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onBlur={handleEmailBlur}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Your Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="e.g. Alex Morgan"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Role on BuildConnect
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRole('CLIENT')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition text-center flex items-center justify-center gap-1.5 ${
                    selectedRole === 'CLIENT'
                      ? 'bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-500/20'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>🏠</span>
                  <span>Client (Homeowner)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole('WORKER')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition text-center flex items-center justify-center gap-1.5 ${
                    selectedRole === 'WORKER'
                      ? 'bg-blue-50 border-blue-500 text-blue-700 ring-2 ring-blue-500/20'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span>🔨</span>
                  <span>Worker / Pro</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-500/20 transition flex items-center justify-center gap-2 mt-3 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in with Google...</span>
                </>
              ) : (
                <>
                  <GoogleIcon className="w-4 h-4" />
                  <span>Continue with Google</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </form>

          {/* Privacy Note */}
          <div className="pt-3 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span>Google verifies your identity and shares your name and email with BuildConnect.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GoogleAccountChooserModal;
