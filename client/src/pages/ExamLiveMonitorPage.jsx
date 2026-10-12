import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { getSocket, joinExamRoom } from '../services/socket';
import { formatTime12h, formatDateTime12h } from '../utils/dateUtils';
import ThemeToggle from '../components/common/ThemeToggle';
import {
  ShieldAlert, RefreshCw, Eye, AlertTriangle, Clock,
  User, Search, Volume2, VolumeX,
  X, ArrowLeft, Camera, MoreVertical, Flag, VolumeOff,
  UserX, ShieldCheck, ExternalLink, Loader2
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

export default function ExamLiveMonitorPage() {
  const { testId, examId } = useParams();
  const activeExamId = testId || examId;
  const navigate = useNavigate();

  const [exam, setExam] = useState(null);
  const [violations, setViolations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImageModal, setSelectedImageModal] = useState(null);
  const [brokenImages, setBrokenImages] = useState(() => new Set());
  const [openDropdownIdx, setOpenDropdownIdx] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [mutedCandidates, setMutedCandidates] = useState(() => new Set());

  const audioContextRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (!e.target.closest('[data-page-action-dropdown]')) {
        setOpenDropdownIdx(null);
      }
    };
    window.addEventListener('click', handleOutsideClick);
    return () => window.removeEventListener('click', handleOutsideClick);
  }, []);

  const markImageBroken = (url) => {
    setBrokenImages((prev) => new Set(prev).add(url));
  };

  const playAlertChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (_) {}
  };

  const fetchViolations = async () => {
    if (!activeExamId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get(`/exams/${activeExamId}/live-violations`);
      if (res.data?.success) {
        setViolations(res.data.violations || []);
        if (res.data.exam) {
          setExam(res.data.exam);
        }
      }
    } catch (err) {
      console.warn('Failed to load violations:', err);
      setError(err.response?.data?.message || 'Could not fetch proctoring infractions.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!activeExamId) return;
    fetchViolations();

    const socket = getSocket();
    joinExamRoom(activeExamId);

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    if (socket.connected) setIsConnected(true);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    const handleLiveViolation = (data) => {
      if (data.examId === activeExamId) {
        setViolations((prev) => [data, ...prev]);
        playAlertChime();
      }
    };

    socket.on('violation:live', handleLiveViolation);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('violation:live', handleLiveViolation);
    };
  }, [activeExamId]);

  // Exclude non-image events for snapshot gallery
  const filteredViolations = violations.filter((v) => {
    if (!v.imageUrl) return false;
    const matchesFilter = selectedFilter === 'ALL' || v.type === selectedFilter;
    const matchesSearch =
      !searchQuery ||
      (v.userName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.userEmail || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const totalSnapshots = violations.filter((v) => v.imageUrl).length;
  const phoneAlerts = violations.filter((v) => v.type === 'CELL_PHONE' || v.type === 'PROHIBITED_OBJECT').length;
  const faceAlerts = violations.filter((v) => v.type === 'NO_FACE' || v.type === 'MULTI_FACE').length;
  const uniqueCandidates = new Set(violations.map((v) => v.userEmail || v.userName || v.userId)).size;

  const handleClose = () => {
    if (window.opener && window.name.startsWith('proctor_')) {
      window.close();
    } else {
      navigate(activeExamId ? `/test/${activeExamId}` : '/dashboard');
    }
  };

  const toggleMuteCandidate = (candidateId) => {
    setMutedCandidates((prev) => {
      const next = new Set(prev);
      if (next.has(candidateId)) next.delete(candidateId);
      else next.add(candidateId);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0C0F17] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-150">

      {/* ── 1. HEADER & GLOBAL TELEMETRY BAR ── */}
      <header className="sticky top-0 z-30 w-full bg-white dark:bg-[#131926] border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6 py-2.5 shadow-none">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">

          <div className="flex items-center gap-2.5 min-w-0">
            <button
              type="button"
              onClick={handleClose}
              title="Return to assessment details"
              className="p-1 rounded-md text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#162030] transition-colors cursor-pointer shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2 min-w-0">
              <h1 className="text-xs font-semibold text-slate-900 dark:text-slate-100 tracking-tight truncate">
                Live Proctoring Console
              </h1>

              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>

              <span className="text-[11px] text-slate-400 dark:text-slate-500 truncate hidden md:inline">
                {exam?.title || 'Active Assessment'} · <span className="font-mono">ID: {String(activeExamId || '').slice(0, 10)}...</span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Mute alert chime' : 'Enable alert chime'}
              className="h-7 px-2 rounded-md border border-slate-200 dark:border-slate-700/80 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#162030] transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {soundEnabled ? <Volume2 className="w-3 h-3 text-indigo-600 dark:text-indigo-400" /> : <VolumeX className="w-3 h-3 text-slate-400" />}
              <span className="hidden sm:inline">{soundEnabled ? 'Sound On' : 'Muted'}</span>
            </button>

            <button
              type="button"
              onClick={fetchViolations}
              disabled={isLoading}
              title="Refresh telemetry feed"
              className="h-7 px-2 rounded-md border border-slate-200 dark:border-slate-700/80 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#162030] transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Sync</span>
            </button>

            <ThemeToggle />

            <button
              type="button"
              onClick={handleClose}
              title="Exit Console"
              className="h-7 px-2 rounded-md border border-slate-200 dark:border-slate-700/80 text-[11px] font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#162030] transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <X className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exit</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Operations Canvas ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 space-y-3.5">

        {/* ── 2. COMPACT KPI TELEMETRY STRIP ── */}
        <div className="bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-slate-800/80 rounded-lg py-2 px-4 flex flex-wrap items-center justify-between divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-slate-800/80 shadow-sm gap-2 sm:gap-0">
          <div className="flex items-center gap-2.5 px-4 first:pl-0">
            <Camera className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
            <div>
              <span className="text-[9px] font-medium uppercase tracking-wider text-slate-400 block">Evidence Snaps</span>
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 tabular-nums leading-none">{totalSnapshots}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 px-4">
            <ShieldAlert className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
            <div>
              <span className="text-[9px] font-medium uppercase tracking-wider text-slate-400 block">Hardware Flags</span>
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 tabular-nums leading-none">{phoneAlerts}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 px-4">
            <AlertTriangle className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
            <div>
              <span className="text-[9px] font-medium uppercase tracking-wider text-slate-400 block">Biometric Flags</span>
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 tabular-nums leading-none">{faceAlerts}</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5 px-4 last:pr-0">
            <User className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
            <div>
              <span className="text-[9px] font-medium uppercase tracking-wider text-slate-400 block">Active Candidates</span>
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 tabular-nums leading-none">{uniqueCandidates}</span>
            </div>
          </div>
        </div>

        {/* ── 3. FILTER TOOLBAR ── */}
        <div className="bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-slate-800/80 rounded-lg p-2 sm:p-2.5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
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
                  className={`text-[11px] px-2.5 py-1 rounded-md transition-colors whitespace-nowrap cursor-pointer font-medium ${
                    isActive
                      ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-60">
            <Search className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidate or email..."
              className="text-[11px] h-7 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-[#0C0F17] px-2.5 pl-7 w-full text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:bg-white dark:focus:bg-[#0C0F17] focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>

        {/* ── 4. VIDEO-FIRST CANDIDATE TILES (Twitch Mod View / CCTV HUD Grid) ── */}
        {isLoading ? (
          <div className="py-24 bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-slate-800/80 rounded-lg flex flex-col items-center justify-center text-slate-400 space-y-2.5">
            <Loader2 className="w-5 h-5 animate-spin text-slate-500 dark:text-slate-400" />
            <span className="text-xs font-medium">Synchronizing live proctoring stream...</span>
          </div>
        ) : error ? (
          <div className="p-4 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between">
            <span>{error}</span>
            <button
              type="button"
              onClick={fetchViolations}
              className="px-3 py-1 bg-white hover:bg-slate-50 border border-rose-200 rounded-md text-xs font-medium text-rose-700 cursor-pointer"
            >
              Retry
            </button>
          </div>
        ) : filteredViolations.length === 0 ? (
          <div className="py-20 bg-white dark:bg-[#131926] border border-slate-200/80 dark:border-slate-800/80 rounded-lg text-center space-y-2 p-8">
            <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Clean Session • No Infractions</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              No incidents logged matching filter parameters. Verified visual telemetry captures will stream in real time.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filteredViolations.map((v, idx) => {
              const isBroken = brokenImages.has(v.imageUrl);
              const trustScore = v.candidateTrustScore ?? 100;
              const isMuted = mutedCandidates.has(v.userId || v.userEmail);
              const isDropdownOpen = openDropdownIdx === idx;
              const firstName = v.userName ? v.userName.split(' ')[0] : 'Candidate';
              const violationDetails = getViolationDetails(v.type);

              return (
                <div
                  key={idx}
                  className="relative aspect-video rounded-lg overflow-hidden bg-slate-950 border border-slate-800/80 shadow-sm group hover:ring-2 hover:ring-indigo-500 transition-all cursor-pointer select-none"
                  onClick={() => {
                    if (v.imageUrl && !isBroken) setSelectedImageModal(v);
                  }}
                >
                  {/* Video / Snapshot Feed */}
                  {v.imageUrl && !isBroken ? (
                    <img
                      src={v.imageUrl}
                      alt={`Capture of ${v.userName || 'candidate'}`}
                      onError={() => markImageBroken(v.imageUrl)}
                      className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-500 text-xs gap-1 bg-slate-900 w-full h-full">
                      <Camera className="w-4 h-4 text-slate-600" />
                      <span className="text-[10px] font-mono text-slate-400">Feed Unavailable</span>
                    </div>
                  )}

                  {/* HUD Overlay: Top-Left Candidate Badge */}
                  <div className="absolute top-2 left-2 z-10 bg-black/65 backdrop-blur-md px-1.5 py-0.5 rounded text-[9.5px] font-medium text-white flex items-center gap-1 shadow-sm pointer-events-none">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="truncate max-w-[100px]">{firstName}</span>
                    {isMuted && (
                      <span title="Audio muted" className="text-rose-400">
                        <VolumeOff className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>

                  {/* HUD Overlay: Top-Right Violation Flag (Compact, proportional title-case pill) */}
                  {v.type && (
                    <div className={`absolute top-2 right-2 z-10 backdrop-blur-md text-[9px] font-medium px-1.5 py-0.5 rounded shadow-xs flex items-center gap-1 pointer-events-none ${
                      violationDetails.tone === 'critical'
                        ? 'bg-rose-500/90 text-white'
                        : 'bg-amber-500/90 text-black'
                    }`}>
                      <AlertTriangle className="w-2.5 h-2.5" />
                      <span>{violationDetails.label}</span>
                    </div>
                  )}

                  {/* HUD Overlay: Center Hover Enlarge Cue */}
                  <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <span className="bg-black/70 backdrop-blur-md text-white text-[9.5px] font-medium px-2 py-0.5 rounded flex items-center gap-1 shadow-sm">
                      <Eye className="w-2.5 h-2.5" />
                      <span>Inspect Feed</span>
                    </span>
                  </div>

                  {/* HUD Overlay: Bottom-Left Live Telemetry */}
                  <div className="absolute bottom-2 left-2 z-10 bg-black/65 backdrop-blur-md px-1.5 py-0.5 rounded text-[9px] font-mono text-slate-200 flex items-center gap-1.5 shadow-sm pointer-events-none">
                    <div className="flex items-center gap-1">
                      <Clock className="w-2 h-2 text-slate-400" />
                      <span>{v.timestamp ? formatTime12h(v.timestamp, { includeSeconds: true }) : 'Live'}</span>
                    </div>
                    <span className="text-slate-500">•</span>
                    <span>
                      Trust{' '}
                      <strong className={trustScore > 75 ? 'text-emerald-400' : trustScore < 60 ? 'text-rose-400' : 'text-amber-400'}>
                        {trustScore}%
                      </strong>
                    </span>
                  </div>

                  {/* HUD Overlay: Bottom-Right Hover Action Triggers */}
                  <div
                    className="absolute bottom-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-black/70 backdrop-blur-md p-0.5 rounded shadow-sm"
                    onClick={(e) => e.stopPropagation()}
                    data-page-action-dropdown
                  >
                    <button
                      type="button"
                      onClick={() => alert(`Warning issued to ${v.userName || 'Candidate'}: Please remain focused on your examination.`)}
                      className="bg-amber-500 hover:bg-amber-400 text-black font-semibold text-[9px] px-1.5 py-0.5 rounded transition cursor-pointer flex items-center gap-0.5"
                      title="Issue warning"
                    >
                      <ShieldAlert className="w-2.5 h-2.5" />
                      <span>Warn</span>
                    </button>

                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setOpenDropdownIdx(isDropdownOpen ? null : idx)}
                        title="Actions menu"
                        className="text-white hover:bg-white/20 p-1 rounded cursor-pointer transition-colors"
                      >
                        <MoreVertical className="w-3 h-3" />
                      </button>

                      {isDropdownOpen && (
                        <div
                          className="absolute right-0 bottom-full mb-1 w-44 rounded-md bg-[#131926] border border-slate-700 shadow-xl py-1 z-40 text-xs"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              alert(`Flag logged for ${v.userName || 'candidate'} for manual review.`);
                              setOpenDropdownIdx(null);
                            }}
                            className="w-full text-left px-3 py-1.5 text-slate-200 hover:bg-[#162030] flex items-center gap-2 cursor-pointer"
                          >
                            <Flag className="w-3.5 h-3.5 text-slate-400" />
                            <span>Flag for Review</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              toggleMuteCandidate(v.userId || v.userEmail);
                              setOpenDropdownIdx(null);
                            }}
                            className="w-full text-left px-3 py-1.5 text-slate-200 hover:bg-[#162030] flex items-center gap-2 cursor-pointer"
                          >
                            <VolumeOff className="w-3.5 h-3.5 text-slate-400" />
                            <span>{isMuted ? 'Unmute Audio' : 'Mute Audio'}</span>
                          </button>

                          <div className="my-1 border-t border-slate-700/80" />

                          <button
                            type="button"
                            onClick={() => {
                              if (window.confirm(`Disqualify candidate ${v.userName || 'record'} and terminate session?`)) {
                                alert(`Candidate session terminated.`);
                              }
                              setOpenDropdownIdx(null);
                            }}
                            className="w-full text-left px-3 py-1.5 text-rose-400 hover:bg-rose-950/40 flex items-center gap-2 font-medium cursor-pointer"
                          >
                            <UserX className="w-3.5 h-3.5 text-rose-500" />
                            <span>Disqualify Candidate</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* ── High-Resolution Photo Lightbox ── */}
      {selectedImageModal && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedImageModal(null)}
        >
          <div
            className="max-w-3xl w-full bg-white dark:bg-[#131926] border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden p-5 text-slate-900 dark:text-slate-100 space-y-4 shadow-2xl"
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
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#162030] cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-lg overflow-hidden bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-center max-h-[65vh]">
              <img
                src={selectedImageModal.imageUrl}
                alt="Infraction capture full"
                className="max-h-[65vh] w-auto object-contain"
              />
            </div>

            <div className="flex items-center justify-between pt-1 text-xs">
              <div className="text-slate-500 dark:text-slate-400 font-mono">
                Trust Score: <strong className="text-slate-900 dark:text-slate-100">{selectedImageModal.candidateTrustScore ?? 100}%</strong>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={selectedImageModal.imageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="h-8 px-3 rounded-md border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#162030] transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <span>Original Image</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <button
                  type="button"
                  onClick={() => setSelectedImageModal(null)}
                  className="h-8 px-3 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors cursor-pointer"
                >
                  Close Evidence
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
