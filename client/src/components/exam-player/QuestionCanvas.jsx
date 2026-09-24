import React from 'react';
import useExamStore from '../../store/useExamStore';
import MathRenderer from '../common/MathRenderer';
import { Bookmark, RotateCcw, ArrowRight, Tag, Hash, Check } from 'lucide-react';

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
      if (updated !== '-') {
        setAnswer(currentQ._id, updated, 'NAT');
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#edf2f9] dark:bg-[#0f172a] overflow-y-auto transition-colors duration-200">
      {/* Top Question Info Bar */}
      <div className="border-b border-slate-200/90 dark:border-[#334155] px-6 py-3 bg-white dark:bg-[#1e293b] flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="font-display text-xs font-bold text-slate-900 dark:text-white tabular-nums">
            Question {currentIndex + 1}
          </span>
          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-900/60">
            {currentQ.questionType === 'MCQ'
              ? 'Single Choice (MCQ)'
              : currentQ.questionType === 'MSQ'
              ? 'Multiple Correct (MSQ)'
              : 'Numerical Answer (NAT)'}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          {currentQ.isEdited && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
              Edited
            </span>
          )}
          <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-[#151f32] px-2.5 py-1 rounded-lg border border-slate-200/80 dark:border-[#334155] text-[11px] font-medium text-slate-700 dark:text-slate-300">
            <Tag className="w-3 h-3 text-slate-400" />
            <span>{currentQ.subject}</span>
            {currentQ.topic && <span className="text-slate-400">• {currentQ.topic}</span>}
          </span>
        </div>
      </div>

      {/* Main Question Statement */}
      <div className="p-6 flex-1 space-y-6 max-w-4xl w-full mx-auto">
        <div className="p-6 sm:p-7 rounded-2xl bg-white dark:bg-[#1e293b] border border-slate-200/90 dark:border-[#334155] text-slate-900 dark:text-slate-100 text-sm sm:text-base leading-relaxed elevation-card space-y-4">
          {currentQ.questionText && <MathRenderer text={currentQ.questionText} />}
          {currentQ.imageAttachment && (
            <div className="pt-2">
              <img
                src={currentQ.imageAttachment}
                alt={`Question ${currentIndex + 1} illustration`}
                className="max-h-72 max-w-full rounded-xl border border-slate-200 dark:border-[#334155] object-contain bg-white/5"
              />
            </div>
          )}
        </div>

        {/* Options / Input Container */}
        <div className="space-y-3">
          <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1">
            {currentQ.questionType === 'NAT' ? 'Numerical Response' : 'Select Option'}
          </h3>

          {/* MCQ Option Tiles */}
          {currentQ.questionType === 'MCQ' && (
            <div className="grid grid-cols-1 gap-3">
              {currentQ.options?.map((optionItem, optIdx) => {
                const isSelected = currentAnswers.includes(optIdx);
                const optText = typeof optionItem === 'object' && optionItem !== null ? optionItem.text : optionItem;
                const optImage = typeof optionItem === 'object' && optionItem !== null ? optionItem.image : '';

                return (
                  <button
                    key={optIdx}
                    type="button"
                    onClick={() => setAnswer(currentQ._id, optIdx, 'MCQ')}
                    className={`w-full text-left p-4 rounded-xl border flex items-start gap-3.5 transition-all duration-150 cursor-pointer text-xs sm:text-sm ${
                      isSelected
                        ? 'bg-blue-500/10 dark:bg-blue-500/15 border-blue-500 text-slate-900 dark:text-white ring-1 ring-blue-500/30 shadow-xs'
                        : 'bg-white dark:bg-[#1e293b] border-slate-200/80 dark:border-[#334155] text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-500 hover:bg-slate-50/80 dark:hover:bg-[#243147]'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-transform ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-[#151f32] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-[#334155]'
                      }`}
                    >
                      {optionLabels[optIdx] || optIdx + 1}
                    </div>
                    <div className="flex-1 pt-0.5 text-slate-800 dark:text-slate-200 leading-relaxed space-y-2">
                      {optText && <MathRenderer text={optText} />}
                      {optImage && (
                        <img
                          src={optImage}
                          alt={`Option ${optionLabels[optIdx]} illustration`}
                          className="max-h-28 max-w-xs rounded-lg border border-slate-200/80 dark:border-[#334155] object-contain bg-white"
                        />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* MSQ Option Tiles */}
          {currentQ.questionType === 'MSQ' && (
            <div className="grid grid-cols-1 gap-3">
              {currentQ.options?.map((optionItem, optIdx) => {
                const isSelected = currentAnswers.includes(optIdx);
                const optText = typeof optionItem === 'object' && optionItem !== null ? optionItem.text : optionItem;
                const optImage = typeof optionItem === 'object' && optionItem !== null ? optionItem.image : '';

                return (
                  <button
                    key={optIdx}
                    type="button"
                    onClick={() => setAnswer(currentQ._id, optIdx, 'MSQ')}
                    className={`w-full text-left p-4 rounded-xl border flex items-start gap-3.5 transition-all duration-150 cursor-pointer text-xs sm:text-sm ${
                      isSelected
                        ? 'bg-blue-500/10 dark:bg-blue-500/15 border-blue-500 text-slate-900 dark:text-white ring-1 ring-blue-500/30 shadow-xs'
                        : 'bg-white dark:bg-[#1e293b] border-slate-200/80 dark:border-[#334155] text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-500 hover:bg-slate-50/80 dark:hover:bg-[#243147]'
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 transition-transform ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-[#151f32] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-[#334155]'
                      }`}
                    >
                      {isSelected ? <Check className="w-4 h-4" /> : optionLabels[optIdx] || optIdx + 1}
                    </div>
                    <div className="flex-1 pt-0.5 text-slate-800 dark:text-slate-200 leading-relaxed space-y-2">
                      {optText && <MathRenderer text={optText} />}
                      {optImage && (
                        <img
                          src={optImage}
                          alt={`Option ${optionLabels[optIdx]} illustration`}
                          className="max-h-28 max-w-xs rounded-lg border border-slate-200/80 dark:border-[#334155] object-contain bg-white"
                        />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* NAT Numeric Input & On-screen Keypad */}
          {currentQ.questionType === 'NAT' && (
            <div className="max-w-md space-y-4 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Numerical Result Value:
                </label>
                <input
                  type="number"
                  step="any"
                  value={currentAnswers.length > 0 ? currentAnswers[0] : ''}
                  onChange={handleNatInputChange}
                  placeholder="Enter numerical decimal/integer answer..."
                  className="input-base text-sm font-mono"
                />
              </div>

              {/* On-Screen Keypad */}
              <div className="card-base p-4">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                  Numeric Keypad
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {['7', '8', '9', 'BACKSPACE', '4', '5', '6', 'CLEAR', '1', '2', '3', '-', '0', '.', '+/-', 'ENTER'].map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleNatKeypadPress(key)}
                      className={`p-2.5 rounded-lg font-mono text-xs font-semibold transition-all cursor-pointer ${
                        key === 'CLEAR'
                          ? 'bg-rose-500/10 text-rose-600 border border-rose-500/20 dark:text-rose-400 hover:bg-rose-500/20'
                          : key === 'BACKSPACE'
                          ? 'bg-slate-100 text-slate-700 border border-slate-200/80 dark:bg-[#151f32] dark:text-slate-300 dark:border-[#334155] hover:bg-slate-200 dark:hover:bg-[#243147]'
                          : key === 'ENTER'
                          ? 'btn-primary'
                          : 'bg-slate-50 dark:bg-[#151f32] text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-[#334155] hover:bg-slate-100 dark:hover:bg-[#243147]'
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

      {/* Sticky Actions Bottom Toolbar */}
      <div className="sticky bottom-0 border-t border-slate-200/80 dark:border-[#334155] bg-white/95 dark:bg-[#1e293b]/95 backdrop-blur-md px-6 py-3 flex flex-wrap items-center justify-between gap-3 shadow-xs shrink-0">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={clearCurrentResponse}
            className="btn-secondary text-xs py-2 px-3.5 flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Clear</span>
          </button>

          <button
            type="button"
            onClick={markForReviewAndNext}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-violet-700 dark:text-violet-300 bg-violet-500/10 hover:bg-violet-500/15 border border-violet-500/20 transition-all cursor-pointer"
          >
            <Bookmark className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
            <span>Mark for Review & Next</span>
          </button>
        </div>

        <button
          type="button"
          onClick={saveAndNext}
          className="btn-primary text-xs py-2 px-5 flex items-center gap-2"
        >
          <span>Save & Next</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
