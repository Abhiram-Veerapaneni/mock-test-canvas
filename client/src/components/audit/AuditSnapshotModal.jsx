import React from 'react';
import { X, ExternalLink } from 'lucide-react';
import { formatDateTime12h } from '../../utils/dateUtils';
import { VIOLATION_LABELS, getBadgeStyle } from '../../utils/auditConstants';

export default function AuditSnapshotModal({ selectedSnapshot, onClose }) {
  if (!selectedSnapshot) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="max-w-2xl w-full bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none rounded-lg p-6 text-slate-900 dark:text-slate-100 space-y-4 shadow-sm"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header with Close Button */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${getBadgeStyle(selectedSnapshot.type)}`}>
              {VIOLATION_LABELS[selectedSnapshot.type] || selectedSnapshot.type}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Candidate: <strong className="text-slate-900 dark:text-slate-100 font-medium">{selectedSnapshot.userName}</strong>
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
            title="Close Modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Image Container */}
        <div className="rounded-md overflow-hidden bg-slate-100 dark:bg-[#0C0F17] border border-slate-200/80 dark:border-slate-800/80 max-h-[60vh] flex items-center justify-center">
          <img
            src={selectedSnapshot.imageUrl}
            alt="Candidate violation evidence"
            className="max-h-[60vh] w-auto object-contain"
          />
        </div>

        {/* Modal Footer Metadata */}
        <div className="flex items-center justify-between text-xs pt-1">
          <div className="space-y-0.5">
            <div className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
              Timestamp: {selectedSnapshot.timestamp ? formatDateTime12h(selectedSnapshot.timestamp, { includeYear: true, includeSeconds: true }) : '—'}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              Total violations by user: <strong className="text-rose-600 dark:text-rose-400">{selectedSnapshot.noOfViolations}</strong>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={selectedSnapshot.imageUrl}
              target="_blank"
              rel="noreferrer"
              className="btn-primary text-xs inline-flex items-center gap-1.5 px-3 py-1.5"
            >
              <span>Full Original</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={onClose}
              className="btn-secondary text-xs px-3 py-1.5"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
