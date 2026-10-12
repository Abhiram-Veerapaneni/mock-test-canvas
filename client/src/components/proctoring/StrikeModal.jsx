import React from 'react';
import { AlertTriangle, ShieldAlert, X, Eye, EyeOff, Users, Volume2, Smartphone, BookOpen } from 'lucide-react';

/**
 * StrikeModal
 *
 * Premium warning modal displayed when a proctoring violation is confirmed.
 * Shows violation details, current strike count, and a visual trust score bar.
 *
 * @param {Object}   props
 * @param {string}   props.type         Violation type (NO_FACE, MULTI_FACE, NOISE_SPIKE, etc.)
 * @param {number}   props.strikeCount  Current total strike count
 * @param {number}   props.trustScore   Current trust score (0–100)
 * @param {number}   props.maxWarnings  Max allowed warnings from exam settings
 * @param {boolean}  props.isOpen       Whether the modal is visible
 * @param {function} props.onClose      Dismiss handler
 */

const VIOLATION_INFO = {
  CELL_PHONE: {
    icon: Smartphone,
    label: 'Cell Phone / Mobile Device Detected',
    description: 'A mobile phone or handheld device was detected in your camera view. Using phones or electronic devices is strictly prohibited during the test.',
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  PROHIBITED_BOOK: {
    icon: BookOpen,
    label: 'Study Material / Book Detected',
    description: 'A book, textbook, or printed reference material was detected in camera view. Unauthorized study aids are prohibited.',
    color: '#f97316',
    bgColor: 'rgba(249, 115, 22, 0.08)',
    borderColor: 'rgba(249, 115, 22, 0.25)',
  },
  PROHIBITED_OBJECT: {
    icon: AlertTriangle,
    label: 'Prohibited Device Detected',
    description: 'An unauthorized electronic device or secondary display was detected in your workspace.',
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  NO_FACE: {
    icon: EyeOff,
    label: 'No Face Detected',
    description: 'Your face was not visible to the camera for an extended period. Please ensure you remain in front of the webcam.',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.08)',
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  MULTI_FACE: {
    icon: Users,
    label: 'Multiple Faces Detected',
    description: 'More than one person was detected in the camera frame. Only the exam candidate should be visible.',
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  NOISE_SPIKE: {
    icon: Volume2,
    label: 'Excessive Noise Detected',
    description: 'Unusually loud or sustained noise was detected from your microphone. Please ensure a quiet testing environment.',
    color: '#f97316',
    bgColor: 'rgba(249, 115, 22, 0.08)',
    borderColor: 'rgba(249, 115, 22, 0.25)',
  },
  FULLSCREEN_EXIT: {
    icon: ShieldAlert,
    label: 'Fullscreen Exited',
    description: 'You exited fullscreen mode during the exam. This is a proctoring violation.',
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  TAB_SWITCH: {
    icon: AlertTriangle,
    label: 'Tab Switch Detected',
    description: 'You switched to another browser tab during the exam.',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.08)',
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  WINDOW_BLUR: {
    icon: AlertTriangle,
    label: 'Window Focus Lost',
    description: 'The exam window lost focus, possibly due to switching applications.',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.08)',
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
};

const DEFAULT_INFO = {
  icon: AlertTriangle,
  label: 'Proctoring Violation',
  description: 'A proctoring violation has been detected.',
  color: '#f59e0b',
  bgColor: 'rgba(245, 158, 11, 0.08)',
  borderColor: 'rgba(245, 158, 11, 0.25)',
};

export default function StrikeModal({ type, strikeCount, trustScore, maxWarnings, isOpen, onClose }) {
  if (!isOpen) return null;

  const info = VIOLATION_INFO[type] || DEFAULT_INFO;
  const IconComponent = info.icon;

  // Severity-dependent color for the strike counter
  const getSeverityColor = () => {
    const ratio = maxWarnings > 0 ? strikeCount / maxWarnings : 0;
    if (ratio >= 0.8) return '#ef4444'; // red — critical
    if (ratio >= 0.5) return '#f97316'; // orange — warning
    return '#f59e0b';                    // amber — caution
  };

  // Trust score bar color
  const getTrustColor = () => {
    if (trustScore >= 70) return '#22c55e'; // green
    if (trustScore >= 40) return '#f59e0b'; // amber
    return '#ef4444';                        // red
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-[2px] animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white dark:bg-[#131926] border border-slate-100 dark:border-slate-800/80 rounded-lg overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top accent bar */}
        <div
          className={`h-1 ${
            type === 'CELL_PHONE' || type === 'MULTI_FACE' || type === 'FULLSCREEN_EXIT'
              ? 'bg-rose-500'
              : 'bg-amber-500'
          }`}
        />

        <div className="p-5">
          {/* Icon + Title */}
          <div className="flex items-start gap-3 mb-4">
            <div className="w-9 h-9 rounded-md bg-rose-50 dark:bg-rose-950/50 border border-rose-200/60 dark:border-rose-900/60 flex items-center justify-center shrink-0 mt-0.5">
              <IconComponent className="w-4 h-4 text-rose-600 dark:text-rose-400" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                {info.label}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                {info.description}
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 gap-2.5 mb-4">
            {/* Strike count */}
            <div className="bg-slate-50 dark:bg-[#162030] border border-slate-200 dark:border-slate-700/80 rounded-md p-3 text-center">
              <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400 mb-0.5">
                Strikes
              </div>
              <div className="text-xl font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
                {strikeCount}
                <span className="text-xs font-normal text-slate-400 ml-1">
                  / {maxWarnings || '∞'}
                </span>
              </div>
            </div>

            {/* Trust score */}
            <div className="bg-slate-50 dark:bg-[#162030] border border-slate-200 dark:border-slate-700/80 rounded-md p-3 text-center">
              <div className="text-[10px] font-medium uppercase tracking-wider text-slate-400 mb-0.5">
                Trust Score
              </div>
              <div className="text-xl font-semibold text-slate-900 dark:text-white tabular-nums">
                {trustScore}
                <span className="text-xs font-normal text-slate-400 ml-1">
                  /100
                </span>
              </div>
            </div>
          </div>

          {/* Trust score progress bar */}
          <div className="w-full h-1 bg-slate-200 dark:bg-slate-800/80 rounded-sm overflow-hidden mb-4">
            <div
              className={`h-full transition-all duration-300 rounded-sm ${
                trustScore >= 70
                  ? 'bg-emerald-500'
                  : trustScore >= 40
                  ? 'bg-amber-500'
                  : 'bg-rose-500'
              }`}
              style={{ width: `${trustScore}%` }}
            />
          </div>

          {/* Warning text */}
          <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center mb-4 leading-relaxed">
            Repeated violations will result in automatic exam termination.
          </p>

          {/* Dismiss button */}
          <button
            onClick={onClose}
            className="w-full py-2 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:text-white shadow-sm shadow-indigo-600/20 active:scale-[0.98] text-xs font-medium transition-colors cursor-pointer shadow-sm"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
}
