import React from 'react';
import { Link } from 'react-router-dom';
import { Hammer, ShieldCheck, Lock, Heart, FileCheck } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 pt-16 pb-24 border-t border-slate-800 mt-20 mb-16 sm:mb-0">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          {/* Brand col */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2 font-bold text-xl text-white">
              <div className="h-9 w-9 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                <Hammer className="w-5 h-5" />
              </div>
              <span>Build<span className="text-blue-500">Connect</span></span>
            </Link>
            <p className="text-sm leading-relaxed text-slate-400">
              The secure marketplace for hiring verified interior design, renovation, carpentry, and home improvement professionals.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-3 py-1.5 rounded-lg w-fit">
              <ShieldCheck className="w-4 h-4" /> 100% Identity & Business Verified Professionals
            </div>
          </div>

          {/* Service Categories */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Top Services</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/workers?category=Interior+Design" className="hover:text-white transition">Interior Design</Link></li>
              <li><Link to="/workers?category=Modular+Kitchen" className="hover:text-white transition">Modular Kitchen</Link></li>
              <li><Link to="/workers?category=Carpentry" className="hover:text-white transition">Carpentry & Woodwork</Link></li>
              <li><Link to="/workers?category=False+Ceiling" className="hover:text-white transition">False Ceiling & Lighting</Link></li>
              <li><Link to="/workers?category=Painting" className="hover:text-white transition">Painting & Wall Textures</Link></li>
            </ul>
          </div>

          {/* Platform */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Platform</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/how-it-works" className="hover:text-white transition">How It Works</Link></li>
              <li><Link to="/register?role=WORKER" className="hover:text-white transition">Join as a Professional</Link></li>
              <li><Link to="/register?role=CLIENT" className="hover:text-white transition">Post a Home Project</Link></li>
              <li><Link to="/workers" className="hover:text-white transition">Worker Directory</Link></li>
            </ul>
          </div>

          {/* Security & Privacy */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Security & Trust</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/privacy" className="hover:text-white transition">Privacy Policy (Location Shield)</Link></li>
              <li><Link to="/terms" className="hover:text-white transition">Terms of Service</Link></li>
              <li className="flex items-center gap-2 text-xs text-slate-400 mt-2">
                <Lock className="w-3.5 h-3.5 text-blue-400" /> HttpOnly Token Rotation
              </li>
              <li className="flex items-center gap-2 text-xs text-slate-400">
                <FileCheck className="w-3.5 h-3.5 text-blue-400" /> Legally Valid E-Sign Agreements
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} BuildConnect Platform. All rights reserved.</p>
          <p className="flex items-center gap-1">Built with defense-in-depth security & WCAG accessibility</p>
        </div>
      </div>
    </footer>
  );
};
