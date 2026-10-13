import React from 'react';
import { Plus, Trash2, Image as ImageIcon, Loader2, X } from 'lucide-react';

export default function BankQuestionOptionsEditor({
  questionType,
  options = [],
  correctAnswers = [],
  onToggleCorrectAnswer,
  onOptionTextChange,
  onAddOption,
  onRemoveOption,
  onOptionImageUpload,
  onOptionImageChange,
  uploadingOptIndex,
  optionFileRefs,
  natMin,
  onNatMinChange,
  natMax,
  onNatMaxChange
}) {
  if (questionType === 'NAT') {
    return (
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#162030] border border-slate-200 dark:border-slate-800/80 space-y-3">
        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
          Accepted Numerical Value or Range
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <span className="text-[11px] text-slate-500 block mb-1">Exact Value / Min Range:</span>
            <input
              type="number"
              step="any"
              value={natMin}
              onChange={(e) => onNatMinChange(e.target.value)}
              placeholder="e.g. 42 or 3.14"
              className="w-full px-3 py-1.5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 font-mono"
            />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 block mb-1">Max Range (Optional):</span>
            <input
              type="number"
              step="any"
              value={natMax}
              onChange={(e) => onNatMaxChange(e.target.value)}
              placeholder="Leave blank for exact"
              className="w-full px-3 py-1.5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 font-mono"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
          Options ({questionType === 'MCQ' ? 'Select 1 correct' : 'Select all correct'})
        </label>
        {options.length < 6 && (
          <button
            type="button"
            onClick={onAddOption}
            className="text-xs text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Option
          </button>
        )}
      </div>

      <div className="space-y-2">
        {options.map((opt, idx) => {
          const isCorrect = correctAnswers.includes(idx);
          const letter = String.fromCharCode(65 + idx);
          const isUploadingThisOpt = uploadingOptIndex === idx;

          return (
            <div
              key={idx}
              className={`p-2.5 rounded-lg border transition-colors space-y-2 ${
                isCorrect
                  ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                  : 'bg-white dark:bg-[#162030] border-slate-200 dark:border-slate-700'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {/* Checkbox / Radio */}
                <button
                  type="button"
                  onClick={() => onToggleCorrectAnswer(idx)}
                  className={`w-6 h-6 rounded flex items-center justify-center font-mono text-xs font-semibold shrink-0 cursor-pointer transition-colors ${
                    isCorrect
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                  title={isCorrect ? 'Marked Correct' : 'Click to mark correct'}
                >
                  {isCorrect ? '✓' : letter}
                </button>

                <div className="flex-1 space-y-1">
                  <input
                    type="text"
                    value={opt.text}
                    onChange={(e) => onOptionTextChange(idx, e.target.value)}
                    placeholder={`Option ${letter} text (LaTeX supported: $x^2$)`}
                    className="w-full px-2.5 py-1 text-xs bg-transparent border-b border-slate-200 dark:border-slate-700 focus:outline-none focus:border-slate-400 text-slate-900 dark:text-slate-100"
                  />
                </div>

                {/* Option Image Trigger */}
                <input
                  ref={(el) => {
                    if (optionFileRefs?.current) {
                      optionFileRefs.current[idx] = el;
                    }
                  }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      onOptionImageUpload(e.target.files[0], idx);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => optionFileRefs?.current?.[idx]?.click()}
                  disabled={isUploadingThisOpt}
                  className="p-1 rounded bg-slate-100 dark:bg-slate-800/80 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer shrink-0"
                  title="Attach option picture"
                >
                  {isUploadingThisOpt ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ImageIcon className="w-3.5 h-3.5" />
                  )}
                </button>

                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => onRemoveOption(idx)}
                    className="p-1 text-slate-400 hover:text-rose-500 rounded cursor-pointer shrink-0"
                    title="Remove option"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Option Image Preview if attached */}
              {opt.image && (
                <div className="ml-8 flex items-center justify-between p-1.5 rounded bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={opt.image}
                      alt={`Option ${letter}`}
                      className="w-8 h-8 object-contain rounded border border-slate-200 dark:border-slate-700 bg-white"
                    />
                    <span className="text-[10px] text-slate-400 truncate font-mono">
                      {opt.image}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOptionImageChange(idx, '')}
                    className="p-1 text-slate-400 hover:text-rose-500 rounded cursor-pointer"
                    title="Remove option picture"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
