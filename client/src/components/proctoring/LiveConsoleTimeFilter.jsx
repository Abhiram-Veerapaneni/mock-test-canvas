import React, { useState, useEffect, useRef } from 'react';
import { Clock, Calendar, ChevronDown, Check, X, AlertCircle } from 'lucide-react';
import { formatDateRange12h } from '../../utils/dateUtils';

const PRESET_OPTIONS = [
  { key: 'ALL', label: 'All Time' },
  { key: '15M', label: 'Last 15m' },
  { key: '1H', label: 'Last 1h' },
  { key: 'TODAY', label: 'Today' },
];

export default function LiveConsoleTimeFilter({
  timePreset = 'ALL',
  onSelectPreset,
  customStart = '',
  customEnd = '',
  onApplyCustom,
  onReset,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempStart, setTempStart] = useState(customStart);
  const [tempEnd, setTempEnd] = useState(customEnd);
  const [validationError, setValidationError] = useState('');

  const containerRef = useRef(null);

  // Synchronize local form inputs when props change
  useEffect(() => {
    setTempStart(customStart);
    setTempEnd(customEnd);
  }, [customStart, customEnd]);

  // Handle outside click & Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleSelectPreset = (presetKey) => {
    setValidationError('');
    onSelectPreset(presetKey);
    setIsOpen(false);
  };

  const handleApplyCustom = (e) => {
    e.preventDefault();
    if (!tempStart && !tempEnd) {
      setValidationError('Please select at least a start or end time.');
      return;
    }

    if (tempStart && tempEnd) {
      const startMs = new Date(tempStart).getTime();
      const endMs = new Date(tempEnd).getTime();
      if (endMs <= startMs) {
        setValidationError('End time must be after start time.');
        return;
      }
    }

    setValidationError('');
    onApplyCustom({ customStart: tempStart, customEnd: tempEnd });
    setIsOpen(false);
  };

  const handleClear = () => {
    setTempStart('');
    setTempEnd('');
    setValidationError('');
    onReset();
    setIsOpen(false);
  };

  // Determine active trigger label
  let triggerLabel = 'All Time';
  let isFiltered = timePreset !== 'ALL';
  if (timePreset === '15M') triggerLabel = 'Last 15m';
  else if (timePreset === '1H') triggerLabel = 'Last 1h';
  else if (timePreset === 'TODAY') triggerLabel = 'Today';
  else if (timePreset === 'CUSTOM') {
    if (customStart && customEnd) {
      triggerLabel = 'Custom Range';
    } else if (customStart) {
      triggerLabel = 'From start';
    } else if (customEnd) {
      triggerLabel = 'Until end';
    } else {
      triggerLabel = 'Custom';
    }
  }

  const formattedRangeTitle =
    timePreset === 'CUSTOM' && (customStart || customEnd)
      ? formatDateRange12h(customStart, customEnd)
      : undefined;

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      {/* ── Trigger Button ── */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        title={formattedRangeTitle || 'Filter feed by date and time'}
        aria-expanded={isOpen}
        className={`h-8 px-3 rounded-lg border text-xs font-medium transition-all flex items-center gap-2 cursor-pointer select-none shadow-sm ${
          isFiltered
            ? 'border-indigo-200 dark:border-indigo-800/70 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300'
            : 'border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#131926] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-[#162030]'
        }`}
      >
        {timePreset === 'CUSTOM' || timePreset === 'TODAY' ? (
          <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
        ) : (
          <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
        )}

        <span className="truncate max-w-[120px]">{triggerLabel}</span>

        {isFiltered ? (
          <span
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.stopPropagation();
                handleClear();
              }
            }}
            className="p-0.5 rounded text-indigo-400 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-200 transition-colors ml-0.5 cursor-pointer"
            title="Clear time filter"
          >
            <X className="w-3 h-3" />
          </span>
        ) : (
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        )}
      </button>

      {/* ── Dropdown Popover ── */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 rounded-xl bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-slate-800/80 shadow-lg p-4 z-50 text-xs transition-colors">
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100 dark:border-slate-800/80">
            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
              Filter by Date & Time
            </span>
            {isFiltered && (
              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium cursor-pointer"
              >
                Reset to All
              </button>
            )}
          </div>

          {/* Quick Presets */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Quick Presets
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {PRESET_OPTIONS.map(({ key, label }) => {
                const isActive = timePreset === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleSelectPreset(key)}
                    className={`h-8 px-2.5 rounded-lg text-xs font-medium transition-all text-left flex items-center justify-between cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 hover:bg-indigo-500 text-white dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:text-white shadow-sm shadow-indigo-600/20'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:bg-slate-800/60 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                    }`}
                  >
                    <span>{label}</span>
                    {isActive && <Check className="w-3.5 h-3.5 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div className="my-3 border-t border-slate-100 dark:border-slate-800/80" />

          {/* Custom Date & Time Range */}
          <form onSubmit={handleApplyCustom} className="space-y-2.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Custom Range
            </span>

            <div className="space-y-2">
              <div>
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                  Start Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={tempStart}
                  onChange={(e) => {
                    setTempStart(e.target.value);
                    setValidationError('');
                  }}
                  className="w-full py-1.5 px-2.5 bg-white dark:bg-[#0C0F17] border border-slate-200/80 dark:border-slate-800/80 rounded-lg text-xs font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors"
                />
              </div>

              <div>
                <label className="text-[11px] font-medium text-slate-600 dark:text-slate-400 block mb-1">
                  End Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={tempEnd}
                  onChange={(e) => {
                    setTempEnd(e.target.value);
                    setValidationError('');
                  }}
                  className="w-full py-1.5 px-2.5 bg-white dark:bg-[#0C0F17] border border-slate-200/80 dark:border-slate-800/80 rounded-lg text-xs font-mono text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors"
                />
              </div>

              {validationError && (
                <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium pt-0.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{validationError}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={() => {
                  setTempStart('');
                  setTempEnd('');
                  setValidationError('');
                }}
                className="text-xs text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 font-medium cursor-pointer"
              >
                Clear inputs
              </button>

              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-sm shadow-indigo-600/20 active:scale-[0.98] dark:bg-indigo-500 dark:hover:bg-indigo-400 dark:text-white text-xs py-1.5 px-3 rounded-lg transition-all cursor-pointer"
              >
                Apply Range
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
