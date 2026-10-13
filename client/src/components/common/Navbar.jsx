import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import ThemeToggle from './ThemeToggle';
import NotificationBell from './NotificationBell';
import api from '../../services/api';
import LogoutDraftModal from './LogoutDraftModal';
import ConfirmLogoutModal from './ConfirmLogoutModal';
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

  // Default Sign Out Confirmation Modal state
  const [confirmLogoutModalOpen, setConfirmLogoutModalOpen] = useState(false);

  // Logout Draft Interception Modal state
  const [logoutDraftModalOpen, setLogoutDraftModalOpen] = useState(false);
  const [activeDraftInfo, setActiveDraftInfo] = useState(null);
  const [isSavingLogoutDraft, setIsSavingLogoutDraft] = useState(false);

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

  const getActiveUserUnsavedDraft = () => {
    const uId = user?._id || 'guest';
    const userDraftPrefix = `pmt_draft_exam_${uId}_`;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;

      const isUserExamDraft = key.startsWith(userDraftPrefix) || key === `pmt_draft_exam_${uId}_new` || key === 'pmt_draft_exam_new';
      const isLegacyExamDraft = key.startsWith('pmt_draft_exam_') && !key.includes('_question_');

      if (isUserExamDraft || isLegacyExamDraft) {
        try {
          const raw = localStorage.getItem(key);
          if (!raw) continue;
          const parsed = JSON.parse(raw);

          const hasContent = Boolean(
            (parsed.title && parsed.title.trim()) ||
            (parsed.description && parsed.description.trim()) ||
            (Array.isArray(parsed.questions) && parsed.questions.length > 0)
          );

          if (!hasContent) continue;

          // If it is a brand new draft, it has never been saved to the database
          const isBrandNewDraft = !parsed.existingExamId || key.endsWith('_new');
          if (isBrandNewDraft) {
            return { key, data: parsed, isNew: true };
          }

          // If it is an existing database exam:
          // Check if it has unsaved changes compared to the database version
          if (parsed.hasUnsavedChanges === false || parsed.isSyncedWithServer === true) {
            continue; // Already in sync with database, no need to ask!
          }

          // Has new changes to old database file:
          return { key, data: parsed, isNew: false };
        } catch (e) {
          // ignore parsing error
        }
      }
    }
    return null;
  };

  const handleLogoutClick = () => {
    setUserMenuOpen(false);

    // Flush any pending in-memory form edits to localStorage
    window.dispatchEvent(new CustomEvent('pmt_flush_draft_before_logout'));

    const unsavedDraft = getActiveUserUnsavedDraft();
    if (unsavedDraft) {
      setActiveDraftInfo(unsavedDraft);
      setLogoutDraftModalOpen(true);
    } else {
      // Default: ask user for confirmation before signing out
      setConfirmLogoutModalOpen(true);
    }
  };

  const executeCompleteLogout = () => {
    // Notify all active listeners to prevent unmount hooks from saving drafts back
    window.dispatchEvent(new CustomEvent('pmt_logout_in_progress'));

    // Clear all draft keys from localStorage so nothing persists on shared devices
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('pmt_draft_')) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch (_) {}

    logout();
    navigate('/login');
  };

  const handleSaveAndLogout = async () => {
    if (!activeDraftInfo?.data) {
      executeCompleteLogout();
      return;
    }
    setIsSavingLogoutDraft(true);
    try {
      const d = activeDraftInfo.data;
      const payload = {
        title: (d.title || 'Untitled Assessment Draft').trim(),
        description: (d.description || '').trim(),
        category: d.category || 'JEE',
        status: 'draft',
        durationMinutes: Number(d.durationMinutes || 60),
        markingScheme: {
          correct: Number(d.correctMark || 4),
          incorrect: Number(d.incorrectMark || -1)
        },
        maxAttempts: d.isUnlimitedAttempts ? null : Math.max(1, Number(d.maxAttemptsValue || 3)),
        allowPracticeMode: Boolean(d.allowPracticeMode ?? true),
        allowReviewResponses: Boolean(d.allowReviewResponses ?? true),
        proctorSettings: {
          faceCheck: d.faceCheck ?? true,
          audioCheck: d.audioCheck ?? true,
          fullScreenLock: d.fullScreenLock ?? true,
          objectCheck: d.objectCheck ?? true,
          liveNotifications: d.liveNotifications ?? false,
          maxWarningsAllowed: 3
        },
        questions: Array.isArray(d.questions) ? d.questions : []
      };

      if (d.existingExamId) {
        await api.put(`/exams/${d.existingExamId}`, payload);
      } else {
        await api.post('/exams', payload);
      }
    } catch (err) {
      console.warn('Failed to save draft to database before logout:', err);
    } finally {
      setIsSavingLogoutDraft(false);
      setLogoutDraftModalOpen(false);
      executeCompleteLogout();
    }
  };

  const handleDiscardAndLogout = () => {
    setLogoutDraftModalOpen(false);
    executeCompleteLogout();
  };

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Authoring Studio', path: '/create-test', icon: PlusCircle },
    { label: 'Question Bank', path: '/question-bank', icon: Database },
    { label: 'Analytics', path: '/analytics', icon: BarChart3 }
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-[#0C0F17]/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-12 flex items-center justify-between gap-6">
        {/* Brand */}
        <div className="flex items-center gap-8 h-full">
          <Link to="/dashboard" className="flex items-center gap-2 shrink-0">
            <div className="w-6 h-6 rounded-md bg-indigo-600 dark:bg-indigo-500 flex items-center justify-center text-white shadow-sm shadow-indigo-600/20">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100">
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
                  className={`h-full flex items-center text-xs tracking-tight transition-colors -mb-[1px] ${isActive
                      ? 'text-slate-900 dark:text-slate-100 border-b-2 border-indigo-600 font-medium'
                      : 'border-b-2 border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-normal'
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
            <div className="relative pl-2 border-l border-slate-200/80 dark:border-slate-800/80" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 py-1 px-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-[#162030] transition-colors cursor-pointer"
              >
                <div className="w-6 h-6 rounded-md bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 text-xs font-medium">
                  {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon className="w-3 h-3" />}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-medium text-slate-900 dark:text-slate-100 leading-none truncate max-w-[120px]">
                    {user.name || 'Candidate'}
                  </span>
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-1 w-52 rounded-lg bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none p-1 z-50">
                  <div className="px-2.5 py-2 border-b border-slate-100 dark:border-slate-800/80 mb-1">
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {user.name || 'Candidate'}
                    </p>
                    <p className="text-[11px] text-slate-400 truncate">
                      {user.email}
                    </p>
                  </div>

                  <div className="space-y-0.5">
                    <Link
                      to="/assessments-overview"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#162030] transition-colors"
                    >
                      <LayoutDashboard className="w-3.5 h-3.5 text-slate-400" />
                      <span>Assessments</span>
                    </Link>

                    <Link
                      to="/telemetry"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#162030] transition-colors"
                    >
                      <BarChart3 className="w-3.5 h-3.5 text-slate-400" />
                      <span>Telemetry</span>
                    </Link>

                    <button
                      type="button"
                      onClick={handleLogoutClick}
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
            <div className="flex items-center pl-2 border-l border-slate-200/80 dark:border-slate-800/80">
              <button
                type="button"
                onClick={() => openAuthModal()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-sm shadow-indigo-600/20 active:scale-[0.98] dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:text-white dark:shadow-indigo-500/10 text-xs py-1.5 px-3 rounded-lg flex items-center gap-1.5 transition-all duration-150 cursor-pointer"
              >
                Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </header>

      {/* Default Sign Out Confirmation Modal */}
      <ConfirmLogoutModal
        isOpen={confirmLogoutModalOpen}
        onClose={() => setConfirmLogoutModalOpen(false)}
        onConfirm={() => {
          setConfirmLogoutModalOpen(false);
          executeCompleteLogout();
        }}
      />

      {/* Logout Unsaved Draft Interception Modal */}
      <LogoutDraftModal
        isOpen={logoutDraftModalOpen}
        onClose={() => setLogoutDraftModalOpen(false)}
        onSaveAndLogout={handleSaveAndLogout}
        onDiscardAndLogout={handleDiscardAndLogout}
        draftTitle={activeDraftInfo?.data?.title || 'Untitled Assessment Draft'}
        questionCount={Array.isArray(activeDraftInfo?.data?.questions) ? activeDraftInfo.data.questions.length : 0}
        isSaving={isSavingLogoutDraft}
      />
    </>
  );
}
