import React from 'react';
import { ShieldAlert, Search, Eye } from 'lucide-react';
import { formatDateTime12h } from '../../utils/dateUtils';
import { VIOLATION_LABELS, getBadgeStyle } from '../../utils/auditConstants';

export default function AuditViolationLogsTable({
  filteredViolations,
  violationSearch,
  setViolationSearch,
  violationTypeFilter,
  setViolationTypeFilter,
  onlyWithImages,
  setOnlyWithImages,
  onSelectSnapshot
}) {
  const VIOLATION_FILTER_TYPES = [
    'ALL',
    'CELL_PHONE',
    'PROHIBITED_BOOK',
    'NO_FACE',
    'MULTI_FACE',
    'NOISE_SPIKE',
    'TAB_SWITCH',
    'FULLSCREEN_EXIT'
  ];

  return (
    <section className="bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none rounded-lg shadow-none overflow-hidden space-y-4 p-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {VIOLATION_FILTER_TYPES.map((type) => (
            <button
              key={type}
              onClick={() => setViolationTypeFilter(type)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors cursor-pointer border ${
                violationTypeFilter === type
                  ? 'bg-indigo-600 text-white border-indigo-600 dark:bg-indigo-500 dark:text-white dark:border-indigo-500 shadow-sm'
                  : 'bg-white dark:bg-[#131926] text-slate-600 dark:text-slate-300 border-slate-200/80 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-[#162030]'
              }`}
            >
              {type === 'ALL' ? 'All Types' : VIOLATION_LABELS[type] || type}
            </button>
          ))}

          <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white dark:bg-[#131926] text-slate-700 dark:text-slate-300 font-medium cursor-pointer ml-1 select-none border border-slate-200/80 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-[#162030]">
            <input
              type="checkbox"
              checked={onlyWithImages}
              onChange={(e) => setOnlyWithImages(e.target.checked)}
              className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 text-slate-900 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
            <span>Only with Images</span>
          </label>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
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
        <div className="py-16 text-center text-slate-400 space-y-2">
          <ShieldAlert className="w-8 h-8 mx-auto opacity-40 text-emerald-500" />
          <p className="text-xs font-medium">No violation logs match the active filters.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200/80 dark:border-slate-800/80">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/75 dark:bg-[#0C0F17]/75 border-b border-slate-200/80 dark:border-slate-800/80 text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
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
                  className="hover:bg-slate-50/50 dark:hover:bg-[#162030]/50 transition-colors"
                >
                  {/* 1. Timestamp */}
                  <td className="py-3 px-4 whitespace-nowrap font-mono tabular-nums text-slate-600 dark:text-slate-300">
                    {v.timestamp ? formatDateTime12h(v.timestamp, { includeYear: true, includeSeconds: true }) : '—'}
                  </td>

                  {/* 2. User */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-semibold flex items-center justify-center text-[10px]">
                        {v.userName ? v.userName.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900 dark:text-slate-100">
                          {v.userName || 'Anonymous'}
                        </div>
                        <div className="text-[10px] text-slate-400">{v.userEmail || 'Candidate'}</div>
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
                        onClick={() => onSelectSnapshot(v)}
                        title="Inspect Snapshot"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>View Snapshot</span>
                      </button>
                    ) : (
                      <span className="text-slate-400 text-xs">None</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
