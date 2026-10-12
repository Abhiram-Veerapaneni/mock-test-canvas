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
  TrendingUp,
  Sparkles,
  Edit3,
  Flame,
  Sigma,
  Calendar,
  FileCheck
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

        timer = setTimeout(() => {
          if (!isSubscribed) return;
          window.google.accounts.id.prompt((notification) => {
            if (notification.isDismissedMoment() || notification.isSkippedMoment()) {
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

  const getScheduleInfo = (schedule) => {
    if (!schedule?.isScheduled) {
      return {
        isScheduled: false,
        text: 'Flexible • Anytime Access',
        badge: 'Open Window',
        status: 'OPEN'
      };
    }

    const now = Date.now();
    const start = schedule.startTime ? new Date(schedule.startTime) : null;
    const end = schedule.endTime ? new Date(schedule.endTime) : null;
    const startMs = start?.getTime();
    const endMs = end?.getTime();

    let status = 'LIVE';
    let badge = 'Active Now';
    if (startMs && now < startMs) {
      status = 'UPCOMING';
      badge = 'Upcoming';
    } else if (endMs && now > endMs) {
      status = 'CONCLUDED';
      badge = 'Concluded';
    }

    let dateRangeStr = '';
    if (start && end) {
      const isSameDay = start.toDateString() === end.toDateString();
      const dateFormatted = start.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric'
      });
      const startTimeStr = start.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit'
      });
      const endTimeStr = end.toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit'
      });
      if (isSameDay) {
        dateRangeStr = `${dateFormatted} • ${startTimeStr} – ${endTimeStr}`;
      } else {
        const endFormatted = end.toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric'
        });
        dateRangeStr = `${dateFormatted}, ${startTimeStr} – ${endFormatted}, ${endTimeStr}`;
      }
    } else if (start) {
      dateRangeStr = `Opens ${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
    } else if (end) {
      dateRangeStr = `Closes ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
    } else {
      dateRangeStr = 'Scheduled Window';
    }

    return {
      isScheduled: true,
      text: dateRangeStr,
      badge,
      status
    };
  };

  const totalQuestions = exams.reduce((sum, e) => sum + (e.questions?.length || 0), 0);
  const completedAttempts = user?.attemptedTests?.length || 0;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0f17] text-slate-900 dark:text-zinc-100 flex flex-col transition-colors duration-200">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-7">
        {/* Top Hero Banner */}
        <section className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-7 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-5 transition-all">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60">
                Examination Portal
              </span>
              <span className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Proctoring Online
              </span>
            </div>
            <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Candidate & Assessment Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
              {isAuthenticated ? (
                <>Welcome back, <span className="font-semibold text-slate-900 dark:text-slate-200">{user?.name || 'Candidate'}</span>. Select an active test to begin your proctored assessment or author new examination materials.</>
              ) : (
                <>Browse verified competitive exam papers (JEE, NEET, GATE) or create custom mock assessments with automated LaTeX parsing.</>
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

        {/* 3 Metric Cards Grid (Clean CBT KPIs with micro-trends, Current Filter relocated) */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {/* Card 1: Active Tests */}
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Active Tests
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-900/60">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                Live Catalog
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-extrabold tabular-nums text-slate-900 dark:text-white">
                {exams.length}
              </div>
              <div className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Verified CBT</span>
              </div>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 block">
              Available assessments ready for testing
            </span>
          </div>

          {/* Card 2: Total Questions Available */}
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Question Bank
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-900/60">
                <Sigma className="w-3 h-3" />
                KaTeX Math Ready
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-extrabold tabular-nums text-slate-900 dark:text-white">
                {totalQuestions}
              </div>
              <div className="flex items-center gap-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400">
                <span>MCQ • MSQ • NAT</span>
              </div>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 block">
              High-yield questions with full pedagogical solutions
            </span>
          </div>

          {/* Card 3: Completed Assessments */}
          <div className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-3">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Completed Assessments
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-900/60">
                <FileCheck className="w-3 h-3" />
                Auto-Evaluated
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-extrabold tabular-nums text-slate-900 dark:text-white">
                {completedAttempts}
              </div>
              <div className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {completedAttempts > 0 ? 'Full Analysis Available' : 'Start your first test'}
              </div>
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 block">
              Proctored candidate attempts scored
            </span>
          </div>
        </section>

        {/* Single Horizontal Control Bar: Search Input (Left), Category Pill Tabs + Current Filter (Right), Author New Exam */}
        <section className="bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-3 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Left: Search input */}
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-72 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assessment or topic..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </form>

          {/* Right: Category Pill Tabs with Subtle Active State */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1 hidden lg:inline">
              Curriculum:
            </span>
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-2xs font-semibold'
                      : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {cat === 'ALL' ? 'All Streams' : cat}
                </button>
              );
            })}
          </div>
        </section>

        {/* Exams Catalog Grid */}
        <section>
          {isLoading ? (
            <div className="py-24 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
              <p className="text-xs font-medium">Loading examination catalog...</p>
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
            <div className="text-center py-16 bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mx-auto mb-3">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white mb-1">
                No examinations found
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-5 leading-relaxed">
                No active tests match your search or stream filter ({selectedCategory}). You can author a new examination paper in the studio.
              </p>
              <button
                onClick={() => navigate('/create-test')}
                className="btn-primary"
              >
                Create Exam Paper
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
                    className="group bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col justify-between shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition-all cursor-pointer"
                  >
                    <div className="space-y-4">
                      {/* Top Badges: Category + Status + Duration */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/80 dark:border-blue-900/60">
                            {exam.category || 'Standard'}
                          </span>
                          {exam.status === 'draft' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60">
                              Draft
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60">
                              Live
                            </span>
                          )}
                        </div>

                        {/* Clean Duration Pill */}
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span className="tabular-nums font-semibold">{exam.durationMinutes}m</span>
                        </div>
                      </div>

                      {/* Title & Description */}
                      <div className="space-y-1.5">
                        <h2 className="font-display text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                          {exam.title}
                        </h2>
                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 min-h-[2.5rem] leading-relaxed">
                          {exam.description || 'Comprehensive evaluation covering standard curriculum syllabus with proctored validation.'}
                        </p>
                      </div>

                      {/* Schedule Timing Display */}
                      {(() => {
                        const sched = getScheduleInfo(exam.schedule);
                        return (
                          <div
                            className={`p-2.5 rounded-xl border text-xs flex items-center justify-between gap-2.5 transition-colors ${
                              sched.isScheduled
                                ? sched.status === 'LIVE'
                                  ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/70 text-emerald-900 dark:text-emerald-200'
                                  : sched.status === 'UPCOMING'
                                  ? 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/70 text-amber-900 dark:text-amber-200'
                                  : 'bg-slate-100/90 dark:bg-slate-900/90 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                                : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200/60 dark:border-slate-800/80 text-slate-500 dark:text-slate-400'
                            }`}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <Calendar
                                className={`w-3.5 h-3.5 shrink-0 ${
                                  sched.isScheduled
                                    ? sched.status === 'LIVE'
                                      ? 'text-emerald-600 dark:text-emerald-400'
                                      : sched.status === 'UPCOMING'
                                      ? 'text-amber-600 dark:text-amber-400'
                                      : 'text-slate-400'
                                    : 'text-slate-400'
                                }`}
                              />
                              <div className="min-w-0">
                                <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">
                                  {sched.isScheduled ? 'Schedule Window' : 'Schedule Mode'}
                                </span>
                                <span className="truncate font-semibold text-[11px] block">
                                  {sched.text}
                                </span>
                              </div>
                            </div>
                            <span
                              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shrink-0 ${
                                sched.isScheduled
                                  ? sched.status === 'LIVE'
                                    ? 'bg-emerald-600 text-white shadow-2xs'
                                    : sched.status === 'UPCOMING'
                                    ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                                    : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                  : 'bg-slate-200/80 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              {sched.badge}
                            </span>
                          </div>
                        );
                      })()}

                      {/* Structured 3-column stats bar */}
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                        <div className="bg-slate-50 dark:bg-slate-900/70 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">Questions</span>
                          <span className="font-bold text-slate-900 dark:text-white tabular-nums">{exam.questionCount || exam.questions?.length || 0}</span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900/70 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">Total Marks</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{exam.totalMarks || 100} pts</span>
                        </div>
                        <div className={`p-2.5 rounded-xl border text-xs ${
                          isExhausted
                            ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50'
                            : 'bg-slate-50 dark:bg-slate-900/70 border-slate-200/60 dark:border-slate-800'
                        }`}>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">Attempts</span>
                          <span className={`font-bold tabular-nums ${
                            isExhausted ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
                          }`}>
                            {isUnlimited ? `${attemptsUsed} / ∞` : `${attemptsUsed}/${maxAttempts}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Standardized Action Button: Solid brand blue for Start Proctored Exam, outlined/ghost for Retake */}
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
                          className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-medium text-xs flex items-center justify-center gap-1.5 cursor-not-allowed border border-slate-200 dark:border-slate-700"
                        >
                          <span>Attempts Exhausted</span>
                        </button>
                      ) : hasAttempted ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/test/${exam._id}`);
                          }}
                          className="w-full py-2.5 rounded-xl border border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
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
                          className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
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
