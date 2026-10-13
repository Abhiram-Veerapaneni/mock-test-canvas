import React from 'react';
import MathRenderer from '../common/MathRenderer';
import { Image as ImageIcon, Loader2, Trash2 } from 'lucide-react';

export default function EditQuestionStatementEditor({
  questionText,
  onQuestionTextChange,
  imageAttachment,
  onRemoveImageAttachment,
  previewMode,
  isUploadingQuestionImg,
  questionFileRef,
  onQuestionImageUpload
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-slate-800 dark:text-slate-200">
          Question Statement (Text / LaTeX / Formula)
        </label>

        {/* Cloudinary Question Image Upload Trigger */}
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
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 border border-slate-200/80 dark:border-slate-700 transition-colors cursor-pointer disabled:opacity-50"
          >
            {isUploadingQuestionImg ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                <span>Uploading Picture...</span>
              </>
            ) : (
              <>
                <ImageIcon className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                <span>{imageAttachment ? 'Replace Picture' : 'Attach Picture (Cloudinary)'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Statement Editor & Preview */}
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
            placeholder="Enter question statement (e.g. Find $\int_0^1 x dx$). Can be blank if statement is an image."
            className="w-full p-3 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-slate-900 dark:focus:border-slate-100 leading-relaxed"
          />
        )}

        {(previewMode === 'preview' || previewMode === 'split') && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg overflow-y-auto max-h-48 space-y-2">
            <span className="text-[10px] font-medium uppercase tracking-wider text-slate-400 block">
              Formula Rendered Preview
            </span>
            {questionText ? (
              <MathRenderer text={questionText} className="text-xs text-slate-900 dark:text-slate-100" />
            ) : (
              <span className="text-[11px] text-slate-400 italic">No text provided.</span>
            )}
          </div>
        )}
      </div>

      {/* Attached Question Picture Display */}
      {imageAttachment && (
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 flex items-center justify-center">
              <img
                src={imageAttachment}
                alt="Question diagram"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <span className="text-xs font-semibold text-slate-900 dark:text-white block truncate">
                Question Diagram Attached
              </span>
              <a
                href={imageAttachment}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline truncate block"
              >
                {imageAttachment}
              </a>
            </div>
          </div>
          <button
            type="button"
            onClick={onRemoveImageAttachment}
            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors shrink-0"
            title="Remove question image"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
