import React, { useState, useEffect } from 'react';
import { ShieldAlert, X, Eye, Users, Volume2, EyeOff, AlertTriangle, Smartphone, BookOpen } from 'lucide-react';

const VIOLATION_LABELS = {
  TAB_SWITCH: 'Tab Switched',
  WINDOW_BLUR: 'Focus Lost',
  FULLSCREEN_EXIT: 'Fullscreen Exited',
  NO_FACE: 'No Face Detected',
  MULTI_FACE: 'Multiple Faces',
  NOISE_SPIKE: 'Excessive Noise',
  CELL_PHONE: 'Mobile Phone Detected',
  PROHIBITED_BOOK: 'Book / Notes Detected',
  PROHIBITED_OBJECT: 'Prohibited Device Detected',
};

export default function LiveViolationToast({ alert, onClose, onViewEvidence }) {
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsClosing(true);
      setTimeout(onClose, 300);
    }, 8000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const handleManualClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 300);
  };

  const getIcon = () => {
    switch (alert.type) {
      case 'CELL_PHONE': return <Smartphone className="w-4 h-4 text-rose-400" />;
      case 'PROHIBITED_BOOK': return <BookOpen className="w-4 h-4 text-orange-400" />;
      case 'PROHIBITED_OBJECT': return <AlertTriangle className="w-4 h-4 text-rose-400" />;
      case 'MULTI_FACE': return <Users className="w-4 h-4 text-rose-400" />;
      case 'NO_FACE': return <EyeOff className="w-4 h-4 text-amber-400" />;
      case 'NOISE_SPIKE': return <Volume2 className="w-4 h-4 text-orange-400" />;
      default: return <AlertTriangle className="w-4 h-4 text-rose-400" />;
    }
  };

  return (
    <div
      className={`fixed bottom-6 right-6 z-[9999] max-w-sm w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-sm p-3.5 text-zinc-900 dark:text-zinc-100 transition-all duration-200 ${
        isClosing ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Violation Icon */}
        <div className="w-8 h-8 rounded-md bg-rose-50 dark:bg-rose-950/50 border border-rose-200/60 dark:border-rose-900/60 flex items-center justify-center shrink-0 mt-0.5">
          {getIcon()}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] uppercase font-medium tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              Live Proctor Alert
            </span>
            <button
              onClick={handleManualClose}
              className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 p-0.5 rounded transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-xs font-semibold text-zinc-900 dark:text-white truncate mt-0.5">
            {alert.userName || 'Candidate'}
          </p>

          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
            {alert.examTitle || 'Examination'} · <span className="text-amber-700 dark:text-amber-400 font-medium">{VIOLATION_LABELS[alert.type] || alert.type}</span>
          </p>

          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-mono">
              Score: <strong className="text-rose-600 dark:text-rose-400 tabular-nums">{alert.trustScore ?? '—'}%</strong>
            </span>
            {alert.imageUrl && (
              <button
                onClick={() => onViewEvidence?.(alert)}
                className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 text-[11px] font-medium transition-colors cursor-pointer shadow-sm"
              >
                <Eye className="w-3 h-3" />
                <span>View Snapshot</span>
              </button>
            )}
          </div>
        </div>

        {/* Thumbnail Preview */}
        {alert.imageUrl && (
          <div
            onClick={() => onViewEvidence?.(alert)}
            className="w-12 h-12 rounded-md bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 overflow-hidden shrink-0 cursor-pointer group relative"
          >
            <img
              src={alert.imageUrl}
              alt="Snapshot preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-zinc-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Eye className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
