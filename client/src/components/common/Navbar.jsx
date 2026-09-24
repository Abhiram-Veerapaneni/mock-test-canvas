import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import ThemeToggle from './ThemeToggle';
import NotificationBell from './NotificationBell';
import { LayoutDashboard, PlusCircle, LogOut, User as UserIcon, ShieldCheck } from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, logout, openAuthModal } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-[#334155] glass-panel transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link to="/dashboard" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-display text-sm font-bold tracking-tight text-slate-900 dark:text-white">
              Mock Test Canvas
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5">
          <Link
            to="/dashboard"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              location.pathname === '/dashboard' || location.pathname === '/'
                ? 'bg-blue-50/80 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200/70 dark:border-blue-800/60 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-[#1e293b]'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </Link>
          <Link
            to="/create-test"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              location.pathname === '/create-test'
                ? 'bg-blue-50/80 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200/70 dark:border-blue-800/60 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-[#1e293b]'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Authoring Studio</span>
          </Link>
        </nav>

        {/* Right Actions: Bell + Theme Toggle + User Info & Logout / Sign In */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {isAuthenticated && <NotificationBell />}
          <ThemeToggle />

          {isAuthenticated && user ? (
            <div className="flex items-center gap-2 sm:gap-2.5 pl-1.5 sm:pl-2 border-l border-slate-200/80 dark:border-[#334155]">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-semibold text-slate-900 dark:text-white leading-none truncate max-w-[140px]">
                  {user.name}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 truncate max-w-[140px]">
                  {user.email}
                </span>
              </div>
              <div
                className="w-8 h-8 rounded-lg bg-slate-100/80 dark:bg-[#151f32] border border-slate-200/80 dark:border-[#334155] flex items-center justify-center text-slate-600 dark:text-slate-300 shadow-2xs"
                title={user.name || user.email}
              >
                <UserIcon className="w-3.5 h-3.5" />
              </div>
              <button
                onClick={handleLogout}
                title="Log out"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-slate-200/80 dark:border-[#334155] hover:border-rose-200 dark:hover:border-rose-900/50 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 pl-1.5 sm:pl-2 border-l border-slate-200/80 dark:border-[#334155]">
              <button
                type="button"
                onClick={() => openAuthModal()}
                className="btn-primary"
              >
                Sign In / Register
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
