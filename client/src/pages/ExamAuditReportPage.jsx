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
import AuditRevokeModal from '../components/audit/AuditRevokeModal';
import { Loader2, AlertTriangle, CheckCircle2 } from 'lucide-react';

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

  // Modal for revoking / resetting / disqualifying an attempt
  const [selectedAttemptForRevoke, setSelectedAttemptForRevoke] = useState(null);
  const [isRevoking, setIsRevoking] = useState(false);
  const [actionNotice, setActionNotice] = useState(null);

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

  const handleRevokeConfirm = async ({ attemptId, action, reason }) => {
    setIsRevoking(true);
    setActionNotice(null);
    try {
      const res = await api.post(`/submissions/attempt/${attemptId}/revoke`, { action, reason });
      if (res.data?.success) {
        // Optimistically update completion report
        setData((prev) => {
          if (!prev?.completionReport) return prev;
          const nextReport = prev.completionReport.map((rep) => {
            if (rep.attemptId === attemptId) {
              return {
                ...rep,
                status: action === 'RESET_FOR_RETAKE' ? 'REVOKED' : 'DISQUALIFIED',
                revocation: res.data.attempt?.revocation || {
                  isRevoked: true,
                  actionType: action,
                  reason
                }
              };
            }
            return rep;
          });
          return { ...prev, completionReport: nextReport };
        });

        setActionNotice({
          type: 'success',
          message:
            action === 'RESET_FOR_RETAKE'
              ? 'Candidate attempt reset and 1 re-attempt quota granted.'
              : 'Candidate attempt disqualified for malpractice.'
        });
        setSelectedAttemptForRevoke(null);
      } else {
        throw new Error(res.data?.message || 'Failed to revoke attempt');
      }
    } catch (err) {
      console.error('Revoke attempt error:', err);
      setActionNotice({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Error revoking candidate attempt.'
      });
    } finally {
      setIsRevoking(false);
    }
  };

  const handleRestoreAttempt = async (item) => {
    if (!item?.attemptId) return;
    const confirmed = window.confirm(
      `Restore this attempt for ${item.user?.name || 'this candidate'} back to submitted status?`
    );
    if (!confirmed) return;

    try {
      const res = await api.post(`/submissions/attempt/${item.attemptId}/revoke`, { action: 'RESTORE' });
      if (res.data?.success) {
        setData((prev) => {
          if (!prev?.completionReport) return prev;
          const nextReport = prev.completionReport.map((rep) => {
            if (rep.attemptId === item.attemptId) {
              return {
                ...rep,
                status: item.submittedAt ? 'SUBMITTED' : 'IN_PROGRESS',
                revocation: null
              };
            }
            return rep;
          });
          return { ...prev, completionReport: nextReport };
        });

        setActionNotice({
          type: 'success',
          message: 'Candidate attempt restored successfully.'
        });
      } else {
        throw new Error(res.data?.message || 'Failed to restore attempt');
      }
    } catch (err) {
      console.error('Restore attempt error:', err);
      setActionNotice({
        type: 'error',
        message: err.response?.data?.message || err.message || 'Error restoring candidate attempt.'
      });
    }
  };

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

        {/* Action Notice Alert */}
        {actionNotice && (
          <div
            className={`p-3.5 rounded-lg border text-xs flex items-center justify-between ${
              actionNotice.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-300'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300'
            }`}
          >
            <div className="flex items-center gap-2">
              {actionNotice.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              )}
              <span className="font-medium">{actionNotice.message}</span>
            </div>
            <button
              onClick={() => setActionNotice(null)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-semibold cursor-pointer text-xs ml-3"
            >
              Dismiss
            </button>
          </div>
        )}

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
                onOpenRevokeModal={setSelectedAttemptForRevoke}
                onRestoreAttempt={handleRestoreAttempt}
              />
            )}
          </>
        )}

        {/* High-Resolution Snapshot Modal */}
        <AuditSnapshotModal
          selectedSnapshot={selectedSnapshot}
          onClose={() => setSelectedSnapshot(null)}
        />

        {/* Revoke / Disqualify Modal */}
        <AuditRevokeModal
          attemptItem={selectedAttemptForRevoke}
          onClose={() => setSelectedAttemptForRevoke(null)}
          onConfirm={handleRevokeConfirm}
          isSubmitting={isRevoking}
        />
      </main>
    </div>
  );
}
