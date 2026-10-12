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
      className={`fixed bottom-6 right-6 z-[9999] max-w-sm w-full bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none rounded-lg shadow-sm p-3.5 text-slate-900 dark:text-slate-100 transition-all duration-200 ${
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
              className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5 rounded transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-xs font-semibold text-slate-900 dark:text-white truncate mt-0.5">
            {alert.userName || 'Candidate'}
          </p>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
            {alert.examTitle || 'Examination'} · <span className="text-amber-700 dark:text-amber-400 font-medium">{VIOLATION_LABELS[alert.type] || alert.type}</span>
          </p>

          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              Score: <strong className="text-rose-600 dark:text-rose-400 tabular-nums">{alert.trustScore ?? '—'}%</strong>
            </span>
            {alert.imageUrl && (
              <button
                onClick={() => onViewEvidence?.(alert)}
                className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:text-white shadow-sm shadow-indigo-600/20 active:scale-[0.98] text-[11px] font-medium transition-colors cursor-pointer shadow-sm"
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
            className="w-12 h-12 rounded-md bg-slate-100 dark:bg-[#0C0F17] border border-slate-200/80 dark:border-slate-800/80 overflow-hidden shrink-0 cursor-pointer group relative"
          >
            <img
              src={alert.imageUrl}
              alt="Snapshot preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
              <Eye className="w-3.5 h-3.5 text-white" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
