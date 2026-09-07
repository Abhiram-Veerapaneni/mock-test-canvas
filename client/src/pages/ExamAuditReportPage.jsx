import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import api from '../services/api';
import useAuthStore from '../store/useAuthStore';
import {
  ShieldAlert, Users, Award, Clock, ArrowLeft, Loader2,
  AlertTriangle, Eye, X, CheckCircle2, Search, Filter,
  ExternalLink, Calendar, RefreshCw, FileText, BarChart3,
  Check, ChevronDown, Radio
} from 'lucide-react';

const VIOLATION_LABELS = {
  TAB_SWITCH: 'Tab Switch',
  WINDOW_BLUR: 'Focus Lost',
  FULLSCREEN_EXIT: 'Fullscreen Exit',
  NO_FACE: 'No Face Detected',
  MULTI_FACE: 'Multiple Faces',
  NOISE_SPIKE: 'Excessive Noise',
};

export default function ExamAuditReportPage() {
  const { testId, examId: routeExamId } = useParams();
  const examId = testId || routeExamId;
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState('violations'); // 'violations' | 'completion'
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal for clicked image snapshot
  const [selectedSnapshot, setSelectedSnapshot] = useState(null);

  // Filters for Table 1: Violation Logs
  const [violationSearch, setViolationSearch] = useState('');
  const [violationTypeFilter, setViolationTypeFilter] = useState('ALL');
  const [onlyWithImages, setOnlyWithImages] = useState(false);

  // Filters for Table 2: Completion Report
  const [completionSearch, setCompletionSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [trustFilter, setTrustFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('RECENT'); // 'RECENT' | 'SCORE_DESC' | 'TRUST_ASC' | 'VIOLATIONS_DESC'

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get(`/exams/${examId}/live-violations`);
      if (res.data?.success) {
        setData(res.data);
      } else {
        throw new Error('Failed to load audit data');
      }
    } catch (err) {
      console.error('Audit report fetch error:', err);
      setError(err.response?.data?.message || 'Could not fetch proctoring audit report.');
    } finally {
      setIsLoading(false);
    }
  }, [examId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Filtered Violation Logs ──────────────────────────────────────────────────
  const filteredViolations = (data?.violations || []).filter((v) => {
    const matchesSearch =
      !violationSearch.trim() ||
      (v.userName || '').toLowerCase().includes(violationSearch.toLowerCase()) ||
      (v.userEmail || '').toLowerCase().includes(violationSearch.toLowerCase());

    const matchesType = violationTypeFilter === 'ALL' || v.type === violationTypeFilter;
    const matchesImage = !onlyWithImages || !!v.imageUrl;

    return matchesSearch && matchesType && matchesImage;
  });

  // ── Filtered & Sorted Completion Report ──────────────────────────────────────
  const filteredCompletion = (data?.completionReport || [])
    .filter((rep) => {
      const matchesSearch =
        !completionSearch.trim() ||
        (rep.user?.name || '').toLowerCase().includes(completionSearch.toLowerCase()) ||
        (rep.user?.email || '').toLowerCase().includes(completionSearch.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || rep.status === statusFilter;

      let matchesTrust = true;
      if (trustFilter === 'LOW') matchesTrust = rep.trustScore < 70;
      if (trustFilter === 'HIGH') matchesTrust = rep.trustScore >= 80;

      return matchesSearch && matchesStatus && matchesTrust;
    })
    .sort((a, b) => {
      if (sortBy === 'SCORE_DESC') return (b.score || 0) - (a.score || 0);
      if (sortBy === 'TRUST_ASC') return (a.trustScore || 0) - (b.trustScore || 0);
      if (sortBy === 'VIOLATIONS_DESC') return (b.violationsCount || 0) - (a.violationsCount || 0);
      return new Date(b.submittedAt || b.startedAt) - new Date(a.submittedAt || a.startedAt);
    });

  const getBadgeStyle = (type) => {
    switch (type) {
      case 'MULTI_FACE':
        return 'bg-rose-500/10 text-rose-500 dark:text-rose-400 border-rose-500/30';
      case 'NO_FACE':
        return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30';
      case 'NOISE_SPIKE':
        return 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30';
      default:
        return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30';
    }
  };

  const getTrustBadge = (score) => {
    if (score >= 80) return 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (score >= 50) return 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20';
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* ── Top Navigation Bar ────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(`/test/${examId}`)}
            className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Exam Overview</span>
          </button>

          <button
            onClick={fetchData}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh Report</span>
          </button>
        </div>

        {/* ── Header Banner & Quick Metrics ─────────────────────────────────── */}
        <section className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                  Creator Proctoring Suite
                </span>
                {data?.exam?.proctorSettings?.liveNotifications && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-500/10 text-rose-500 border border-rose-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                    Live Alerts Enabled
                  </span>
                )}
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                {data?.exam?.title || 'Examination Audit & Results'}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Detailed infraction timestamps, photographic evidence snapshots, and student submission performance.
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                <div className="text-[10px] uppercase text-slate-400 font-semibold">Total Attempts</div>
                <div className="text-lg font-bold tabular-nums text-slate-900 dark:text-white">
                  {data?.completionReport?.length || 0}
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                <div className="text-[10px] uppercase text-slate-400 font-semibold">Violations</div>
                <div className="text-lg font-bold tabular-nums text-rose-500">
                  {data?.totalViolations || 0}
                </div>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-200 dark:border-slate-800 text-center">
                <div className="text-[10px] uppercase text-slate-400 font-semibold">Avg Trust</div>
                <div className="text-lg font-bold tabular-nums text-emerald-500">
                  {data?.completionReport?.length > 0
                    ? `${Math.round(
                        data.completionReport.reduce((sum, r) => sum + r.trustScore, 0) /
                          data.completionReport.length
                      )}%`
                    : '100%'}
                </div>
              </div>
            </div>
          </div>

          {/* ── Table Switch Tabs ─────────────────────────────────────────── */}
          <div className="flex items-center gap-2 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setActiveTab('violations')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'violations'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Violation Logs ({data?.violations?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('completion')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                activeTab === 'completion'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Candidate Completion Report ({data?.completionReport?.length || 0})</span>
            </button>
          </div>
        </section>

        {/* ── Loading / Error States ────────────────────────────────────────── */}
        {isLoading && (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-2">
            <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
            <p className="text-xs">Loading audit data & candidate snapshots...</p>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={fetchData}
              className="px-3 py-1 bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-800 rounded-lg text-xs font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {!isLoading && !error && (
          <>
            {/* ═════════════════════════════════════════════════════════════════════
                TAB 1: VIOLATION LOGS TABLE
               ═════════════════════════════════════════════════════════════════════ */}
            {activeTab === 'violations' && (
              <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden space-y-4 p-5">
                {/* Filters */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                    {['ALL', 'NO_FACE', 'MULTI_FACE', 'NOISE_SPIKE', 'TAB_SWITCH', 'FULLSCREEN_EXIT'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setViolationTypeFilter(type)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                          violationTypeFilter === type
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {type === 'ALL' ? 'All Types' : VIOLATION_LABELS[type] || type}
                      </button>
                    ))}

                    <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium cursor-pointer ml-1 select-none">
                      <input
                        type="checkbox"
                        checked={onlyWithImages}
                        onChange={(e) => setOnlyWithImages(e.target.checked)}
                        className="rounded border-slate-300 dark:border-slate-700 text-blue-600"
                      />
                      <span>Only with Images</span>
                    </label>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={violationSearch}
                      onChange={(e) => setViolationSearch(e.target.value)}
                      placeholder="Search candidate..."
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Table */}
                {filteredViolations.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 dark:text-slate-500 space-y-2">
                    <ShieldAlert className="w-8 h-8 mx-auto opacity-40 text-emerald-500" />
                    <p className="text-xs">No violation logs match the active filters.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          <th className="py-3 px-4">Timestamp</th>
                          <th className="py-3 px-4">User</th>
                          <th className="py-3 px-4">Violation Type</th>
                          <th className="py-3 px-4 text-center">No. of Violations</th>
                          <th className="py-3 px-4 text-center">Image Evidence</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                        {filteredViolations.map((v, idx) => (
                          <tr
                            key={idx}
                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                          >
                            {/* 1. Timestamp */}
                            <td className="py-3 px-4 whitespace-nowrap font-mono text-slate-600 dark:text-slate-300">
                              {v.timestamp ? new Date(v.timestamp).toLocaleString() : '—'}
                            </td>

                            {/* 2. User */}
                            <td className="py-3 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 font-bold flex items-center justify-center text-[10px]">
                                  {v.userName ? v.userName.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <div>
                                  <div className="font-semibold text-slate-900 dark:text-white">
                                    {v.userName || 'Anonymous'}
                                  </div>
                                  <div className="text-[10px] text-slate-400">{v.userEmail || 'Candidate'}</div>
                                </div>
                              </div>
                            </td>

                            {/* 3. Violation Type */}
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded-md text-[11px] font-semibold border ${getBadgeStyle(v.type)}`}>
                                {VIOLATION_LABELS[v.type] || v.type}
                              </span>
                            </td>

                            {/* 4. Number of Violations */}
                            <td className="py-3 px-4 whitespace-nowrap text-center">
                              <span className="inline-block px-2 py-0.5 rounded-full font-bold tabular-nums text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20">
                                {v.noOfViolations ?? 1}
                              </span>
                            </td>

                            {/* 5. Image (if applicable) */}
                            <td className="py-3 px-4 whitespace-nowrap text-center">
                              {v.imageUrl ? (
                                <button
                                  onClick={() => setSelectedSnapshot(v)}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 text-white dark:bg-slate-800 dark:hover:bg-slate-700 hover:bg-slate-800 text-[11px] font-medium transition-colors shadow-xs cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5 text-blue-400" />
                                  <span>View Snapshot</span>
                                </button>
                              ) : (
                                <span className="text-slate-400 text-[11px]">N/A (No image)</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}

            {/* ═════════════════════════════════════════════════════════════════════
                TAB 2: COMPLETION REPORT TABLE
               ═════════════════════════════════════════════════════════════════════ */}
            {activeTab === 'completion' && (
              <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden space-y-4 p-5">
                {/* Filters & Sorting */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Status filter */}
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 focus:outline-none"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="SUBMITTED">Submitted</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="DISQUALIFIED">Disqualified</option>
                    </select>

                    {/* Trust score filter */}
                    <select
                      value={trustFilter}
                      onChange={(e) => setTrustFilter(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 focus:outline-none"
                    >
                      <option value="ALL">All Trust Scores</option>
                      <option value="LOW">Low Trust (&lt; 70%)</option>
                      <option value="HIGH">High Trust (≥ 80%)</option>
                    </select>

                    {/* Sort Order */}
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 focus:outline-none"
                    >
                      <option value="RECENT">Sort: Most Recent</option>
                      <option value="SCORE_DESC">Sort: Highest Score</option>
                      <option value="TRUST_ASC">Sort: Lowest Trust Score</option>
                      <option value="VIOLATIONS_DESC">Sort: Most Violations</option>
                    </select>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={completionSearch}
                      onChange={(e) => setCompletionSearch(e.target.value)}
                      placeholder="Search candidate..."
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Table */}
                {filteredCompletion.length === 0 ? (
                  <div className="py-16 text-center text-slate-400 dark:text-slate-500 space-y-2">
                    <FileText className="w-8 h-8 mx-auto opacity-40 text-blue-500" />
                    <p className="text-xs">No candidate reports match the active filters.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-950/70 border-b border-slate-200 dark:border-slate-800 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                          <th className="py-3 px-4">User</th>
                          <th className="py-3 px-4 text-center">Status</th>
                          <th className="py-3 px-4 text-center">Score</th>
                          <th className="py-3 px-4 text-center">Accuracy</th>
                          <th className="py-3 px-4 text-center">Answered / Unanswered</th>
                          <th className="py-3 px-4 text-center">No. of Violations</th>
                          <th className="py-3 px-4 text-center">Trust Score at End</th>
                          <th className="py-3 px-4 text-right">Submitted At</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                        {filteredCompletion.map((item, idx) => (
                          <tr
                            key={idx}
                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                          >
                            {/* 1. User */}
                            <td className="py-3 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold flex items-center justify-center text-xs">
                                  {item.user?.name ? item.user.name.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <div>
                                  <div className="font-semibold text-slate-900 dark:text-white">
                                    {item.user?.name || 'Candidate'}
                                  </div>
                                  <div className="text-[10px] text-slate-400">{item.user?.email}</div>
                                </div>
                              </div>
                            </td>

                            {/* 2. Status */}
                            <td className="py-3 px-4 whitespace-nowrap text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                item.status === 'SUBMITTED'
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-500/20'
                                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-500/20'
                              }`}>
                                {item.status}
                              </span>
                            </td>

                            {/* 3. Score */}
                            <td className="py-3 px-4 whitespace-nowrap text-center">
                              <span className="font-bold text-slate-900 dark:text-white tabular-nums text-sm">
                                {item.score}
                              </span>
                              <span className="text-[10px] text-slate-400 ml-1">pts</span>
                            </td>

                            {/* 4. Accuracy */}
                            <td className="py-3 px-4 whitespace-nowrap text-center font-semibold tabular-nums">
                              <span className={item.accuracy >= 70 ? 'text-emerald-500' : 'text-slate-600 dark:text-slate-400'}>
                                {item.accuracy}%
                              </span>
                            </td>

                            {/* 5. Answered / Unanswered */}
                            <td className="py-3 px-4 whitespace-nowrap text-center font-mono">
                              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{item.answeredCount}</span>
                              <span className="text-slate-400 mx-1">/</span>
                              <span className="text-slate-500">{item.unansweredCount}</span>
                            </td>

                            {/* 6. Violations Count */}
                            <td className="py-3 px-4 whitespace-nowrap text-center">
                              <span className={`px-2 py-0.5 rounded-full font-bold tabular-nums text-xs ${
                                item.violationsCount > 0
                                  ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                                  : 'text-slate-400'
                              }`}>
                                {item.violationsCount}
                              </span>
                            </td>

                            {/* 7. Trust Score at End */}
                            <td className="py-3 px-4 whitespace-nowrap text-center">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold tabular-nums text-xs border ${getTrustBadge(item.trustScore)}`}>
                                {item.trustScore}%
                              </span>
                            </td>

                            {/* 8. Submitted At */}
                            <td className="py-3 px-4 whitespace-nowrap text-right font-mono text-slate-500 text-[11px]">
                              {item.submittedAt ? new Date(item.submittedAt).toLocaleDateString('en-IN', {
                                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                              }) : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}
          </>
        )}

        {/* ── High-Resolution Snapshot Modal ─────────────────────────────────── */}
        {selectedSnapshot && (
          <div
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedSnapshot(null)}
          >
            <div
              className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-6 text-slate-100 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header with Close Button */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${getBadgeStyle(selectedSnapshot.type)}`}>
                    {VIOLATION_LABELS[selectedSnapshot.type] || selectedSnapshot.type}
                  </span>
                  <span className="text-xs text-slate-400">
                    Candidate: <strong className="text-white">{selectedSnapshot.userName}</strong>
                  </span>
                </div>

                <button
                  onClick={() => setSelectedSnapshot(null)}
                  className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  title="Close Modal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Image Container */}
              <div className="rounded-2xl overflow-hidden bg-black border border-slate-800 max-h-[60vh] flex items-center justify-center">
                <img
                  src={selectedSnapshot.imageUrl}
                  alt="Candidate violation evidence"
                  className="max-h-[60vh] w-auto object-contain"
                />
              </div>

              {/* Modal Footer Metadata */}
              <div className="flex items-center justify-between text-xs pt-1">
                <div className="space-y-0.5">
                  <div className="text-slate-400 font-mono text-[11px]">
                    Timestamp: {selectedSnapshot.timestamp ? new Date(selectedSnapshot.timestamp).toLocaleString() : '—'}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Total violations by user: <strong className="text-rose-400">{selectedSnapshot.noOfViolations}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <a
                    href={selectedSnapshot.imageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors"
                  >
                    <span>Full Original</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    onClick={() => setSelectedSnapshot(null)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
