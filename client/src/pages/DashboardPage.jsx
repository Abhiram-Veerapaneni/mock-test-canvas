import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import useAuthStore from '../store/useAuthStore';
import api from '../services/api';
import {
  BookOpen,
  Clock,
  Award,
  ShieldCheck,
  Search,
  PlusCircle,
  Play,
  RotateCcw,
  Loader2,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  ArrowUpRight,
  Sparkles,
  Edit3
} from 'lucide-react';

export default function DashboardPage() {
  const { user, isAuthenticated, loginWithGoogle } = useAuthStore();
  const navigate = useNavigate();

  const [exams, setExams] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const categories = ['ALL', 'JEE', 'NEET', 'GATE', 'APTITUDE', 'CUSTOM'];

  // Initialize native Google One Tap prompt on Dashboard for unauthenticated users
  useEffect(() => {
    if (isAuthenticated) return;

    // Respect user's choice if they clicked "Continue Without Login" or dismissed it during this session
    try {
      if (sessionStorage.getItem('dismissedGoogleOneTap') === 'true') {
        return;
      }
    } catch (_) {}

    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!googleClientId || googleClientId.includes('your_google_client_id')) {
      return;
    }

    let isSubscribed = true;
    let timer = null;

    const initializeGoogle = () => {
      if (window.google?.accounts?.id && isSubscribed) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response) => {
            if (response?.credential && isSubscribed) {
              const res = await loginWithGoogle(response.credential);
              if (res?.success) {
                try {
                  sessionStorage.removeItem('dismissedGoogleOneTap');
                } catch (_) {}
                fetchExams();
              }
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        // Polite delay (1.2s) so the dashboard renders smoothly first
        timer = setTimeout(() => {
          if (!isSubscribed) return;
          window.google.accounts.id.prompt((notification) => {
            if (notification.isDismissedMoment() || notification.isSkippedMoment()) {
              // User dismissed or tapped outside -> do not prompt again in this session
              try {
                sessionStorage.setItem('dismissedGoogleOneTap', 'true');
              } catch (_) {}
              window.google?.accounts?.id?.cancel();
            }
          });
        }, 1200);
      }
    };

    if (window.google?.accounts?.id) {
      initializeGoogle();
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          initializeGoogle();
        }
      }, 200);

      return () => {
        clearInterval(interval);
        if (timer) clearTimeout(timer);
        window.google?.accounts?.id?.cancel();
      };
    }

    return () => {
      isSubscribed = false;
      if (timer) clearTimeout(timer);
      window.google?.accounts?.id?.cancel();
    };
  }, [isAuthenticated, loginWithGoogle]);

  useEffect(() => {
    fetchExams();
  }, [selectedCategory]);

  const fetchExams = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = {};
      if (selectedCategory !== 'ALL') params.category = selectedCategory;
      if (searchQuery.trim()) params.search = searchQuery.trim();

      const res = await api.get('/exams', { params });
      if (res.data?.success) {
        setExams(res.data.exams || []);
      }
    } catch (err) {
      console.error('Failed to load exams:', err);
      setError('Unable to load available exams. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchExams();
  };

  const handleAuthorExamClick = () => {
    navigate('/create-test');
  };

  return (
    <div className="min-h-screen bg-[#edf2f9] dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top Header Banner */}
        <section className="card-base p-6 sm:p-7 elevation-card flex flex-col sm:flex-row sm:items-center justify-between gap-5 transition-all">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="badge-blue">
                Candidate Portal
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Proctoring Online
              </span>
            </div>
            <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Assessment Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              {isAuthenticated ? (
                <>Welcome back, <span className="font-semibold text-slate-900 dark:text-slate-200">{user?.name || 'User'}</span>. Select an assessment below or author new examination material.</>
              ) : (
                <>Welcome! Browse our collection of proctored assessments below or sign in to save your progress.</>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleAuthorExamClick}
              className="btn-primary"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Author New Exam</span>
            </button>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <div className="card-base p-4 sm:p-5 elevation-card hover:border-slate-300 dark:hover:border-[#2d3e5e] transition-colors">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Available Tests</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold tabular-nums text-slate-900 dark:text-white">{exams.length}</div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">Active tests in catalog</span>
          </div>

          <div className="card-base p-4 sm:p-5 elevation-card hover:border-slate-300 dark:hover:border-[#2d3e5e] transition-colors">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Total Questions</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center">
                <HelpCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold tabular-nums text-slate-900 dark:text-white">
              {exams.reduce((sum, e) => sum + (e.questions?.length || 0), 0)}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">Ready for practice</span>
          </div>

          <div className="card-base p-4 sm:p-5 elevation-card hover:border-slate-300 dark:hover:border-[#2d3e5e] transition-colors">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Completed</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold tabular-nums text-slate-900 dark:text-white">
              {user?.attemptedTests?.length || 0}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">Evaluated attempts</span>
          </div>

          <div className="card-base p-4 sm:p-5 elevation-card hover:border-slate-300 dark:hover:border-[#2d3e5e] transition-colors">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">Current Filter</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center">
                <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white truncate">
              {selectedCategory === 'ALL' ? 'All Streams' : selectedCategory}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">Selected curriculum</span>
          </div>
        </section>

        {/* Filters & Search Toolbar */}
        <section className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-[#334155]">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-2xs font-semibold'
                    : 'bg-white dark:bg-[#1e293b] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200/90 dark:border-[#334155] hover:border-slate-300 dark:hover:border-[#475569]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assessment title or topic..."
              className="input-base pl-9"
            />
          </form>
        </section>

        {/* Exams Catalog Grid */}
        <section>
          {isLoading ? (
            <div className="py-24 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
              <p className="text-xs font-medium">Loading assessments...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                onClick={fetchExams}
                className="btn-secondary text-xs py-1 px-3"
              >
                Retry
              </button>
            </div>
          ) : exams.length === 0 ? (
            <div className="text-center py-16 card-base p-8 elevation-card">
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-[#151f32] flex items-center justify-center text-slate-400 mx-auto mb-3">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white mb-1">No examinations found</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-5 leading-relaxed">
                No active tests match your search or category filter. You can create a new assessment right now in Authoring Studio.
              </p>
              <button
                onClick={() => navigate('/create-test')}
                className="btn-primary"
              >
                Create Exam
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-stretch">
              {exams.map((exam) => {
                const attemptsUsed = exam.userAttemptCount || 0;
                const maxAttempts = exam.maxAttempts;
                const isUnlimited = maxAttempts === null || maxAttempts === undefined;
                const attemptsLeft = isUnlimited ? Infinity : Math.max(0, maxAttempts - attemptsUsed);
                const hasAttempted = attemptsUsed > 0;
                const isExhausted = !isUnlimited && attemptsLeft === 0;

                return (
                  <div
                    key={exam._id}
                    onClick={() => navigate(`/test/${exam._id}`)}
                    className="group card-interactive p-6 flex flex-col justify-between cursor-pointer"
                  >
                    <div className="space-y-4">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="badge-blue">
                            {exam.category}
                          </span>
                          {exam.status === 'draft' && (
                            <span className="badge-amber">
                              Draft
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span className="tabular-nums font-medium">{exam.durationMinutes} mins</span>
                        </div>
                      </div>

                      {/* Title & Description with clamped 2-line rhythm */}
                      <div className="space-y-1.5">
                        <h2 className="font-display text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                          {exam.title}
                        </h2>
                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 min-h-[2.5rem] leading-relaxed">
                          {exam.description || 'Comprehensive evaluation covering standard curriculum syllabus with proctored validation.'}
                        </p>
                      </div>

                      {/* 3 Metric Micro-grid */}
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-[#334155] text-xs">
                        <div className="bg-slate-50/80 dark:bg-[#151f32] p-2.5 rounded-xl border border-slate-200/60 dark:border-[#334155]">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">Questions</span>
                          <span className="font-bold text-slate-900 dark:text-white tabular-nums">{exam.questionCount || 0}</span>
                        </div>
                        <div className="bg-slate-50/80 dark:bg-[#151f32] p-2.5 rounded-xl border border-slate-200/60 dark:border-[#334155]">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">Total Marks</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{exam.totalMarks || 100} pts</span>
                        </div>
                        <div className={`p-2.5 rounded-xl border text-xs ${
                          isExhausted
                            ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50'
                            : 'bg-slate-50/80 dark:bg-[#151f32] border border-slate-200/60 dark:border-[#334155]'
                        }`}>
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">Attempts</span>
                          <span className={`font-bold tabular-nums ${
                            isExhausted ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
                          }`}>
                            {isUnlimited ? `${attemptsUsed} / ∞` : `${attemptsUsed}/${maxAttempts}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Button firmly pinned to bottom */}
                    <div className="pt-5 mt-auto">
                      {exam.status === 'draft' ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/create-test?examId=${exam._id}`);
                          }}
                          className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Continue Editing Draft</span>
                        </button>
                      ) : isExhausted ? (
                        <button
                          disabled
                          className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-[#151f32] text-slate-400 dark:text-slate-500 font-medium text-xs flex items-center justify-center gap-1.5 cursor-not-allowed"
                        >
                          <span>Attempts Exhausted</span>
                        </button>
                      ) : hasAttempted ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/test/${exam._id}`);
                          }}
                          className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Retake Exam{!isUnlimited ? ` (${attemptsLeft} left)` : ''}</span>
                        </button>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/test/${exam._id}`);
                          }}
                          className="w-full btn-primary py-2.5"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Start Proctored Exam</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
