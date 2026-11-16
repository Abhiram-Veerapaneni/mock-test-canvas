import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  ChevronDown,
  ChevronUp,
  Filter,
  RotateCcw
} from 'lucide-react';

export default function SubjectTopicReviewBreakdown({
  questions = [],
  selectedSubject = 'ALL',
  onSelectSubject,
  selectedTopic = 'ALL',
  onSelectTopic,
  onScrollToQuestion
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  // 1. Group by Subject with Diagnostic Metrics
  const { subjectStats, overallDiagnostics } = useMemo(() => {
    const map = new Map();
    let totalPositiveMarks = 0;
    let totalNegativeMarks = 0;

    questions.forEach((q) => {
      const subj = q.subject || 'General';
      if (!map.has(subj)) {
        map.set(subj, {
          subject: subj,
          total: 0,
          attempted: 0,
          correct: 0,
          incorrect: 0,
          unanswered: 0,
          positiveMarks: 0,
          negativeMarks: 0,
          netMarks: 0
        });
      }
      const entry = map.get(subj);
      entry.total += 1;

      const marksAwarded = Number(q.marksAwarded) || 0;
      if (q.isAnswered) {
        entry.attempted += 1;
        if (q.isCorrect) {
          entry.correct += 1;
          entry.positiveMarks += Math.max(0, marksAwarded);
          totalPositiveMarks += Math.max(0, marksAwarded);
        } else {
          entry.incorrect += 1;
          const penalty = Math.abs(Math.min(0, marksAwarded));
          entry.negativeMarks += penalty;
          totalNegativeMarks += penalty;
        }
      } else {
        entry.unanswered += 1;
      }
      entry.netMarks += marksAwarded;
    });

    const stats = Array.from(map.values()).map((s) => ({
      ...s,
      accuracy: s.attempted > 0 ? Math.round((s.correct / s.attempted) * 100 * 10) / 10 : 0
    }));

    return {
      subjectStats: stats,
      overallDiagnostics: {
        totalPositiveMarks,
        totalNegativeMarks
      }
    };
  }, [questions]);

  // 2. Group by Topic (per Subject) with Mastery Status
  const topicStats = useMemo(() => {
    const map = new Map();

    questions.forEach((q) => {
      const subj = q.subject || 'General';
      const top = q.topic || 'General';
      const key = `${subj}:::${top}`;

      if (!map.has(key)) {
        map.set(key, {
          key,
          subject: subj,
          topic: top,
          total: 0,
          correct: 0,
          incorrect: 0,
          unanswered: 0,
          questionIndices: []
        });
      }
      const entry = map.get(key);
      entry.total += 1;
      entry.questionIndices.push(q.questionIndex);
      if (q.isAnswered) {
        if (q.isCorrect) entry.correct += 1;
        else entry.incorrect += 1;
      } else {
        entry.unanswered += 1;
      }
    });

    return Array.from(map.values()).map((t) => ({
      ...t,
      status: t.correct === t.total ? 'MASTERED' : t.incorrect > 0 ? 'NEEDS_REVISION' : 'UNEXPLORED'
    }));
  }, [questions]);

  if (!questions || questions.length === 0) return null;

  const isFiltered = selectedSubject !== 'ALL' || selectedTopic !== 'ALL';
  const needsRevisionCount = topicStats.filter((t) => t.status === 'NEEDS_REVISION').length;

  return (
    <div className="rounded-xl bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none overflow-hidden transition-all duration-200">
      {/* Sleek Low-Profile Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 px-4 py-2.5 sm:px-5 sm:py-3 bg-white dark:bg-[#131926]">
        {/* Left: Section Icon, Title & Live Micro-Stats */}
        <div className="flex items-center gap-2.5 flex-wrap min-w-0">
          <div className="w-6 h-6 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center shrink-0">
            <BarChart3 className="w-3.5 h-3.5" />
          </div>

          <h2 className="text-xs sm:text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Subject & Topic Diagnostics
          </h2>

          {/* Quick-Glance Summary Preview Strip */}
          <div className="hidden md:flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono pl-1">
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span>{subjectStats.length} Subject{subjectStats.length !== 1 ? 's' : ''}</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">+{overallDiagnostics.totalPositiveMarks} Gross</span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-rose-600 dark:text-rose-400 font-semibold">-{overallDiagnostics.totalNegativeMarks} Penalty</span>
          </div>

          {/* Active Filter Pill */}
          {isFiltered && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
              <Filter className="w-2.5 h-2.5" />
              <span>{selectedTopic !== 'ALL' ? selectedTopic : selectedSubject}</span>
            </span>
          )}
        </div>

        {/* Right: Actions & Expand/Collapse Toggle */}
        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          {isFiltered && (
            <button
              type="button"
              onClick={() => {
                onSelectSubject?.('ALL');
                onSelectTopic?.('ALL');
              }}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 px-2 py-1 rounded transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100/80 hover:bg-slate-200/80 dark:bg-slate-800/80 dark:hover:bg-slate-700 border border-slate-200/80 dark:border-slate-700/80 transition-all cursor-pointer shadow-2xs"
            title={isExpanded ? 'Collapse Diagnostics' : 'Expand Diagnostics'}
          >
            <span>{isExpanded ? 'Hide Details' : 'View Breakdown'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-400" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-400" />}
          </button>
        </div>
      </div>

      {/* Expanded Diagnostic Details */}
      {isExpanded && (
        <div className="border-t border-slate-100 dark:border-slate-800/80 p-4 sm:p-5 space-y-4 bg-slate-50/30 dark:bg-transparent">
          {/* 1. Compact Subject Scorecard Table */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Subject-wise Scorecard
              </span>
              <span className="text-slate-400 font-normal text-[11px]">
                (click row to filter)
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-200/80 dark:border-slate-800/80 rounded-lg bg-white dark:bg-[#131926]">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200/80 dark:border-slate-800/80">
                  <tr>
                    <th className="py-2 px-3">Subject</th>
                    <th className="py-2 px-3 text-center">Questions</th>
                    <th className="py-2 px-3 text-center">Attempted</th>
                    <th className="py-2 px-3 text-center text-emerald-600 dark:text-emerald-400">Correct</th>
                    <th className="py-2 px-3 text-center text-rose-600 dark:text-rose-400">Incorrect</th>
                    <th className="py-2 px-3 text-center text-slate-400">Skipped</th>
                    <th className="py-2 px-3 text-right text-emerald-600 dark:text-emerald-400">Gross</th>
                    <th className="py-2 px-3 text-right text-rose-600 dark:text-rose-400">Penalty</th>
                    <th className="py-2 px-3 text-right">Net Marks</th>
                    <th className="py-2 px-3 text-right">Accuracy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 font-mono text-xs">
                  {subjectStats.map((s) => {
                    const isSelected = selectedSubject === s.subject;

                    return (
                      <tr
                        key={s.subject}
                        onClick={() => {
                          const nextSubj = isSelected ? 'ALL' : s.subject;
                          onSelectSubject?.(nextSubj);
                          onSelectTopic?.('ALL');
                        }}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-indigo-50/80 dark:bg-indigo-950/40 font-semibold'
                            : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="py-2 px-3 font-sans font-medium text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          {isSelected && <Filter className="w-3 h-3 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                          <span>{s.subject}</span>
                        </td>
                        <td className="py-2 px-3 text-center text-slate-600 dark:text-slate-300">{s.total}</td>
                        <td className="py-2 px-3 text-center text-slate-600 dark:text-slate-300">{s.attempted}</td>
                        <td className="py-2 px-3 text-center text-emerald-600 dark:text-emerald-400 font-semibold">{s.correct}</td>
                        <td className="py-2 px-3 text-center text-rose-600 dark:text-rose-400 font-semibold">{s.incorrect}</td>
                        <td className="py-2 px-3 text-center text-slate-400">{s.unanswered}</td>
                        <td className="py-2 px-3 text-right text-emerald-600 dark:text-emerald-400 font-semibold">+{s.positiveMarks}</td>
                        <td className="py-2 px-3 text-right text-rose-600 dark:text-rose-400 font-semibold">-{s.negativeMarks}</td>
                        <td className="py-2 px-3 text-right font-semibold text-slate-900 dark:text-slate-100">
                          {s.netMarks >= 0 ? `+${s.netMarks}` : s.netMarks}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900 dark:text-slate-100">
                          {s.attempted > 0 ? `${s.accuracy}%` : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 2. Compact Topic Revision Diagnostics */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Topic Revision Diagnostics <span className="font-normal lowercase text-slate-400">(click to filter questions)</span>
              </span>
              <span className="text-slate-400 text-[11px]">
                {needsRevisionCount} topic{needsRevisionCount !== 1 ? 's' : ''} need revision
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {topicStats
                .filter((t) => selectedSubject === 'ALL' || t.subject === selectedSubject)
                .map((t) => {
                  const isSelected = selectedTopic === t.topic;

                  let borderStyle = 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-300';
                  if (t.status === 'MASTERED') {
                    borderStyle = 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/60 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300';
                  } else if (t.status === 'NEEDS_REVISION') {
                    borderStyle = 'border-rose-200 dark:border-rose-900/40 bg-rose-50/60 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300';
                  }

                  return (
                    <button
                      key={t.key}
                      type="button"
                      onClick={() => {
                        const nextTopic = isSelected ? 'ALL' : t.topic;
                        onSelectTopic?.(nextTopic);
                        if (t.questionIndices.length > 0) {
                          onScrollToQuestion?.(t.questionIndices[0]);
                        }
                      }}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium transition-all cursor-pointer ${borderStyle} ${
                        isSelected ? 'ring-2 ring-indigo-500 ring-offset-1 dark:ring-offset-[#131926] shadow-xs' : 'hover:opacity-90'
                      }`}
                    >
                      <span>{t.topic}</span>
                      <span className="text-[10px] opacity-75 font-mono">({t.correct}/{t.total})</span>
                    </button>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
