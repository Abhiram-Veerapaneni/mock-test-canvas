import React from 'react';
import { Trophy } from 'lucide-react';
import { formatDateTime12h } from '../../utils/dateUtils';

const formatSeconds = (sec) => {
  if (!sec || sec <= 0) return '—';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
};

const getAccuracyColor = (acc) => {
  if (acc >= 80) return 'text-emerald-600 dark:text-emerald-400';
  if (acc >= 50) return 'text-amber-600 dark:text-amber-400';
  return 'text-rose-600 dark:text-rose-400';
};

export default function ExamAttemptsTab({
  attempts = [],
  exam,
  examId,
  isCreator,
  bestAttempt,
  canViewResponses,
  isReviewLockedBySchedule,
  navigate
}) {
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return formatDateTime12h(dateStr, { includeYear: true });
  };

  return (
    <div className="space-y-6">
      {bestAttempt && (
        <div className="bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none rounded-lg p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Trophy className="w-3.5 h-3.5 text-amber-500" />
              <span className="font-medium text-[11px] uppercase tracking-wider">
                Personal Best
              </span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                {bestAttempt.score}
              </span>
              <span className="text-xs text-slate-400">
                / {exam.totalMarks || (exam.questions?.length || 0) * 4} pts
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 divide-x divide-slate-200/80 dark:divide-slate-800/80 text-center min-w-[240px]">
            <div className="px-3">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                Accuracy
              </span>
              <span className="text-sm font-semibold tabular-nums text-slate-900 dark:text-slate-100 mt-0.5 block">
                {bestAttempt.accuracy}%
              </span>
            </div>
            <div className="px-3">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                Correct
              </span>
              <span className="text-sm font-semibold tabular-nums text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                {bestAttempt.correct ?? '—'}
              </span>
            </div>
            <div className="px-3">
              <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                Incorrect
              </span>
              <span className="text-sm font-semibold tabular-nums text-rose-600 dark:text-rose-400 mt-0.5 block">
                {bestAttempt.incorrect ?? '—'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Submissions Table */}
      <div className="border border-slate-200/80 dark:border-slate-800/80 rounded-lg overflow-hidden bg-white dark:bg-[#131926]">
        <div className="px-5 py-3.5 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Attempt History ({attempts.length})
          </h3>
        </div>

        {attempts.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            {isCreator
              ? 'No attempts recorded for this exam yet.'
              : 'No attempts logged yet. Begin this assessment to record your verified test results.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/75 dark:bg-[#131926]/75 text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  <th className="py-2.5 px-4">Attempt</th>
                  <th className="py-2.5 px-4">Mode</th>
                  <th className="py-2.5 px-4">
                    {isCreator ? 'Date' : 'Submission Date'}
                  </th>
                  <th className="py-2.5 px-4 text-center">Time Taken</th>
                  <th className="py-2.5 px-4 text-center">Answered</th>
                  <th className="py-2.5 px-4 text-right">Score</th>
                  <th className="py-2.5 px-4 text-right">Accuracy</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {attempts.map((attempt, idx) => (
                  <tr
                    key={attempt._id || idx}
                    className="hover:bg-slate-50/50 dark:hover:bg-[#162030]/40 transition-colors"
                  >
                    <td className="py-2.5 px-4 font-mono tabular-nums text-slate-900 dark:text-slate-100">
                      #{attempts.length - idx}
                    </td>
                    <td className="py-2.5 px-4">
                      {attempt.isPractice ? (
                        <span className="text-slate-500">Practice</span>
                      ) : (
                        <span className="text-slate-900 dark:text-slate-100 font-medium">
                          Official
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-4 text-slate-500">
                      {formatDate(attempt.submittedAt || attempt.createdAt)}
                    </td>
                    <td className="py-2.5 px-4 text-center font-mono text-slate-500">
                      {formatSeconds(attempt.timeTakenSeconds)}
                    </td>
                    <td className="py-2.5 px-4 text-center font-mono tabular-nums text-slate-700 dark:text-slate-300">
                      {(attempt.correct || 0) + (attempt.incorrect || 0)}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                      {attempt.score}{' '}
                      {!isCreator && exam.totalMarks ? `/ ${exam.totalMarks} pts` : 'pts'}
                    </td>
                    <td
                      className={`py-2.5 px-4 text-right font-mono font-semibold tabular-nums ${getAccuracyColor(
                        attempt.accuracy
                      )}`}
                    >
                      {attempt.accuracy}%
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      {isCreator ? (
                        <button
                          type="button"
                          onClick={() =>
                            navigate(`/test/${examId}/review/${attempt._id}`)
                          }
                          className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-medium cursor-pointer"
                        >
                          Responses
                        </button>
                      ) : canViewResponses ? (
                        <button
                          onClick={() =>
                            navigate(`/test/${exam._id}/review/${attempt._id}`)
                          }
                          className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 text-xs font-medium cursor-pointer"
                        >
                          View Answers
                        </button>
                      ) : isReviewLockedBySchedule ? (
                        <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                          Locked
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">Disabled</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
