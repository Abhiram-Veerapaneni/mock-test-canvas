import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import useAuthStore from '../store/useAuthStore';
import api from '../services/api';
import { formatDateTime12h } from '../utils/dateUtils';
import {
  BookOpen,
  Search,
  PlusCircle,
  Play,
  RotateCcw,
  Loader2,
  AlertCircle,
  Edit3,
  Clock,
  FileText,
  Award,
  Calendar,
  Compass,
  X
} from 'lucide-react';

export default function DashboardPage() {
  const { user, isAuthenticated, loginWithGoogle } = useAuthStore();
  const navigate = useNavigate();

  const [exams, setExams] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const searchDebounceRef = useRef(null);

  const categories = ['ALL', 'JEE', 'NEET', 'GATE', 'APTITUDE', 'CUSTOM'];

  // Initialize native Google One Tap prompt on Dashboard for unauthenticated users
  useEffect(() => {
    if (isAuthenticated) return;

    try {
      if (sessionStorage.getItem('dismissedGoogleOneTap') === 'true') {
        return;
      }
    } catch (_) { }

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
                } catch (_) { }
                fetchExams();
              }
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        timer = setTimeout(() => {
          if (!isSubscribed) return;
          window.google.accounts.id.prompt((notification) => {
            if (notification.isDismissedMoment() || notification.isSkippedMoment()) {
              try {
                sessionStorage.setItem('dismissedGoogleOneTap', 'true');
              } catch (_) { }
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

  const fetchExams = async (showFullLoader = true, searchOverride = null) => {
    if (showFullLoader) {
      setIsLoading(true);
    } else {
      setIsSearching(true);
    }
    setError(null);
    try {
      const activeSearch = searchOverride !== null ? searchOverride : searchQuery;
      const params = { limit: 50 };
      if (selectedCategory !== 'ALL') params.category = selectedCategory;
      if (activeSearch.trim()) params.search = activeSearch.trim();

      const res = await api.get('/exams', { params });
      if (res.data?.success) {
        setExams(res.data.exams || []);
      }
    } catch (err) {
      console.error('Failed to load exams:', err);
      setError('Unable to load available exams. Please try again later.');
    } finally {
      if (showFullLoader) setIsLoading(false);
      setIsSearching(false);
    }
  };

  useEffect(() => {
    fetchExams(true);
  }, [selectedCategory]);

  // Debounced server search without full-page re-rendering
  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(() => {
      fetchExams(false, searchQuery);
    }, 250);

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery]);

  // Instant 0ms client-side filtering on loaded exams for instantaneous response
  const displayExams = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return exams;

    return exams.filter((exam) => {
      const titleMatch = exam.title?.toLowerCase().includes(q);
      const descMatch = exam.description?.toLowerCase().includes(q);
      const catMatch = exam.category?.toLowerCase().includes(q);
      const creatorMatch = exam.creatorName?.toLowerCase().includes(q);
      return titleMatch || descMatch || catMatch || creatorMatch;
    });
  }, [exams, searchQuery]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    fetchExams(false, searchQuery);
  };

  const handleAuthorExamClick = () => {
    navigate('/create-test');
  };

  const getScheduleMeta = (schedule) => {
    if (!schedule?.isScheduled) {
      return 'Flexible · Anytime';
    }
    const now = Date.now();
    const start = schedule.startTime ? new Date(schedule.startTime) : null;
    const end = schedule.endTime ? new Date(schedule.endTime) : null;
    const startMs = start?.getTime();
    const endMs = end?.getTime();

    if (startMs && now < startMs) {
      return `Opens ${formatDateTime12h(start)}`;
    }
    if (endMs && now > endMs) {
      return `Ended ${formatDateTime12h(end)}`;
    }
    if (endMs) {
      return `Closes ${formatDateTime12h(end)}`;
    }
    if (startMs) {
      return `Live since ${formatDateTime12h(start)}`;
    }
    return 'Schedule open';
  };

  const [questionBankCount, setQuestionBankCount] = useState(null);

  // Fetch true Question Bank count from question repository
  useEffect(() => {
    api.get('/questions', { params: { limit: 1 } })
      .then((res) => {
        if (res.data?.success && typeof res.data.total === 'number') {
          setQuestionBankCount(res.data.total);
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch question bank count:', err);
      });
  }, []);

  const totalExamQuestions = useMemo(() => {
    return exams.reduce((sum, e) => sum + (e.questionCount || e.questions?.length || 0), 0);
  }, [exams]);

  const totalQuestions = questionBankCount !== null ? questionBankCount : totalExamQuestions;
  const completedAttempts = user?.attemptedTests?.length || 0;

  const getCategoryBadgeClass = (category) => {
    const cat = (category || '').toUpperCase();
    if (cat === 'JEE' || cat === 'NEET') {
      return 'text-indigo-600 dark:text-indigo-400 bg-indigo-50/60 dark:bg-indigo-950/40 border-indigo-100 dark:border-indigo-900/40';
    }
    if (cat === 'GATE') {
      return 'text-blue-600 dark:text-blue-400 bg-blue-50/60 dark:bg-blue-950/40 border-blue-100 dark:border-blue-900/40';
    }
    if (cat === 'APTITUDE') {
      return 'text-teal-700 dark:text-teal-400 bg-teal-50/60 dark:bg-teal-950/40 border-teal-100 dark:border-teal-900/40';
    }
    return 'text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-zinc-800 border-slate-200 dark:border-zinc-700';
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] dark:bg-zinc-950 text-slate-900 dark:text-zinc-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Top Header */}
        <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Assessments
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              {isAuthenticated ? (
                <>Logged in as <span className="font-medium text-zinc-800 dark:text-zinc-200">{user?.name || user?.email}</span>. Select an active test to begin.</>
              ) : (
                <>Browse verified competitive exam papers or author custom assessments.</>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleAuthorExamClick}
              className="btn-primary"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Author New Exam</span>
            </button>
          </div>
        </section>

        {/* KPI & Metric Blocks: 3-column border-separated grid rather than separate floating bubble cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-zinc-200 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900">
          <div className="p-4 sm:p-5">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Active Tests</p>
            <p className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 tabular-nums mt-1">
              {displayExams.length}
            </p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">Ready for testing</p>
          </div>

          <div
            onClick={() => navigate('/question-bank')}
            className="p-4 sm:p-5 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-850/50 transition-colors group"
            title="Browse Question Bank repository"
          >
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 transition-colors">
                Question Bank
              </p>
              <Compass className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors" />
            </div>
            <p className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 tabular-nums mt-1">
              {totalQuestions}
            </p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">KaTeX math verified</p>
          </div>

          <div className="p-4 sm:p-5">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Completed Assessments</p>
            <p className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 tabular-nums mt-1">
              {completedAttempts}
            </p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
              {completedAttempts > 0 ? 'Full analysis available' : 'Start your first test'}
            </p>
          </div>
        </section>

        {/* Control Bar: Search Input & Category Filters */}
        <section className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tests by title or topic..."
              className="w-full pl-8 pr-16 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition-colors"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {isSearching && (
                <Loader2 className="w-3 h-3 text-zinc-400 animate-spin" />
              )}
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-0.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded transition-colors"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </form>

          {/* Stream Filter text tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${isSelected
                      ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/60'
                    }`}
                >
                  {cat === 'ALL' ? 'All' : cat}
                </button>
              );
            })}
          </div>
        </section>

        {/* Test Cards & List Grid */}
        <section>
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-zinc-400">
              <Loader2 className="w-5 h-5 animate-spin text-zinc-500 mb-2" />
              <p className="text-xs">Loading tests...</p>
            </div>
          ) : error ? (
            <div className="p-3.5 rounded-lg bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/50 dark:border-rose-800/40 text-rose-700 dark:text-rose-400 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                onClick={fetchExams}
                className="btn-secondary py-1 px-2.5 text-xs"
              >
                Retry
              </button>
            </div>
          ) : displayExams.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-8">
              {searchQuery.trim() ? (
                <>
                  <Search className="w-6 h-6 text-zinc-400 mx-auto mb-2" />
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                    No matching examinations found
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mb-4">
                    No active tests match "{searchQuery}" in category ({selectedCategory}).
                  </p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="btn-secondary text-xs py-1.5 px-3"
                  >
                    Clear Search Query
                  </button>
                </>
              ) : (
                <>
                  <BookOpen className="w-6 h-6 text-zinc-400 mx-auto mb-2" />
                  <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">
                    No examinations found
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mb-4">
                    No active tests match your filter ({selectedCategory}). You can author a new examination paper in the studio.
                  </p>
                  <button
                    onClick={() => navigate('/create-test')}
                    className="btn-primary"
                  >
                    Create Exam
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
              {displayExams.map((exam) => {
                const attemptsUsed = exam.userAttemptCount || 0;
                const maxAttempts = exam.maxAttempts;
                const isUnlimited = maxAttempts === null || maxAttempts === undefined;
                const attemptsLeft = isUnlimited ? Infinity : Math.max(0, maxAttempts - attemptsUsed);
                const hasAttempted = attemptsUsed > 0;
                const isExhausted = !isUnlimited && attemptsLeft === 0;
                const isDraft = exam.status === 'draft';
                const questionCount = exam.questionCount || exam.questions?.length || 0;
                const scheduleMeta = getScheduleMeta(exam.schedule);

                return (
                  <div
                    key={exam._id}
                    onClick={() => navigate(`/test/${exam._id}`)}
                    className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-5 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-200 hover:shadow-sm flex flex-col justify-between group cursor-pointer"
                  >
                    <div>
                      {/* Header: Upper-left subtle eyebrow + Conditional status indicator only */}
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                          {exam.category || 'Standard'}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {exam.isGenerated && !exam.isPublic && (
                            <span className="text-[11px] text-zinc-400 font-medium">Private</span>
                          )}
                          {/* Status: ONLY show if draft or exhausted. Published/Live is default so do not label. */}
                          {isDraft ? (
                            <span className="bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/40 text-[11px] px-2 py-0.5 rounded-md font-medium">
                              Draft
                            </span>
                          ) : isExhausted ? (
                            <span className="bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/40 text-[11px] px-2 py-0.5 rounded-md font-medium">
                              Exhausted
                            </span>
                          ) : null}
                        </div>
                      </div>

                      {/* Body: Card title */}
                      <h2 className="text-base font-semibold text-zinc-900 dark:text-white line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {exam.title}
                      </h2>

                      {exam.description && (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 line-clamp-2">
                          {exam.description}
                        </p>
                      )}

                      {/* Clean Schema Data Grid: Duration, Questions, Marks with Ratio, Schedule */}
                      <div className="border-y border-zinc-100 dark:border-zinc-800 py-3 my-3 grid grid-cols-2 gap-y-2.5 gap-x-3 text-xs text-zinc-600 dark:text-zinc-400">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <span className="truncate tabular-nums">{exam.durationMinutes} mins</span>
                        </div>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <FileText className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <span className="truncate tabular-nums">{questionCount} Questions</span>
                        </div>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Award className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <span className="truncate tabular-nums">
                            {exam.totalMarks || (questionCount * (exam.markingScheme?.correct || 4))} Marks
                            {exam.markingScheme?.correct !== undefined && (
                              <span className="text-[10px] text-zinc-400 ml-1">
                                (+{exam.markingScheme.correct}/{exam.markingScheme.incorrect ?? 0})
                              </span>
                            )}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <Calendar className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          <span className="truncate text-[11px]">{scheduleMeta}</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer: Dual-Action Hierarchy & Attempts counter */}
                    <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-3 mt-1 flex items-center justify-between">
                      <span className="text-xs text-zinc-400 tabular-nums">
                        {isUnlimited
                          ? `${attemptsUsed} attempts`
                          : `${attemptsUsed}/${maxAttempts} attempts`}
                      </span>

                      <div className="flex items-center gap-2">
                        {/* Practice Mode Action (if allowPracticeMode === true and not draft and not exhausted) */}
                        {exam.allowPracticeMode && !isDraft && !isExhausted && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              sessionStorage.setItem('active_exam_mode', 'PRACTICE');
                              localStorage.setItem('active_exam_id', exam._id);
                              navigate('/test', { state: { examId: exam._id, isPractice: true } });
                            }}
                            className="border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-xs py-1.5 px-2.5 rounded-lg shadow-sm font-medium transition cursor-pointer flex items-center gap-1.5"
                            title="Start unproctored practice session"
                          >
                            <Compass className="w-3.5 h-3.5 text-zinc-400" />
                            <span>Practice</span>
                          </button>
                        )}

                        {/* Primary Action */}
                        {isDraft ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/create-test?examId=${exam._id}`);
                            }}
                            className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 text-xs py-1.5 px-3 rounded-lg shadow-sm font-medium transition cursor-pointer flex items-center gap-1.5"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Edit Draft</span>
                          </button>
                        ) : isExhausted ? (
                          <span className="text-xs text-zinc-400 py-1.5 px-2 font-medium">Exhausted</span>
                        ) : hasAttempted ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/test/${exam._id}`);
                            }}
                            className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 text-xs py-1.5 px-3 rounded-lg shadow-sm font-medium transition cursor-pointer flex items-center gap-1.5"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Retake</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/test/${exam._id}`);
                            }}
                            className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200 text-xs py-1.5 px-3 rounded-lg shadow-sm font-medium transition cursor-pointer flex items-center gap-1.5"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>Start</span>
                          </button>
                        )}
                      </div>
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
