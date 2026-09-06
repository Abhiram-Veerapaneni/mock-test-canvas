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
  CheckCircle2
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuthStore();
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
      setError('Unable to load available exams. Please check your backend connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchExams();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Top Header Banner */}
        <section className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
              Assessment Dashboard
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Welcome back, <span className="font-medium text-slate-900 dark:text-white">{user?.name || 'User'}</span>. Access your examinations and authoring suite below.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/create-test')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Author New Exam</span>
            </button>
          </div>
        </section>

        {/* Stats Grid */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
              <span className="text-xs font-medium">Available Tests</span>
              <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white">{exams.length}</div>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">Ready for assessment</span>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
              <span className="text-xs font-medium">Total Questions</span>
              <HelpCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
              {exams.reduce((sum, e) => sum + (e.questions?.length || 0), 0)}
            </div>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">Across current exams</span>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
              <span className="text-xs font-medium">Tests Attempted</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="text-2xl font-bold tabular-nums text-slate-900 dark:text-white">
              {user?.attemptedTests?.length || 0}
            </div>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">Completed by you</span>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-1">
              <span className="text-xs font-medium">Selected Stream</span>
              <Award className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
              {selectedCategory === 'ALL' ? 'All Streams' : selectedCategory}
            </div>
            <span className="text-[11px] text-slate-400 dark:text-slate-500">Active category filter</span>
          </div>
        </section>

        {/* Filters & Search Bar */}
        <section className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                    : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search exams..."
              className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </form>
        </section>

        {/* Exams Grid */}
        <section>
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600 mb-2" />
              <p className="text-xs">Loading examinations...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                onClick={fetchExams}
                className="px-3 py-1 bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 rounded-lg text-xs font-medium"
              >
                Retry
              </button>
            </div>
          ) : exams.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
              <BookOpen className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white mb-1">No examinations available</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-4">
                No active tests match your criteria. Create a new exam using the Authoring Studio.
              </p>
              <button
                onClick={() => navigate('/create-test')}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium"
              >
                Create Exam
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                    onClick={() => navigate(`/exam/${exam._id}`)}
                    className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between shadow-xs hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md cursor-pointer transition-all duration-150"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wide bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-900/60">
                          {exam.category}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span className="tabular-nums">{exam.durationMinutes} mins</span>
                        </div>
                      </div>

                      <div>
                        <h2 className="text-sm font-semibold text-slate-900 dark:text-white line-clamp-1">
                          {exam.title}
                        </h2>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                          {exam.description || 'Comprehensive evaluation covering competitive entrance syllabus.'}
                        </p>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                        <div className="bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-200/60 dark:border-slate-800/80">
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Questions</span>
                          <span className="font-semibold text-slate-900 dark:text-white tabular-nums">{exam.questionCount || 0}</span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-200/60 dark:border-slate-800/80">
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Total Marks</span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">{exam.totalMarks || 100} pts</span>
                        </div>
                        <div className={`p-2 rounded-lg border text-xs ${
                          isExhausted
                            ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60'
                            : 'bg-slate-50 dark:bg-slate-950 border-slate-200/60 dark:border-slate-800/80'
                        }`}>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Attempts</span>
                          <span className={`font-semibold tabular-nums ${
                            isExhausted ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'
                          }`}>
                            {isUnlimited ? `${attemptsUsed} / ∞` : `${attemptsUsed}/${maxAttempts}`}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4">
                      {isExhausted ? (
                        <button
                          disabled
                          className="w-full py-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-medium text-xs flex items-center justify-center gap-1.5 cursor-not-allowed"
                        >
                          <span>Attempts Exhausted</span>
                        </button>
                      ) : hasAttempted ? (
                        <button
                          onClick={() => navigate(`/exam/${exam._id}`)}
                          className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs flex items-center justify-center gap-1.5 shadow-xs focus:ring-2 focus:ring-emerald-500/20 focus:outline-none transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Retake Exam{!isUnlimited ? ` (${attemptsLeft} left)` : ''}</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => navigate(`/exam/${exam._id}`)}
                          className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs flex items-center justify-center gap-1.5 shadow-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors"
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
