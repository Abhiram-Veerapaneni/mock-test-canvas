import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { isTimestampInFilter } from '../utils/dateUtils';
import ThemeToggle from '../components/common/ThemeToggle';
import LiveConsoleTimeFilter from '../components/proctoring/LiveConsoleTimeFilter';
import LiveTelemetryKPIs from '../components/proctoring/LiveTelemetryKPIs';
import LiveCandidateCard from '../components/proctoring/LiveCandidateCard';
import LiveEvidenceModal from '../components/proctoring/LiveEvidenceModal';
import useLiveProctorFeed from '../hooks/useLiveProctorFeed';
import {
  RefreshCw, Clock, Search, Volume2, VolumeX,
  X, ArrowLeft, ShieldCheck, Loader2
} from 'lucide-react';

export default function ExamLiveMonitorPage() {
  const { testId, examId } = useParams();
  const activeExamId = testId || examId;
  const navigate = useNavigate();

  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImageModal, setSelectedImageModal] = useState(null);
  const [openDropdownIdx, setOpenDropdownIdx] = useState(null);

  const {
    exam,
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
  } = useLiveProctorFeed({ activeExamId });

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

  const handleClose = () => {
    if (window.opener && window.name.startsWith('proctor_')) {
      window.close();
    } else {
      navigate(activeExamId ? `/test/${activeExamId}` : '/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0C0F17] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-150">
      {/* 1. Header & Telemetry Bar */}
      <header className="sticky top-0 z-30 w-full bg-white dark:bg-[#131926] border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={handleClose}
              title="Return to assessment details"
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#162030] transition-colors cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 min-w-0">
              <h1 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 tracking-tight truncate">
                Live Proctoring Console
              </h1>
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-600 text-white shadow-xs shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                Live Feed
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 truncate hidden md:inline">
                {exam?.title || 'Active Assessment'} · <span className="font-mono">ID: {String(activeExamId || '').slice(0, 10)}...</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Mute alert chime' : 'Enable alert chime'}
              className="h-8 px-3 rounded-lg border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#131926] text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-[#162030] shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
              <span className="hidden sm:inline">{soundEnabled ? 'Sound On' : 'Muted'}</span>
            </button>

            <button
              type="button"
              onClick={fetchViolations}
              disabled={isLoading}
              title="Refresh telemetry feed"
              className="h-8 px-3 rounded-lg border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#131926] text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-[#162030] shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sync</span>
            </button>

            <ThemeToggle />

            <button
              type="button"
              onClick={handleClose}
              title="Exit Console"
              className="h-8 px-3 rounded-lg border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#131926] text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-[#162030] shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exit</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Operations Canvas */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-5">
        {/* 2. KPI Summary Row */}
        <LiveTelemetryKPIs
          totalSnapshots={totalSnapshots}
          phoneAlerts={phoneAlerts}
          faceAlerts={faceAlerts}
          uniqueCandidates={uniqueCandidates}
        />

        {/* 3. Filter & Search Toolbar */}
        <section className="bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-slate-800/80 rounded-xl p-3 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                    ? 'bg-indigo-600 text-white dark:bg-indigo-500 dark:text-white shadow-sm shadow-indigo-600/20'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:bg-slate-800/60 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
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

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search candidate or email..."
                className="w-full pl-8 pr-8 py-1.5 bg-white dark:bg-[#0C0F17] border border-slate-200/80 dark:border-slate-800/80 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:focus:ring-indigo-400 transition-colors shadow-sm"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded cursor-pointer"
                  title="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </section>

        {/* Live Window Notice */}
        {missedLiveCount > 0 && (
          <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg bg-white dark:bg-[#131926] border-l-4 border-l-indigo-600 border border-slate-200 dark:border-slate-800 text-xs shadow-xs">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 animate-pulse" />
              <span className="truncate text-slate-700 dark:text-slate-300">
                <strong className="font-semibold text-slate-900 dark:text-slate-100">{missedLiveCount}</strong> new live violation{missedLiveCount > 1 ? 's' : ''} occurred outside the active time window.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleResetTimeFilter}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-2.5 py-1 rounded-md shadow-xs transition-all cursor-pointer"
              >
                View live feed
              </button>
              <button
                type="button"
                onClick={() => setMissedLiveCount(0)}
                className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer"
                title="Dismiss notice"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* 4. Candidate Grid */}
        {isLoading ? (
          <div className="py-24 bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-slate-800/80 rounded-xl flex flex-col items-center justify-center text-slate-400 space-y-2.5 shadow-sm">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Synchronizing live proctoring stream...</span>
          </div>
        ) : error ? (
          <div className="p-4 rounded-lg bg-white dark:bg-[#131926] border-l-4 border-l-rose-600 border border-slate-200 dark:border-slate-800 text-xs flex items-center justify-between shadow-xs">
            <span className="font-medium text-slate-900 dark:text-slate-100">{error}</span>
            <button
              type="button"
              onClick={fetchViolations}
              className="px-3 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-md text-xs font-medium text-slate-700 shadow-xs cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : filteredViolations.length === 0 ? (
          <div className="py-20 bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-slate-800/80 rounded-xl text-center space-y-2 p-8 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Clean Session • No Infractions</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              {timePreset !== 'ALL'
                ? 'No incidents logged within the selected date and time window.'
                : 'No incidents logged matching filter parameters. Verified visual telemetry captures will stream in real time.'}
            </p>
            {timePreset !== 'ALL' && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleResetTimeFilter}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0C0F17] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#162030] shadow-sm transition-colors cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Reset date & time filter</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
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
      </main>

      {/* Evidence Lightbox */}
      <LiveEvidenceModal
        selectedImageModal={selectedImageModal}
        onClose={() => setSelectedImageModal(null)}
      />
    </div>
  );
}
