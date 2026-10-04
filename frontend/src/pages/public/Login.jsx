import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Lock, Mail, Hammer, Eye, EyeOff } from 'lucide-react';
import { GoogleIcon } from '../../components/GoogleIcon';
import { GoogleAccountChooserModal } from '../../components/GoogleAccountChooserModal';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isGoogleChooserOpen, setIsGoogleChooserOpen] = useState(false);

  const { login, googleAuth } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(email, password);
      const user = res.user;
      if (user.role === 'CLIENT') navigate('/client/dashboard');
      else if (user.role === 'WORKER') navigate('/worker/dashboard');
      else if (user.role === 'ADMIN') navigate('/admin');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectGoogleAccount = async (accountData) => {
    try {
      const res = await googleAuth(accountData, accountData.role || 'CLIENT');
      const user = res.user;
      if (user.role === 'CLIENT') navigate('/client/dashboard');
      else if (user.role === 'WORKER') navigate('/worker/dashboard');
      else if (user.role === 'ADMIN') navigate('/admin');
    } catch (err) {
      const msg = err.response?.data?.message || 'Google authentication failed. Please try again.';
      setError(msg);
      throw err;
    }
  };

  const handleGoogleClick = () => {
    setError('');
    setIsGoogleChooserOpen(true);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="h-12 w-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-md shadow-blue-500/20">
            <Hammer className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">Welcome Back</h1>
          <p className="text-xs text-slate-500">Log in to manage your projects, quotes, and messages</p>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl text-center">
            {error}
          </div>
        )}

        {/* Demo Login Quick Fill Badges */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
          <span className="font-bold text-slate-700">Quick Fill Demo Credentials:</span>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={() => { setEmail('client@buildconnect.com'); setPassword('Password123!'); }}
              className="bg-white px-2.5 py-1 rounded border border-slate-200 hover:border-blue-400 font-medium"
            >
              Client Demo
            </button>
            <button
              type="button"
              onClick={() => { setEmail('raj@buildconnect.com'); setPassword('Password123!'); }}
              className="bg-white px-2.5 py-1 rounded border border-slate-200 hover:border-blue-400 font-medium"
            >
              Worker Demo
            </button>
            <button
              type="button"
              onClick={() => { setEmail('admin@buildconnect.com'); setPassword('Password123!'); }}
              className="bg-white px-2.5 py-1 rounded border border-slate-200 hover:border-blue-400 font-medium"
            >
              Admin Demo
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
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
                placeholder="••••••••"
                className="w-full pl-10 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500"
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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-500/20 transition"
          >
            {loading ? 'Logging in...' : 'Log In'}
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
          Don't have an account?{' '}
          <Link to="/register" className="font-bold text-blue-600 hover:underline">
            Register Here
          </Link>
        </p>
      </div>

      <GoogleAccountChooserModal
        isOpen={isGoogleChooserOpen}
        onClose={() => setIsGoogleChooserOpen(false)}
        onSelectAccount={handleSelectGoogleAccount}
        defaultRole="CLIENT"
      />
    </div>
  );
};
