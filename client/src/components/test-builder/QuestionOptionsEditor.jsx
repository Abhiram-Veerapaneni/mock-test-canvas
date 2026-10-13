import React from 'react';
import {
  Plus,
  Trash2,
  Image as ImageIcon,
  Loader2,
  X,
  GripVertical
} from 'lucide-react';

export default function QuestionOptionsEditor({
  questionType,
  options = [],
  correctAnswers = [],
  onOptionTextChange,
  onCorrectMcqChange,
  onCorrectMsqToggle,
  onAddOption,
  onRemoveOption,
  onOptionImageUpload,
  onRemoveOptionImage,
  uploadingOptIndex,
  optionFileRefs,
  natMin,
  setNatMin,
  natMax,
  setNatMax
}) {
  if (questionType === 'NAT') {
    return (
      <div className="bg-slate-50/60 dark:bg-[#162030] p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 space-y-2">
        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
          Numeric Value Range [Min, Max]
        </label>
        <div className="grid grid-cols-2 gap-3 max-w-sm">
          <div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Minimum Value</span>
            <input
              type="number"
              step="any"
              value={natMin}
              onChange={(e) => setNatMin(e.target.value)}
              placeholder="e.g. 10.0"
              className="w-full px-3 py-1.5 bg-white dark:bg-[#131926] border border-slate-200 dark:border-slate-700/80 rounded-lg text-xs font-mono text-slate-900 dark:text-slate-100"
            />
          </div>
          <div>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">Maximum Value (Optional)</span>
            <input
              type="number"
              step="any"
              value={natMax}
              onChange={(e) => setNatMax(e.target.value)}
              placeholder="e.g. 10.5"
              className="w-full px-3 py-1.5 bg-white dark:bg-[#131926] border border-slate-200 dark:border-slate-700/80 rounded-lg text-xs font-mono text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
            Options Builder & Correct Key ({questionType === 'MCQ' ? 'Single Choice' : 'Multiple Choice'})
          </label>
          <p className="text-[11px] text-slate-400">
            Click the option badge (A, B, C, D) to mark the correct choice.
          </p>
        </div>
        <button
          type="button"
          onClick={onAddOption}
          disabled={options.length >= 6}
          className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 flex items-center gap-1 disabled:opacity-40 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Add Option
        </button>
      </div>

      <div className="space-y-2">
        {options.map((opt, optIdx) => {
          const isSelected = correctAnswers.includes(optIdx);
          const isUploadingThis = uploadingOptIndex === optIdx;
          const letter = String.fromCharCode(65 + optIdx);

          return (
            <div
              key={optIdx}
              className={`space-y-1.5 p-2 rounded-xl border transition-colors ${
                isSelected
                  ? 'bg-emerald-50/40 border-emerald-300/80 dark:bg-emerald-950/20 dark:border-emerald-800/70'
                  : 'bg-white dark:bg-[#162030] border-slate-200/90 dark:border-slate-800/90 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2">
                {/* Drag Handle */}
                <div className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-grab px-0.5">
                  <GripVertical className="w-4 h-4" />
                </div>

                {/* Correct Option Selector Badge */}
                <button
                  type="button"
                  onClick={() =>
                    questionType === 'MCQ'
                      ? onCorrectMcqChange(optIdx)
                      : onCorrectMsqToggle(optIdx)
                  }
                  title={isSelected ? 'Correct option (Click to toggle)' : 'Click to mark as correct option'}
                  className={`w-6 h-6 rounded-md flex items-center justify-center font-medium text-xs shrink-0 transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-[#131926] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/80 hover:bg-slate-200 dark:hover:bg-[#1a2334]'
                  }`}
                >
                  {isSelected ? '✓' : letter}
                </button>

                <input
                  type="text"
                  value={opt.text}
                  onChange={(e) => onOptionTextChange(optIdx, e.target.value)}
                  placeholder={`Option ${letter} text/formula (e.g. $x^2 + 1$)...`}
                  className="flex-1 px-3 py-1.5 bg-slate-50/50 dark:bg-[#131926] border border-slate-200 dark:border-slate-700/80 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
                />

                {/* Option Image Upload Trigger */}
                <input
                  ref={(el) => {
                    if (optionFileRefs?.current) {
                      optionFileRefs.current[optIdx] = el;
                    }
                  }}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      onOptionImageUpload(e.target.files[0], optIdx);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => optionFileRefs?.current?.[optIdx]?.click()}
                  disabled={isUploadingThis}
                  className="p-1.5 rounded-lg bg-slate-50 dark:bg-[#131926] border border-slate-200 dark:border-slate-700/80 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition-colors cursor-pointer"
                  title="Attach option picture"
                >
                  {isUploadingThis ? (
                    <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                  ) : (
                    <ImageIcon className="w-4 h-4" />
                  )}
                </button>

                {options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => onRemoveOption(optIdx)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition-colors cursor-pointer"
                    title="Delete option"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Option image preview if attached */}
              {opt.image && (
                <div className="ml-10 flex items-center justify-between p-1.5 rounded-lg bg-slate-50 dark:bg-[#131926] border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-2 min-w-0">
                    <img
                      src={opt.image}
                      alt="Option diagram"
                      className="w-8 h-8 object-contain rounded border border-slate-200 dark:border-slate-700 bg-white"
                    />
                    <span className="text-xs text-slate-600 dark:text-slate-400 truncate font-mono">
                      {opt.image}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveOptionImage(optIdx)}
                    className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                    title="Remove option image"
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
