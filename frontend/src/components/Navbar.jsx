import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Hammer,
  User as UserIcon,
  LogOut,
  LayoutDashboard,
  ShieldCheck,
  MessageSquare,
  FileText,
  Briefcase,
  Menu,
  X,
  Bell,
  Settings,
} from 'lucide-react';
import { Avatar } from './Avatar';
import { ProfileModal } from './ProfileModal';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const dropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(e.target) &&
        !e.target.closest('#mobile-menu-toggle')
      ) {
        setMobileMenuOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setDropdownOpen(false);
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleLogout = async () => {
    setDropdownOpen(false);
    setMobileMenuOpen(false);
    try {
      await logout();
    } catch (err) {
      console.error(err);
    }
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 font-bold text-xl text-slate-900">
              <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                <Hammer className="w-5 h-5" />
              </div>
              <span>Build<span className="text-blue-600">Connect</span></span>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex items-center ml-10 space-x-6 text-sm font-medium text-slate-600">
              <Link to="/workers" className="hover:text-blue-600 transition">Find Workers</Link>
              <Link to="/categories" className="hover:text-blue-600 transition">Services</Link>
              <Link to="/how-it-works" className="hover:text-blue-600 transition">How it Works</Link>
              <Link to="/about" className="hover:text-blue-600 transition">About</Link>
            </div>
          </div>

          {/* User Auth Section */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  id="user-profile-menu-button"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-3 p-1.5 rounded-full hover:bg-slate-100 transition focus:outline-none"
                  aria-expanded={dropdownOpen}
                >
                  <Avatar
                    src={user.avatarUrl}
                    name={user.name}
                    size="sm"
                  />
                  <div className="text-left hidden lg:block">
                    <div className="text-sm font-semibold text-slate-800 leading-tight">{user.name}</div>
                    <div className="text-xs text-blue-600 font-medium capitalize">{user.role.toLowerCase()}</div>
                  </div>
                </button>

                {/* Profile Dropdown */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-sm font-bold text-slate-800">{user.name}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>

                    {user.role === 'CLIENT' && (
                      <>
                        <Link
                          to="/client/dashboard"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          <LayoutDashboard className="w-4 h-4 text-slate-400" /> Dashboard
                        </Link>
                        <Link
                          to="/client/projects"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          <Briefcase className="w-4 h-4 text-slate-400" /> My Projects
                        </Link>
                        <Link
                          to="/client/messages"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          <MessageSquare className="w-4 h-4 text-slate-400" /> Messages
                        </Link>
                      </>
                    )}

                    {user.role === 'WORKER' && (
                      <>
                        <Link
                          to="/worker/dashboard"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          <LayoutDashboard className="w-4 h-4 text-slate-400" /> Dashboard
                        </Link>
                        <Link
                          to="/worker/profile"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 font-semibold"
                        >
                          <UserIcon className="w-4 h-4 text-blue-600" /> Edit Worker Profile
                        </Link>
                        <Link
                          to="/worker/projects"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          <Briefcase className="w-4 h-4 text-slate-400" /> Client Requests
                        </Link>
                        <Link
                          to="/worker/verification"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          <ShieldCheck className="w-4 h-4 text-emerald-500" /> Verification
                        </Link>
                        <Link
                          to="/worker/messages"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                        >
                          <MessageSquare className="w-4 h-4 text-blue-500" /> Messages & Deals
                        </Link>
                      </>
                    )}

                    {user.role === 'ADMIN' && (
                      <Link
                        to="/admin"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-amber-700 font-semibold hover:bg-amber-50"
                      >
                        <ShieldCheck className="w-4 h-4 text-amber-600" /> Admin Control
                      </Link>
                    )}

                    <div className="border-t border-slate-100 my-1"></div>

                    <button
                      type="button"
                      onClick={() => {
                        setDropdownOpen(false);
                        setIsProfileModalOpen(true);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 font-medium text-left"
                    >
                      <Settings className="w-4 h-4 text-slate-400" /> Edit Profile & Photo
                    </button>

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 font-medium text-left"
                    >
                      <LogOut className="w-4 h-4" /> Log Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="text-sm font-semibold text-slate-700 hover:text-blue-600 px-3 py-2 rounded-lg"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl shadow-md shadow-blue-500/20 transition"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu trigger & Quick Avatar */}
          <div className="flex items-center gap-2 md:hidden">
            {user ? (
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(true)}
                className="p-1 rounded-full hover:bg-slate-100 transition focus:outline-none"
                title="Edit Profile & Photo"
              >
                <Avatar src={user.avatarUrl} name={user.name} size="sm" />
              </button>
            ) : (
              <Link
                to="/login"
                className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition"
              >
                Log In
              </Link>
            )}
            <button
              id="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 focus:outline-none rounded-lg hover:bg-slate-100"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div ref={mobileMenuRef} className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-6 space-y-3 shadow-lg">
          <Link to="/workers" onClick={() => setMobileMenuOpen(false)} className="block text-slate-700 font-medium py-1">Find Workers</Link>
          <Link to="/categories" onClick={() => setMobileMenuOpen(false)} className="block text-slate-700 font-medium py-1">Services</Link>
          <Link to="/how-it-works" onClick={() => setMobileMenuOpen(false)} className="block text-slate-700 font-medium py-1">How it Works</Link>
          <Link to="/about" onClick={() => setMobileMenuOpen(false)} className="block text-slate-700 font-medium py-1">About</Link>

          {user ? (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <div className="font-bold text-slate-900">{user.name} ({user.role})</div>
              {user.role === 'CLIENT' && (
                <>
                  <Link to="/client/dashboard" onClick={() => setMobileMenuOpen(false)} className="block text-blue-600 font-semibold py-1">Client Dashboard</Link>
                  <Link to="/client/projects" onClick={() => setMobileMenuOpen(false)} className="block text-slate-700 font-medium py-1">My Projects</Link>
                  <Link to="/client/messages" onClick={() => setMobileMenuOpen(false)} className="block text-slate-700 font-medium py-1">Messages</Link>
                </>
              )}
              {user.role === 'WORKER' && (
                <>
                  <Link to="/worker/dashboard" onClick={() => setMobileMenuOpen(false)} className="block text-blue-600 font-semibold py-1">Worker Dashboard</Link>
                  <Link to="/worker/projects" onClick={() => setMobileMenuOpen(false)} className="block text-slate-700 font-medium py-1">Client Requests</Link>
                  <Link to="/worker/verification" onClick={() => setMobileMenuOpen(false)} className="block text-emerald-600 font-medium py-1">Identity & KYC Verification</Link>
                </>
              )}
              {user.role === 'ADMIN' && (
                <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className="block text-amber-600 font-semibold py-1">Admin Dashboard</Link>
              )}
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  setIsProfileModalOpen(true);
                }}
                className="text-slate-700 font-semibold py-1 block w-full text-left"
              >
                Edit Profile & Photo
              </button>
              <button onClick={handleLogout} className="text-rose-600 font-semibold py-1 block w-full text-left">Log Out</button>
            </div>
          ) : (
            <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
              <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="text-center font-semibold text-slate-700 border py-2 rounded-xl">Log In</Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="text-center font-semibold text-white bg-blue-600 py-2 rounded-xl">Register</Link>
            </div>
          )}
        </div>
      )}

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </nav>
  );
};
