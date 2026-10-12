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
    <div className="flex-1 flex flex-col h-full bg-zinc-50 dark:bg-zinc-950 overflow-y-auto transition-colors duration-200">
      {/* Sub-header: Question Number, Type tag, Marking Scheme badge */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 px-6 py-2.5 bg-white dark:bg-zinc-900 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-zinc-900 dark:text-white tabular-nums">
            Question {currentIndex + 1}
          </span>
          <span className="text-zinc-300 dark:text-zinc-700">·</span>
          <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            {currentQ.questionType === 'MCQ'
              ? 'Single Choice (MCQ)'
              : currentQ.questionType === 'MSQ'
              ? 'Multiple Correct (MSQ)'
              : 'Numerical Answer (NAT)'}
          </span>
          <span className="px-2 py-0.5 rounded-sm text-[10px] font-medium font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
            +{correctMark} / {incorrectMark}
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          {currentQ.isEdited && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-medium uppercase tracking-wider bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
              Edited
            </span>
          )}
          <span className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-md border border-zinc-200 dark:border-zinc-700 text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
            <Tag className="w-3 h-3 text-zinc-400" />
            <span>{currentQ.subject || 'General'}</span>
            {currentQ.topic && <span className="text-zinc-400">· {currentQ.topic}</span>}
          </span>
        </div>
      </div>

      {/* Main Question Body & Options */}
      <div className="p-6 flex-1 space-y-6 max-w-4xl w-full mx-auto">
        {/* Question Statement Card */}
        <div className="p-6 sm:p-7 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-sm leading-relaxed text-zinc-800 dark:text-zinc-100 shadow-none space-y-4">
          {currentQ.questionText && <MathRenderer text={currentQ.questionText} />}

          {/* Image Container with Zoom */}
          {currentQ.imageAttachment && (
            <div className="pt-2">
              <div
                onClick={() => setLightboxImg(currentQ.imageAttachment)}
                className="group relative max-h-72 inline-block rounded-md border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 p-2 cursor-zoom-in overflow-hidden transition-colors hover:border-zinc-400"
                title="Click to zoom image"
              >
                <img
                  src={currentQ.imageAttachment}
                  alt={`Question ${currentIndex + 1} illustration`}
                  className="max-h-64 max-w-full rounded object-contain"
                />
                <div className="absolute inset-0 bg-zinc-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="bg-zinc-900/90 text-white text-[11px] px-2.5 py-1 rounded-md flex items-center gap-1">
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
            <h3 className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
              {currentQ.questionType === 'NAT' ? 'Numerical Response' : 'Select Option'}
            </h3>
            {['MCQ', 'MSQ'].includes(currentQ.questionType) && (
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
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
                        ? 'border-zinc-900 dark:border-zinc-100 ring-1 ring-zinc-900 dark:ring-zinc-100 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-white shadow-none'
                        : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50/60 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-mono font-medium shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700'
                      }`}
                    >
                      {optionLabels[optIdx] || optIdx + 1}
                    </div>
                    <div className="flex-1 pt-0.5 text-zinc-800 dark:text-zinc-200 leading-relaxed space-y-2">
                      {optText && <MathRenderer text={optText} />}
                      {optImage && (
                        <img
                          src={optImage}
                          alt={`Option ${optionLabels[optIdx]} illustration`}
                          className="max-h-28 max-w-xs rounded-md border border-zinc-200 dark:border-zinc-800 object-contain bg-white"
                        />
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-400 font-mono px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-800">
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
                        ? 'border-zinc-900 dark:border-zinc-100 ring-1 ring-zinc-900 dark:ring-zinc-100 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-900 dark:text-white shadow-none'
                        : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50/60 dark:hover:bg-zinc-800/50'
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-md flex items-center justify-center text-xs font-mono font-medium shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700'
                      }`}
                    >
                      {isSelected ? <Check className="w-3.5 h-3.5" /> : optionLabels[optIdx] || optIdx + 1}
                    </div>
                    <div className="flex-1 pt-0.5 text-zinc-800 dark:text-zinc-200 leading-relaxed space-y-2">
                      {optText && <MathRenderer text={optText} />}
                      {optImage && (
                        <img
                          src={optImage}
                          alt={`Option ${optionLabels[optIdx]} illustration`}
                          className="max-h-28 max-w-xs rounded-md border border-zinc-200 dark:border-zinc-800 object-contain bg-white"
                        />
                      )}
                    </div>
                    <span className="text-[10px] text-zinc-400 font-mono px-1.5 py-0.5 rounded border border-zinc-200 dark:border-zinc-800">
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
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
                  Numerical Result Value:
                </label>
                <input
                  type="text"
                  value={currentAnswers.length > 0 ? String(currentAnswers[0]) : ''}
                  onChange={handleNatInputChange}
                  placeholder="Enter numerical answer (e.g. 42.5)"
                  className="w-full px-3.5 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-md text-sm font-mono text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:border-zinc-900 dark:focus:border-zinc-100"
                />
              </div>

              {/* Virtual Keypad */}
              <div className="p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg space-y-2">
                <div className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
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
                          : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700'
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
      <div className="sticky bottom-0 border-t border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 shadow-none shrink-0 z-10">
        <div className="flex items-center gap-2">
          {/* Clear Response */}
          <button
            type="button"
            onClick={clearCurrentResponse}
            className="px-3 py-1.5 rounded-md text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
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
          className="px-4 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-xs font-medium flex items-center gap-2 cursor-pointer shadow-sm transition-colors"
        >
          <span>Save & Next</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Lightbox Zoom Modal */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-[10000] bg-zinc-950/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
          onClick={() => setLightboxImg(null)}
        >
          <div
            className="max-w-4xl w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 space-y-3 shadow-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <h3 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">High-Resolution Diagram Zoom</h3>
              <button
                type="button"
                onClick={() => setLightboxImg(null)}
                className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="max-h-[75vh] flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 rounded-md overflow-hidden p-3 border border-zinc-200 dark:border-zinc-800">
              <img src={lightboxImg} alt="Diagram full view" className="max-h-[70vh] w-auto object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
