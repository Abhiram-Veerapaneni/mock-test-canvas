import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import useAuthStore from '../store/useAuthStore';
import api from '../services/api';
import { formatDateTime12h } from '../utils/dateUtils';
import {
  BookOpen,
  RefreshCw,
  Loader2,
  AlertCircle,
  LogIn,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  ExternalLink,
  Clock
} from 'lucide-react';

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const { isAuthenticated, openAuthModal, user } = useAuthStore();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get('/analytics/me');
      if (res.data?.success) {
        setData(res.data);
      } else {
        throw new Error(res.data?.message || 'Failed to load analytics.');
      }
    } catch (err) {
      console.error('[AnalyticsPage] Error fetching:', err);
      setError(err.response?.data?.message || err.message || 'Could not load analytics.');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const categories = data?.categoryPerformance || [];
  const allTrends = data?.trend || [];

  // Set default category when data loads
  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0].category);
    }
  }, [categories, selectedCategory]);

  // Current active category data
  const activeCategoryData = useMemo(() => {
    if (!selectedCategory) return null;
    return categories.find((c) => c.category === selectedCategory) || null;
  }, [categories, selectedCategory]);

  // Filter attempt history for active category
  const categoryAttempts = useMemo(() => {
    if (!selectedCategory) return [];
    return allTrends
      .filter((t) => t.category === selectedCategory)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [allTrends, selectedCategory]);

  // Derive Strongest & Priority Focus Subjects in active category
  const { strongestSubject, focusSubject } = useMemo(() => {
    if (!activeCategoryData || !activeCategoryData.subjects.length) {
      return { strongestSubject: null, focusSubject: null };
    }
    const evaluated = activeCategoryData.subjects.filter((s) => s.totalAnswered > 0);
    if (evaluated.length === 0) {
      return { strongestSubject: null, focusSubject: null };
    }
    const sorted = [...evaluated].sort((a, b) => (b.accuracy || 0) - (a.accuracy || 0));
    return {
      strongestSubject: sorted[0],
      focusSubject: sorted.length > 1 ? sorted[sorted.length - 1] : null
    };
  }, [activeCategoryData]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0C0F17] text-slate-900 dark:text-slate-300 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Top Header - Matches DashboardPage Section Header */}
        <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
              Subject Analytics
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {isAuthenticated ? (
                <>Candidate performance and subject mastery for <span className="font-medium text-slate-800 dark:text-slate-200">{user?.name || user?.email}</span>.</>
              ) : (
                <>Subject-level accuracy and scorecards across your examination tracks.</>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <button
                type="button"
                onClick={fetchAnalytics}
                disabled={isLoading}
                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs active:scale-[0.98] dark:bg-slate-800/80 dark:hover:bg-slate-800 dark:text-slate-200 dark:border-slate-700 text-xs py-1.5 px-3 rounded-lg font-medium transition cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            )}
          </div>
        </section>

        {/* Guest Guard */}
        {!isAuthenticated && (
          <div className="text-center py-16 bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-slate-800/80 rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:shadow-none p-8 space-y-4">
            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 flex items-center justify-center mx-auto shadow-xs">
              <LogIn className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Sign In to View Subject Performance
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                Subject-wise question mastery and accuracy metrics are stored under your verified candidate profile.
              </p>
            </div>
            <button
              type="button"
              onClick={() => openAuthModal({ title: 'Sign In to View Analytics' })}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-sm shadow-indigo-600/20 active:scale-[0.98] dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:text-white dark:shadow-indigo-500/10 text-xs py-1.5 px-4 rounded-lg inline-flex items-center gap-2 transition cursor-pointer"
            >
              Sign In to Continue
            </button>
          </div>
        )}

        {/* Loading State */}
        {isAuthenticated && isLoading && !data && (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 dark:text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin text-indigo-600 dark:text-indigo-400 mb-2" />
            <p className="text-xs">Loading performance data...</p>
          </div>
        )}

        {/* Error State */}
        {isAuthenticated && error && (
          <div className="p-3.5 rounded-lg bg-white dark:bg-[#131926] border-l-4 border-l-rose-600 border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
              <span className="font-medium text-slate-900 dark:text-slate-100">{error}</span>
            </div>
            <button
              onClick={fetchAnalytics}
              className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-xs active:scale-[0.98] dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-slate-700 py-1 px-2.5 text-xs rounded-md font-medium transition cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Main Content Area */}
        {isAuthenticated && data && (
          <>
            {categories.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-slate-800/80 rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:shadow-none p-8 space-y-3">
                <BookOpen className="w-6 h-6 text-slate-400 dark:text-slate-400 mx-auto mb-2" />
                <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  No Completed Assessments Recorded
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                  Attempt an assessment to generate subject-wise accuracy and diagnostic breakdowns.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/dashboard')}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-sm shadow-indigo-600/20 active:scale-[0.98] dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:text-white dark:shadow-indigo-500/10 text-xs py-1.5 px-3 rounded-lg inline-flex items-center gap-1.5 transition cursor-pointer mt-2"
                >
                  <span>Explore Assessments</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* 1. Category Switcher Tabs - Styled Identically to DashboardPage Categories */}
                <section className="flex items-center justify-between gap-3 pt-1">
                  <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
                    {categories.map((c) => {
                      const isSelected = selectedCategory === c.category;
                      return (
                        <button
                          key={c.category}
                          type="button"
                          onClick={() => setSelectedCategory(c.category)}
                          className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors cursor-pointer whitespace-nowrap ${
                            isSelected
                              ? 'bg-indigo-600 text-white dark:bg-indigo-500 dark:text-white shadow-sm shadow-indigo-600/20'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                          }`}
                        >
                          <span>{c.category}</span>
                          <span className="ml-1.5 text-[10px] font-mono opacity-80">
                            ({c.totalExams || 1} { (c.totalExams || 1) === 1 ? 'test' : 'tests' })
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>

                {/* 2. Track Summary Metric Blocks - Exact Dashboard 3-column Divide Layout */}
                {activeCategoryData && (
                  <section className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200/80 dark:divide-slate-800/80 border border-slate-200/80 rounded-lg bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none">
                    <div className="p-4 sm:p-5">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Questions</p>
                      <p className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums mt-1">
                        {activeCategoryData.totalQuestions}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">
                        In {activeCategoryData.totalExams || 1} { (activeCategoryData.totalExams || 1) === 1 ? 'test' : 'tests' } ({activeCategoryData.category})
                      </p>
                    </div>

                    <div className="p-4 sm:p-5">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Questions Attempted</p>
                      <p className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums mt-1">
                        {activeCategoryData.totalAnswered}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">
                        {activeCategoryData.totalCorrect} correct · {activeCategoryData.totalIncorrect} incorrect
                      </p>
                    </div>

                    <div className="p-4 sm:p-5">
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Net Accuracy</p>
                      <p className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums mt-1">
                        {activeCategoryData.accuracy}%
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-400 mt-0.5">
                        From latest test submissions
                      </p>
                    </div>
                  </section>
                )}

                {/* 3. Strengths vs Priority Revision Area (Testbook/Allen Diagnostic Pattern) */}
                {strongestSubject && (
                  <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-slate-800/80 rounded-lg p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:shadow-none space-y-2">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                          Strongest Subject
                        </span>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                          {strongestSubject.subject}
                        </h3>
                        <span className="text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                          {strongestSubject.accuracy}%
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {strongestSubject.totalCorrect} of {strongestSubject.totalAnswered} answered correctly. Keep maintaining this benchmark.
                      </p>
                    </div>

                    {focusSubject && (
                      <div className="bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-slate-800/80 rounded-lg p-4 sm:p-5 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:shadow-none space-y-2">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                          <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                            Priority Focus Area
                          </span>
                        </div>
                        <div className="flex items-baseline justify-between">
                          <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                            {focusSubject.subject}
                          </h3>
                          <span className="text-lg font-bold font-mono text-amber-600 dark:text-amber-400">
                            {focusSubject.accuracy}%
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {focusSubject.totalIncorrect} incorrect answers recorded. Prioritize revision on weak topics here.
                        </p>
                      </div>
                    )}
                  </section>
                )}

                {/* 4. Core Subject Cards - Matching ExamCard / Dashboard Design */}
                {activeCategoryData && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Subject Performance ({activeCategoryData.category})
                      </h2>
                    </div>

                    {activeCategoryData.subjects.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400 rounded-lg bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-slate-800/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:shadow-none">
                        No subject-specific questions recorded for this category yet.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {activeCategoryData.subjects.map((subj) => {
                          const acc = subj.accuracy || 0;

                          return (
                            <div
                              key={subj.subject}
                              className="bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-slate-800/80 rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:shadow-none p-4 sm:p-5 space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div>
                                  <span className="text-[11px] font-bold tracking-wider uppercase text-indigo-600 dark:text-indigo-400 block mb-0.5">
                                    {activeCategoryData.category}
                                  </span>
                                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                    {subj.subject}
                                  </h3>
                                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                                    {subj.totalQuestions} question{subj.totalQuestions !== 1 ? 's' : ''} in syllabus
                                  </p>
                                </div>
                                <div className="text-right">
                                  <span className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 font-mono">
                                    {acc}%
                                  </span>
                                  <span className="block text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                                    Accuracy
                                  </span>
                                </div>
                              </div>

                              {/* Progress bar in platform standard indigo */}
                              <div className="space-y-1">
                                <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-500"
                                    style={{ width: `${Math.min(acc, 100)}%` }}
                                  />
                                </div>
                              </div>

                              {/* Clean metric footer row */}
                              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                                <div>
                                  <span className="text-slate-400 mr-1.5">Correct:</span>
                                  <span className="font-semibold text-slate-800 dark:text-slate-200">{subj.totalCorrect}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 mr-1.5">Incorrect:</span>
                                  <span className="font-semibold text-slate-800 dark:text-slate-200">{subj.totalIncorrect}</span>
                                </div>
                                <div>
                                  <span className="text-slate-400 mr-1.5">Unanswered:</span>
                                  <span className="font-semibold text-slate-800 dark:text-slate-200">{subj.totalUnanswered}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* 5. Completed Assessments in this Stream (With Direct Solution Review Links) */}
                {categoryAttempts.length > 0 && (
                  <div className="bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-slate-800/80 rounded-lg shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:shadow-none p-4 sm:p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                          Attempted Assessments ({activeCategoryData.category})
                        </h3>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Review verified response sheets and step-by-step AI solutions
                        </p>
                      </div>
                      <span className="text-xs text-slate-400 font-mono">
                        {categoryAttempts.length} attempt{categoryAttempts.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    <div className="overflow-x-auto border border-slate-200/80 dark:border-slate-800/80 rounded-lg">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50/80 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200/80 dark:border-slate-800/80">
                          <tr>
                            <th className="py-2.5 px-3">Assessment Title</th>
                            <th className="py-2.5 px-3">Submitted</th>
                            <th className="py-2.5 px-3 text-center">Type</th>
                            <th className="py-2.5 px-3 text-right">Score</th>
                            <th className="py-2.5 px-3 text-right">Accuracy</th>
                            <th className="py-2.5 px-3 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                          {categoryAttempts.map((att) => (
                            <tr key={att.attemptId} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                              <td className="py-2.5 px-3 font-sans font-medium text-slate-900 dark:text-slate-100 max-w-[200px] truncate">
                                {att.examTitle}
                              </td>
                              <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 font-sans text-[11px]">
                                {formatDateTime12h(att.date)}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-sans font-medium ${
                                  att.isPractice
                                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                    : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
                                }`}>
                                  {att.isPractice ? 'Practice' : 'Official'}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right font-medium text-slate-900 dark:text-slate-100">
                                {att.score} / {att.totalMarks}
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-slate-100">
                                {att.accuracy}%
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => navigate(`/test/${att.examId}/review/${att.attemptId}`)}
                                  className="inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-medium font-sans cursor-pointer hover:underline"
                                >
                                  <span>Review</span>
                                  <ExternalLink className="w-3 h-3" />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
