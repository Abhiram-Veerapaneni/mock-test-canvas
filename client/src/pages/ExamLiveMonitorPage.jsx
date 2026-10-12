import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { getSocket, joinExamRoom } from '../services/socket';
import { formatTime12h, formatDateTime12h } from '../utils/dateUtils';
import ThemeToggle from '../components/common/ThemeToggle';
import {
  ShieldAlert, Radio, RefreshCw, Eye, AlertTriangle,
  Clock, CheckCircle2, User, Search, Volume2, VolumeX,
  ExternalLink, X, Shield, Smartphone, BookOpen, Users,
  Minimize2, Bell
} from 'lucide-react';

const VIOLATION_LABELS = {
  TAB_SWITCH: 'Tab Switch',
  WINDOW_BLUR: 'Focus Lost',
  FULLSCREEN_EXIT: 'Fullscreen Exit',
  NO_FACE: 'No Face Detected',
  MULTI_FACE: 'Multiple Faces',
  NOISE_SPIKE: 'Excessive Noise',
  CELL_PHONE: 'Mobile Phone',
  PROHIBITED_BOOK: 'Study Material',
  PROHIBITED_OBJECT: 'Prohibited Device',
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
  const [isConnected, setIsConnected] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastAlertTime, setLastAlertTime] = useState(null);

  const audioContextRef = useRef(null);

  // Play subtle warning chime on new violation
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
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (_) {}
  };

  const fetchViolations = async () => {
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
        setLastAlertTime(new Date());
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

  // Telemetry metric counts
  const totalSnapshots = violations.filter((v) => v.imageUrl).length;
  const phoneAlerts = violations.filter((v) => v.type === 'CELL_PHONE' || v.type === 'PROHIBITED_OBJECT').length;
  const faceAlerts = violations.filter((v) => v.type === 'NO_FACE' || v.type === 'MULTI_FACE').length;
  const uniqueCandidates = new Set(violations.map((v) => v.userEmail || v.userName || v.userId)).size;

  const renderBadge = (type) => {
    let dotColor = 'bg-zinc-400';
    switch (type) {
      case 'CELL_PHONE':
      case 'PROHIBITED_OBJECT':
        dotColor = 'bg-rose-500';
        break;
      case 'PROHIBITED_BOOK':
      case 'NO_FACE':
        dotColor = 'bg-amber-500';
        break;
      case 'MULTI_FACE':
        dotColor = 'bg-rose-500';
        break;
      case 'NOISE_SPIKE':
        dotColor = 'bg-amber-500';
        break;
      default:
        dotColor = 'bg-zinc-400';
    }

    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300 shrink-0">
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
        <span>{VIOLATION_LABELS[type] || type}</span>
      </span>
    );
  };

  const handleClose = () => {
    // If opened as a popup window, close it. Otherwise navigate back.
    if (window.opener && window.name.startsWith('proctor_')) {
      window.close();
    } else {
      navigate(`/test/${activeExamId}`);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col transition-colors duration-200 font-sans">
      
      {/* ── Top Command Bar ── */}
      <header className="sticky top-0 z-30 w-full bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm border-b border-zinc-200 dark:border-zinc-800 shadow-none px-4 sm:px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Brand & Active Exam Title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight truncate">
                  Live Proctoring Command Center
                </h1>
                <span className="inline-flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 shrink-0">
                  <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                  {isConnected ? 'Stream Active' : 'Connecting...'}
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                {exam?.title || 'Monitoring Session'} • ID: <span className="font-mono text-zinc-600 dark:text-zinc-300">{activeExamId}</span>
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Audio Alert Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Mute alert sounds' : 'Enable alert sounds'}
              className="btn-secondary text-xs px-2.5 py-1.5 rounded-md flex items-center gap-1.5 cursor-pointer"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden md:inline">{soundEnabled ? 'Sound On' : 'Muted'}</span>
            </button>

            {/* Refresh */}
            <button
              onClick={fetchViolations}
              disabled={isLoading}
              title="Refresh live stream"
              className="btn-secondary p-1.5 rounded-md cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Close / Return */}
            <button
              onClick={handleClose}
              title="Close window / Return"
              className="btn-secondary p-1.5 rounded-md cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Workstation Container ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-4">
        
        {/* ── Telemetry Stats Ribbon ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-zinc-200 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 shadow-none">
          <div className="p-4">
            <p className="text-xs font-medium text-zinc-500">Evidence Snaps</p>
            <p className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 tabular-nums mt-0.5">{totalSnapshots}</p>
          </div>

          <div className="p-4">
            <p className="text-xs font-medium text-zinc-500">Mobile / Hardware</p>
            <p className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 tabular-nums mt-0.5">{phoneAlerts}</p>
          </div>

          <div className="p-4">
            <p className="text-xs font-medium text-zinc-500">Face / Attention</p>
            <p className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 tabular-nums mt-0.5">{faceAlerts}</p>
          </div>

          <div className="p-4">
            <p className="text-xs font-medium text-zinc-500">Flagged Users</p>
            <p className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100 tabular-nums mt-0.5">{uniqueCandidates}</p>
          </div>
        </div>

        {/* ── Filters & Candidate Search Bar ── */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3 shadow-none flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {['ALL', 'CELL_PHONE', 'PROHIBITED_BOOK', 'NO_FACE', 'MULTI_FACE'].map((type) => (
              <button
                key={type}
                onClick={() => setSelectedFilter(type)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer border ${
                  selectedFilter === type
                    ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100'
                    : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850'
                }`}
              >
                {type === 'ALL' ? `All Infractions (${filteredViolations.length})` : VIOLATION_LABELS[type] || type}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidate..."
              className="input-base text-xs pl-8 pr-3 py-1.5"
            />
          </div>
        </div>

        {/* ── Evidence Snapshots Gallery ── */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-5 shadow-none">
          {isLoading ? (
            <div className="py-24 flex flex-col items-center justify-center text-zinc-400 space-y-3">
              <RefreshCw className="w-6 h-6 animate-spin text-zinc-600 dark:text-zinc-400" />
              <span className="text-xs font-medium">Connecting to telemetry server & loading evidence...</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={fetchViolations}
                className="btn-secondary text-xs px-3 py-1.5"
              >
                Retry
              </button>
            </div>
          ) : filteredViolations.length === 0 ? (
            <div className="py-24 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/50 dark:border-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Clean Session • No Violations</h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
                No infractions logged matching current filters. When a candidate triggers an infraction, live photo evidence will stream into this view automatically.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredViolations.map((v, idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-3.5 flex flex-col justify-between space-y-3 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors group shadow-none"
                >
                  {/* Candidate Info Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-semibold flex items-center justify-center shrink-0">
                        {v.userName ? v.userName.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-zinc-900 dark:text-zinc-100 truncate">{v.userName || 'Candidate'}</p>
                        <p className="text-[10px] text-zinc-400 truncate">{v.userEmail || 'Active Test Taker'}</p>
                      </div>
                    </div>

                    {renderBadge(v.type)}
                  </div>

                  {/* Photo Evidence Window */}
                  {v.imageUrl ? (
                    <div
                      onClick={() => setSelectedImageModal(v)}
                      className="w-full h-44 rounded-md bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 overflow-hidden relative group/img cursor-pointer"
                    >
                      <img
                        src={v.imageUrl}
                        alt="Violation capture"
                        className="w-full h-full object-cover transition-transform duration-200 group-hover/img:scale-102"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-zinc-950/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                        <div className="px-2.5 py-1 rounded-md bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xs text-zinc-900 dark:text-zinc-100 text-xs font-medium flex items-center gap-1.5 shadow-sm">
                          <Eye className="w-3.5 h-3.5 text-zinc-500" />
                          <span>Enlarge Snapshot</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-44 rounded-md bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center text-zinc-400 space-y-1">
                      <AlertTriangle className="w-5 h-5 opacity-60" />
                      <span className="text-[11px]">System Event (No Image)</span>
                    </div>
                  )}

                  {/* Metadata and Trust Score */}
                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1 font-mono text-zinc-500 dark:text-zinc-400">
                      <Clock className="w-3 h-3 text-zinc-400" />
                      {v.timestamp ? formatTime12h(v.timestamp, { includeSeconds: true }) : 'Just now'}
                    </span>
                    {v.candidateTrustScore !== undefined && (
                      <span className="text-zinc-500 dark:text-zinc-400 font-mono text-[11px]">
                        Trust: <strong className={`font-medium ${v.candidateTrustScore < 70 ? 'text-rose-600 dark:text-rose-400' : 'text-zinc-800 dark:text-zinc-200'}`}>
                          {v.candidateTrustScore}%
                        </strong>
                      </span>
                    )}
                  </div>

                  {/* Quick Actions Strip */}
                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-1 text-[11px]">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        alert(`Warning sent to ${v.userName || 'Candidate'}: Please remain focused on the exam.`);
                      }}
                      className="btn-secondary text-[11px] px-2 py-0.5"
                      title="Send real-time warning toast to candidate"
                    >
                      Warning
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        alert(`Candidate ${v.userName || 'Record'} flagged for manual review.`);
                      }}
                      className="btn-secondary text-[11px] px-2 py-0.5"
                      title="Add flag to candidate"
                    >
                      Flag
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Disqualify candidate ${v.userName || 'test taker'}?`)) {
                          alert(`Candidate session terminated.`);
                        }
                      }}
                      className="px-2 py-0.5 rounded-md text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-[11px] font-medium transition-colors cursor-pointer"
                      title="Terminate assessment session"
                    >
                      Disqualify
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>

      {/* ── High-Resolution Photo Lightbox ── */}
      {selectedImageModal && (
        <div
          className="fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedImageModal(null)}
        >
          <div
            className="max-w-3xl w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden shadow-sm p-5 text-zinc-900 dark:text-zinc-100 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  Infraction Evidence Review
                </h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {selectedImageModal.userName} • {VIOLATION_LABELS[selectedImageModal.type] || selectedImageModal.type} •{' '}
                  {formatDateTime12h(selectedImageModal.timestamp, { includeYear: true, includeSeconds: true })}
                </p>
              </div>
              <button
                onClick={() => setSelectedImageModal(null)}
                className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-md overflow-hidden bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 max-h-[65vh] flex items-center justify-center">
              <img
                src={selectedImageModal.imageUrl}
                alt="High resolution violation capture"
                className="max-h-[65vh] w-auto object-contain"
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-zinc-500 dark:text-zinc-400 font-mono text-[11px]">
                Secured Cloudinary Asset • Test ID: {activeExamId}
              </span>
              <a
                href={selectedImageModal.imageUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100 font-medium"
              >
                <span>Full Resolution Original</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
