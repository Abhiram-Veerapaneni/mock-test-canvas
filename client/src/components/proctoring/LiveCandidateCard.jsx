import React from 'react';
import {
  AlertTriangle,
  Camera,
  Eye,
  Clock,
  MoreVertical,
  Flag,
  VolumeOff,
  UserX
} from 'lucide-react';
import { formatTime12h } from '../../utils/dateUtils';
import { getViolationDetails, getViolationBadgeStyle, getTrustScoreStyle } from './proctorUtils';

export default function LiveCandidateCard({
  violation,
  index,
  isBroken,
  isMuted,
  isDropdownOpen,
  onToggleDropdown,
  onSelectImage,
  onMarkBroken,
  onToggleMute,
}) {
  const v = violation;
  const trustScore = v.candidateTrustScore ?? 100;
  const violationDetails = getViolationDetails(v.type);
  const trustInfo = getTrustScoreStyle(trustScore);

  return (
    <div className="bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-slate-800/80 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden group">
      {/* 1. Header (Above Feed) */}
      <div className="px-3.5 py-2.5 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 bg-slate-50/50 dark:bg-[#162030]/50">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Candidate active" />
          <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 truncate" title={v.userName || 'Candidate'}>
            {v.userName || 'Candidate'}
          </span>
          {isMuted && (
            <span title="Audio muted" className="text-slate-400 dark:text-slate-500 shrink-0">
              <VolumeOff className="w-3 h-3" />
            </span>
          )}
        </div>

        {/* Right: Semantic Tinted Alert Badge */}
        {v.type && (
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border shrink-0 ${getViolationBadgeStyle(violationDetails.tone)}`}>
            <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
            <span className="truncate max-w-[110px]">{violationDetails.label}</span>
          </span>
        )}
      </div>

      {/* 2. Video Frame (16:9 Aspect Ratio) */}
      <div
        className="relative aspect-video w-full bg-slate-950 overflow-hidden cursor-pointer select-none"
        onClick={() => {
          if (v.imageUrl && !isBroken) onSelectImage(v);
        }}
      >
        {v.imageUrl && !isBroken ? (
          <>
            <img
              src={v.imageUrl}
              alt={`Capture of ${v.userName || 'candidate'}`}
              onError={() => onMarkBroken(v.imageUrl)}
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
              loading="lazy"
            />
            {/* Hover Inspect Cue */}
            <div className="absolute inset-0 bg-slate-900/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="bg-white/95 dark:bg-[#131926]/95 text-slate-800 dark:text-slate-100 text-xs font-medium px-2.5 py-1 rounded-lg shadow-sm border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span>Enlarge Snapshot</span>
              </span>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800/40 text-slate-400 space-y-1.5">
            <Camera className="w-6 h-6 text-slate-400 dark:text-slate-500" />
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Feed Unavailable</span>
          </div>
        )}
      </div>

      {/* 3. Footer / Metadata Row */}
      <div className="px-3.5 py-2.5 bg-white dark:bg-[#131926] border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
          <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{v.timestamp ? formatTime12h(v.timestamp, { includeSeconds: true }) : 'Live'}</span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${trustInfo.badgeClass}`}
            title={`Trust Score: ${trustScore}% (${trustInfo.label})`}
          >
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">Trust</span>
            <strong className="font-semibold tabular-nums">{trustScore}%</strong>
          </span>

          <div className="relative" data-action-dropdown>
            <button
              type="button"
              onClick={onToggleDropdown}
              title="Candidate actions"
              className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <MoreVertical className="w-3.5 h-3.5" />
            </button>

            {isDropdownOpen && (
              <div
                className="absolute right-0 bottom-full mb-1 w-44 rounded-xl bg-white dark:bg-[#131926] border border-slate-200 dark:border-slate-800 shadow-xl py-1 z-40 text-xs"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={() => {
                    alert(`Warning issued to ${v.userName || 'Candidate'}: Please remain focused on your examination.`);
                    onToggleDropdown();
                  }}
                  className="w-full text-left px-3 py-1.5 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#162030] flex items-center gap-2 cursor-pointer font-medium"
                >
                  <Flag className="w-3.5 h-3.5 text-amber-500" />
                  <span>Issue Warning</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onToggleMute(v.userId || v.userEmail);
                    onToggleDropdown();
                  }}
                  className="w-full text-left px-3 py-1.5 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#162030] flex items-center gap-2 cursor-pointer font-medium"
                >
                  <VolumeOff className="w-3.5 h-3.5 text-slate-400" />
                  <span>{isMuted ? 'Unmute Audio' : 'Mute Candidate'}</span>
                </button>
                <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Disqualify candidate ${v.userName || 'record'} and terminate session?`)) {
                      alert(`Candidate session terminated.`);
                    }
                    onToggleDropdown();
                  }}
                  className="w-full text-left px-3 py-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 flex items-center gap-2 font-medium cursor-pointer"
                >
                  <UserX className="w-3.5 h-3.5 text-rose-500" />
                  <span>Disqualify Candidate</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

