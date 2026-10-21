import React, { useState, useEffect, useCallback } from 'react';
import useExamStore from '../../store/useExamStore';
import MathRenderer from '../common/MathRenderer';
import { Bookmark, RotateCcw, ArrowRight, Tag, Check, X, ZoomIn } from 'lucide-react';

export default function QuestionCanvas() {
  const {
    questions,
    currentIndex,
    answers,
    setAnswer,
    clearCurrentResponse,
    markForReviewAndNext,
    saveAndNext,
    exam
  } = useExamStore();

  const [lightboxImg, setLightboxImg] = useState(null);

  const currentQ = questions[currentIndex];

  const currentAnswers = currentQ ? answers[currentQ._id] || [] : [];
  const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F'];

  // Keyboard shortcut listener (A, B, C, D)
  const handleKeyDown = useCallback(
    (e) => {
      // Don't intercept if user is typing in an input/textarea
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;

      const key = e.key.toUpperCase();
      const keyIndex = ['A', 'B', 'C', 'D'].indexOf(key);

      if (keyIndex !== -1 && currentQ?.options && keyIndex < currentQ.options.length) {
        e.preventDefault();
        if (currentQ.questionType === 'MCQ') {
          setAnswer(currentQ._id, keyIndex, 'MCQ');
        } else if (currentQ.questionType === 'MSQ') {
          setAnswer(currentQ._id, keyIndex, 'MSQ');
        }
      } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        saveAndNext();
      }
    },
    [currentQ, setAnswer, saveAndNext]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!currentQ) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-slate-400 text-xs">
        No active question selected.
      </div>
    );
  }

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

  const correctMark = currentQ.marks ?? exam?.markingScheme?.correct ?? 4;
  const incorrectMark = currentQ.negativeMarks ?? exam?.markingScheme?.incorrect ?? -1;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F8FAFC] dark:bg-[#0C0F17] overflow-y-auto transition-colors duration-200">
      {/* Sub-header: Question Number, Type tag, Marking Scheme badge */}
      <div className="border-b border-slate-200/80 dark:border-slate-800/80 px-6 py-2.5 bg-white dark:bg-[#131926] flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-slate-900 dark:text-white tabular-nums">
            Question {currentIndex + 1}
          </span>
          <span className="text-slate-300 dark:text-slate-700">·</span>
          <span className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {currentQ.questionType === 'MCQ'
              ? 'Single Choice (MCQ)'
              : currentQ.questionType === 'MSQ'
              ? 'Multiple Correct (MSQ)'
              : 'Numerical Answer (NAT)'}
          </span>
          <span className="px-2 py-0.5 rounded-sm text-[10px] font-medium font-mono bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            +{correctMark} / {incorrectMark}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          {currentQ.isEdited && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
              Edited
            </span>
          )}
          <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 text-[11px] font-medium text-slate-700 dark:text-slate-300">
            <Tag className="w-3 h-3 text-slate-400" />
            <span>{currentQ.subject || 'General'}</span>
            {currentQ.topic && <span className="text-slate-400">· {currentQ.topic}</span>}
          </span>
        </div>
      </div>

      {/* Main Question Body & Options */}
      <div className="p-6 flex-1 space-y-6 max-w-4xl w-full mx-auto">
        {/* Question Statement Card */}
        <div className="p-6 sm:p-7 rounded-lg bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none text-sm leading-relaxed text-slate-800 dark:text-slate-100 shadow-none space-y-4">
          {currentQ.questionText && <MathRenderer text={currentQ.questionText} />}

          {/* Image Container with Zoom */}
          {currentQ.imageAttachment && (
            <div className="pt-2">
              <div
                onClick={() => setLightboxImg(currentQ.imageAttachment)}
                className="group relative max-h-72 inline-block rounded-md border border-slate-200/80 dark:border-slate-800/80 bg-[#F8FAFC] dark:bg-[#0C0F17] p-2 cursor-zoom-in overflow-hidden transition-colors hover:border-slate-400"
                title="Click to zoom image"
              >
                <img
                  src={currentQ.imageAttachment}
                  alt={`Question ${currentIndex + 1} illustration`}
                  className="max-h-64 max-w-full rounded object-contain"
                />
                <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="bg-slate-950/80 text-white text-[11px] px-2.5 py-1 rounded-md flex items-center gap-1">
                    <ZoomIn className="w-3.5 h-3.5" />
                    <span>Zoom In</span>
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Options / Input Container */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              {currentQ.questionType === 'NAT' ? 'Numerical Response' : 'Select Option'}
            </h3>
            {['MCQ', 'MSQ'].includes(currentQ.questionType) && (
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                Press [A], [B], [C], [D] on keyboard to select
              </span>
            )}
          </div>

          {/* MCQ Option Radio Cards */}
          {currentQ.questionType === 'MCQ' && (
            <div className="grid grid-cols-1 gap-2.5">
              {currentQ.options?.map((optionItem, optIdx) => {
                const isSelected = currentAnswers.includes(optIdx);
                const optText = typeof optionItem === 'object' && optionItem !== null ? optionItem.text : optionItem;
                const optImage = typeof optionItem === 'object' && optionItem !== null ? optionItem.image : '';

                return (
                  <button
                    key={optIdx}
                    type="button"
                    onClick={() => setAnswer(currentQ._id, optIdx, 'MCQ')}
                    className={`w-full text-left p-3.5 rounded-lg border flex items-start gap-3 transition-colors cursor-pointer text-sm ${
                      isSelected
                        ? 'border-indigo-600 dark:border-indigo-500 ring-2 ring-indigo-600/20 bg-white dark:bg-[#151f32] text-slate-900 dark:text-slate-100 shadow-xs'
                        : 'bg-white dark:bg-[#131926] border-slate-200/80 dark:border-slate-800/80 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-[#162030]'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-semibold shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {optionLabels[optIdx] || optIdx + 1}
                    </div>
                    <div className="flex-1 pt-0.5 text-slate-800 dark:text-slate-200 leading-relaxed space-y-2">
                      {optText && <MathRenderer text={optText} inline />}
                      {optImage && (
                        <img
                          src={optImage}
                          alt={`Option ${optionLabels[optIdx]} illustration`}
                          className="max-h-28 max-w-xs rounded-md border border-slate-200/80 dark:border-slate-800/80 object-contain bg-white"
                        />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono px-1.5 py-0.5 rounded border border-slate-200/80 dark:border-slate-800/80">
                      [{optionLabels[optIdx]}]
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* MSQ Option Tiles */}
          {currentQ.questionType === 'MSQ' && (
            <div className="grid grid-cols-1 gap-2.5">
              {currentQ.options?.map((optionItem, optIdx) => {
                const isSelected = currentAnswers.includes(optIdx);
                const optText = typeof optionItem === 'object' && optionItem !== null ? optionItem.text : optionItem;
                const optImage = typeof optionItem === 'object' && optionItem !== null ? optionItem.image : '';

                return (
                  <button
                    key={optIdx}
                    type="button"
                    onClick={() => setAnswer(currentQ._id, optIdx, 'MSQ')}
                    className={`w-full text-left p-3.5 rounded-lg border flex items-start gap-3 transition-colors cursor-pointer text-sm ${
                      isSelected
                        ? 'border-indigo-600 dark:border-indigo-500 ring-2 ring-indigo-600/20 bg-white dark:bg-[#151f32] text-slate-900 dark:text-slate-100 shadow-xs'
                        : 'bg-white dark:bg-[#131926] border-slate-200/80 dark:border-slate-800/80 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-[#162030]'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-semibold shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {isSelected ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : optionLabels[optIdx] || optIdx + 1}
                    </div>
                    <div className="flex-1 pt-0.5 text-slate-800 dark:text-slate-200 leading-relaxed space-y-2">
                      {optText && <MathRenderer text={optText} inline />}
                      {optImage && (
                        <img
                          src={optImage}
                          alt={`Option ${optionLabels[optIdx]} illustration`}
                          className="max-h-28 max-w-xs rounded-md border border-slate-200/80 dark:border-slate-800/80 object-contain bg-white"
                        />
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono px-1.5 py-0.5 rounded border border-slate-200/80 dark:border-slate-800/80">
                      [{optionLabels[optIdx]}]
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          {/* NAT Numeric Input & On-screen Keypad */}
          {currentQ.questionType === 'NAT' && (
            <div className="max-w-md space-y-4 pt-1">
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Numerical Result Value:
                </label>
                <input
                  type="text"
                  value={currentAnswers.length > 0 ? String(currentAnswers[0]) : ''}
                  onChange={handleNatInputChange}
                  placeholder="Enter numerical answer (e.g. 42.5)"
                  className="w-full px-3.5 py-2 bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none rounded-md text-sm font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-slate-900 dark:focus:border-slate-100"
                />
              </div>

              {/* Virtual Keypad */}
              <div className="p-3 bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none rounded-lg space-y-2">
                <div className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                  Virtual Keypad
                </div>
                <div className="grid grid-cols-4 gap-1.5 text-xs font-mono font-medium">
                  {['7', '8', '9', 'BACKSPACE', '4', '5', '6', 'CLEAR', '1', '2', '3', '-', '0', '.'].map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleNatKeypadPress(key)}
                      className={`p-2 rounded-md border text-center transition-colors cursor-pointer ${
                        key === 'BACKSPACE' || key === 'CLEAR'
                          ? 'bg-rose-50/60 dark:bg-rose-950/30 border-rose-200/60 dark:border-rose-900/60 text-rose-700 dark:text-rose-400 col-span-1'
                          : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#162030]'
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

      {/* Bottom Action Toolbar (Fixed / Sticky) */}
      <div className="sticky bottom-0 border-t border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-[#0C0F17]/95 backdrop-blur-sm px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-none shrink-0 z-10">
        <div className="flex items-center gap-2">
          {/* Clear Response */}
          <button
            type="button"
            onClick={clearCurrentResponse}
            className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#162030] border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Clear Response</span>
          </button>

          {/* Mark for Review & Next */}
          <button
            type="button"
            onClick={markForReviewAndNext}
            className="px-3 py-1.5 rounded-md text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60 hover:bg-amber-100/60 dark:hover:bg-amber-900/40 transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Bookmark className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Mark for Review & Next</span>
          </button>
        </div>

        {/* Save & Next (primary CTA) */}
        <button
          type="button"
          onClick={saveAndNext}
          className="px-4 py-1.5 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:text-white shadow-sm shadow-indigo-600/20 active:scale-[0.98] text-xs font-medium flex items-center gap-2 cursor-pointer shadow-sm transition-colors"
        >
          <span>Save & Next</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Lightbox Zoom Modal */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-[10000] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setLightboxImg(null)}
        >
          <div
            className="max-w-4xl w-full bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none rounded-lg p-4 space-y-3 shadow-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
              <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">High-Resolution Diagram Zoom</h3>
              <button
                type="button"
                onClick={() => setLightboxImg(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#162030]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-[75vh] flex items-center justify-center bg-[#F8FAFC] dark:bg-[#0C0F17] rounded-md overflow-hidden p-3 border border-slate-200/80 dark:border-slate-800/80">
              <img src={lightboxImg} alt="Diagram full view" className="max-h-[70vh] w-auto object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
