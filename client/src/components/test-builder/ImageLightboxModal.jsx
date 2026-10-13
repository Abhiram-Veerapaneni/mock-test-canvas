import React from 'react';
import { X, ExternalLink } from 'lucide-react';

export default function ImageLightboxModal({ imageUrl, onClose }) {
  if (!imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="max-w-3xl w-full bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none rounded-lg p-5 space-y-3 shadow-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
            High Resolution Image Preview
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#162030] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="max-h-[70vh] flex items-center justify-center bg-[#F8FAFC] dark:bg-[#0C0F17] rounded-md overflow-hidden p-2 border border-slate-200/80 dark:border-slate-800/80">
          <img
            src={imageUrl}
            alt="Diagram preview"
            className="max-h-[65vh] w-auto object-contain"
          />
        </div>
        <div className="flex justify-end">
          <a
            href={imageUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:underline flex items-center gap-1 font-medium"
          >
            <span>Open original in new tab</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
