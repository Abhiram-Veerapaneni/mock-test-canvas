import React from 'react';
import { Plus, Trash2, Image as ImageIcon, Loader2, X } from 'lucide-react';

export default function EditQuestionOptionsEditor({
  questionType,
  options,
  onAddOption,
  onRemoveOption,
  onOptionTextChange,
  onRemoveOptionImage,
  correctAnswers,
  onCorrectMcqChange,
  onCorrectMsqToggle,
  optionFileRefs,
  uploadingOptIndex,
  onOptionImageUpload,
  natMin,
  setNatMin,
  natMax,
  setNatMax
}) {
  return (
    <>
      {/* MCQ / MSQ Options */}
      {(questionType === 'MCQ' || questionType === 'MSQ') && (
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Options &amp; Correct Answer ({questionType === 'MCQ' ? 'Single Choice' : 'Multiple Choices'})
              </label>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Each option can be text, a picture (saved to Cloudinary), or both.
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

          <div className="space-y-2.5">
            {options.map((opt, optIdx) => {
              const isSelected = correctAnswers.includes(optIdx);
              const isUploadingThis = uploadingOptIndex === optIdx;

              return (
                <div
                  key={optIdx}
                  className={`p-3 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-emerald-500/10 border-emerald-500/30 dark:bg-emerald-950/20 dark:border-emerald-500/30'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {/* Correct toggle button */}
                    <button
                      type="button"
                      onClick={() =>
                        questionType === 'MCQ'
                          ? onCorrectMcqChange(optIdx)
                          : onCorrectMsqToggle(optIdx)
                      }
                      title={isSelected ? 'Marked correct' : 'Click to mark correct'}
                      className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {isSelected ? '✓' : String.fromCharCode(65 + optIdx)}
                    </button>

                    {/* Option text */}
                    <input
                      type="text"
                      value={opt.text}
                      onChange={(e) => onOptionTextChange(optIdx, e.target.value)}
                      placeholder={`Option ${String.fromCharCode(65 + optIdx)} text or formula...`}
                      className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />

                    {/* Cloudinary Option Picture Upload */}
                    <input
                      ref={(el) => (optionFileRefs.current[optIdx] = el)}
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
                      onClick={() => optionFileRefs.current[optIdx]?.click()}
                      disabled={isUploadingThis}
                      className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors cursor-pointer"
                      title="Attach option image to Cloudinary"
                    >
                      {isUploadingThis ? (
                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      ) : (
                        <ImageIcon className="w-4 h-4" />
                      )}
                    </button>

                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => onRemoveOption(optIdx)}
                        className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                        title="Delete option"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Option image preview if present */}
                  {opt.image && (
                    <div className="mt-2.5 ml-9 flex items-center justify-between p-2 rounded-lg bg-slate-100/80 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={opt.image}
                          alt={`Option ${String.fromCharCode(65 + optIdx)} preview`}
                          className="w-9 h-9 object-contain rounded border border-slate-200 dark:border-slate-700 shrink-0 bg-white"
                        />
                        <span className="text-[11px] text-slate-600 dark:text-slate-400 truncate">
                          Option Picture Uploaded
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemoveOptionImage(optIdx)}
                        className="text-xs text-rose-600 hover:text-rose-700 p-1 cursor-pointer"
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
      )}

      {/* NAT Range */}
      {questionType === 'NAT' && (
        <div className="bg-slate-50 dark:bg-[#162030] p-4 rounded-md border border-slate-200 dark:border-slate-700/60 space-y-2.5">
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
            Accepted Numeric Answer Range [Min, Max]
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
                className="w-full px-3 py-1.5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-md text-xs text-slate-900 dark:text-slate-100 font-mono"
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
                className="w-full px-3 py-1.5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-md text-xs text-slate-900 dark:text-slate-100 font-mono"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
