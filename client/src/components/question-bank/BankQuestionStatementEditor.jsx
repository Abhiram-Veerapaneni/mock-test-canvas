import React from 'react';
import MathRenderer from '../common/MathRenderer';
import { Image as ImageIcon, Loader2, Trash2 } from 'lucide-react';

export default function BankQuestionStatementEditor({
  questionText,
  onQuestionTextChange,
  previewMode = 'split',
  imageAttachment,
  onImageAttachmentChange,
  isUploadingDiagram,
  onDiagramUpload,
  diagramFileRef
}) {
  return (
    <div className="space-y-4">
      {/* Statement Editor with Live KaTeX Preview */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
            Question Statement (LaTeX formatted via $inline$ or $$block$$)
          </label>
        </div>

        <div className={`grid gap-3 ${previewMode === 'split' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
          {previewMode !== 'preview' && (
            <textarea
              rows={4}
              value={questionText}
              onChange={(e) => onQuestionTextChange(e.target.value)}
              placeholder="Enter problem statement... e.g. Solve the integral $\int_0^\pi \sin(x) dx$"
              className="w-full px-3 py-2 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:border-slate-400 font-mono"
            />
          )}

          {previewMode !== 'edit' && (
            <div className="p-3 bg-slate-50 dark:bg-[#162030] border border-slate-200 dark:border-slate-800/80 rounded-lg min-h-[96px] text-xs text-slate-800 dark:text-slate-200 overflow-y-auto">
              <div className="text-[10px] uppercase font-semibold text-slate-400 mb-1">Live Math Preview:</div>
              {questionText.trim() ? (
                <MathRenderer text={questionText} />
              ) : (
                <span className="italic text-slate-400">Statement preview will appear here...</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Diagram Upload & URL */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
            Optional Diagram Image
          </label>

          {/* Upload to Cloudinary Trigger */}
          <div className="flex items-center gap-2">
            <input
              ref={diagramFileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  onDiagramUpload(e.target.files[0]);
                }
              }}
            />
            <button
              type="button"
              onClick={() => diagramFileRef.current?.click()}
              disabled={isUploadingDiagram}
              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-[#162030] text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
            >
              {isUploadingDiagram ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
                  <span>Uploading to Cloudinary...</span>
                </>
              ) : (
                <>
                  <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
                  <span>{imageAttachment ? 'Change Picture' : 'Upload Image'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        <input
          type="text"
          value={imageAttachment}
          onChange={(e) => onImageAttachmentChange(e.target.value)}
          placeholder="Or paste direct image URL (https://... or Cloudinary link)"
          className="w-full px-3 py-1.5 bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-slate-400"
        />

        {/* Attached Diagram Preview Card */}
        {imageAttachment && (
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-12 rounded overflow-hidden bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 shrink-0 flex items-center justify-center">
                <img src={imageAttachment} alt="Diagram preview" className="w-full h-full object-contain" />
              </div>
              <div className="min-w-0">
                <span className="text-xs font-medium text-slate-900 dark:text-slate-100 block truncate">
                  Diagram Image Attached
                </span>
                <span className="text-[10px] text-slate-400 truncate block font-mono">
                  {imageAttachment}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onImageAttachmentChange('')}
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
              title="Remove diagram"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
