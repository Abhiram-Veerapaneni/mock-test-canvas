import React, { useState, useEffect, useRef } from 'react';
import { getSocket, joinExamRoom } from '../../services/socket';
import api from '../../services/api';
import { formatTime12h, formatDateTime12h, isTimestampInFilter } from '../../utils/dateUtils';
import LiveConsoleTimeFilter from './LiveConsoleTimeFilter';
import {
  ShieldAlert,
  ExternalLink,
  X,
  RefreshCw,
  Eye,
  Clock,
  User,
  Search,
  Camera,
  MoreVertical,
  Flag,
  VolumeOff,
  UserX,
  ShieldCheck,
  Loader2,
  AlertTriangle
} from 'lucide-react';

const VIOLATION_CONFIG = {
  CELL_PHONE: { label: 'Mobile Phone', tone: 'critical' },
  PROHIBITED_OBJECT: { label: 'Prohibited Device', tone: 'critical' },
  MULTI_FACE: { label: 'Multiple Faces', tone: 'warning' },
  NO_FACE: { label: 'No Face', tone: 'warning' },
  PROHIBITED_BOOK: { label: 'Study Material', tone: 'warning' },
  NOISE_SPIKE: { label: 'Noise Detected', tone: 'warning' },
  TAB_SWITCH: { label: 'Tab Switch', tone: 'neutral' },
  WINDOW_BLUR: { label: 'Focus Lost', tone: 'neutral' },
  FULLSCREEN_EXIT: { label: 'Fullscreen Exit', tone: 'neutral' },
};

const getViolationDetails = (type) => {
  if (!type) return { label: 'Infraction', tone: 'warning' };
  if (VIOLATION_CONFIG[type]) return VIOLATION_CONFIG[type];
  const formatted = type.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
  return { label: formatted, tone: 'warning' };
};

const getViolationBadgeStyle = (tone) => {
  if (tone === 'critical') {
    return 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60';
  }
  if (tone === 'warning') {
    return 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60';
  }
  return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/60 dark:text-slate-300 dark:border-slate-700';
};

const getTrustScoreStyle = (score) => {
  const val = score ?? 100;
  if (val >= 80) {
    return {
      badgeClass: 'text-emerald-700 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
      label: 'Good'
    };
  }
  if (val >= 50) {
    return {
      badgeClass: 'text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
      label: 'Review'
    };
  }
  return {
    badgeClass: 'text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/60',
    label: 'High Risk'
  };
};

