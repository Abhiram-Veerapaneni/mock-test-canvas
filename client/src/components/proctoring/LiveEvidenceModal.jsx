import React from 'react';
import { X, ExternalLink } from 'lucide-react';
import { formatDateTime12h } from '../../utils/dateUtils';
import { getViolationDetails, getTrustScoreStyle } from './proctorUtils';

export default function LiveEvidenceModal({ selectedImageModal, onClose }) {
  if (!selectedImageModal) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="max-w-3xl w-full bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-slate-800/80 rounded-xl overflow-hidden p-5 text-slate-900 dark:text-slate-100 space-y-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Infraction Evidence Review
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              {selectedImageModal.userName} • {getViolationDetails(selectedImageModal.type).label} •{' '}
              {formatDateTime12h(selectedImageModal.timestamp, { includeYear: true, includeSeconds: true })}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#162030] cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="rounded-lg overflow-hidden bg-slate-950 border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-center max-h-[65vh]">
          <img
            src={selectedImageModal.imageUrl}
            alt="Infraction capture full"
            className="max-h-[65vh] w-auto object-contain"
          />
        </div>

        <div className="flex items-center justify-between pt-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Candidate Trust:</span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-md font-semibold text-xs border ${getTrustScoreStyle(selectedImageModal.candidateTrustScore).badgeClass}`}>
              {selectedImageModal.candidateTrustScore ?? 100}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={selectedImageModal.imageUrl}
              target="_blank"
              rel="noreferrer"
              className="h-8 px-3 rounded-lg border border-slate-200/80 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#162030] shadow-sm transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <span>Original Image</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              type="button"
              onClick={onClose}
              className="h-8 px-3.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-sm shadow-indigo-600/20 transition-all cursor-pointer"
            >
              Close Evidence
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

