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

  const getBadgeStyle = (type) => {
    switch (type) {
      case 'MULTI_FACE':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      case 'NO_FACE':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'NOISE_SPIKE':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
      default:
        return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-5xl w-full bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-100">

        {/* ── Modal Header ── */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between gap-4 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Live Proctoring & Evidence Console
                </h2>
                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide uppercase ${
                  isConnected
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                    : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  {isConnected ? 'Stream Active' : 'Connecting...'}
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate max-w-lg">
                {examTitle} • Real-time violation alerts and Cloudinary photographic evidence
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchViolations}
              disabled={isLoading}
              title="Refresh violations"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Filter Bar & Metrics ── */}
        <div className="px-6 py-3 border-b border-slate-800/80 bg-slate-900 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            {['ALL', 'NO_FACE', 'MULTI_FACE'].map((type) => (
              <button
                key={type}
                onClick={() => setSelectedFilter(type)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  selectedFilter === type
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {type === 'ALL' ? `All Snapshots (${filteredViolations.length})` : VIOLATION_LABELS[type] || type}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by candidate..."
              className="w-full pl-8 pr-3 py-1 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* ── Content Grid / Evidence Gallery ── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-2">
              <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
              <span className="text-xs">Loading proctoring evidence...</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center justify-between">
              <span>{error}</span>
              <button
                onClick={fetchViolations}
                className="px-3 py-1 bg-slate-900 border border-rose-700 rounded-lg font-medium"
              >
                Retry
              </button>
            </div>
          ) : filteredViolations.length === 0 ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-semibold text-white">No Violations Logged</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No proctoring infractions match this filter. When candidates violate rules, live snapshots will automatically populate here in real-time.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredViolations.map((v, idx) => (
                <div
                  key={idx}
                  className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between space-y-3 hover:border-slate-700 transition-all group"
                >
                  {/* Candidate Info & Type Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 text-xs font-semibold shrink-0">
                        {v.userName ? v.userName.charAt(0).toUpperCase() : <User className="w-3.5 h-3.5" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-white truncate">{v.userName || 'Candidate'}</p>
                        <p className="text-[10px] text-slate-400 truncate">{v.userEmail || 'Student'}</p>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border ${getBadgeStyle(v.type)} shrink-0`}>
                      {VIOLATION_LABELS[v.type] || v.type}
                    </span>
                  </div>

                  {/* Cloudinary Snapshot Image */}
                  {v.imageUrl ? (
                    <div
                      onClick={() => setSelectedImageModal(v)}
                      className="w-full h-44 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden relative group/img cursor-pointer"
                    >
                      <img
                        src={v.imageUrl}
                        alt="Violation snapshot"
                        className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                        <div className="px-3 py-1.5 rounded-lg bg-black/70 backdrop-blur-sm text-white text-xs font-medium flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5" />
                          <span>Enlarge Evidence</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-44 rounded-xl bg-slate-900/60 border border-slate-800/80 flex flex-col items-center justify-center text-slate-500 space-y-1">
                      <AlertTriangle className="w-6 h-6 opacity-40" />
                      <span className="text-[11px]">System Flag (No image)</span>
                    </div>
                  )}

                  {/* Metadata Footer */}
                  <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1 font-mono">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {v.timestamp ? new Date(v.timestamp).toLocaleTimeString() : 'Just now'}
                    </span>
                    {v.candidateTrustScore !== undefined && (
                      <span className="text-[11px] font-medium">
                        Trust: <strong className="text-rose-300">{v.candidateTrustScore}%</strong>
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
            className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
            onClick={() => setSelectedImageModal(null)}
          >
            <div
              className="max-w-3xl w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl space-y-4 p-5 text-slate-100"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    Violation Evidence Snapshot
                  </h3>
                  <p className="text-xs text-slate-400">
                    {selectedImageModal.userName} • {VIOLATION_LABELS[selectedImageModal.type] || selectedImageModal.type} •{' '}
                    {new Date(selectedImageModal.timestamp).toLocaleString()}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedImageModal(null)}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="rounded-2xl overflow-hidden bg-black border border-slate-800 max-h-[65vh] flex items-center justify-center">
                <img
                  src={selectedImageModal.imageUrl}
                  alt="High resolution violation"
                  className="max-h-[65vh] w-auto object-contain"
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-400 font-mono text-[11px]">
                  Cloudinary Asset • Stored under exam directory
                </span>
                <a
                  href={selectedImageModal.imageUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 font-medium"
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
