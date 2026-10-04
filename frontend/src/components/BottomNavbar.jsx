import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Home,
  Search,
  Users,
  Briefcase,
  MessageSquare,
  LayoutDashboard,
  ShieldCheck,
  FileText,
  User as UserIcon,
  LogIn,
  LayoutGrid,
  Sparkles,
  Settings,
  LogOut,
  ChevronUp,
} from 'lucide-react';
import { Avatar } from './Avatar';
import { ProfileModal } from './ProfileModal';

export const BottomNavbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const menuRef = useRef(null);

  // Close profile popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Close popup on navigation
  useEffect(() => {
    setProfileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    setProfileMenuOpen(false);
    try {
      await logout();
    } catch (err) {
      console.error(err);
    }
    navigate('/login');
  };

  // Define navigation items based on user role
  const getNavItems = () => {
    if (!user) {
      return [
        { label: 'Home', icon: Home, path: '/' },
        { label: 'Find Pros', icon: Search, path: '/workers' },
        { label: 'Services', icon: LayoutGrid, path: '/categories' },
        { label: 'Process', icon: Sparkles, path: '/how-it-works' },
        { label: 'Log In', icon: LogIn, path: '/login' },
      ];
    }

    if (user.role === 'CLIENT') {
      return [
        { label: 'Home', icon: Home, path: '/' },
        { label: 'Find Pros', icon: Search, path: '/workers' },
        { label: 'Projects', icon: Briefcase, path: '/client/projects' },
        { label: 'Messages', icon: MessageSquare, path: '/client/messages' },
        { label: 'Account', icon: UserIcon, isAccount: true, path: '/client/dashboard' },
      ];
    }

    if (user.role === 'WORKER') {
      return [
        { label: 'Overview', icon: LayoutDashboard, path: '/worker/dashboard' },
        { label: 'Requests', icon: Briefcase, path: '/worker/projects' },
        { label: 'Messages', icon: MessageSquare, path: '/worker/messages' },
        { label: 'Verification', icon: ShieldCheck, path: '/worker/verification' },
        { label: 'Profile', icon: UserIcon, isAccount: true, path: '/worker/profile' },
      ];
    }

    if (user.role === 'ADMIN') {
      return [
        { label: 'Overview', icon: LayoutDashboard, path: '/admin' },
        { label: 'Users', icon: Users, path: '/admin/users' },
        { label: 'Verification', icon: ShieldCheck, path: '/admin/verifications' },
        { label: 'Audit Logs', icon: FileText, path: '/admin/audit-logs' },
        { label: 'Profile', icon: UserIcon, isAccount: true, path: '/admin' },
      ];
    }

    return [];
  };

  const navItems = getNavItems();

  const isItemActive = (item) => {
    if (item.path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(item.path);
  };

  return (
    <>
      {/* Account Popover Menu for Mobile / Bottom bar */}
      {profileMenuOpen && user && (
        <div
          ref={menuRef}
          className="fixed bottom-20 right-4 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 p-3 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200"
        >
          <div className="flex items-center gap-3 p-3 border-b border-slate-100 bg-slate-50/70 rounded-xl mb-2">
            <Avatar src={user.avatarUrl} name={user.name} size="sm" />
            <div className="min-w-0 flex-1">
              <div className="font-bold text-sm text-slate-900 truncate">{user.name}</div>
              <div className="text-xs text-blue-600 font-semibold capitalize">{user.role.toLowerCase()}</div>
            </div>
          </div>

          <div className="space-y-1 text-sm font-medium">
            {user.role === 'CLIENT' && (
              <>
                <Link
                  to="/client/dashboard"
                  className="flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:bg-slate-100 rounded-xl transition"
                >
                  <LayoutDashboard className="w-4 h-4 text-blue-600" /> Client Dashboard
                </Link>
                <Link
                  to="/client/projects"
                  className="flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:bg-slate-100 rounded-xl transition"
                >
                  <Briefcase className="w-4 h-4 text-blue-600" /> My Projects
                </Link>
                <Link
                  to="/client/messages"
                  className="flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:bg-slate-100 rounded-xl transition"
                >
                  <MessageSquare className="w-4 h-4 text-blue-600" /> Messages & Deals
                </Link>
              </>
            )}

            {user.role === 'WORKER' && (
              <>
                <Link
                  to="/worker/dashboard"
                  className="flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:bg-slate-100 rounded-xl transition"
                >
                  <LayoutDashboard className="w-4 h-4 text-blue-600" /> Worker Dashboard
                </Link>
                <Link
                  to="/worker/profile"
                  className="flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:bg-slate-100 rounded-xl transition"
                >
                  <UserIcon className="w-4 h-4 text-blue-600" /> Edit Worker Profile
                </Link>
                <Link
                  to="/worker/projects"
                  className="flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:bg-slate-100 rounded-xl transition"
                >
                  <Briefcase className="w-4 h-4 text-blue-600" /> Client Requests
                </Link>
                <Link
                  to="/worker/verification"
                  className="flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:bg-slate-100 rounded-xl transition"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-600" /> Identity Verification
                </Link>
              </>
            )}

            {user.role === 'ADMIN' && (
              <Link
                to="/admin"
                className="flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:bg-slate-100 rounded-xl transition"
              >
                <ShieldCheck className="w-4 h-4 text-amber-600" /> Admin Control
              </Link>
            )}

            <button
              type="button"
              onClick={() => {
                setProfileMenuOpen(false);
                setIsProfileModalOpen(true);
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-slate-700 hover:bg-slate-100 rounded-xl transition text-left"
            >
              <Settings className="w-4 h-4 text-slate-500" /> Edit Profile & Photo
            </button>

            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl transition text-left font-semibold"
            >
              <LogOut className="w-4 h-4" /> Log Out
            </button>
          </div>
        </div>
      )}

      {/* Main Bottom Navigation Bar */}
      <nav
        aria-label="Bottom Navigation"
        className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom,0px)]"
      >
        <div className="max-w-3xl mx-auto px-2 sm:px-6">
          <div className="flex items-center justify-around h-16">
            {navItems.map((item, index) => {
              const active = isItemActive(item);
              const Icon = item.icon;

              if (item.isAccount && user) {
                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setProfileMenuOpen(!profileMenuOpen)}
                    className={`relative flex flex-col items-center justify-center flex-1 h-full py-1 px-1 transition-all duration-200 select-none ${
                      active || profileMenuOpen ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <div
                      className={`relative flex items-center justify-center w-10 h-7 rounded-xl transition-all duration-200 ${
                        active || profileMenuOpen ? 'bg-blue-100/70 scale-105' : ''
                      }`}
                    >
                      {user.avatarUrl ? (
                        <Avatar
                          src={user.avatarUrl}
                          name={user.name}
                          size="sm"
                          className="w-6 h-6 rounded-full ring-2 ring-blue-500/30"
                        />
                      ) : (
                        <Icon className="w-5 h-5" />
                      )}
                    </div>
                    <span className="text-[11px] leading-tight mt-0.5 tracking-tight flex items-center gap-0.5">
                      {item.label}
                      <ChevronUp
                        className={`w-3 h-3 transition-transform duration-200 ${
                          profileMenuOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </span>
                    {(active || profileMenuOpen) && (
                      <span className="absolute top-1 w-1.5 h-1.5 bg-blue-600 rounded-full"></span>
                    )}
                  </button>
                );
              }

              return (
                <Link
                  key={index}
                  to={item.path}
                  className={`relative flex flex-col items-center justify-center flex-1 h-full py-1 px-1 transition-all duration-200 select-none ${
                    active ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <div
                    className={`relative flex items-center justify-center w-10 h-7 rounded-xl transition-all duration-200 ${
                      active ? 'bg-blue-100/70 scale-105' : 'hover:bg-slate-100/70'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] leading-tight mt-0.5 tracking-tight truncate max-w-[64px] sm:max-w-none text-center">
                    {item.label}
                  </span>
                  {active && (
                    <span className="absolute top-1 w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Edit Profile & Photo Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </>
  );
};

export default BottomNavbar;
