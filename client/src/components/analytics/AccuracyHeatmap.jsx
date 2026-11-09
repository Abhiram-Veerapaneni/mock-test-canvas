import React from 'react';
import { Tag, Calendar, Flame } from 'lucide-react';

export default function AccuracyHeatmap({ tagAccuracy = [], activeDays = [], streak = 0 }) {
  // Generate last 14 days grid to display active revision streak
  const last14Days = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const str = d.toISOString().split('T')[0];
    const isToday = i === 13;
    const isActive = activeDays.includes(str);
    const dayLabel = d.toLocaleDateString(undefined, { weekday: 'narrow' });
    const dateNum = d.getDate();
    return { str, isToday, isActive, dayLabel, dateNum };
  });

  return (
    <div className="space-y-6">
      {/* Activity & Consecutive Streak Mini-Calendar */}
      <div className="bg-slate-50/50 dark:bg-slate-800/20 border border-slate-200/80 dark:border-slate-800/80 rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-600 dark:text-amber-500" />
            <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
              Study Activity & Consecutive Streak
            </h4>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/40 text-[11px] font-medium text-amber-800 dark:text-amber-300">
            <span>🔥 {streak} Day Streak</span>
          </div>
        </div>

        {/* 14-day mini squares */}
        <div className="grid grid-cols-7 sm:grid-cols-14 gap-1.5 pt-1">
          {last14Days.map((day) => (
            <div
              key={day.str}
              className={`flex flex-col items-center justify-center p-1.5 rounded-md text-[10px] border transition-colors ${
                day.isActive
                  ? 'bg-indigo-50 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 font-semibold'
                  : 'bg-white dark:bg-[#131926] border-slate-200/70 dark:border-slate-800/70 text-slate-400'
              } ${day.isToday ? 'ring-1 ring-slate-400 dark:ring-slate-600' : ''}`}
              title={`${day.str} — ${day.isActive ? 'Active Test Attempt' : 'No tests recorded'}`}
            >
              <span className="text-[9px] uppercase tracking-wider">{day.dayLabel}</span>
              <span className="font-mono mt-0.5">{day.dateNum}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Topic Tag Matrix */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
              Topic Breakdown & Accuracy Matrix
            </h4>
          </div>
          <span className="text-[11px] text-slate-400">
            {tagAccuracy.length} Topics evaluated
          </span>
        </div>

        {(!tagAccuracy || tagAccuracy.length === 0) ? (
          <div className="p-4 text-center text-xs text-slate-400">
            No tagged question attempts available yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {tagAccuracy.map((t) => {
              const acc = t.accuracy || 0;
              let badgeColor = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';
              if (acc >= 75) {
                badgeColor = 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-900/40';
              } else if (acc < 50) {
                badgeColor = 'bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 border-rose-200/80 dark:border-rose-900/40';
              } else {
                badgeColor = 'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border-amber-200/80 dark:border-amber-900/40';
              }

              return (
                <div
                  key={`${t.stream}-${t.tag}`}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#131926] text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-medium text-slate-800 dark:text-slate-200 truncate">
                      {t.tag}
                    </div>
                    <div className="text-[10px] text-slate-400 truncate">
                      {t.stream} · {t.totalCorrect}/{t.totalAnswered}
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium border shrink-0 ${badgeColor}`}
                  >
                    {acc}%
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

