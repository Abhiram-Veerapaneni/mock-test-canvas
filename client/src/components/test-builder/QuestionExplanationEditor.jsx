import React from 'react';
import MathRenderer from '../common/MathRenderer';
import { BookOpen, ChevronDown, ChevronUp } from 'lucide-react';

export default function QuestionExplanationEditor({
  isExplanationOpen,
  setIsExplanationOpen,
  explanation,
  onExplanationChange
}) {
  return (
    <div className="border border-slate-200/80 dark:border-slate-800/80 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setIsExplanationOpen(!isExplanationOpen)}
        className="w-full px-4 py-2.5 bg-slate-50/70 dark:bg-[#162030] flex items-center justify-between text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1a2334] transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
          <span>Pedagogical Solution / Explanation (Optional)</span>
          {explanation && explanation.trim() && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
              Added
            </span>
          )}
        </div>
        {isExplanationOpen ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {isExplanationOpen && (
        <div className="p-3.5 bg-white dark:bg-[#131926] border-t border-slate-200/80 dark:border-slate-800/80 space-y-2">
          <textarea
            rows={3}
            value={explanation}
            onChange={(e) => onExplanationChange(e.target.value)}
            placeholder="Step-by-step solution shown after candidate completes assessment (LaTeX supported)..."
            className="w-full p-2.5 bg-slate-50/50 dark:bg-[#162030] border border-slate-200 dark:border-slate-700/80 rounded-lg text-xs font-mono text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          {explanation && explanation.trim() && (
            <div className="p-2.5 bg-slate-50 dark:bg-[#162030] rounded-lg border border-slate-200 dark:border-slate-700/80">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Explanation KaTeX Preview:
              </span>
              <MathRenderer text={explanation} className="text-xs text-slate-800 dark:text-slate-200" />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
