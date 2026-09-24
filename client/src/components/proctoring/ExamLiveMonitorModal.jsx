import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { getSocket, joinExamRoom } from '../../services/socket';
import {
  ShieldAlert, Radio, X, Loader2, Users, Eye, EyeOff,
  Volume2, AlertTriangle, RefreshCw, Calendar, Clock,
  ExternalLink, CheckCircle2, User, Search
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

export default function ExamLiveMonitorModal({ examId, examTitle, onClose }) {
  const [violations, setViolations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedImageModal, setSelectedImageModal] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Fetch initial violations from backend
  const fetchViolations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get(`/exams/${examId}/live-violations`);
      if (res.data?.success) {
        setViolations(res.data.violations || []);
      }
    } catch (err) {
      console.warn('Failed to load violations:', err);
      setError(err.response?.data?.message || 'Could not fetch violations.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchViolations();

    // Setup real-time Socket.IO listener for this exam
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
      }
    };

    socket.on('violation:live', handleLiveViolation);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('violation:live', handleLiveViolation);
    };
  }, [examId]);

  // In live alerting image grid, exclude tab switches and non-image violations
  const filteredViolations = violations.filter((v) => {
    if (!v.imageUrl) return false; // Exclude non-image events like tab switch
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

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="max-w-5xl w-full bg-white dark:bg-[#1e293b] border border-slate-200/90 dark:border-[#334155] rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-900 dark:text-slate-100 transition-colors duration-200">

        {/* ── Modal Header ── */}
        <div className="px-5 sm:px-6 py-3.5 border-b border-slate-200/90 dark:border-[#334155] flex items-center justify-between gap-4 bg-slate-50/90 dark:bg-[#151f32]/90">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight truncate">
                  Live Proctoring & Evidence Console
                </h2>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-[#1e293b] border border-slate-200/90 dark:border-slate-700 text-slate-700 dark:text-slate-300 shrink-0">
                  <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  <span>{isConnected ? 'Stream Active' : 'Connecting...'}</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-lg">
                {examTitle} • Real-time photographic evidence stream
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Open in New Window */}
            <button
              type="button"
              onClick={handleOpenInNewWindow}
              title="Open in separate pop-up window"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-[#243147] border border-slate-200/80 dark:border-[#334155] transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Open in New Window</span>
            </button>

            {/* Refresh */}
            <button
              type="button"
              onClick={fetchViolations}
              disabled={isLoading}
              title="Refresh violations"
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#243147] border border-slate-200/80 dark:border-[#334155] transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>

            {/* Close */}
            <button
              type="button"
              onClick={onClose}
              title="Close modal"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#243147] border border-slate-200/80 dark:border-[#334155] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Telemetry Quick Metrics Bar ── */}
        <div className="px-5 sm:px-6 py-2.5 bg-slate-50 dark:bg-[#111827] border-b border-slate-200/80 dark:border-[#334155] flex flex-wrap items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
            <span className="text-slate-500 dark:text-slate-400 text-[11px]">Snaps:</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">{totalSnapshots}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            <span className="text-slate-500 dark:text-slate-400 text-[11px]">Mobile/Hardware:</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">{phoneAlerts}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span className="text-slate-500 dark:text-slate-400 text-[11px]">Face/Attention:</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">{faceAlerts}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-slate-500 dark:text-slate-400 text-[11px]">Flagged Candidates:</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">{uniqueCandidates}</span>
          </div>
        </div>

        {/* ── Filter Bar & Search ── */}
        <div className="px-5 sm:px-6 py-2.5 border-b border-slate-200/80 dark:border-[#334155] bg-white dark:bg-[#1e293b] flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {['ALL', 'CELL_PHONE', 'PROHIBITED_BOOK', 'NO_FACE', 'MULTI_FACE'].map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedFilter(type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  selectedFilter === type
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-[#151f32] dark:hover:bg-[#243147] text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-[#334155]'
                }`}
              >
                {type === 'ALL' ? `All Snapshots (${filteredViolations.length})` : VIOLATION_LABELS[type] || type}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by candidate..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-[#151f32] border border-slate-200 dark:border-[#334155] rounded-lg text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500/30 focus:border-blue-500"
            />
          </div>
        </div>

        {/* ── Content Grid / Evidence Gallery ── */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 bg-[#edf2f9]/50 dark:bg-[#0f172a]/50">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 space-y-2">
              <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
              <span className="text-xs">Loading proctoring evidence...</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between">
              <span>{error}</span>
              <button
                type="button"
                onClick={fetchViolations}
                className="px-3 py-1 bg-white dark:bg-[#243147] border border-rose-300 dark:border-rose-700 rounded-lg font-medium cursor-pointer"
              >
                Retry
              </button>
            </div>
          ) : filteredViolations.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">No Violations Logged</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                No proctoring infractions match this filter. When candidates violate rules, live snapshots will automatically populate here in real-time.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredViolations.map((v, idx) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-[#151f32] border border-slate-200/90 dark:border-[#334155] rounded-xl p-4 flex flex-col justify-between space-y-3 hover:border-slate-300 dark:hover:border-slate-600 transition-all group shadow-xs"
                >
                  {/* Candidate Info & Type Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700/70 border border-slate-300/80 dark:border-slate-600/60 flex items-center justify-center text-slate-700 dark:text-slate-200 text-xs font-semibold shrink-0">
                        {v.userName ? v.userName.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{v.userName || 'Candidate'}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{v.userEmail || 'Active Candidate'}</p>
                      </div>
                    </div>

                    {renderBadge(v.type)}
                  </div>

                  {/* Cloudinary Snapshot Image */}
                  {v.imageUrl ? (
                    <div
                      onClick={() => setSelectedImageModal(v)}
                      className="w-full h-44 rounded-xl bg-slate-100 dark:bg-[#0f172a] border border-slate-200/80 dark:border-[#243147] overflow-hidden relative group/img cursor-pointer"
                    >
                      <img
                        src={v.imageUrl}
                        alt="Violation snapshot"
                        className="w-full h-full object-cover transition-transform duration-200 group-hover/img:scale-102"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                        <div className="px-3 py-1.5 rounded-lg bg-white/95 dark:bg-[#1e293b]/95 backdrop-blur-xs text-slate-900 dark:text-white text-xs font-medium flex items-center gap-1.5 shadow-md">
                          <Eye className="w-3.5 h-3.5 text-blue-500" />
                          <span>Enlarge Evidence</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-44 rounded-xl bg-slate-100 dark:bg-[#0f172a] border border-slate-200/80 dark:border-[#243147] flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 space-y-1">
                      <AlertTriangle className="w-6 h-6 opacity-60" />
                      <span className="text-[11px]">System Flag (No image)</span>
                    </div>
                  )}

                  {/* Metadata Footer */}
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

        {/* ── Fullscreen Image Lightbox Modal ── */}
        {selectedImageModal && (
          <div
            className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedImageModal(null)}
          >
            <div
              className="max-w-3xl w-full bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-[#334155] rounded-2xl overflow-hidden shadow-2xl space-y-4 p-5 text-slate-900 dark:text-slate-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Violation Evidence Snapshot
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {selectedImageModal.userName} • {VIOLATION_LABELS[selectedImageModal.type] || selectedImageModal.type} •{' '}
                    {new Date(selectedImageModal.timestamp).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedImageModal(null)}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#243147] dark:hover:bg-[#2e3e5b] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors border border-slate-200 dark:border-[#334155]"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="rounded-xl overflow-hidden bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-[#334155] max-h-[65vh] flex items-center justify-center">
                <img
                  src={selectedImageModal.imageUrl}
                  alt="High resolution violation"
                  className="max-h-[65vh] w-auto object-contain"
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                  Cloudinary Asset • Stored under exam directory
                </span>
                <a
                  href={selectedImageModal.imageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                >
                  <span>Open Full Original</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
