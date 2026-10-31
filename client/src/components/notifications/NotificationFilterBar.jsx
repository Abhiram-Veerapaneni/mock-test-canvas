import React from 'react';
import { ShieldAlert, FileCheck, Search, X } from 'lucide-react';

export default function NotificationFilterBar({
  activeTab,
  setActiveTab,
  searchQuery,
  setSearchQuery,
  totalCount,
  violationCount,
  submissionCount,
  unreadCount,
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800/80">
      {/* Horizontal Underline Tabs */}
      <div className="flex items-center gap-6 overflow-x-auto -mb-[1px]">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`pb-3 text-xs transition-colors shrink-0 cursor-pointer border-b-2 flex items-center gap-1.5 ${
            activeTab === 'ALL'
              ? 'border-indigo-600 dark:border-indigo-400 text-slate-900 dark:text-slate-100 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
          }`}
        >
          <span>All</span>
          <span className="text-[11px] text-slate-400 tabular-nums">
            ({totalCount})
          </span>
        </button>

        <button
          onClick={() => setActiveTab('VIOLATION')}
          className={`pb-3 text-xs transition-colors shrink-0 cursor-pointer border-b-2 flex items-center gap-1.5 ${
            activeTab === 'VIOLATION'
              ? 'border-indigo-600 dark:border-indigo-400 text-slate-900 dark:text-slate-100 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Violations</span>
          {violationCount > 0 && (
            <span className="text-[11px] text-slate-400 tabular-nums">
              ({violationCount})
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('EXAM_SUBMISSION')}
          className={`pb-3 text-xs transition-colors shrink-0 cursor-pointer border-b-2 flex items-center gap-1.5 ${
            activeTab === 'EXAM_SUBMISSION'
              ? 'border-indigo-600 dark:border-indigo-400 text-slate-900 dark:text-slate-100 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
          }`}
        >
          <FileCheck className="w-3.5 h-3.5" />
          <span>Submissions</span>
          {submissionCount > 0 && (
            <span className="text-[11px] text-slate-400 tabular-nums">
              ({submissionCount})
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('UNREAD')}
          className={`pb-3 text-xs transition-colors shrink-0 cursor-pointer border-b-2 flex items-center gap-1.5 ${
            activeTab === 'UNREAD'
              ? 'border-indigo-600 dark:border-indigo-400 text-slate-900 dark:text-slate-100 font-semibold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
          }`}
        >
          <span>Unread</span>
          {unreadCount > 0 && (
            <span className="text-[11px] text-rose-600 dark:text-rose-400 font-medium tabular-nums">
              ({unreadCount})
            </span>
          )}
        </button>
      </div>

      {/* Search Input */}
      <div className="relative w-full sm:w-64 pb-2 sm:pb-0">
        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search notifications..."
          className="input-base text-xs pl-8 pr-7 py-1.5"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

