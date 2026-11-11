import React, { useMemo, useState } from 'react';
import {
  Layers,
  Tag,
  ChevronDown,
  ChevronUp,
  Filter,
  RotateCcw,
  Clock,
  TrendingDown,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

export default function SubjectTopicReviewBreakdown({
  questions = [],
  selectedSubject = 'ALL',
  onSelectSubject,
  selectedTopic = 'ALL',
  onSelectTopic,
  onScrollToQuestion
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Format seconds to readable mm:ss
  const formatSeconds = (sec) => {
    if (!sec || sec <= 0) return '0s';
    const m = Math.floor(sec / 60);
    const s = Math.round(sec % 60);
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  };

  // 1. Group by Subject with Testbook/Allen-style Diagnostic Metrics
  const { subjectStats, overallDiagnostics } = useMemo(() => {
    const map = new Map();
    let totalPositiveMarks = 0;
    let totalNegativeMarks = 0;
    let correctTimeSec = 0;
    let incorrectTimeSec = 0;
    let totalCorrectCount = 0;
    let totalIncorrectCount = 0;

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
          netMarks: 0,
          timeSpentSeconds: 0
        });
      }
      const entry = map.get(subj);
      entry.total += 1;
      const timeSpent = Number(q.timeSpentSeconds) || 0;
      entry.timeSpentSeconds += timeSpent;

      const marksAwarded = Number(q.marksAwarded) || 0;
      if (q.isAnswered) {
        entry.attempted += 1;
        if (q.isCorrect) {
          entry.correct += 1;
          entry.positiveMarks += Math.max(0, marksAwarded);
          totalPositiveMarks += Math.max(0, marksAwarded);
          correctTimeSec += timeSpent;
          totalCorrectCount += 1;
        } else {
          entry.incorrect += 1;
          const penalty = Math.abs(Math.min(0, marksAwarded));
          entry.negativeMarks += penalty;
          totalNegativeMarks += penalty;
          incorrectTimeSec += timeSpent;
          totalIncorrectCount += 1;
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
        totalNegativeMarks,
        avgTimeOnCorrect: totalCorrectCount > 0 ? Math.round(correctTimeSec / totalCorrectCount) : 0,
        avgTimeOnIncorrect: totalIncorrectCount > 0 ? Math.round(incorrectTimeSec / totalIncorrectCount) : 0
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
      // Allen/Testbook status: Mastered (100% correct), Needs Revision (any incorrect), Unexplored
      status: t.correct === t.total ? 'MASTERED' : t.incorrect > 0 ? 'NEEDS_REVISION' : 'UNEXPLORED'
    }));
  }, [questions]);

  if (!questions || questions.length === 0) return null;

  return (
    <div className="rounded-lg bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none p-5 sm:p-6 space-y-5">
      {/* Header bar aligned with ResponseScoreBanner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
        <div>
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400 block mb-0.5">
            Diagnostic Breakdown
          </span>
          <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Subject Performance & Topic Insights
          </h2>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {(selectedSubject !== 'ALL' || selectedTopic !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                onSelectSubject?.('ALL');
                onSelectTopic?.('ALL');
              }}
              className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline px-2 py-1 rounded transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Filters</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={isExpanded ? 'Collapse Analysis' : 'Expand Analysis'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="space-y-6">
          {/* 1. Testbook-style Diagnostic Insight Pill Rows */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/80 dark:divide-slate-800/80 border border-slate-200/80 dark:border-slate-800/80 rounded-lg bg-slate-50/50 dark:bg-[#162030]/50 text-center">
            <div className="p-3">
              <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 block">Gross Marks</span>
              <span className="text-lg font-semibold tracking-tight text-emerald-600 dark:text-emerald-400 font-mono mt-0.5 block">
                +{overallDiagnostics.totalPositiveMarks}
              </span>
            </div>
            <div className="p-3">
              <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 block">Negative Penalty</span>
              <span className="text-lg font-semibold tracking-tight text-rose-600 dark:text-rose-400 font-mono mt-0.5 block">
                -{overallDiagnostics.totalNegativeMarks}
              </span>
            </div>
            <div className="p-3">
              <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 block">Avg Time on Correct</span>
              <span className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100 font-mono mt-0.5 block">
                {formatSeconds(overallDiagnostics.avgTimeOnCorrect)}
              </span>
            </div>
            <div className="p-3">
              <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 block">Avg Time on Incorrect</span>
              <span className="text-lg font-semibold tracking-tight text-slate-900 dark:text-slate-100 font-mono mt-0.5 block">
                {formatSeconds(overallDiagnostics.avgTimeOnIncorrect)}
              </span>
            </div>
          </div>

          {/* 2. Subject Scorecard Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Subject-wise Scorecard (Click to filter questions)
              </span>
              <span className="text-slate-400 font-mono">
                {subjectStats.length} subject{subjectStats.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-200/80 dark:border-slate-800/80 rounded-lg">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200/80 dark:border-slate-800/80">
                  <tr>
                    <th className="py-2.5 px-3">Subject</th>
                    <th className="py-2.5 px-3 text-center">Questions</th>
                    <th className="py-2.5 px-3 text-center">Attempted</th>
                    <th className="py-2.5 px-3 text-center text-emerald-600 dark:text-emerald-400">Correct</th>
                    <th className="py-2.5 px-3 text-center text-rose-600 dark:text-rose-400">Incorrect</th>
                    <th className="py-2.5 px-3 text-center text-slate-400">Skipped</th>
                    <th className="py-2.5 px-3 text-right">Net Marks</th>
                    <th className="py-2.5 px-3 text-right">Accuracy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
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
                            ? 'bg-indigo-50/70 dark:bg-indigo-950/40 font-semibold'
                            : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/30'
                        }`}
                      >
                        <td className="py-2.5 px-3 font-sans font-medium text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          {isSelected && <Filter className="w-3 h-3 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                          <span>{s.subject}</span>
                        </td>
                        <td className="py-2.5 px-3 text-center text-slate-600 dark:text-slate-300">{s.total}</td>
                        <td className="py-2.5 px-3 text-center text-slate-600 dark:text-slate-300">{s.attempted}</td>
                        <td className="py-2.5 px-3 text-center text-emerald-600 dark:text-emerald-400 font-semibold">{s.correct}</td>
                        <td className="py-2.5 px-3 text-center text-rose-600 dark:text-rose-400 font-semibold">{s.incorrect}</td>
                        <td className="py-2.5 px-3 text-center text-slate-400">{s.unanswered}</td>
                        <td className="py-2.5 px-3 text-right font-semibold text-slate-900 dark:text-slate-100">
                          {s.netMarks >= 0 ? `+${s.netMarks}` : s.netMarks}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-slate-100">
                          {s.attempted > 0 ? `${s.accuracy}%` : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. Actionable Topic Mastery Breakdown (Allen/Testbook Inspired) */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Topic Revision Diagnostics (Click to filter & jump)
              </span>
              <span className="text-slate-400 text-[11px]">
                {topicStats.filter((t) => t.status === 'NEEDS_REVISION').length} topic(s) need revision
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {topicStats
                .filter((t) => selectedSubject === 'ALL' || t.subject === selectedSubject)
                .map((t) => {
                  const isSelected = selectedTopic === t.topic;

                  // Clear, standard badges without neon colors
                  let statusTag = (
                    <span className="text-[10px] text-slate-400">({t.correct}/{t.total})</span>
                  );
                  let borderStyle = 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300';

                  if (t.status === 'MASTERED') {
                    borderStyle = 'border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300';
                  } else if (t.status === 'NEEDS_REVISION') {
                    borderStyle = 'border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300';
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
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium transition-all cursor-pointer ${borderStyle} ${
                        isSelected ? 'ring-2 ring-indigo-500 ring-offset-1 dark:ring-offset-[#131926]' : 'hover:opacity-90'
                      }`}
                    >
                      <span>{t.topic}</span>
                      {statusTag}
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
