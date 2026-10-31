import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, X, ExternalLink } from 'lucide-react';
import { formatDateTime12h } from '../../utils/dateUtils';
import { VIOLATION_LABELS } from './notificationConstants';

export default function NotificationSnapshotModal({ snapshotPreview, onClose }) {
  if (!snapshotPreview) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="max-w-xl w-full bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none rounded-lg overflow-hidden shadow-sm p-6 text-slate-900 dark:text-slate-100 space-y-4 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              <span>Proctoring Violation Evidence Snapshot</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {snapshotPreview.candidateName || 'Candidate'} •{' '}
              {VIOLATION_LABELS[snapshotPreview.violationType] || snapshotPreview.violationType} •{' '}
              {snapshotPreview.timestamp
                ? formatDateTime12h(snapshotPreview.timestamp, { includeYear: true, includeSeconds: true })
                : 'Active Exam'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="rounded-md overflow-hidden border border-slate-200/80 dark:border-slate-800/80 bg-slate-950 flex items-center justify-center min-h-[260px] max-h-[440px]">
          <img
            src={snapshotPreview.imageUrl}
            alt="Proctoring violation snapshot"
            className="w-full h-full object-contain"
          />
        </div>

        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
          <span className="font-mono">
            Trust Score:{' '}
            <strong className="text-rose-600 dark:text-rose-400 font-medium">
              {snapshotPreview.trustScore ?? '—'}%
            </strong>
          </span>

          {snapshotPreview.examId && (
            <Link
              to={`/test/${snapshotPreview.examId}/audit`}
              onClick={onClose}
              className="btn-primary text-xs inline-flex items-center gap-1.5 px-3 py-1.5"
            >
              <span>Open Audit Report</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

