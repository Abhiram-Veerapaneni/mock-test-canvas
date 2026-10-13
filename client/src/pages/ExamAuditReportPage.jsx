import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import BackButton from '../components/common/BackButton';
import Breadcrumbs from '../components/common/Breadcrumbs';
import api from '../services/api';
import useAuthStore from '../store/useAuthStore';
import AuditHeaderMetrics from '../components/audit/AuditHeaderMetrics';
import AuditViolationLogsTable from '../components/audit/AuditViolationLogsTable';
import AuditCompletionReportTable from '../components/audit/AuditCompletionReportTable';
import AuditSnapshotModal from '../components/audit/AuditSnapshotModal';
import { Loader2, AlertTriangle } from 'lucide-react';

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

  // Filtered Violation Logs
  const filteredViolations = (data?.violations || []).filter((v) => {
    const matchesSearch =
      !violationSearch.trim() ||
      (v.userName || '').toLowerCase().includes(violationSearch.toLowerCase()) ||
      (v.userEmail || '').toLowerCase().includes(violationSearch.toLowerCase());

    const matchesType = violationTypeFilter === 'ALL' || v.type === violationTypeFilter;
    const matchesImage = !onlyWithImages || !!v.imageUrl;

    return matchesSearch && matchesType && matchesImage;
  });

  // Filtered & Sorted Completion Report
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

  const avgTrustScore =
    data?.completionReport?.length > 0
      ? Math.round(
          data.completionReport.reduce((sum, r) => sum + r.trustScore, 0) /
            data.completionReport.length
        )
      : 100;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0C0F17] text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
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

        {/* Header Banner & Quick Metrics */}
        <AuditHeaderMetrics
          exam={data?.exam}
          attemptsCount={data?.completionReport?.length || 0}
          totalViolations={data?.totalViolations || 0}
          avgTrustScore={avgTrustScore}
          isLoading={isLoading}
          onRefresh={fetchData}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          violationsCount={data?.violations?.length || 0}
          completionCount={data?.completionReport?.length || 0}
        />

        {/* Loading / Error States */}
        {isLoading && (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 space-y-2">
            <Loader2 className="w-6 h-6 animate-spin text-slate-600 dark:text-slate-400" />
            <p className="text-xs">Loading audit data &amp; candidate snapshots...</p>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={fetchData} className="btn-secondary text-xs px-3 py-1">
              Retry
            </button>
          </div>
        )}

        {!isLoading && !error && (
          <>
            {/* TAB 1: VIOLATION LOGS TABLE */}
            {activeTab === 'violations' && (
              <AuditViolationLogsTable
                filteredViolations={filteredViolations}
                violationSearch={violationSearch}
                setViolationSearch={setViolationSearch}
                violationTypeFilter={violationTypeFilter}
                setViolationTypeFilter={setViolationTypeFilter}
                onlyWithImages={onlyWithImages}
                setOnlyWithImages={setOnlyWithImages}
                onSelectSnapshot={setSelectedSnapshot}
              />
            )}

            {/* TAB 2: COMPLETION REPORT TABLE */}
            {activeTab === 'completion' && (
              <AuditCompletionReportTable
                filteredCompletion={filteredCompletion}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                modeFilter={modeFilter}
                setModeFilter={setModeFilter}
                trustFilter={trustFilter}
                setTrustFilter={setTrustFilter}
                sortBy={sortBy}
                setSortBy={setSortBy}
                completionSearch={completionSearch}
                setCompletionSearch={setCompletionSearch}
                formatSeconds={formatSeconds}
                examId={examId}
                navigate={navigate}
              />
            )}
          </>
        )}

        {/* High-Resolution Snapshot Modal */}
        <AuditSnapshotModal
          selectedSnapshot={selectedSnapshot}
          onClose={() => setSelectedSnapshot(null)}
        />
      </main>
    </div>
  );
}
