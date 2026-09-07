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
      className={`fixed bottom-6 right-6 z-[9999] max-w-sm w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-4 text-slate-900 dark:text-slate-100 transition-all duration-300 ${
        isClosing ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Violation Icon */}
        <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 flex items-center justify-center shrink-0 mt-0.5">
          {getIcon()}
        </div>

        {/* Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] uppercase font-bold tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              Live Proctor Alert
            </span>
            <button
              onClick={handleManualClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-0.5 rounded transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-xs font-semibold text-slate-900 dark:text-white truncate mt-0.5">
            {alert.userName || 'Candidate'}
          </p>

          <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
            {alert.examTitle || 'Examination'} • <span className="text-amber-600 dark:text-amber-400 font-medium">{VIOLATION_LABELS[alert.type] || alert.type}</span>
          </p>

          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              Score: <strong className="text-rose-600 dark:text-rose-400">{alert.trustScore ?? '—'}%</strong>
            </span>
            {alert.imageUrl && (
              <button
                onClick={() => onViewEvidence?.(alert)}
                className="ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-medium transition-colors cursor-pointer shadow-xs"
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
            className="w-14 h-14 rounded-lg bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 overflow-hidden shrink-0 cursor-pointer group relative"
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
