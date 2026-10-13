import React from 'react';
import MathRenderer from '../common/MathRenderer';
import {
  Image as ImageIcon,
  Loader2,
  Trash2,
  Edit3,
  Eye
} from 'lucide-react';

export default function QuestionStatementEditor({
  questionText,
  onQuestionTextChange,
  imageAttachment,
  onRemoveImageAttachment,
  previewMode = 'split',
  onPreviewModeChange,
  isUploadingQuestionImg,
  onQuestionImageUpload,
  questionFileRef
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
          Question Statement
        </label>

        {/* Cloudinary Question Image Upload */}
        <div className="flex items-center gap-2">
          <input
            ref={questionFileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                onQuestionImageUpload(e.target.files[0]);
              }
            }}
          />
          <button
            type="button"
            onClick={() => questionFileRef.current?.click()}
            disabled={isUploadingQuestionImg}
            className="h-7 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700/80 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#162030] transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            {isUploadingQuestionImg ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                <span>{imageAttachment ? 'Change Picture' : 'Attach Picture'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div
        className={`grid gap-3 ${
          previewMode === 'split' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'
        }`}
      >
        {(previewMode === 'edit' || previewMode === 'split') && (
          <textarea
            rows={4}
            value={questionText}
            onChange={(e) => onQuestionTextChange(e.target.value)}
            placeholder="Enter question statement (e.g. Find $\int_0^1 x dx$). Can be left blank if statement is an image."
            className="w-full p-3 bg-slate-50/50 dark:bg-[#162030] border border-slate-200 dark:border-slate-700/80 rounded-xl text-xs font-mono leading-relaxed text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
          />
        )}

        {(previewMode === 'preview' || previewMode === 'split') && (
          <div className="p-3.5 bg-slate-50/70 dark:bg-[#162030] border border-slate-200 dark:border-slate-700/80 rounded-xl overflow-y-auto max-h-40 space-y-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500 block">
              Real-Time LaTeX Preview
            </span>
            {questionText ? (
              <MathRenderer text={questionText} className="text-xs text-slate-900 dark:text-slate-100" />
            ) : (
              <span className="text-xs text-slate-400 italic">No text entered.</span>
            )}
          </div>
        )}
      </div>

      {/* Attached Question Picture Display */}
      {imageAttachment && (
        <div className="p-2.5 rounded-xl bg-slate-50/60 dark:bg-[#162030] border border-slate-200 dark:border-slate-700/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-white dark:bg-[#131926] border border-slate-200 dark:border-slate-700 shrink-0 flex items-center justify-center">
              <img src={imageAttachment} alt="Question Diagram" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-medium text-slate-900 dark:text-slate-100 block truncate">
                Question Diagram Attached
              </span>
              <span className="text-[10px] text-slate-400 font-mono truncate block">
                {imageAttachment}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onRemoveImageAttachment}
            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
            title="Remove picture"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
