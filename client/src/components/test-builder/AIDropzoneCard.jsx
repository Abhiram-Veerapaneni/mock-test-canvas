import React from 'react';
import {
  Sparkles,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Loader2,
  UploadCloud,
  AlertCircle
} from 'lucide-react';

export default function AIDropzoneCard({
  isDropzoneExpanded,
  setIsDropzoneExpanded,
  isIngesting,
  ingestionStep,
  ingestionError,
  dragActive,
  setDragActive,
  fileInputRef,
  onFileUpload,
  onFileDrop,
  onLoadSampleQuestion
}) {
  return (
    <div className="bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none rounded-lg p-5 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shrink-0">
            <Sparkles className="w-4 h-4 text-slate-500" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Automated AI Question Paper Ingestion</span>
              <span className="text-[11px] font-mono text-slate-400 font-normal">
                Gemini
              </span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Parses questions, equations, and figures from PDF, Word (.docx), or photos.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onLoadSampleQuestion}
            className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 cursor-pointer"
            title="Insert a sample JEE/NEET KaTeX question"
          >
            <BookOpen className="w-3.5 h-3.5 text-slate-500" />
            <span>Load Sample Question</span>
          </button>

          <button
            type="button"
            onClick={() => setIsDropzoneExpanded(!isDropzoneExpanded)}
            className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5 cursor-pointer"
          >
            <span>{isDropzoneExpanded ? 'Collapse' : 'Upload File'}</span>
            {isDropzoneExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Drag and Drop Zone (Expandable) */}
      {(isDropzoneExpanded || isIngesting || dragActive) && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragActive(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setDragActive(false);
          }}
          onDrop={onFileDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${dragActive
            ? 'border-indigo-600 dark:border-indigo-400 bg-slate-100 dark:bg-slate-800/80'
            : isIngesting
              ? 'border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#131926] cursor-wait'
              : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 bg-slate-50/50 dark:bg-[#0C0F17]/40'
            }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.doc,image/png,image/jpeg,image/webp,image/jpg,application/pdf"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                onFileUpload(e.target.files[0]);
              }
            }}
            className="hidden"
          />

          {isIngesting ? (
            <div className="py-3 space-y-3">
              <Loader2 className="w-6 h-6 text-slate-600 dark:text-slate-300 animate-spin mx-auto" />
              <div className="space-y-1">
                <p className="text-xs font-medium text-slate-900 dark:text-slate-100">
                  {ingestionStep || 'Processing document with Gemini AI...'}
                </p>
                <p className="text-xs text-slate-500">
                  Extracting questions, options, and formatting LaTeX formulas...
                </p>
              </div>
            </div>
          ) : (
            <div className="py-2 space-y-2">
              <div className="w-8 h-8 rounded-md bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 mx-auto">
                <UploadCloud className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-800 dark:text-slate-200">
                  <span className="text-slate-900 dark:text-slate-100 underline underline-offset-2">Click to browse</span> or drag and drop document here
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                  Supports PDF (.pdf), Word (.docx) & Images (.png, .jpg, .webp) up to 15 MB
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {ingestionError && (
        <div className="p-3 rounded-md bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/50 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-xs flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
          <div className="flex-1 min-w-0">
            <p className="font-medium">Document Ingestion Failed</p>
            <p className="text-xs mt-0.5">{ingestionError}</p>
          </div>
        </div>
      )}
    </div>
  );
}
