import React from 'react';
import { Layers } from 'lucide-react';

export default function StreamAccuracyChart({ streamAccuracy = [] }) {
  if (!streamAccuracy || streamAccuracy.length === 0) {
    return (
      <div className="p-6 text-center text-xs text-slate-500 dark:text-slate-400">
        No stream or subject data available yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
            Subject & Stream Mastery
          </h3>
        </div>
        <span className="text-[11px] text-slate-500 dark:text-slate-400">
          Accuracy %
        </span>
      </div>

      <div className="space-y-3.5">
        {streamAccuracy.map((item) => {
          const acc = item.accuracy || 0;
          let barColor = 'bg-indigo-600 dark:bg-indigo-500';
          if (acc >= 75) barColor = 'bg-emerald-600 dark:bg-emerald-500';
          else if (acc < 50) barColor = 'bg-rose-500 dark:bg-rose-500';

          return (
            <div key={item.stream} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {item.stream}
                </span>
                <div className="flex items-center gap-2 font-mono text-slate-600 dark:text-slate-400">
                  <span>
                    {item.totalCorrect} / {item.totalAnswered} correct
                  </span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {acc}%
                  </span>
                </div>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                  style={{ width: `${Math.min(acc, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

