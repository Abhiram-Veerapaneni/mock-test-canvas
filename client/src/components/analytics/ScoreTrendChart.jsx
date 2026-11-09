import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { TrendingUp, Filter } from 'lucide-react';

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  const dataPoint = payload[0]?.payload;
  if (!dataPoint) return null;

  return (
    <div className="bg-white dark:bg-[#0f1420] border border-slate-200 dark:border-slate-800 rounded-lg p-3 shadow-md text-xs space-y-1.5 min-w-[180px]">
      <div className="font-semibold text-slate-900 dark:text-slate-100 truncate">
        {dataPoint.examTitle}
      </div>
      <div className="text-[11px] text-slate-500 dark:text-slate-400">
        {new Date(dataPoint.date).toLocaleDateString(undefined, {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })} · <span className="capitalize">{dataPoint.isPractice ? 'Practice' : 'Official'}</span>
      </div>
      <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 space-y-1">
        <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
          <span>Score:</span>
          <span className="font-medium font-mono">
            {dataPoint.score} / {dataPoint.totalMarks} ({dataPoint.percentage}%)
          </span>
        </div>
        <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
          <span>Accuracy:</span>
          <span className="font-medium font-mono text-emerald-600 dark:text-emerald-400">
            {dataPoint.accuracy}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default function ScoreTrendChart({ trend = [] }) {
  const [filterMode, setFilterMode] = useState('ALL'); // 'ALL' | 'OFFICIAL' | 'PRACTICE'

  const filteredData = useMemo(() => {
    if (filterMode === 'OFFICIAL') {
      return trend.filter((d) => !d.isPractice);
    }
    if (filterMode === 'PRACTICE') {
      return trend.filter((d) => d.isPractice);
    }
    return trend;
  }, [trend, filterMode]);

  const chartData = useMemo(() => {
    return filteredData.map((d, index) => {
      const shortDate = new Date(d.date).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric'
      });
      return {
        ...d,
        label: `${shortDate} (#${index + 1})`,
        officialScore: !d.isPractice ? d.score : null,
        practiceScore: d.isPractice ? d.score : null
      };
    });
  }, [filteredData]);

  if (!trend || trend.length === 0) {
    return (
      <div className="p-8 text-center text-xs text-slate-500 dark:text-slate-400">
        No completed test attempts recorded yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Score Progression Over Time
          </h3>
        </div>

        {/* Filter Pills */}
        <div className="inline-flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-xs">
          <button
            type="button"
            onClick={() => setFilterMode('ALL')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              filterMode === 'ALL'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            All Attempts ({trend.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('OFFICIAL')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              filterMode === 'OFFICIAL'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Official Only
          </button>
          <button
            type="button"
            onClick={() => setFilterMode('PRACTICE')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
              filterMode === 'PRACTICE'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            Practice Only
          </button>
        </div>
      </div>

      <div className="h-64 sm:h-72 w-full pt-2">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 15, left: -10, bottom: 0 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              className="stroke-slate-200 dark:stroke-slate-800"
            />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={{ className: 'stroke-slate-200 dark:stroke-slate-800' }}
              tick={{ fontSize: 11, className: 'fill-slate-500 dark:fill-slate-400' }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 11, className: 'fill-slate-500 dark:fill-slate-400' }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: '8px', fontSize: '11px' }}
              formatter={(value) => (
                <span className="text-slate-600 dark:text-slate-400 capitalize">
                  {value === 'officialScore' ? 'Official Exam' : 'Practice Exam'}
                </span>
              )}
            />
            <Line
              type="monotone"
              dataKey="officialScore"
              name="officialScore"
              stroke="#4F46E5"
              strokeWidth={2}
              dot={{ r: 3, fill: '#4F46E5' }}
              activeDot={{ r: 5, stroke: '#4F46E5', strokeWidth: 2 }}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="practiceScore"
              name="practiceScore"
              stroke="#94A3B8"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={{ r: 3, fill: '#94A3B8' }}
              activeDot={{ r: 5, stroke: '#94A3B8', strokeWidth: 2 }}
              connectNulls
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

