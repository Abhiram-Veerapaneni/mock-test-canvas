import React from 'react';
import { Maximize } from 'lucide-react';

export default function ExamFullscreenGate({ onEnterFullscreen }) {
  return (
    <div className="h-screen w-screen bg-[#F8FAFC] dark:bg-[#0C0F17] flex flex-col items-center justify-center p-6 text-center transition-colors duration-200">
      <div className="max-w-md w-full bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none rounded-lg p-7 sm:p-8 shadow-sm space-y-4">
        <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-center mx-auto">
          <Maximize className="w-6 h-6 text-slate-700 dark:text-slate-300" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-base font-semibold tracking-tight text-slate-900 dark:text-white">
            Fullscreen Required
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
            This examination must be completed in a secured fullscreen environment. Click the button below to initiate full lockdown mode.
          </p>
        </div>
        <button
          onClick={onEnterFullscreen}
          className="w-full py-2.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:text-white shadow-sm shadow-indigo-600/20 active:scale-[0.98] font-medium text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
        >
          <Maximize className="w-4 h-4" />
          <span>Enter Fullscreen Assessment</span>
        </button>
        <p className="text-[11px] text-slate-400">Your questions and answers are saved automatically.</p>
      </div>
    </div>
  );
}
