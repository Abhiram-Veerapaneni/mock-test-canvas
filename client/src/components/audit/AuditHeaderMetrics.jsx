import React from 'react';
import { RefreshCw, ShieldAlert, FileText } from 'lucide-react';

export default function AuditHeaderMetrics({
  exam,
  attemptsCount,
  totalViolations,
  avgTrustScore,
  isLoading,
  onRefresh,
  activeTab,
  onSelectTab,
  violationsCount,
  completionCount
}) {
  return (
    <section className="rounded-lg bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none p-6 space-y-6 shadow-none">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              Creator Proctoring Suite
            </span>
            {exam?.proctorSettings?.liveNotifications && (
              <span className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                Live Alerts Active
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            {exam?.title || 'Examination Audit & Results'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Review candidate biometric logs, webcam snapshots, trust scores, and submission records.
          </p>
        </div>

        {/* Quick Metrics */}
        <div className="flex items-center gap-3">
          <div className="grid grid-cols-3 divide-x divide-slate-200/80 dark:divide-slate-800/80 border border-slate-200/80 dark:border-slate-800/80 rounded-lg bg-slate-50/50 dark:bg-[#162030]/50">
            <div className="p-3 text-center min-w-[84px]">
              <div className="text-[10px] uppercase text-slate-400 font-medium tracking-wider">Attempts</div>
              <div className="text-xl font-semibold tabular-nums text-slate-900 dark:text-slate-100 mt-0.5">
                {attemptsCount}
              </div>
            </div>
            <div className="p-3 text-center min-w-[84px]">
              <div className="text-[10px] uppercase text-slate-400 font-medium tracking-wider">Violations</div>
              <div className="text-xl font-semibold tabular-nums text-rose-600 dark:text-rose-400 mt-0.5">
                {totalViolations}
              </div>
            </div>
            <div className="p-3 text-center min-w-[84px]">
              <div className="text-[10px] uppercase text-slate-400 font-medium tracking-wider">Avg Trust</div>
              <div className="text-xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400 mt-0.5">
                {avgTrustScore}%
              </div>
            </div>
          </div>

          <button
            onClick={onRefresh}
            disabled={isLoading}
            title="Refresh audit data"
            className="btn-secondary p-2.5 rounded-md cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Table Switch Tabs */}
      <div className="flex items-center gap-6 border-t border-slate-100 dark:border-slate-800/80 pt-4 -mb-2">
        <button
          onClick={() => onSelectTab('violations')}
          className={`flex items-center gap-2 pb-3 text-xs transition-colors cursor-pointer border-b-2 -mb-[1px] ${
            activeTab === 'violations'
              ? 'border-indigo-600 dark:border-indigo-400 text-slate-900 dark:text-slate-100 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Violation Logs ({violationsCount})</span>
        </button>

        <button
          onClick={() => onSelectTab('completion')}
          className={`flex items-center gap-2 pb-3 text-xs transition-colors cursor-pointer border-b-2 -mb-[1px] ${
            activeTab === 'completion'
              ? 'border-indigo-600 dark:border-indigo-400 text-slate-900 dark:text-slate-100 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Candidate Completion Report ({completionCount})</span>
        </button>
      </div>
    </section>
  );
}
