import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { getSocket, joinExamRoom } from '../services/socket';
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
    let dotColor = 'bg-blue-400';
    switch (type) {
      case 'CELL_PHONE':
      case 'PROHIBITED_OBJECT':
        dotColor = 'bg-rose-400';
        break;
      case 'PROHIBITED_BOOK':
      case 'NO_FACE':
        dotColor = 'bg-amber-400';
        break;
      case 'MULTI_FACE':
        dotColor = 'bg-indigo-400';
        break;
      case 'NOISE_SPIKE':
        dotColor = 'bg-sky-400';
        break;
      default:
        dotColor = 'bg-blue-400';
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-[#1e293b] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 shrink-0">
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
    <div className="min-h-screen bg-[#edf2f9] dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200 font-sans">
      
      {/* ── Top Command Bar ── */}
      <header className="sticky top-0 z-30 w-full bg-white/95 dark:bg-[#151f32]/95 backdrop-blur-md border-b border-slate-200/90 dark:border-[#334155] shadow-xs px-4 sm:px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Brand & Active Exam Title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight truncate">
                  Live Proctoring Command Center
                </h1>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-medium border shrink-0 ${
                  isConnected
                    ? 'bg-slate-100 dark:bg-[#1e293b] text-slate-700 dark:text-slate-300 border-slate-200/90 dark:border-slate-700'
                    : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                  {isConnected ? 'Stream Active' : 'Connecting...'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {exam?.title || 'Monitoring Session'} • ID: <span className="font-mono">{activeExamId}</span>
              </p>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Audio Alert Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Mute alert sounds' : 'Enable alert sounds'}
              className={`p-2 rounded-xl border text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                soundEnabled
                  ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700/50'
                  : 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-[#1e293b] dark:text-slate-400 dark:border-[#334155]'
              }`}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden md:inline">{soundEnabled ? 'Sound On' : 'Muted'}</span>
            </button>

            {/* Refresh */}
            <button
              onClick={fetchViolations}
              disabled={isLoading}
              title="Refresh live stream"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1e293b] dark:hover:bg-[#243147] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-[#334155] transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Close / Return */}
            <button
              onClick={handleClose}
              title="Close window / Return"
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1e293b] dark:hover:bg-[#243147] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-[#334155] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Workstation Container ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-4">
        
        {/* ── Telemetry Stats Ribbon ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-[#1e293b] border border-slate-200/90 dark:border-[#334155] rounded-xl p-3.5 shadow-2xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-[#151f32] border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-center text-slate-600 dark:text-slate-300">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Evidence Snaps</p>
              <p className="text-xl font-semibold text-slate-900 dark:text-slate-100 tabular-nums">{totalSnapshots}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1e293b] border border-slate-200/90 dark:border-[#334155] rounded-xl p-3.5 shadow-2xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-[#151f32] border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-center text-rose-500 dark:text-rose-400">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Mobile / Hardware</p>
              <p className="text-xl font-semibold text-slate-900 dark:text-slate-100 tabular-nums">{phoneAlerts}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1e293b] border border-slate-200/90 dark:border-[#334155] rounded-xl p-3.5 shadow-2xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-[#151f32] border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-center text-amber-500 dark:text-amber-400">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Face / Attention</p>
              <p className="text-xl font-semibold text-slate-900 dark:text-slate-100 tabular-nums">{faceAlerts}</p>
            </div>
          </div>

          <div className="bg-white dark:bg-[#1e293b] border border-slate-200/90 dark:border-[#334155] rounded-xl p-3.5 shadow-2xs flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-[#151f32] border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-center text-emerald-500 dark:text-emerald-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Flagged Users</p>
              <p className="text-xl font-semibold text-slate-900 dark:text-slate-100 tabular-nums">{uniqueCandidates}</p>
            </div>
          </div>
        </div>

        {/* ── Filters & Candidate Search Bar ── */}
        <div className="bg-white dark:bg-[#1e293b] border border-slate-200/90 dark:border-[#334155] rounded-xl p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {['ALL', 'CELL_PHONE', 'PROHIBITED_BOOK', 'NO_FACE', 'MULTI_FACE'].map((type) => (
              <button
                key={type}
                onClick={() => setSelectedFilter(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedFilter === type
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-[#151f32] dark:hover:bg-[#243147] text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-[#334155]'
                }`}
              >
                {type === 'ALL' ? `All Infractions (${filteredViolations.length})` : VIOLATION_LABELS[type] || type}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidate name or email..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-[#151f32] border border-slate-200 dark:border-[#334155] rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        {/* ── Evidence Snapshots Gallery ── */}
        <div className="bg-white dark:bg-[#1e293b] border border-slate-200/90 dark:border-[#334155] rounded-2xl p-5 shadow-xs">
          {isLoading ? (
            <div className="py-24 flex flex-col items-center justify-center text-slate-400 space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
              <span className="text-xs font-medium">Connecting to telemetry server & loading evidence...</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={fetchViolations}
                className="px-3 py-1.5 bg-white dark:bg-[#243147] border border-rose-300 dark:border-rose-700 rounded-lg font-medium cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : filteredViolations.length === 0 ? (
            <div className="py-24 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Clean Session • No Violations</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                No infractions logged matching current filters. When a candidate triggers an infraction (such as drawing a mobile phone or leaving camera view), live photo evidence will stream into this view automatically.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredViolations.map((v, idx) => (
                <div
                  key={idx}
                  className="bg-[#f8fafc] dark:bg-[#151f32] border border-slate-200/90 dark:border-[#334155] rounded-xl p-3.5 flex flex-col justify-between space-y-3 hover:border-blue-500/60 transition-all group shadow-2xs"
                >
                  {/* Candidate Info Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700/70 border border-slate-300/80 dark:border-slate-600/60 flex items-center justify-center text-slate-700 dark:text-slate-300 text-xs font-bold shrink-0">
                        {v.userName ? v.userName.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{v.userName || 'Candidate'}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{v.userEmail || 'Active Test Taker'}</p>
                      </div>
                    </div>

                    {renderBadge(v.type)}
                  </div>

                  {/* Photo Evidence Window */}
                  {v.imageUrl ? (
                    <div
                      onClick={() => setSelectedImageModal(v)}
                      className="w-full h-44 rounded-xl bg-slate-100 dark:bg-[#0f172a] border border-slate-200/80 dark:border-[#243147] overflow-hidden relative group/img cursor-pointer"
                    >
                      <img
                        src={v.imageUrl}
                        alt="Violation capture"
                        className="w-full h-full object-cover transition-transform duration-200 group-hover/img:scale-102"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                        <div className="px-3 py-1.5 rounded-lg bg-white/95 dark:bg-[#1e293b]/95 backdrop-blur-xs text-slate-900 dark:text-white text-xs font-semibold flex items-center gap-1.5 shadow-md">
                          <Eye className="w-3.5 h-3.5 text-blue-500" />
                          <span>Enlarge Snapshot</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-44 rounded-xl bg-slate-100 dark:bg-[#0f172a] border border-slate-200/80 dark:border-[#243147] flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 space-y-1">
                      <AlertTriangle className="w-6 h-6 opacity-60" />
                      <span className="text-[11px]">System Event (No Image)</span>
                    </div>
                  )}

                  {/* Metadata and Trust Score */}
                  <div className="pt-2 border-t border-slate-200/80 dark:border-[#334155] flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1 font-mono text-slate-500 dark:text-slate-400">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {v.timestamp ? new Date(v.timestamp).toLocaleTimeString() : 'Just now'}
                    </span>
                    {v.candidateTrustScore !== undefined && (
                      <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        Trust: <strong className={`font-semibold ${v.candidateTrustScore < 70 ? 'text-rose-500 dark:text-rose-300' : 'text-slate-800 dark:text-slate-200'}`}>
                          {v.candidateTrustScore}%
                        </strong>
                      </span>
                    )}
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
          className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setSelectedImageModal(null)}
        >
          <div
            className="max-w-3xl w-full bg-white dark:bg-[#1e293b] border border-slate-200/90 dark:border-[#334155] rounded-2xl overflow-hidden shadow-2xl p-5 text-slate-900 dark:text-slate-100 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Infraction Evidence Review
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedImageModal.userName} • {VIOLATION_LABELS[selectedImageModal.type] || selectedImageModal.type} •{' '}
                  {new Date(selectedImageModal.timestamp).toLocaleString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedImageModal(null)}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#151f32] dark:hover:bg-[#243147] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors border border-slate-200/80 dark:border-[#334155]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-xl overflow-hidden bg-slate-100 dark:bg-[#0f172a] border border-slate-200/80 dark:border-[#334155] max-h-[65vh] flex items-center justify-center">
              <img
                src={selectedImageModal.imageUrl}
                alt="High resolution violation capture"
                className="max-h-[65vh] w-auto object-contain"
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                Secured Cloudinary Asset • Test ID: {activeExamId}
              </span>
              <a
                href={selectedImageModal.imageUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-semibold"
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
