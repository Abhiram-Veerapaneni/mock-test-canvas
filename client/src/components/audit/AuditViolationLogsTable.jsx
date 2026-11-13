import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Search,
  Eye,
  ChevronDown,
  ChevronUp,
  Users,
  List,
  Clock
} from 'lucide-react';
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
  const [viewMode, setViewMode] = useState('GROUPED'); // 'GROUPED' | 'FLAT'
  const [collapsedUsers, setCollapsedUsers] = useState(new Set());

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

  // Group violations by candidate username / userId
  const groupedByUser = useMemo(() => {
    const map = new Map();

    (filteredViolations || []).forEach((v) => {
      const key = v.userId ? String(v.userId) : (v.userName?.trim().toLowerCase() || 'anonymous');
      if (!map.has(key)) {
        map.set(key, {
          key,
          userId: v.userId,
          userName: v.userName || 'Anonymous Candidate',
          userEmail: v.userEmail || '',
          userAvatar: v.userAvatar || '',
          trustScore: v.candidateTrustScore,
          attemptStatus: v.attemptStatus,
          violations: []
        });
      }
      map.get(key).violations.push(v);
    });

    // Sort groups: candidate with highest violations first, then alphabetically
    return Array.from(map.values()).sort((a, b) => {
      return b.violations.length - a.violations.length || a.userName.localeCompare(b.userName);
    });
  }, [filteredViolations]);

  const toggleUserCollapse = (key) => {
    setCollapsedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const expandAll = () => setCollapsedUsers(new Set());
  const collapseAll = () => setCollapsedUsers(new Set(groupedByUser.map((g) => g.key)));

  return (
    <section className="bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none rounded-lg overflow-hidden space-y-4 p-5 sm:p-6">
      {/* Filters & Search Toolbar */}
      <div className="flex flex-col gap-3">
        {/* Row 1: Type Filter Pills & Images Checkbox */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none flex-wrap">
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

            <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white dark:bg-[#131926] text-slate-700 dark:text-slate-300 text-xs font-medium cursor-pointer ml-1 select-none border border-slate-200/80 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-[#162030]">
              <input
                type="checkbox"
                checked={onlyWithImages}
                onChange={(e) => setOnlyWithImages(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-slate-300 dark:border-slate-700 text-slate-900 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <span>Only with Images</span>
            </label>
          </div>

          {/* View Mode Toggle (Grouped by User vs Chronological Flat List) */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            {viewMode === 'GROUPED' && groupedByUser.length > 0 && (
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 mr-1">
                <button
                  type="button"
                  onClick={expandAll}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 font-medium cursor-pointer"
                >
                  Expand all
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={collapseAll}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 font-medium cursor-pointer"
                >
                  Collapse all
                </button>
              </div>
            )}

            <div className="inline-flex items-center rounded-md border border-slate-200/80 dark:border-slate-800/80 p-0.5 bg-slate-50 dark:bg-slate-900/60">
              <button
                type="button"
                onClick={() => setViewMode('GROUPED')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  viewMode === 'GROUPED'
                    ? 'bg-white dark:bg-[#131926] text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Group violations by candidate username"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Grouped by User</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('FLAT')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                  viewMode === 'FLAT'
                    ? 'bg-white dark:bg-[#131926] text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="View all violations chronologically"
              >
                <List className="w-3.5 h-3.5" />
                <span>Chronological</span>
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={violationSearch}
            onChange={(e) => setViolationSearch(e.target.value)}
            placeholder="Search candidate by name or email..."
            className="input-base text-xs pl-8 pr-3 py-1.5 w-full"
          />
        </div>
      </div>

      {/* Main Content Area */}
      {filteredViolations.length === 0 ? (
        <div className="py-16 text-center text-slate-400 space-y-2">
          <ShieldAlert className="w-8 h-8 mx-auto opacity-40 text-emerald-500" />
          <p className="text-xs font-medium">No violation logs match the active filters.</p>
        </div>
      ) : viewMode === 'GROUPED' ? (
        /* GROUPED BY USERNAME VIEW */
        <div className="space-y-3">
          <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between px-1">
            <span>
              Showing violations across <strong className="font-semibold text-slate-700 dark:text-slate-200">{groupedByUser.length}</strong> candidate{groupedByUser.length !== 1 ? 's' : ''} ({filteredViolations.length} total event{filteredViolations.length !== 1 ? 's' : ''})
            </span>
          </div>

          {groupedByUser.map((group) => {
            const isCollapsed = collapsedUsers.has(group.key);
            const trustScore = group.trustScore ?? 100;
            const trustColor =
              trustScore >= 80
                ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60'
                : trustScore >= 60
                ? 'text-amber-700 dark:text-amber-400 bg-amber-50/70 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60'
                : 'text-rose-700 dark:text-rose-400 bg-rose-50/70 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60';

            return (
              <div
                key={group.key}
                className="rounded-lg border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#131926] overflow-hidden transition-all shadow-xs"
              >
                {/* Candidate Group Header */}
                <div
                  onClick={() => toggleUserCollapse(group.key)}
                  className="flex items-center justify-between p-3.5 bg-slate-50/75 dark:bg-[#0C0F17]/75 hover:bg-slate-100/70 dark:hover:bg-[#162030] cursor-pointer transition-colors select-none"
                >
                  {/* Left: User Identity */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 font-semibold flex items-center justify-center text-xs shrink-0 border border-indigo-200 dark:border-indigo-800/60">
                      {group.userName ? group.userName.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-slate-900 dark:text-slate-100 text-xs sm:text-sm">
                          {group.userName}
                        </span>
                        {group.attemptStatus && (
                          <span
                            className={`text-[10px] font-medium px-1.5 py-0.5 rounded uppercase tracking-wider ${
                              group.attemptStatus === 'DISQUALIFIED'
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                                : group.attemptStatus === 'REVOKED'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                                : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                            }`}
                          >
                            {group.attemptStatus}
                          </span>
                        )}
                      </div>
                      {group.userEmail && (
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                          {group.userEmail}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right: Candidate Badges & Collapse Toggle */}
                  <div className="flex items-center gap-2.5 shrink-0">
                    <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${trustColor}`}>
                      Trust: {trustScore}%
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold tabular-nums text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 border border-rose-200/70 dark:border-rose-900/50">
                      {group.violations.length} {group.violations.length === 1 ? 'Violation' : 'Violations'}
                    </span>
                    <div className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5">
                      {isCollapsed ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronUp className="w-4 h-4" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Expanded Violations List for this Candidate */}
                {!isCollapsed && (
                  <div className="border-t border-slate-200/80 dark:border-slate-800/80 overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-white dark:bg-[#131926] border-b border-slate-100 dark:border-slate-800/80 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                          <th className="py-2.5 px-4 w-48">Timestamp</th>
                          <th className="py-2.5 px-4">Violation Type</th>
                          <th className="py-2.5 px-4 text-center w-36">Image Evidence</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                        {group.violations.map((v, vIdx) => (
                          <tr
                            key={vIdx}
                            className="hover:bg-slate-50/50 dark:hover:bg-[#162030]/50 transition-colors"
                          >
                            <td className="py-2.5 px-4 whitespace-nowrap font-mono tabular-nums text-slate-600 dark:text-slate-300">
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                                <span>
                                  {v.timestamp
                                    ? formatDateTime12h(v.timestamp, { includeYear: true, includeSeconds: true })
                                    : '—'}
                                </span>
                              </div>
                            </td>
                            <td className="py-2.5 px-4 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${getBadgeStyle(v.type)}`}>
                                {VIOLATION_LABELS[v.type] || v.type}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 whitespace-nowrap text-center">
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
              </div>
            );
          })}
        </div>
      ) : (
        /* CHRONOLOGICAL FLAT TABLE VIEW */
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
                  <td className="py-3 px-4 whitespace-nowrap font-mono tabular-nums text-slate-600 dark:text-slate-300">
                    {v.timestamp ? formatDateTime12h(v.timestamp, { includeYear: true, includeSeconds: true }) : '—'}
                  </td>
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
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${getBadgeStyle(v.type)}`}>
                      {VIOLATION_LABELS[v.type] || v.type}
                    </span>
                  </td>
                  <td className="py-3 px-4 whitespace-nowrap text-center">
                    <span className="inline-block px-2 py-0.5 rounded text-xs font-semibold tabular-nums text-rose-700 dark:text-rose-400 bg-rose-50/60 dark:bg-rose-950/40 border border-rose-200/50 dark:border-rose-900/50">
                      {v.noOfViolations ?? 1}
                    </span>
                  </td>
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
