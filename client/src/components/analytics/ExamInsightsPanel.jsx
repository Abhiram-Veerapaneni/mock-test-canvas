import React, { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import {
  BarChart2,
  Users,
  Target,
  Award,
  ChevronDown,
  Loader2,
  AlertCircle
} from 'lucide-react';
import api from '../../services/api';

export default function ExamInsightsPanel({ attemptedExams = [] }) {
  const [selectedExamId, setSelectedExamId] = useState('');
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Set default selected exam when list loads
  useEffect(() => {
    if (attemptedExams.length > 0 && !selectedExamId) {
      setSelectedExamId(attemptedExams[0]._id);
    }
  }, [attemptedExams, selectedExamId]);

  useEffect(() => {
    if (!selectedExamId) return;

    const fetchInsights = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await api.get(`/analytics/exam/${selectedExamId}`);
        if (res.data?.success) {
          setData(res.data);
        } else {
          throw new Error(res.data?.message || 'Could not load exam insights.');
        }
      } catch (err) {
        console.error('Exam insights error:', err);
        setError(err.response?.data?.message || err.message || 'Failed to fetch exam data.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInsights();
  }, [selectedExamId]);

  if (!attemptedExams || attemptedExams.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
        No completed examinations to analyze. Take an assessment to view deep insights.
      </div>
    );
  }

  const stats = data?.stats;
  const scoreDistribution = data?.scoreDistribution || [];
  const streamBreakdown = data?.streamBreakdown || [];

  return (
    <div className="space-y-6">
      {/* Exam Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-lg bg-slate-50/50 dark:bg-slate-800/20 border border-slate-200/80 dark:border-slate-800/80">
        <div>
          <label className="text-xs font-semibold text-slate-900 dark:text-slate-100 block">
            Select Examination
          </label>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            {data?.exam?.isCreator ? 'Examiner View: Aggregating all candidates' : 'Candidate View: Your performance history for this test'}
          </p>
        </div>
        <div className="relative min-w-[220px]">
          <select
            value={selectedExamId}
            onChange={(e) => setSelectedExamId(e.target.value)}
            className="w-full appearance-none pl-3 pr-8 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#131926] text-slate-900 dark:text-slate-100 font-medium focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          >
            {attemptedExams.map((ex) => (
              <option key={ex._id} value={ex._id}>
                {ex.title} ({ex.category || 'CUSTOM'})
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </div>

      {isLoading && (
        <div className="p-12 text-center flex flex-col items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400 mb-2" />
          <p className="text-xs text-slate-400">Computing assessment distributions...</p>
        </div>
      )}

      {error && !isLoading && (
        <div className="p-4 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {data && !isLoading && !error && (
        <div className="space-y-6">
          {/* Key Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3.5 rounded-lg bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-slate-800/80">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Attempts</span>
              <div className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono mt-1">
                {stats?.totalAttempts || 0}
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-slate-800/80">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Avg Score</span>
              <div className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono mt-1">
                {stats?.averageScore || 0}
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-slate-800/80">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Median Score</span>
              <div className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono mt-1">
                {stats?.medianScore || 0}
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-slate-800/80">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Best Score</span>
              <div className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono mt-1">
                {stats?.highestScore || 0}
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-slate-800/80">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Lowest Score</span>
              <div className="text-lg font-bold text-slate-900 dark:text-slate-100 font-mono mt-1">
                {stats?.lowestScore || 0}
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-slate-800/80">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Avg Accuracy</span>
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-1">
                {stats?.averageAccuracy || 0}%
              </div>
            </div>
          </div>

          {/* Histogram: Score Distribution */}
          <div className="bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-slate-800/80 rounded-lg p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  Score Distribution Histogram (Decile Buckets)
                </h4>
              </div>
              <span className="text-[11px] text-slate-400">
                Number of attempts per range
              </span>
            </div>

            <div className="h-60 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={scoreDistribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-200 dark:stroke-slate-800" />
                  <XAxis
                    dataKey="bucket"
                    tickLine={false}
                    axisLine={{ className: 'stroke-slate-200 dark:stroke-slate-800' }}
                    tick={{ fontSize: 10, className: 'fill-slate-500 dark:fill-slate-400' }}
                  />
                  <YAxis
                    allowDecimals={false}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, className: 'fill-slate-500 dark:fill-slate-400' }}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const pt = payload[0].payload;
                      return (
                        <div className="bg-white dark:bg-[#0f1420] border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 shadow-md text-xs font-mono">
                          <span className="font-semibold text-slate-900 dark:text-slate-100">{pt.bucket}</span>: {pt.count} candidate attempt(s)
                        </div>
                      );
                    }}
                  />
                  <Bar dataKey="count" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Grouped Bar: Subject / Stream Performance */}
          {streamBreakdown.length > 0 && (
            <div className="bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-slate-800/80 rounded-lg p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    Subject Answer Breakdown
                  </h4>
                </div>
                <span className="text-[11px] text-slate-400">
                  Correct vs. Incorrect answers
                </span>
              </div>

              <div className="h-60 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={streamBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-200 dark:stroke-slate-800" />
                    <XAxis
                      dataKey="stream"
                      tickLine={false}
                      axisLine={{ className: 'stroke-slate-200 dark:stroke-slate-800' }}
                      tick={{ fontSize: 11, className: 'fill-slate-500 dark:fill-slate-400' }}
                    />
                    <YAxis
                      allowDecimals={false}
                      tickLine={false}
                      axisLine={false}
                      tick={{ fontSize: 11, className: 'fill-slate-500 dark:fill-slate-400' }}
                    />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload?.length) return null;
                        return (
                          <div className="bg-white dark:bg-[#0f1420] border border-slate-200 dark:border-slate-800 rounded-lg p-2.5 shadow-md text-xs space-y-1">
                            <div className="font-semibold text-slate-900 dark:text-slate-100">{label}</div>
                            {payload.map((entry, idx) => (
                              <div key={idx} className="flex justify-between gap-4 font-mono text-[11px]">
                                <span style={{ color: entry.color }}>{entry.name}:</span>
                                <span>{entry.value}</span>
                              </div>
                            ))}
                          </div>
                        );
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                    <Bar dataKey="correctCount" name="Correct" fill="#059669" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="incorrectCount" name="Incorrect" fill="#E11D48" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="unansweredCount" name="Unanswered" fill="#94A3B8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

