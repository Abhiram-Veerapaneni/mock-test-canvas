import React, { useMemo } from 'react';
import useExamStore from '../../store/useExamStore';
import useProctorStore from '../../store/useProctorStore';
import { Clock, ShieldCheck, CheckCircle2, ShieldAlert, FlaskConical } from 'lucide-react';

export default function ExamHeader({ onSubmitClick, isPractice: propIsPractice }) {
  const { exam, questions, currentIndex, timeRemainingSeconds, answers, goToQuestion } = useExamStore();
  const { violationCount, trustScore } = useProctorStore();

  const isPractice =
    propIsPractice ??
    (typeof window !== 'undefined' ? sessionStorage.getItem('active_exam_mode') === 'PRACTICE' : false) ??
    exam?.isPractice;

  const formattedTime = useMemo(() => {
    const hours = Math.floor(timeRemainingSeconds / 3600);
    const minutes = Math.floor((timeRemainingSeconds % 3600) / 60);
    const seconds = timeRemainingSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [timeRemainingSeconds]);

  const currentQuestion = questions[currentIndex];
  const activeSubject = currentQuestion?.subject || 'General';

  // Compute subjects and answered count per subject
  const subjectStats = useMemo(() => {
    if (!questions || questions.length === 0) return [];
    const map = {};
    questions.forEach((q, idx) => {
      const subj = q.subject || 'General';
      if (!map[subj]) {
        map[subj] = { name: subj, total: 0, answered: 0, firstIndex: idx };
      }
      map[subj].total += 1;
      const ans = answers[q._id];
      const hasAnswer =
        (Array.isArray(ans) && ans.length > 0) ||
        (typeof ans === 'string' && ans.trim().length > 0) ||
        typeof ans === 'number';
      if (hasAnswer) {
        map[subj].answered += 1;
      }
    });
    return Object.values(map);
  }, [questions, answers]);

  // Urgency styling: < 5m red, < 10m amber
  const isEmergency = timeRemainingSeconds < 300;
  const isWarning = timeRemainingSeconds < 600 && !isEmergency;

  return (
    <header className="w-full h-12 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800 px-4 sm:px-6 select-none transition-colors duration-200 flex items-center justify-between shrink-0 z-20">
      {/* Left: Exam title, marks & subject switcher */}
      <div className="flex items-center gap-4 min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 shrink-0">
              {exam?.category || 'CBT'}
            </span>
            <span className="text-zinc-300 dark:text-zinc-700">·</span>
            <h1 className="text-xs sm:text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight truncate max-w-[200px] sm:max-w-[260px]">
              {exam?.title || 'Mock Examination'}
            </h1>
          </div>
        </div>

        {/* Subject Switcher Tabs */}
        {subjectStats.length > 0 && (
          <div className="hidden lg:flex items-center gap-1 p-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/80">
            {subjectStats.map((subj) => {
              const isActive = subj.name === activeSubject;
              return (
                <button
                  key={subj.name}
                  type="button"
                  onClick={() => goToQuestion(subj.firstIndex)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                  }`}
                >
                  <span>{subj.name}</span>
                  <span
                    className={`text-[10px] tabular-nums font-mono ${
                      isActive
                        ? 'text-zinc-900 dark:text-zinc-300 font-semibold'
                        : 'text-zinc-400 dark:text-zinc-500'
                    }`}
                  >
                    {subj.answered}/{subj.total}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Center: Status Indicator (Zero Badges Rule: 6px Dot) */}
      <div className="hidden md:flex items-center">
        {isPractice ? (
          <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>Practice Session · Proctoring Disabled</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Proctored Session · Live Monitoring</span>
          </div>
        )}
      </div>

      {/* Right: Question Index, Countdown Timer & CBT Submit Button */}
      <div className="flex items-center gap-2.5">
        <div className="hidden sm:flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-800 px-2.5 py-1 rounded-md border border-zinc-200 dark:border-zinc-700 font-mono tabular-nums">
          <span className="font-semibold text-zinc-900 dark:text-white">Q {currentIndex + 1}</span>
          <span className="text-zinc-400">/</span>
          <span>{questions.length}</span>
        </div>

        {/* Proctoring Violations */}
        {violationCount > 0 && !isPractice && (
          <div className="flex items-center gap-1 px-2 py-1 rounded-md border bg-rose-50/60 dark:bg-rose-950/40 border-rose-200/60 dark:border-rose-900/60 text-rose-700 dark:text-rose-400 text-xs font-mono tabular-nums">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{violationCount}</span>
          </div>
        )}

        {/* Digital Countdown Timer */}
        <div
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-medium font-mono tabular-nums transition-colors shadow-none ${
            isEmergency
              ? 'bg-rose-50/60 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-400 animate-pulse'
              : isWarning
              ? 'bg-amber-50/60 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-400'
              : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200'
          }`}
          title="Remaining Examination Time"
        >
          <Clock className={`w-3.5 h-3.5 ${isEmergency ? 'text-rose-500 animate-spin' : isWarning ? 'text-amber-500' : 'text-zinc-400'}`} />
          <span>{formattedTime}</span>
        </div>

        {/* Standard CBT Submit Button */}
        <button
          type="button"
          onClick={onSubmitClick}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-medium text-xs transition-colors cursor-pointer shadow-sm"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Submit Exam</span>
        </button>
      </div>
    </header>
  );
}
