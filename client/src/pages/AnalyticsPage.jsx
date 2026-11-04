import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Navbar from '../components/common/Navbar';
import ScoreTrendChart from '../components/analytics/ScoreTrendChart';
import StreamAccuracyChart from '../components/analytics/StreamAccuracyChart';
import AccuracyHeatmap from '../components/analytics/AccuracyHeatmap';
import ExamInsightsPanel from '../components/analytics/ExamInsightsPanel';
import LeaderboardTable from '../components/analytics/LeaderboardTable';
import useAuthStore from '../store/useAuthStore';
import api from '../services/api';
import {
  BarChart3,
  TrendingUp,
  Target,
  Trophy,
  Flame,
  Clock,
  Award,
  RefreshCw,
  Loader2,
  AlertCircle,
  LogIn
} from 'lucide-react';

export default function AnalyticsPage() {
  const { isAuthenticated, openAuthModal } = useAuthStore();
  const [activeTab, setActiveTab] = useState('performance'); // 'performance' | 'insights' | 'leaderboard'
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchPersonalAnalytics = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get('/analytics/me');
      if (res.data?.success) {
        setData(res.data);
      } else {
        throw new Error(res.data?.message || 'Failed to fetch analytics.');
      }
    } catch (err) {
      console.error('Personal analytics error:', err);
      setError(err.response?.data?.message || err.message || 'Could not load analytics.');
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchPersonalAnalytics();
  }, [fetchPersonalAnalytics]);

  // Extract unique attempted exams list for the Exam Insights tab
  const attemptedExams = useMemo(() => {
    if (!data?.trend) return [];
    const map = new Map();
    data.trend.forEach((t) => {
      const id = t.examId?._id || t.examId;
      if (id && !map.has(String(id))) {
        map.set(String(id), {
          _id: id,
          title: t.examTitle || 'Assessment',
          category: t.category || 'CUSTOM'
        });
      }
    });
    return Array.from(map.values());
  }, [data?.trend]);

  const summary = data?.summary;
  const trend = data?.trend || [];
  const streamAccuracy = data?.streamAccuracy || [];
  const tagAccuracy = data?.tagAccuracy || [];
  const activeDays = data?.activeDays || [];

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0C0F17] text-slate-900 dark:text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800/80">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/40 flex items-center justify-center">
                <BarChart3 className="w-4 h-4" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Performance Analytics & Insights
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Track your score trajectory over time, identify syllabus areas for revision, and view official rankings.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <button
                type="button"
                onClick={fetchPersonalAnalytics}
                disabled={isLoading}
                title="Refresh analytics data"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#131926] text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 w-fit text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('performance')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'performance'
                ? 'bg-white dark:bg-[#131926] text-slate-900 dark:text-slate-100 shadow-2xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>My Performance</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('insights')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'insights'
                ? 'bg-white dark:bg-[#131926] text-slate-900 dark:text-slate-100 shadow-2xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Exam Insights</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('leaderboard')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md font-medium transition-colors ${
              activeTab === 'leaderboard'
                ? 'bg-white dark:bg-[#131926] text-slate-900 dark:text-slate-100 shadow-2xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Leaderboard</span>
          </button>
        </div>

        {/* Guest prompt for Personal Analytics */}
        {!isAuthenticated && activeTab !== 'leaderboard' && (
          <div className="p-8 rounded-lg bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-slate-800/80 text-center space-y-3">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center mx-auto">
              <LogIn className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Sign In to View Your Performance History
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Personal analytics, score progression charts, and topic mastery require an authenticated account.
            </p>
            <button
              type="button"
              onClick={() => openAuthModal({ title: 'Sign In to View Analytics' })}
              className="px-4 py-2 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white shadow-2xs transition-colors"
            >
              Sign In to Continue
            </button>
          </div>
        )}

        {/* Tab 1: My Performance */}
        {isAuthenticated && activeTab === 'performance' && (
          <div className="space-y-6">
            {isLoading && !data && (
              <div className="p-16 text-center flex flex-col items-center justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-slate-400 mb-2" />
                <p className="text-xs text-slate-400">Loading your candidate analytics...</p>
              </div>
            )}

            {error && (
              <div className="p-4 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {data && (
              <>
                {/* Summary Metrics Row */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  <div className="p-3.5 rounded-lg bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-slate-800/80">
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Total Exams</span>
                    <div className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono mt-1">
                      {summary?.totalExamsTaken || 0}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-slate-800/80">
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Official Tests</span>
                    <div className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono mt-1">
                      {summary?.officialAttempts || 0}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-slate-800/80">
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Avg Score</span>
                    <div className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono mt-1">
                      {summary?.averageScore || 0}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-slate-800/80">
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Best Score</span>
                    <div className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono mt-1">
                      {summary?.bestScore || 0}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-slate-800/80">
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Avg Accuracy</span>
                    <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                      {summary?.averageAccuracy || 0}%
                    </div>
                  </div>

                  <div className="p-3.5 rounded-lg bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-slate-800/80">
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Current Streak</span>
                    <div className="text-lg font-bold text-amber-600 dark:text-amber-500 font-mono mt-1">
                      {summary?.currentStreakDays || 0} Days
                    </div>
                  </div>
                </div>

                {/* Score Trend Chart Section */}
                <div className="bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-slate-800/80 rounded-lg p-5">
                  <ScoreTrendChart trend={trend} />
                </div>

                {/* Two-Column Grid: Stream Breakdown & Topic Heatmap */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-slate-800/80 rounded-lg p-5">
                    <StreamAccuracyChart streamAccuracy={streamAccuracy} />
                  </div>

                  <div className="bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-slate-800/80 rounded-lg p-5">
                    <AccuracyHeatmap
                      tagAccuracy={tagAccuracy}
                      activeDays={activeDays}
                      streak={summary?.currentStreakDays || 0}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Tab 2: Exam Insights */}
        {isAuthenticated && activeTab === 'insights' && (
          <ExamInsightsPanel attemptedExams={attemptedExams} />
        )}

        {/* Tab 3: Global Leaderboard (Public / All) */}
        {activeTab === 'leaderboard' && (
          <LeaderboardTable />
        )}
      </main>
    </div>
  );
}

