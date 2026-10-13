import React from 'react';
import { Play, X, AlertCircle, FlaskConical, ShieldCheck } from 'lucide-react';

export default function ExamPreviewModal({
  isOpen,
  onClose,
  exam,
  examId,
  navigate,
  onStartExam
}) {
  if (!isOpen) return null;

  const hasNoQuestions =
    exam?.questionCount === 0 ||
    !exam?.questions ||
    exam.questions.length === 0;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="max-w-lg w-full bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-5 sm:p-6 space-y-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
              <Play className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Preview Test Run Simulation
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Test candidate experience, question flow, and scoring before publishing.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#162030] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {hasNoQuestions ? (
          <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-300 space-y-2">
            <div className="flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>No questions in this examination paper yet</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-400">
              Add questions in the Authoring Studio before previewing.
            </p>
            <button
              onClick={() => {
                onClose();
                navigate(`/create-test?examId=${examId}`);
              }}
              className="btn-primary text-xs py-1.5 px-3"
            >
              Open Authoring Studio
            </button>
          </div>
        ) : (
          <div className="space-y-3 pt-1">
            {/* Mode 1: Quick Unproctored Preview */}
            <div className="p-3.5 rounded-lg border border-indigo-200/80 dark:border-indigo-900/60 bg-indigo-50/40 dark:bg-indigo-950/20 hover:border-indigo-300 dark:hover:border-indigo-800 transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                      Quick Test Run (Practice Mode)
                    </span>
                    <span className="text-[10px] font-medium uppercase px-1.5 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300">
                      Recommended
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Test questions, math renderer, timer, answer palette, and instant grading. No webcam, mic, or browser lockdown required.
                  </p>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    onStartExam(true, true);
                  }}
                  className="btn-primary text-xs py-2 px-3.5 shrink-0 whitespace-nowrap cursor-pointer flex items-center gap-1.5"
                >
                  <FlaskConical className="w-3.5 h-3.5" />
                  <span>Quick Preview</span>
                </button>
              </div>
            </div>

            {/* Mode 2: Full Proctored Simulation */}
            <div className="p-3.5 rounded-lg border border-slate-200/80 dark:border-slate-800/80 bg-slate-50 dark:bg-[#162030]/60 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    Full Proctored Simulation
                  </span>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    Test the full candidate security flow, including hardware verification gate, camera monitor, face detection, and browser lockdown.
                  </p>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    onStartExam(false, true);
                  }}
                  className="btn-secondary text-xs py-2 px-3.5 shrink-0 whitespace-nowrap cursor-pointer flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Proctored Run</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800/80">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary text-xs py-1.5 px-3"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
