import React from 'react';
import useExamStore from '../../store/useExamStore';
import MathRenderer from '../common/MathRenderer';
import { Bookmark, RotateCcw, ArrowRight, Tag } from 'lucide-react';

export default function QuestionCanvas() {
  const {
    questions,
    currentIndex,
    answers,
    setAnswer,
    clearCurrentResponse,
    markForReviewAndNext,
    saveAndNext
  } = useExamStore();

  const currentQ = questions[currentIndex];

  if (!currentQ) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-slate-400 text-xs">
        No active question selected.
      </div>
    );
  }

  const currentAnswers = answers[currentQ._id] || [];
  const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F'];

  const handleNatInputChange = (e) => {
    setAnswer(currentQ._id, e.target.value, 'NAT');
  };

  const handleNatKeypadPress = (char) => {
    const currentStr = currentAnswers.length > 0 ? String(currentAnswers[0]) : '';
    if (char === 'BACKSPACE') {
      const updated = currentStr.slice(0, -1);
      // Edge case fix: if backspace leaves only "-", clear entirely
      if (updated === '-') {
        clearCurrentResponse();
      } else {
        setAnswer(currentQ._id, updated, 'NAT');
      }
    } else if (char === 'CLEAR') {
      clearCurrentResponse();
    } else {
      if (char === '.' && currentStr.includes('.')) return;
      if (char === '-' && currentStr.length > 0) return;
      const updated = currentStr + char;
      // Don't save a bare "-" — it's not a valid number yet
      if (updated !== '-') {
        setAnswer(currentQ._id, updated, 'NAT');
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50 dark:bg-slate-950 overflow-y-auto">
      {/* Top Question Info Bar */}
      <div className="border-b border-slate-200 dark:border-slate-800 px-6 py-2.5 bg-white dark:bg-slate-900 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-900 dark:text-white">
            Question {currentIndex + 1}
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-900/60">
            {currentQ.questionType === 'MCQ'
              ? 'Single Choice (MCQ)'
              : currentQ.questionType === 'MSQ'
              ? 'Multiple Correct (MSQ)'
              : 'Numerical Answer (NAT)'}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 text-[11px]">
            <Tag className="w-3 h-3 text-slate-400" />
            {currentQ.subject}
            {currentQ.topic && ` • ${currentQ.topic}`}
          </span>
        </div>
      </div>

      {/* Main Question Statement */}
      <div className="p-6 flex-1 space-y-5">
        <div className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 text-sm leading-relaxed shadow-xs">
          <MathRenderer text={currentQ.questionText} />
        </div>

        {/* Options / Input */}
        <div className="space-y-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-0.5">
            {currentQ.questionType === 'NAT' ? 'Numerical Response' : 'Options'}
          </h3>

          {/* MCQ Option List */}
          {currentQ.questionType === 'MCQ' && (
            <div className="grid grid-cols-1 gap-2.5">
              {currentQ.options?.map((optionText, optIdx) => {
                const isSelected = currentAnswers.includes(optIdx);
                return (
                  <button
                    key={optIdx}
                    type="button"
                    onClick={() => setAnswer(currentQ._id, optIdx, 'MCQ')}
                    className={`w-full text-left p-3 rounded-lg border flex items-start gap-3 transition-colors cursor-pointer text-xs ${
                      isSelected
                        ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-600 dark:border-blue-500 text-slate-900 dark:text-white shadow-xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-semibold shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {optionLabels[optIdx] || optIdx + 1}
                    </div>
                    <div className="flex-1 pt-0.5 text-xs sm:text-sm">
                      <MathRenderer text={optionText} />
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* MSQ Option List */}
          {currentQ.questionType === 'MSQ' && (
            <div className="grid grid-cols-1 gap-2.5">
              {currentQ.options?.map((optionText, optIdx) => {
                const isSelected = currentAnswers.includes(optIdx);
                return (
                  <button
                    key={optIdx}
                    type="button"
                    onClick={() => setAnswer(currentQ._id, optIdx, 'MSQ')}
                    className={`w-full text-left p-3 rounded-lg border flex items-start gap-3 transition-colors cursor-pointer text-xs ${
                      isSelected
                        ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-600 dark:border-blue-500 text-slate-900 dark:text-white shadow-xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-semibold shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {isSelected ? '✓' : optionLabels[optIdx] || optIdx + 1}
                    </div>
                    <div className="flex-1 pt-0.5 text-xs sm:text-sm">
                      <MathRenderer text={optionText} />
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* NAT Numeric Input & On-screen Keypad */}
          {currentQ.questionType === 'NAT' && (
            <div className="max-w-sm space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Numerical Result:
                </label>
                <input
                  type="number"
                  step="any"
                  value={currentAnswers.length > 0 ? currentAnswers[0] : ''}
                  onChange={handleNatInputChange}
                  placeholder="Enter numeric value..."
                  className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-sm font-mono text-slate-900 dark:text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* On-Screen Keypad */}
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-lg">
                <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Numeric Input Keypad
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {['7', '8', '9', 'BACKSPACE', '4', '5', '6', 'CLEAR', '1', '2', '3', '-', '0', '.', '+/-', 'ENTER'].map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleNatKeypadPress(key)}
                      className={`p-2 rounded-md font-mono text-xs font-medium transition-colors ${
                        key === 'CLEAR'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-900/40 hover:bg-rose-100'
                          : key === 'BACKSPACE'
                          ? 'bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 hover:bg-slate-200'
                          : key === 'ENTER'
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      {key === 'BACKSPACE' ? '⌫' : key === 'CLEAR' ? 'C' : key}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Actions Toolbar */}
      <div className="sticky bottom-0 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={clearCurrentResponse}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Clear</span>
          </button>

          <button
            type="button"
            onClick={markForReviewAndNext}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-amber-800 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/30 border border-amber-200 dark:border-amber-900/50 transition-colors"
          >
            <Bookmark className="w-3.5 h-3.5 text-amber-600" />
            <span>Mark for Review & Next</span>
          </button>
        </div>

        <button
          type="button"
          onClick={saveAndNext}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 shadow-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-colors"
        >
          <span>Save & Next</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
