import React from 'react';
import { Filter } from 'lucide-react';

export default function ResponseQuestionNavigator({
  questions,
  attempt,
  filterType,
  setFilterType,
  activeQuestionIndex,
  onScrollToQuestion
}) {
  return (
    <div className="space-y-4">
      {/* Filter Card */}
      <div className="bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none rounded-lg p-4 space-y-3 shadow-none">
        <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span>Filter Questions</span>
        </span>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => setFilterType('ALL')}
            className={`p-2 rounded-md font-medium text-center border transition-colors cursor-pointer ${
              filterType === 'ALL'
                ? 'bg-indigo-600 text-white dark:bg-indigo-500 border-indigo-600 dark:border-indigo-500 shadow-xs'
                : 'bg-white dark:bg-[#131926] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:text-indigo-600 dark:hover:text-indigo-400'
            }`}
          >
            All ({questions.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('CORRECT')}
            className={`p-2 rounded-md font-medium text-center border transition-colors cursor-pointer ${
              filterType === 'CORRECT'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                : 'bg-white dark:bg-[#131926] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:text-emerald-600'
            }`}
          >
            Correct ({attempt.correct})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('INCORRECT')}
            className={`p-2 rounded-md font-medium text-center border transition-colors cursor-pointer ${
              filterType === 'INCORRECT'
                ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                : 'bg-white dark:bg-[#131926] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-rose-500 hover:text-rose-600'
            }`}
          >
            Incorrect ({attempt.incorrect})
          </button>
          <button
            type="button"
            onClick={() => setFilterType('UNANSWERED')}
            className={`p-2 rounded-md font-medium text-center border transition-colors cursor-pointer ${
              filterType === 'UNANSWERED'
                ? 'bg-slate-600 text-white dark:bg-slate-600 border-slate-600 dark:border-slate-600 shadow-xs'
                : 'bg-white dark:bg-[#131926] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Skipped ({attempt.unanswered})
          </button>
        </div>
      </div>

      {/* Question Quick Jump Grid */}
      <div className="bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-slate-800/80 rounded-lg p-4 space-y-4 shadow-none">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center justify-between">
          <span>Question Navigator</span>
          <span className="font-mono text-slate-400 dark:text-slate-500 font-normal">
            {questions.length} Questions
          </span>
        </div>

        <div className="grid grid-cols-5 gap-2.5 place-items-center">
          {questions.map((q, idx) => {
            const qNum = idx + 1;
            const isCurrent = activeQuestionIndex === qNum;
            const isMarked = q.isMarkedForReview || q.markedForReview;

            let colorClass = 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:bg-[#162030] border border-slate-200 dark:border-slate-700';
            if (q.isCorrect) {
              colorClass = 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm';
            } else if (q.isAnswered && !q.isCorrect) {
              colorClass = 'bg-rose-500 text-white hover:bg-rose-600 shadow-sm';
            } else if (isMarked) {
              colorClass = 'bg-amber-500 text-white hover:bg-amber-600 shadow-sm';
            }

            return (
              <button
                key={q.questionId || idx}
                type="button"
                onClick={() => onScrollToQuestion(qNum)}
                className={`h-9 w-9 rounded-md font-mono text-xs font-semibold relative flex items-center justify-center cursor-pointer select-none focus:outline-none hover:-translate-y-0.5 hover:shadow-sm active:translate-y-0 active:scale-95 transition-all duration-150 ease-out ${colorClass}`}
                title={`Question ${qNum}: ${q.isCorrect ? 'Correct' : q.isAnswered ? 'Incorrect' : 'Unattempted'}`}
              >
                <span>{qNum}</span>
                {isCurrent && (
                  <span
                    className={`absolute top-1 left-1/2 -translate-x-1/2 h-0.5 w-3.5 rounded-full ${
                      q.isCorrect || (q.isAnswered && !q.isCorrect) || isMarked
                        ? 'bg-white/90'
                        : 'bg-slate-500 dark:bg-slate-400'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex flex-col gap-2 text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0" />
              <span>Correct</span>
            </div>
            <span className="font-mono tabular-nums text-slate-400">{attempt.correct ?? 0}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
              <span>Incorrect</span>
            </div>
            <span className="font-mono tabular-nums text-slate-400">{attempt.incorrect ?? 0}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full border border-slate-400 bg-slate-100 dark:bg-slate-800/80 shrink-0" />
              <span>Unattempted</span>
            </div>
            <span className="font-mono tabular-nums text-slate-400">{attempt.unanswered ?? 0}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

