import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  User,
  Briefcase,
  Mail,
  Lock,
  Phone,
  Hammer,
  Eye,
  EyeOff,
  CheckCircle2,
  KeyRound,
  RefreshCw,
  Send,
  AlertCircle,
} from 'lucide-react';
import { GoogleIcon } from '../../components/GoogleIcon';
import { GoogleAccountChooserModal } from '../../components/GoogleAccountChooserModal';
import { LocationSelector } from '../../components/LocationSelector';

export const Register = () => {
  const [searchParams] = useSearchParams();
  const [role, setRole] = useState(searchParams.get('role') || 'CLIENT');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Hyderabad');

  // Email OTP state
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [devOtpCode, setDevOtpCode] = useState('');
  const [otpMessage, setOtpMessage] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isGoogleChooserOpen, setIsGoogleChooserOpen] = useState(false);

  const { register, googleAuth, sendOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();

  // Timer countdown for resending OTP
  useEffect(() => {
    let timer;
    if (otpCountdown > 0) {
      timer = setInterval(() => setOtpCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [otpCountdown]);

  const handleSendOtp = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address first.');
      return;
    }

    setError('');
    setSendingOtp(true);
    setOtpMessage('');
    try {
      const res = await sendOtp(email);
      setOtpSent(true);
      setOtpCountdown(30);
      if (res.devOtp) {
        setDevOtpCode(res.devOtp);
      }
      setOtpMessage(`Verification code sent to ${email}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP code. Please try again.');
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 4) {
      setError('Please enter the verification code.');
      return;
    }

    setError('');
    setVerifyingOtp(true);
    try {
      await verifyOtp(email, otp);
      setOtpVerified(true);
      setOtpMessage('Email verified successfully! ✓');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP code.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!otpVerified) {
      setError('Please verify your email with the OTP code before completing registration.');
      return;
    }

    setLoading(true);
    try {
      const res = await register({
        name,
        email,
        password,
        role,
        phone,
        city: role === 'WORKER' ? city : '',
        otp,
      });
      if (res.user.role === 'CLIENT') navigate('/client/dashboard');
      else navigate('/worker/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectGoogleAccount = async (accountData) => {
    try {
      const res = await googleAuth(accountData, role);
      if (res.user.role === 'CLIENT') navigate('/client/dashboard');
      else navigate('/worker/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Google auth failed. Please try again.';
      setError(msg);
      throw err;
    }
  };

  const handleGoogleClick = () => {
    setError('');
    setIsGoogleChooserOpen(true);
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl max-w-lg w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="h-12 w-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-md shadow-blue-500/20">
            <Hammer className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Create Account</h1>
          <p className="text-xs text-slate-500">Join the secure client & worker management platform</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl text-center flex items-center justify-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Role Toggle */}
        <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 rounded-2xl border border-slate-200/80">
          <button
            type="button"
            onClick={() => setRole('CLIENT')}
            className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
              role === 'CLIENT'
                ? 'bg-white text-blue-600 shadow-md shadow-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4" /> I am a Client
          </button>
          <button
            type="button"
            onClick={() => setRole('WORKER')}
            className={`py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition ${
              role === 'WORKER'
                ? 'bg-white text-blue-600 shadow-md shadow-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Briefcase className="w-4 h-4" /> I am a Professional / Worker
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Name / Business Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={role === 'WORKER' ? 'e.g. Raj Interior Studio' : 'e.g. Ananya Sharma'}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Email Address with OTP Verification */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-700 uppercase">Email Address</label>
              {otpVerified && (
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Email Verified
                </span>
              )}
            </div>

            <div className="relative flex gap-2">
              <div className="relative flex-1">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  disabled={otpVerified}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (otpVerified) setOtpVerified(false);
                    if (otpSent) setOtpSent(false);
                  }}
                  placeholder="name@example.com"
                  className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500 ${
                    otpVerified ? 'border-emerald-300 bg-emerald-50/30 text-emerald-900 font-semibold' : 'border-slate-200'
                  }`}
                />
              </div>

              {!otpVerified && (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={sendingOtp || !email || otpCountdown > 0}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1.5 whitespace-nowrap"
                >
                  {sendingOtp ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : otpCountdown > 0 ? (
                    `Resend in ${otpCountdown}s`
                  ) : otpSent ? (
                    'Resend OTP'
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" /> Send OTP
                    </>
                  )}
                </button>
              )}
            </div>

            {/* OTP Input Card when OTP has been sent */}
            {otpSent && !otpVerified && (
              <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-2.5 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-blue-600" /> Enter 6-digit OTP code:
                  </span>
                  {devOtpCode && (
                    <button
                      type="button"
                      onClick={() => setOtp(devOtpCode)}
                      className="text-[11px] bg-white border border-blue-300 text-blue-700 hover:bg-blue-100 px-2 py-0.5 rounded-md font-mono font-bold transition"
                      title="Click to auto-fill development OTP"
                    >
                      Auto-fill ({devOtpCode})
                    </button>
                  )}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.trim())}
                    placeholder="123456"
                    className="flex-1 px-4 py-2 bg-white border border-blue-200 rounded-xl text-center text-sm font-mono font-bold tracking-widest focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    disabled={verifyingOtp || !otp}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center gap-1"
                  >
                    {verifyingOtp ? 'Verifying...' : 'Verify OTP'}
                  </button>
                </div>

                {otpMessage && (
                  <p className="text-[11px] text-blue-700 font-medium">
                    {otpMessage}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Phone Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 chars"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 transition p-0.5"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Location Selector for Workers only */}
          {role === 'WORKER' && (
            <div>
              <LocationSelector
                value={city}
                onChange={(newCity) => setCity(newCity)}
                label="Operating City / Location"
                placeholder="Type 2+ letters (e.g. Hy, Ba, Mu...)"
                showMap={true}
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !otpVerified}
            className={`w-full py-3 text-white font-bold text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 ${
              otpVerified
                ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'
                : 'bg-slate-300 cursor-not-allowed text-slate-600'
            }`}
          >
            {loading
              ? 'Creating Account...'
              : !otpVerified
              ? 'Verify Email with OTP to Register'
              : `Complete Registration as ${role === 'CLIENT' ? 'Client' : 'Worker'}`}
          </button>
        </form>

        <div className="relative text-center">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
          <span className="relative bg-white px-3 text-xs text-slate-400 font-semibold uppercase">Or</span>
        </div>

        <button
          type="button"
          onClick={handleGoogleClick}
          className="w-full py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-sm rounded-xl border border-slate-200 flex items-center justify-center gap-2.5 transition shadow-sm"
        >
          <GoogleIcon className="w-4 h-4" /> Continue with Google / Gmail
        </button>

        <p className="text-center text-xs text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-blue-600 hover:underline">
            Log In
          </Link>
        </p>
      </div>

      <GoogleAccountChooserModal
        isOpen={isGoogleChooserOpen}
        onClose={() => setIsGoogleChooserOpen(false)}
        onSelectAccount={handleSelectGoogleAccount}
        defaultRole={role}
      />
    </div>
  );
};