export default function ExamLiveMonitorModal({ isOpen, onClose, examId, examTitle }) {
  const [violations, setViolations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImageModal, setSelectedImageModal] = useState(null);
  const [brokenImages, setBrokenImages] = useState(() => new Set());
  const [openDropdownIdx, setOpenDropdownIdx] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [mutedCandidates, setMutedCandidates] = useState(() => new Set());

  // Date & Time Filter state
  const [timePreset, setTimePreset] = useState('ALL');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [missedLiveCount, setMissedLiveCount] = useState(0);

  const filterStateRef = useRef({ timePreset, customStart, customEnd });
  useEffect(() => {
    filterStateRef.current = { timePreset, customStart, customEnd };
  }, [timePreset, customStart, customEnd]);

  // Rolling timer tick for relative presets ('15M', '1H')
  const [, setTimeTick] = useState(0);
  useEffect(() => {
    if (timePreset === '15M' || timePreset === '1H') {
      const interval = setInterval(() => {
        setTimeTick((t) => t + 1);
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [timePreset]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('[data-modal-action-dropdown]')) {
        setOpenDropdownIdx(null);
      }
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const markImageBroken = (url) => {
    setBrokenImages((prev) => new Set(prev).add(url));
  };

  const fetchViolations = async () => {
    if (!examId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get(`/exams/${examId}/live-violations`);
      if (res.data?.success) {
        setViolations(res.data.violations || []);
      }
    } catch (err) {
      console.warn('Failed to load initial violations:', err);
      setError(err.response?.data?.message || 'Could not fetch proctoring infractions.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!isOpen || !examId) return;

    fetchViolations();

    const socket = getSocket();
    joinExamRoom(examId);

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    if (socket.connected) setIsConnected(true);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    const handleLiveViolation = (data) => {
      if (data.examId === examId) {
        setViolations((prev) => [data, ...prev]);

        const { timePreset: currentPreset, customStart: currentStart, customEnd: currentEnd } = filterStateRef.current;
        if (currentPreset !== 'ALL') {
          const isWithinWindow = isTimestampInFilter(data.timestamp, {
            timePreset: currentPreset,
            customStart: currentStart,
            customEnd: currentEnd,
          });
          if (!isWithinWindow) {
            setMissedLiveCount((prev) => prev + 1);
          }
        }
      }
    };

    socket.on('violation:live', handleLiveViolation);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('violation:live', handleLiveViolation);
    };
  }, [isOpen, examId]);

  // 1. Filter violations by date & time window
  const timeFilteredViolations = violations.filter((v) =>
    isTimestampInFilter(v.timestamp, {
      timePreset,
      customStart,
      customEnd,
    })
  );

  // 2. Filter by visual evidence, infraction type, and search query
  const filteredViolations = timeFilteredViolations.filter((v) => {
    if (!v.imageUrl) return false;
    const matchesFilter = selectedFilter === 'ALL' || v.type === selectedFilter;
    const matchesSearch =
      !searchQuery ||
      (v.userName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.userEmail || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Telemetry metric counts
  const totalSnapshots = timeFilteredViolations.filter((v) => v.imageUrl).length;
  const phoneAlerts = timeFilteredViolations.filter((v) => v.type === 'CELL_PHONE' || v.type === 'PROHIBITED_OBJECT').length;
  const faceAlerts = timeFilteredViolations.filter((v) => v.type === 'NO_FACE' || v.type === 'MULTI_FACE').length;
  const uniqueCandidates = new Set(timeFilteredViolations.map((v) => v.userEmail || v.userName || v.userId)).size;

  const handleResetTimeFilter = () => {
    setTimePreset('ALL');
    setCustomStart('');
    setCustomEnd('');
    setMissedLiveCount(0);
  };

  const handleOpenInNewWindow = () => {
    const width = Math.min(1400, window.screen.availWidth - 80);
    const height = Math.min(900, window.screen.availHeight - 80);
    const left = Math.max(0, (window.screen.availWidth - width) / 2);
    const top = Math.max(0, (window.screen.availHeight - height) / 2);

    window.open(
      `/test/${examId}/live`,
      `proctor_live_${examId}`,
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=no,toolbar=no,menubar=no,location=no`
    );
  };

  const toggleMuteCandidate = (candidateId) => {
    setMutedCandidates((prev) => {
      const next = new Set(prev);
      if (next.has(candidateId)) next.delete(candidateId);
      else next.add(candidateId);
      return next;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="max-w-7xl w-full bg-[#F8FAFC] dark:bg-[#0C0F17] border border-slate-200/80 dark:border-slate-800/80 rounded-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-900 dark:text-slate-100 shadow-2xl font-sans transition-colors duration-150">

        {/* ── 1. SOLID TOP CONSOLE BAR ── */}
        <div className="px-5 sm:px-6 py-3 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between gap-4 bg-white dark:bg-[#131926] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100 tracking-tight truncate">
              Live Proctoring Console
            </h2>

            {/* Active Session Pill */}
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/80 shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Live Feed</span>
            </span>

            {/* Session Meta */}
            <span className="text-xs text-slate-500 dark:text-slate-400 truncate hidden sm:inline">
              {examTitle} · <span className="font-mono">ID: {String(examId).slice(0, 8)}...</span>
            </span>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleOpenInNewWindow}
              title="Open in separate workstation window"
              className="h-8 px-3 rounded-lg border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#131926] text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-[#162030] shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Window</span>
            </button>

            <button
              type="button"
              onClick={fetchViolations}
              disabled={isLoading}
              title="Refresh telemetry"
              className="h-8 px-3 rounded-lg border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#131926] text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-[#162030] shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sync</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              title="Close console modal"
              className="h-8 px-2 rounded-lg border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#131926] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#162030] shadow-sm transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── 2. TOP METRIC KPI ROW (B2B SaaS Summary Cards) ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/80 dark:divide-slate-800/80 border-b border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#131926] shrink-0">
          <div className="p-3.5 sm:p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Evidence Snaps
              </span>
              <Camera className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            </div>
            <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums mt-1">
              {totalSnapshots}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Visual evidence captures</p>
          </div>

          <div className="p-3.5 sm:p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Hardware Flags
              </span>
              <ShieldAlert className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            </div>
            <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums mt-1">
              {phoneAlerts}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Mobile phones & devices</p>
          </div>

          <div className="p-3.5 sm:p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Biometric Flags
              </span>
              <AlertTriangle className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            </div>
            <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums mt-1">
              {faceAlerts}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Face presence & orientation</p>
          </div>

          <div className="p-3.5 sm:p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Active Candidates
              </span>
              <User className="w-4 h-4 text-slate-400 dark:text-slate-500" />
            </div>
            <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums mt-1">
              {uniqueCandidates}
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">In this proctoring stream</p>
          </div>
        </div>

        {/* ── 3. FILTER & SEARCH TOOLBAR ── */}
        <div className="px-5 sm:px-6 py-2.5 border-b border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#131926] flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { key: 'ALL', label: `All (${filteredViolations.length})` },
              { key: 'CELL_PHONE', label: `Phones (${phoneAlerts})` },
              { key: 'MULTI_FACE', label: `Faces (${faceAlerts})` },
              { key: 'NO_FACE', label: 'No Face' },
            ].map(({ key, label }) => {
              const isActive = selectedFilter === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedFilter(key)}
                  className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-indigo-600 text-white dark:bg-indigo-500 dark:text-white shadow-sm shadow-indigo-600/20'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 dark:bg-slate-800/60 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100'
                  }`}
                >
                  {label}
                </button>
              );
            })}
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

            <div className="relative w-full sm:w-60">
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
        </div>

        {/* Subtle Live Notice (when events arrive outside filtered time window) */}
        {missedLiveCount > 0 && (
          <div className="mx-5 sm:mx-6 mt-3 flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/60 text-xs text-indigo-900 dark:text-indigo-200 shadow-sm shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0 animate-pulse" />
              <span className="truncate">
                <strong className="font-semibold text-slate-900 dark:text-slate-100">{missedLiveCount}</strong> new live violation{missedLiveCount > 1 ? 's' : ''} occurred outside the active time window.
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleResetTimeFilter}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs px-2.5 py-1 rounded-lg shadow-sm shadow-indigo-600/20 transition-all cursor-pointer"
              >
                View live
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

        {/* ── 4. STRUCTURED CANDIDATE CARDS (B2B SaaS Video Grid) ── */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-[#F8FAFC] dark:bg-[#0C0F17]">
          {isLoading ? (
            <div className="py-24 bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-slate-800/80 rounded-xl flex flex-col items-center justify-center text-slate-400 space-y-2.5 shadow-sm">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-600 dark:text-indigo-400" />
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Synchronizing live proctoring stream...</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between shadow-sm">
              <span>{error}</span>
              <button
                type="button"
                onClick={fetchViolations}
                className="px-3 py-1 bg-white hover:bg-slate-50 border border-rose-200 rounded-lg text-xs font-medium text-rose-700 shadow-sm cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : filteredViolations.length === 0 ? (
            <div className="py-16 bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-slate-800/80 rounded-xl text-center space-y-2 p-8 shadow-sm">
              <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto">
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
              {filteredViolations.map((v, idx) => {
                const isBroken = brokenImages.has(v.imageUrl);
                const trustScore = v.candidateTrustScore ?? 100;
                const isMuted = mutedCandidates.has(v.userId || v.userEmail);
                const isDropdownOpen = openDropdownIdx === idx;
                const violationDetails = getViolationDetails(v.type);
                const trustInfo = getTrustScoreStyle(trustScore);

                return (
                  <div
                    key={idx}
                    className="bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-slate-800/80 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden group"
                  >
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
                        if (v.imageUrl && !isBroken) setSelectedImageModal(v);
                      }}
                    >
                      {v.imageUrl && !isBroken ? (
                        <>
                          <img
                            src={v.imageUrl}
                            alt={`Capture of ${v.userName || 'candidate'}`}
                            onError={() => markImageBroken(v.imageUrl)}
                            className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                            loading="lazy"
                          />
                          {/* Subtle Hover Inspect Cue */}
                          <div className="absolute inset-0 bg-slate-900/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="bg-white/95 dark:bg-[#131926]/95 text-slate-800 dark:text-slate-100 text-xs font-medium px-2.5 py-1 rounded-lg shadow-sm border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-1.5">
                              <Eye className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                              <span>Enlarge Snapshot</span>
                            </span>
                          </div>
                        </>
                      ) : (
                        /* Clean Offline SaaS Placeholder */
                        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800/40 text-slate-400 space-y-1.5">
                          <Camera className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Feed Unavailable</span>
                        </div>
                      )}
                    </div>

                    {/* 3. Footer / Metadata Row (Below Feed, not overlaying faces) */}
                    <div className="px-3.5 py-2.5 bg-white dark:bg-[#131926] border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 text-xs">
                      {/* Timestamp */}
                      <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{v.timestamp ? formatTime12h(v.timestamp, { includeSeconds: true }) : 'Live'}</span>
                      </div>

                      {/* Right: Trust Score & Actions Menu */}
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border ${trustInfo.badgeClass}`}
                          title={`Trust Score: ${trustScore}% (${trustInfo.label})`}
                        >
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-normal">Trust</span>
                          <strong className="font-semibold tabular-nums">{trustScore}%</strong>
                        </span>

                        <div className="relative" data-modal-action-dropdown>
                          <button
                            type="button"
                            onClick={() => setOpenDropdownIdx(isDropdownOpen ? null : idx)}
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
                                  setOpenDropdownIdx(null);
                                }}
                                className="w-full text-left px-3 py-1.5 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#162030] flex items-center gap-2 cursor-pointer font-medium"
                              >
                                <Flag className="w-3.5 h-3.5 text-amber-500" />
                                <span>Issue Warning</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  toggleMuteCandidate(v.userId || v.userEmail);
                                  setOpenDropdownIdx(null);
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
                                  setOpenDropdownIdx(null);
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
              })}
            </div>
          )}
        </div>

        {/* ── High-Resolution Photo Lightbox ── */}
        {selectedImageModal && (
          <div
            className="fixed inset-0 z-70 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedImageModal(null)}
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
                  onClick={() => setSelectedImageModal(null)}
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
                    onClick={() => setSelectedImageModal(null)}
                    className="h-8 px-3.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-sm shadow-indigo-600/20 transition-all cursor-pointer"
                  >
                    Close Evidence
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
