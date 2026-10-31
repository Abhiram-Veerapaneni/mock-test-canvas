import React, { useState, useEffect } from 'react';
import { isTimestampInFilter } from '../../utils/dateUtils';
import LiveConsoleTimeFilter from './LiveConsoleTimeFilter';
import LiveTelemetryKPIs from './LiveTelemetryKPIs';
import LiveCandidateCard from './LiveCandidateCard';
import LiveEvidenceModal from './LiveEvidenceModal';
import useLiveProctorFeed from '../../hooks/useLiveProctorFeed';
import {
  ShieldAlert,
  ExternalLink,
  X,
  RefreshCw,
  Clock,
  Search,
  Volume2,
  VolumeX,
  ShieldCheck,
  Loader2
} from 'lucide-react';

export default function ExamLiveMonitorModal({ isOpen, onClose, examId, examTitle }) {
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImageModal, setSelectedImageModal] = useState(null);
  const [openDropdownIdx, setOpenDropdownIdx] = useState(null);

  const {
    violations,
    isLoading,
    error,
    soundEnabled,
    setSoundEnabled,
    mutedCandidates,
    toggleMuteCandidate,
    brokenImages,
    markImageBroken,
    timePreset,
    setTimePreset,
    customStart,
    setCustomStart,
    customEnd,
    setCustomEnd,
    missedLiveCount,
    setMissedLiveCount,
    handleResetTimeFilter,
    fetchViolations,
  } = useLiveProctorFeed({ activeExamId: examId, enabled: isOpen });

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('[data-action-dropdown]')) {
        setOpenDropdownIdx(null);
      }
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  if (!isOpen) return null;

  const timeFilteredViolations = violations.filter((v) =>
    isTimestampInFilter(v.timestamp, { timePreset, customStart, customEnd })
  );

  const filteredViolations = timeFilteredViolations.filter((v) => {
    if (!v.imageUrl) return false;
    const matchesFilter = selectedFilter === 'ALL' || v.type === selectedFilter;
    const matchesSearch =
      !searchQuery ||
      (v.userName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.userEmail || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalSnapshots = timeFilteredViolations.filter((v) => v.imageUrl).length;
  const phoneAlerts = timeFilteredViolations.filter((v) => v.type === 'CELL_PHONE' || v.type === 'PROHIBITED_OBJECT').length;
  const faceAlerts = timeFilteredViolations.filter((v) => v.type === 'NO_FACE' || v.type === 'MULTI_FACE').length;
  const uniqueCandidates = new Set(timeFilteredViolations.map((v) => v.userEmail || v.userName || v.userId)).size;

  const openInNewWindow = () => {
    window.open(
      `/test/${examId}/live-proctor`,
      `proctor_${examId}`,
      'width=1280,height=800,menubar=no,toolbar=no,location=no,status=no'
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5"
      onClick={onClose}
    >
      <div
        className="w-full max-w-6xl max-h-[92vh] bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl flex flex-col overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="px-5 py-3.5 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-4 bg-slate-50/50 dark:bg-[#162030]/50 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/50 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 truncate">
                  Live Proctoring Telemetry
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-600 text-white shadow-xs shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                  Live
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                {examTitle || 'Active Assessment'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Mute alert chime' : 'Enable alert chime'}
              className="h-8 px-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#131926] text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-[#162030] shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
              <span className="hidden sm:inline">{soundEnabled ? 'Sound On' : 'Muted'}</span>
            </button>

            <button
              type="button"
              onClick={fetchViolations}
              disabled={isLoading}
              title="Refresh telemetry feed"
              className="h-8 px-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#131926] text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-[#162030] shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sync</span>
            </button>

            <button
              type="button"
              onClick={openInNewWindow}
              title="Open dedicated full console"
              className="h-8 px-2.5 rounded-lg border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#131926] text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-[#162030] shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Popout</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              title="Close modal"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#162030] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          <LiveTelemetryKPIs
            totalSnapshots={totalSnapshots}
            phoneAlerts={phoneAlerts}
            faceAlerts={faceAlerts}
            uniqueCandidates={uniqueCandidates}
          />

          {/* Filters Bar */}
          <div className="bg-slate-50/50 dark:bg-[#162030]/50 border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {[
                { key: 'ALL', label: `All (${filteredViolations.length})` },
                { key: 'CELL_PHONE', label: `Phones (${phoneAlerts})` },
                { key: 'MULTI_FACE', label: `Faces (${faceAlerts})` },
                { key: 'NO_FACE', label: 'No Face' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedFilter(key)}
                  className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    selectedFilter === key
                      ? 'bg-indigo-600 text-white dark:bg-indigo-500 dark:text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:bg-slate-800/60 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 border border-slate-200/80 dark:border-slate-700/80'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <LiveConsoleTimeFilter
                timePreset={timePreset}
                onSelectPreset={(preset) => {
                  setTimePreset(preset);
                  setCustomStart('');
                  setCustomEnd('');
                  setMissedLiveCount(0);
                }}
                customStart={customStart}
                customEnd={customEnd}
                onApplyCustom={({ customStart: start, customEnd: end }) => {
                  setTimePreset('CUSTOM');
                  setCustomStart(start);
                  setCustomEnd(end);
                  setMissedLiveCount(0);
                }}
                onReset={handleResetTimeFilter}
              />

              <div className="relative w-full sm:w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search candidate..."
                  className="w-full pl-8 pr-7 py-1.5 bg-white dark:bg-[#0C0F17] border border-slate-200/80 dark:border-slate-800/80 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors shadow-sm"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Grid */}
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-2">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Synchronizing live proctoring stream...</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-300 flex items-center justify-between">
              <span>{error}</span>
              <button
                type="button"
                onClick={fetchViolations}
                className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded text-xs font-medium text-slate-700 shadow-xs cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : filteredViolations.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-semibold text-slate-900 dark:text-slate-100">Clean Session • No Infractions</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                {timePreset !== 'ALL'
                  ? 'No incidents logged within the selected date and time window.'
                  : 'No incidents logged matching filter parameters.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5">
              {filteredViolations.map((v, idx) => (
                <LiveCandidateCard
                  key={idx}
                  violation={v}
                  index={idx}
                  isBroken={brokenImages.has(v.imageUrl)}
                  isMuted={mutedCandidates.has(v.userId || v.userEmail)}
                  isDropdownOpen={openDropdownIdx === idx}
                  onToggleDropdown={() => setOpenDropdownIdx(openDropdownIdx === idx ? null : idx)}
                  onSelectImage={setSelectedImageModal}
                  onMarkBroken={markImageBroken}
                  onToggleMute={toggleMuteCandidate}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <LiveEvidenceModal
        selectedImageModal={selectedImageModal}
        onClose={() => setSelectedImageModal(null)}
      />
    </div>
  );
}
