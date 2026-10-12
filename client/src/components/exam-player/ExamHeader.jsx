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
    <header className="w-full h-14 bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 select-none transition-colors duration-200 flex items-center justify-between shrink-0 z-20">
      {/* Left: Exam title, marks & subject switcher */}
      <div className="flex items-center gap-4 min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200/60 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-900/60 shrink-0">
              {exam?.category || 'CBT'}
            </span>
            <h1 className="font-display text-xs sm:text-sm font-bold text-slate-900 dark:text-white tracking-tight truncate max-w-[200px] sm:max-w-[260px]">
              {exam?.title || 'Mock Examination'}
            </h1>
          </div>
        </div>

        {/* Subject Switcher Tabs */}
        {subjectStats.length > 0 && (
          <div className="hidden lg:flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#1f2937] border border-slate-200 dark:border-slate-800">
            {subjectStats.map((subj) => {
              const isActive = subj.name === activeSubject;
              return (
                <button
                  key={subj.name}
                  type="button"
                  onClick={() => goToQuestion(subj.firstIndex)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white dark:bg-[#111827] text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <span>{subj.name}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold tabular-nums ${
                      isActive
                        ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
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

      {/* Center: Subtle Mode Chip */}
      <div className="hidden md:flex items-center">
        {isPractice ? (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20">
            <FlaskConical className="w-3.5 h-3.5 text-indigo-500" />
            <span>Practice Mode • Proctoring Off</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span>Proctored Session • Live Monitoring Active</span>
          </div>
        )}
      </div>

      {/* Right: Question Index, Countdown Timer & CBT Submit Button */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-[#1f2937] px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 tabular-nums">
          <span className="font-bold text-slate-900 dark:text-white">Q {currentIndex + 1}</span>
          <span className="text-slate-400">/</span>
          <span>{questions.length}</span>
        </div>

        {/* Proctoring Violations */}
        {violationCount > 0 && !isPractice && (
          <div className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs font-bold tabular-nums">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>{violationCount}</span>
          </div>
        )}

        {/* Digital Countdown Timer with Urgency Styling */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold font-mono tracking-wider tabular-nums transition-colors shadow-2xs ${
            isEmergency
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-600 dark:text-rose-400 animate-pulse'
              : isWarning
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-600 dark:text-amber-400'
              : 'bg-slate-100 dark:bg-[#1f2937] border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100'
          }`}
          title="Remaining Examination Time"
        >
          <Clock className={`w-3.5 h-3.5 ${isEmergency ? 'text-rose-500 animate-spin' : isWarning ? 'text-amber-500' : 'text-slate-400'}`} />
          <span>{formattedTime}</span>
        </div>

        {/* Standard CBT Submit Button (bg-slate-900 dark:bg-white text-white dark:text-black) */}
        <button
          type="button"
          onClick={onSubmitClick}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-black font-semibold text-xs transition-all cursor-pointer shadow-xs hover:opacity-90 active:scale-95"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Submit Exam</span>
        </button>
      </div>
    </header>
  );
}
