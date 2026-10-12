import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import BackButton from '../components/common/BackButton';
import Breadcrumbs from '../components/common/Breadcrumbs';
import api from '../services/api';
import useAuthStore from '../store/useAuthStore';
import {
  ShieldAlert, Users, Award, Clock, ArrowLeft, Loader2,
  AlertTriangle, Eye, X, CheckCircle2, Search, Filter,
  ExternalLink, Calendar, RefreshCw, FileText, BarChart3,
  Check, ChevronDown, Radio, FlaskConical, ShieldCheck, CheckCheck,
  ChevronRight
} from 'lucide-react';

const VIOLATION_LABELS = {
  TAB_SWITCH: 'Tab Switch',
  WINDOW_BLUR: 'Focus Lost',
  FULLSCREEN_EXIT: 'Fullscreen Exit',
  NO_FACE: 'No Face Detected',
  MULTI_FACE: 'Multiple Faces',
  NOISE_SPIKE: 'Excessive Noise',
  CELL_PHONE: 'Mobile Phone Detected',
  PROHIBITED_BOOK: 'Study Material / Book',
  PROHIBITED_OBJECT: 'Prohibited Device',
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
  const [modeFilter, setModeFilter] = useState('ALL'); // 'ALL' | 'OFFICIAL' | 'PRACTICE'
  const [sortBy, setSortBy] = useState('RECENT'); // 'RECENT' | 'SCORE_DESC' | 'TRUST_ASC' | 'VIOLATIONS_DESC'

  const formatSeconds = (sec) => {
    if (!sec || sec <= 0) return '—';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  };

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

      const matchesMode =
        modeFilter === 'ALL' ||
        (modeFilter === 'OFFICIAL' && !rep.isPractice) ||
        (modeFilter === 'PRACTICE' && rep.isPractice);

      return matchesSearch && matchesStatus && matchesTrust && matchesMode;
    })
    .sort((a, b) => {
      if (sortBy === 'SCORE_DESC') return (b.score || 0) - (a.score || 0);
      if (sortBy === 'TRUST_ASC') return (a.trustScore || 0) - (b.trustScore || 0);
      if (sortBy === 'VIOLATIONS_DESC') return (b.violationsCount || 0) - (a.violationsCount || 0);
      return new Date(b.submittedAt || b.startedAt) - new Date(a.submittedAt || a.startedAt);
    });

  const getBadgeStyle = (type) => {
    switch (type) {
      case 'CELL_PHONE':
      case 'PROHIBITED_OBJECT':
        return 'text-rose-700 dark:text-rose-400 bg-rose-50/60 dark:bg-rose-950/40 border border-rose-200/50 dark:border-rose-900/50';
      case 'PROHIBITED_BOOK':
        return 'text-amber-700 dark:text-amber-400 bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200/50 dark:border-amber-900/50';
      case 'MULTI_FACE':
        return 'text-rose-700 dark:text-rose-400 bg-rose-50/60 dark:bg-rose-950/40 border border-rose-200/50 dark:border-rose-900/50';
      case 'NO_FACE':
        return 'text-amber-700 dark:text-amber-400 bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200/50 dark:border-amber-900/50';
      case 'NOISE_SPIKE':
        return 'text-amber-700 dark:text-amber-400 bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200/50 dark:border-amber-900/50';
      default:
        return 'text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700';
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col transition-colors duration-200">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Navigation & Breadcrumbs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <BackButton to={`/test/${examId}`} label="Return to Exam Overview" />
          <Breadcrumbs
            items={[
              { label: 'Assessments', to: '/dashboard' },
              { label: data?.exam?.title || 'Exam', to: `/test/${examId}` },
              { label: 'Violation Console & Audit' }
            ]}
          />
        </div>

        {/* ── Header Banner & Quick Metrics ─────────────────────────────────── */}
        <section className="rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-6 space-y-6 shadow-none">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                  Creator Proctoring Suite
                </span>
                {data?.exam?.proctorSettings?.liveNotifications && (
                  <span className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                    Live Alerts Active
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                {data?.exam?.title || 'Examination Audit & Results'}
              </h1>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Review candidate biometric logs, webcam snapshots, trust scores, and submission records.
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="flex items-center gap-3">
              <div className="grid grid-cols-3 divide-x divide-zinc-200 dark:divide-zinc-800 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50/50 dark:bg-zinc-900/50">
                <div className="p-3 text-center min-w-[84px]">
                  <div className="text-[10px] uppercase text-zinc-400 font-medium tracking-wider">Attempts</div>
                  <div className="text-xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-100 mt-0.5">
                    {data?.completionReport?.length || 0}
                  </div>
                </div>
                <div className="p-3 text-center min-w-[84px]">
                  <div className="text-[10px] uppercase text-zinc-400 font-medium tracking-wider">Violations</div>
                  <div className="text-xl font-semibold tabular-nums text-rose-600 dark:text-rose-400 mt-0.5">
                    {data?.totalViolations || 0}
                  </div>
                </div>
                <div className="p-3 text-center min-w-[84px]">
                  <div className="text-[10px] uppercase text-zinc-400 font-medium tracking-wider">Avg Trust</div>
                  <div className="text-xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {data?.completionReport?.length > 0
                      ? `${Math.round(
                          data.completionReport.reduce((sum, r) => sum + r.trustScore, 0) /
                            data.completionReport.length
                        )}%`
                      : '100%'}
                  </div>
                </div>
              </div>

              <button
                onClick={fetchData}
                disabled={isLoading}
                title="Refresh audit data"
                className="btn-secondary p-2.5 rounded-md cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* ── Table Switch Tabs ─────────────────────────────────────────── */}
          <div className="flex items-center gap-6 border-t border-zinc-100 dark:border-zinc-800 pt-4 -mb-2">
            <button
              onClick={() => setActiveTab('violations')}
              className={`flex items-center gap-2 pb-3 text-xs transition-colors cursor-pointer border-b-2 -mb-[1px] ${
                activeTab === 'violations'
                  ? 'border-zinc-900 dark:border-zinc-100 text-zinc-950 dark:text-zinc-50 font-semibold'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 font-medium'
              }`}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Violation Logs ({data?.violations?.length || 0})</span>
            </button>

            <button
              onClick={() => setActiveTab('completion')}
              className={`flex items-center gap-2 pb-3 text-xs transition-colors cursor-pointer border-b-2 -mb-[1px] ${
                activeTab === 'completion'
                  ? 'border-zinc-900 dark:border-zinc-100 text-zinc-950 dark:text-zinc-50 font-semibold'
                  : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 font-medium'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Candidate Completion Report ({data?.completionReport?.length || 0})</span>
            </button>
          </div>
        </section>

        {/* ── Loading / Error States ────────────────────────────────────────── */}
        {isLoading && (
          <div className="py-20 flex flex-col items-center justify-center text-zinc-400 space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-600 dark:text-zinc-400" />
            <p className="text-xs">Loading audit data & candidate snapshots...</p>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={fetchData}
              className="btn-secondary text-xs px-3 py-1"
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
              <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-none overflow-hidden space-y-4 p-6">
                {/* Filters */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                    {['ALL', 'CELL_PHONE', 'PROHIBITED_BOOK', 'NO_FACE', 'MULTI_FACE', 'NOISE_SPIKE', 'TAB_SWITCH', 'FULLSCREEN_EXIT'].map((type) => (
                      <button
                        key={type}
                        onClick={() => setViolationTypeFilter(type)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer border ${
                          violationTypeFilter === type
                            ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100'
                            : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850'
                        }`}
                      >
                        {type === 'ALL' ? 'All Types' : VIOLATION_LABELS[type] || type}
                      </button>
                    ))}

                    <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 font-medium cursor-pointer ml-1 select-none border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850">
                      <input
                        type="checkbox"
                        checked={onlyWithImages}
                        onChange={(e) => setOnlyWithImages(e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-zinc-300 dark:border-zinc-700 text-zinc-900 focus:ring-zinc-500"
                      />
                      <span>Only with Images</span>
                    </label>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={violationSearch}
                      onChange={(e) => setViolationSearch(e.target.value)}
                      placeholder="Search candidate..."
                      className="input-base text-xs pl-8 pr-3 py-1.5"
                    />
                  </div>
                </div>

                {/* Table */}
                {filteredViolations.length === 0 ? (
                  <div className="py-16 text-center text-zinc-400 space-y-2">
                    <ShieldAlert className="w-8 h-8 mx-auto opacity-40 text-emerald-500" />
                    <p className="text-xs font-medium">No violation logs match the active filters.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-zinc-50/75 dark:bg-zinc-950/75 border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                          <th className="py-3 px-4">Timestamp</th>
                          <th className="py-3 px-4">User</th>
                          <th className="py-3 px-4">Violation Type</th>
                          <th className="py-3 px-4 text-center">No. of Violations</th>
                          <th className="py-3 px-4 text-center">Image Evidence</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {filteredViolations.map((v, idx) => (
                          <tr
                            key={idx}
                            className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/50 transition-colors"
                          >
                            {/* 1. Timestamp */}
                            <td className="py-3 px-4 whitespace-nowrap font-mono tabular-nums text-zinc-600 dark:text-zinc-300">
                              {v.timestamp ? new Date(v.timestamp).toLocaleString() : '—'}
                            </td>

                            {/* 2. User */}
                            <td className="py-3 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold flex items-center justify-center text-[10px]">
                                  {v.userName ? v.userName.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <div>
                                  <div className="font-medium text-zinc-900 dark:text-zinc-100">
                                    {v.userName || 'Anonymous'}
                                  </div>
                                  <div className="text-[10px] text-zinc-400">{v.userEmail || 'Candidate'}</div>
                                </div>
                              </div>
                            </td>

                            {/* 3. Violation Type */}
                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${getBadgeStyle(v.type)}`}>
                                {VIOLATION_LABELS[v.type] || v.type}
                              </span>
                            </td>

                            {/* 4. Number of Violations */}
                            <td className="py-3 px-4 whitespace-nowrap text-center">
                              <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold tabular-nums text-rose-700 dark:text-rose-400 bg-rose-50/60 dark:bg-rose-950/40 border border-rose-200/50 dark:border-rose-900/50">
                                {v.noOfViolations ?? 1}
                              </span>
                            </td>

                            {/* 5. Image (if applicable) */}
                            <td className="py-3 px-4 whitespace-nowrap text-center">
                              {v.imageUrl ? (
                                <button
                                  type="button"
                                  onClick={() => setSelectedSnapshot(v)}
                                  title="Inspect Snapshot"
                                  className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5 text-zinc-500" />
                                  <span>View Snapshot</span>
                                </button>
                              ) : (
                                <span className="text-zinc-400 text-xs">None</span>
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
              <section className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-none overflow-hidden space-y-4 p-6">
                {/* Filters & Sorting */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Status filter */}
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="px-2.5 py-1.5 rounded-md bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 focus:outline-none cursor-pointer text-xs"
                    >
                      <option value="ALL">All Statuses</option>
                      <option value="SUBMITTED">Submitted</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="DISQUALIFIED">Disqualified</option>
                    </select>

                    {/* Mode filter */}
                    <select
                      value={modeFilter}
                      onChange={(e) => setModeFilter(e.target.value)}
                      className="px-2.5 py-1.5 rounded-md bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 focus:outline-none cursor-pointer text-xs"
                    >
                      <option value="ALL">All Modes</option>
                      <option value="OFFICIAL">Official Exams</option>
                      <option value="PRACTICE">Practice Sessions</option>
                    </select>

                    {/* Trust score filter */}
                    <select
                      value={trustFilter}
                      onChange={(e) => setTrustFilter(e.target.value)}
                      className="px-2.5 py-1.5 rounded-md bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 focus:outline-none cursor-pointer text-xs"
                    >
                      <option value="ALL">All Trust Scores</option>
                      <option value="LOW">Low Trust (&lt; 70%)</option>
                      <option value="HIGH">High Trust (≥ 80%)</option>
                    </select>

                    {/* Sort Order */}
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="px-2.5 py-1.5 rounded-md bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 focus:outline-none cursor-pointer text-xs"
                    >
                      <option value="RECENT">Sort: Most Recent</option>
                      <option value="SCORE_DESC">Sort: Highest Score</option>
                      <option value="TRUST_ASC">Sort: Lowest Trust Score</option>
                      <option value="VIOLATIONS_DESC">Sort: Most Violations</option>
                    </select>
                  </div>

                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      value={completionSearch}
                      onChange={(e) => setCompletionSearch(e.target.value)}
                      placeholder="Search candidate..."
                      className="input-base text-xs pl-8 pr-3 py-1.5"
                    />
                  </div>
                </div>

                {/* Table */}
                {filteredCompletion.length === 0 ? (
                  <div className="py-16 text-center text-zinc-400 space-y-2">
                    <FileText className="w-8 h-8 mx-auto opacity-40 text-zinc-400" />
                    <p className="text-xs font-medium">No candidate reports match the active filters.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-zinc-50/75 dark:bg-zinc-950/75 border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-medium uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                          <th className="py-3 px-4">User</th>
                          <th className="py-3 px-4 text-center">Mode</th>
                          <th className="py-3 px-4 text-center">Status</th>
                          <th className="py-3 px-4 text-center">Time Taken</th>
                          <th className="py-3 px-4 text-center">Score</th>
                          <th className="py-3 px-4 text-center">Accuracy</th>
                          <th className="py-3 px-4 text-center">Answered / Unanswered</th>
                          <th className="py-3 px-4 text-center">Violations</th>
                          <th className="py-3 px-4 text-center">Trust Score</th>
                          <th className="py-3 px-4 text-right">Submitted At</th>
                          <th className="py-3 px-4 text-right">Responses</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                        {filteredCompletion.map((item, idx) => (
                          <tr
                            key={idx}
                            className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/50 transition-colors"
                          >
                            {/* 1. User */}
                            <td className="py-3 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold flex items-center justify-center text-[10px]">
                                  {item.user?.name ? item.user.name.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <div>
                                  <div className="font-medium text-zinc-900 dark:text-zinc-100">
                                    {item.user?.name || 'Candidate'}
                                  </div>
                                  <div className="text-[10px] text-zinc-400">{item.user?.email}</div>
                                </div>
                              </div>
                            </td>

                            {/* 2. Mode */}
                            <td className="py-3 px-4 whitespace-nowrap text-center">
                              {item.isPractice ? (
                                <span className="inline-flex items-center gap-1 text-xs text-zinc-500">
                                  <FlaskConical className="w-3 h-3 text-zinc-400" />
                                  Practice
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-xs text-zinc-700 dark:text-zinc-300 font-medium">
                                  <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                  Official
                                </span>
                              )}
                            </td>

                            {/* 3. Status */}
                            <td className="py-3 px-4 whitespace-nowrap text-center">
                              <span className="inline-flex items-center gap-1.5 text-xs text-zinc-700 dark:text-zinc-300 font-medium">
                                <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'SUBMITTED' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                {item.status === 'SUBMITTED' ? 'Submitted' : item.status}
                              </span>
                            </td>

                            {/* 4. Time Taken */}
                            <td className="py-3 px-4 whitespace-nowrap text-center tabular-nums text-zinc-600 dark:text-zinc-300 font-mono">
                              {formatSeconds(item.timeTakenSeconds)}
                            </td>

                            {/* 5. Score */}
                            <td className="py-3 px-4 whitespace-nowrap text-center">
                              <span className="font-semibold text-zinc-900 dark:text-zinc-100 tabular-nums text-sm">
                                {item.score}
                              </span>
                              <span className="text-[10px] text-zinc-400 ml-1">pts</span>
                            </td>

                            {/* 6. Accuracy */}
                            <td className="py-3 px-4 whitespace-nowrap text-center font-medium tabular-nums">
                              <span className={item.accuracy >= 70 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-zinc-600 dark:text-zinc-400'}>
                                {item.accuracy}%
                              </span>
                            </td>

                            {/* 7. Answered / Unanswered */}
                            <td className="py-3 px-4 whitespace-nowrap text-center font-mono">
                              <span className="text-zinc-800 dark:text-zinc-200 font-semibold">{item.answeredCount}</span>
                              <span className="text-zinc-400 mx-1">/</span>
                              <span className="text-zinc-400">{item.unansweredCount}</span>
                            </td>

                            {/* 8. Violations Count */}
                            <td className="py-3 px-4 whitespace-nowrap text-center">
                              <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold tabular-nums ${
                                item.violationsCount > 0
                                  ? 'bg-rose-50/60 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/50'
                                  : 'text-zinc-400'
                              }`}>
                                {item.violationsCount}
                              </span>
                            </td>

                            {/* 9. Trust Score at End */}
                            <td className="py-3 px-4 whitespace-nowrap text-center">
                              <span className="inline-flex items-center gap-1.5 text-xs font-medium tabular-nums text-zinc-700 dark:text-zinc-300">
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  item.trustScore >= 80 ? 'bg-emerald-500' : item.trustScore >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                                }`} />
                                {item.trustScore}%
                              </span>
                            </td>

                            {/* 10. Submitted At */}
                            <td className="py-3 px-4 whitespace-nowrap text-right font-mono text-zinc-500 text-[11px]">
                              {item.submittedAt ? new Date(item.submittedAt).toLocaleDateString('en-IN', {
                                day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                              }) : '—'}
                            </td>

                            {/* 11. Actions */}
                            <td className="py-3 px-4 whitespace-nowrap text-right">
                              <button
                                onClick={() => navigate(`/test/${examId}/review/${item.attemptId}`)}
                                className="inline-flex items-center gap-1 text-xs font-medium text-zinc-600 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 transition-colors cursor-pointer"
                              >
                                <span>Answers</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
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
            className="fixed inset-0 z-50 bg-zinc-950/60 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setSelectedSnapshot(null)}
          >
            <div
              className="max-w-2xl w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 text-zinc-900 dark:text-zinc-100 space-y-4 shadow-sm"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header with Close Button */}
              <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-3">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${getBadgeStyle(selectedSnapshot.type)}`}>
                    {VIOLATION_LABELS[selectedSnapshot.type] || selectedSnapshot.type}
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    Candidate: <strong className="text-zinc-900 dark:text-zinc-100 font-medium">{selectedSnapshot.userName}</strong>
                  </span>
                </div>

                <button
                  onClick={() => setSelectedSnapshot(null)}
                  className="p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                  title="Close Modal"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Image Container */}
              <div className="rounded-md overflow-hidden bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 max-h-[60vh] flex items-center justify-center">
                <img
                  src={selectedSnapshot.imageUrl}
                  alt="Candidate violation evidence"
                  className="max-h-[60vh] w-auto object-contain"
                />
              </div>

              {/* Modal Footer Metadata */}
              <div className="flex items-center justify-between text-xs pt-1">
                <div className="space-y-0.5">
                  <div className="text-zinc-500 dark:text-zinc-400 font-mono text-[11px]">
                    Timestamp: {selectedSnapshot.timestamp ? new Date(selectedSnapshot.timestamp).toLocaleString() : '—'}
                  </div>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Total violations by user: <strong className="text-rose-600 dark:text-rose-400">{selectedSnapshot.noOfViolations}</strong>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={selectedSnapshot.imageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary text-xs inline-flex items-center gap-1.5 px-3 py-1.5"
                  >
                    <span>Full Original</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    onClick={() => setSelectedSnapshot(null)}
                    className="btn-secondary text-xs px-3 py-1.5"
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
