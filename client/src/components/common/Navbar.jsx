import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import ThemeToggle from './ThemeToggle';
import NotificationBell from './NotificationBell';
import {
  LayoutDashboard,
  PlusCircle,
  Database,
  BarChart3,
  LogOut,
  User as UserIcon,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, logout, openAuthModal } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [userMenuOpen]);

  const handleLogout = () => {
    setUserMenuOpen(false);
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Authoring Studio', path: '/create-test', icon: PlusCircle },
    { label: 'Question Bank', path: '/question-bank', icon: Database },
    { label: 'Analytics', path: '/analytics', icon: BarChart3 }
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between gap-6">
        {/* Brand */}
        <div className="flex items-center gap-8 h-full">
          <Link to="/dashboard" className="flex items-center gap-2 shrink-0">
            <div className="w-6 h-6 rounded-md bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center text-white dark:text-zinc-900">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Mock Test Canvas
            </span>
          </Link>

          {/* Horizontal Text Tabs with Bottom Border Indicator */}
          <nav className="hidden md:flex items-center gap-6 h-full">
            {navItems.map((item) => {
              const isActive =
                item.path === '/dashboard'
                  ? location.pathname === '/dashboard'
                  : location.pathname.startsWith(item.path);

              return (
                <Link
                  key={item.label}
                  to={item.path}
                  className={`h-full flex items-center text-xs tracking-tight transition-colors border-b-2 -mb-[1px] ${
                    isActive
                      ? 'border-zinc-900 dark:border-zinc-100 text-zinc-950 dark:text-zinc-50 font-medium'
                      : 'border-transparent text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 font-normal'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-3">

          {isAuthenticated && <NotificationBell />}
          <ThemeToggle />

          {isAuthenticated && user ? (
            <div className="relative pl-2 border-l border-zinc-200 dark:border-zinc-800" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 py-1 px-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer"
              >
                <div className="w-6 h-6 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-700 dark:text-zinc-300 text-xs font-medium">
                  {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-3 h-3" />}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-medium text-zinc-900 dark:text-zinc-100 leading-none truncate max-w-[120px]">
                    {user.name || 'Candidate'}
                  </span>
                </div>
                <ChevronDown className="w-3 h-3 text-zinc-400" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-1 w-52 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1 shadow-sm z-50">
                  <div className="px-2.5 py-2 border-b border-zinc-100 dark:border-zinc-800 mb-1">
                    <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                      {user.name || 'Candidate'}
                    </p>
                    <p className="text-[11px] text-zinc-400 truncate">
                      {user.email}
                    </p>
                  </div>

                  <div className="space-y-0.5">
                    <Link
                      to="/assessments-overview"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Assessments</span>
                    </Link>

                    <Link
                      to="/telemetry"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <BarChart3 className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Telemetry</span>
                    </Link>

                    <button
                      type="button"
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center pl-2 border-l border-zinc-200 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => openAuthModal()}
                className="btn-primary"
              >
                Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
