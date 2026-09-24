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
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const [exams, setExams] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const categories = ['ALL', 'JEE', 'NEET', 'GATE', 'APTITUDE', 'CUSTOM'];

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
    <div className="min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Top Header Banner */}
        <section className="rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-[#1f293d] p-6 sm:p-7 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-5 transition-all">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-blue-50 text-blue-700 border border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900/50">
                Candidate Portal
              </span>
              <span className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Proctoring Online
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Assessment Dashboard
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              {isAuthenticated ? (
                <>Welcome back, <span className="font-semibold text-slate-900 dark:text-slate-200">{user?.name || 'User'}</span>. Select an assessment below or author new examination material.</>
              ) : (
                <>Welcome! Browse our collection of proctored assessments below or view detailed exam blueprints.</>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleAuthorExamClick}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all cursor-pointer hover:shadow-md"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Author New Exam</span>
            </button>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-[#1f293d] shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Available Tests</span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center">
                <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold tabular-nums text-slate-900 dark:text-white">{exams.length}</div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">Active tests in catalog</span>
          </div>

          <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-[#1f293d] shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Total Questions</span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center">
                <HelpCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold tabular-nums text-slate-900 dark:text-white">
              {exams.reduce((sum, e) => sum + (e.questions?.length || 0), 0)}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">Ready for practice</span>
          </div>

          <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-[#1f293d] shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Completed</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold tabular-nums text-slate-900 dark:text-white">
              {user?.attemptedTests?.length || 0}
            </div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">Evaluated attempts</span>
          </div>

          <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-[#1f293d] shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Current Filter</span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center">
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
        <section className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pb-2 border-b border-slate-200/80 dark:border-[#1f293d]">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${selectedCategory === cat
                    ? 'bg-blue-600 text-white shadow-xs font-semibold'
                    : 'bg-white dark:bg-[#111827] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200/90 dark:border-[#1f293d] hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search assessment title or topic..."
              className="w-full pl-9 pr-3.5 py-2 bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-[#1f293d] rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all"
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
                className="px-3 py-1.5 bg-white dark:bg-[#111827] border border-rose-300 dark:border-rose-800 rounded-lg text-xs font-medium cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : exams.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-[#111827] rounded-2xl border border-slate-200/90 dark:border-[#1f293d] p-8 shadow-xs">
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-slate-400 mx-auto mb-3">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">No examinations found</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-5 leading-relaxed">
                No active tests match your search or category filter. You can create a new assessment right now in Authoring Studio.
              </p>
              <button
                onClick={() => navigate('/create-test')}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-xs transition-colors cursor-pointer"
              >
                Create Exam
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
              {exams.map((exam) => {
                const attemptsUsed = exam.userAttemptCount || 0;
                const maxAttempts = exam.maxAttempts; // null = unlimited
                const isUnlimited = maxAttempts === null || maxAttempts === undefined;
                const attemptsLeft = isUnlimited ? Infinity : Math.max(0, maxAttempts - attemptsUsed);
                const hasAttempted = attemptsUsed > 0;
                const isExhausted = !isUnlimited && attemptsLeft === 0;

                return (
                  <div
                    key={exam._id}
                    onClick={() => navigate(`/test/${exam._id}`)}
                    className="group rounded-2xl bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-[#1f293d] p-6 flex flex-col justify-between shadow-xs hover:border-blue-400 dark:hover:border-blue-500/70 hover:shadow-md hover:-translate-y-0.5 cursor-pointer transition-all duration-200"
                  >
                    <div className="space-y-4">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200/60 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-900/60">
                            {exam.category}
                          </span>
                          {exam.status === 'draft' && (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-900/60">
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
                        <h2 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                          {exam.title}
                        </h2>
                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 min-h-[2.5rem] leading-relaxed">
                          {exam.description || 'Comprehensive evaluation covering standard curriculum syllabus with proctored validation.'}
                        </p>
                      </div>

                      {/* 3 Metric Pills */}
                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-[#1f293d] text-xs">
                        <div className="bg-slate-50 dark:bg-[#090d16]/70 p-2.5 rounded-xl border border-slate-200/60 dark:border-[#1f293d]">
                          <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 block">Questions</span>
                          <span className="font-bold text-slate-900 dark:text-white tabular-nums">{exam.questionCount || 0}</span>
                        </div>
                        <div className="bg-slate-50 dark:bg-[#090d16]/70 p-2.5 rounded-xl border border-slate-200/60 dark:border-[#1f293d]">
                          <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 block">Total Marks</span>
                          <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">{exam.totalMarks || 100} pts</span>
                        </div>
                        <div className={`p-2.5 rounded-xl border text-xs ${isExhausted
                            ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50'
                            : 'bg-slate-50 dark:bg-[#090d16]/70 border-slate-200/60 dark:border-[#1f293d]'
                          }`}>
                          <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 dark:text-slate-500 block">Attempts</span>
                          <span className={`font-bold tabular-nums ${isExhausted ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
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
                          className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-medium text-xs flex items-center justify-center gap-1.5 cursor-not-allowed"
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
                          className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
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
