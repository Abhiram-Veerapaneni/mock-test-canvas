import React from 'react';
import { Search, FileText, FlaskConical, ShieldCheck, ChevronRight } from 'lucide-react';
import { formatDateTime12h } from '../../utils/dateUtils';

export default function AuditCompletionReportTable({
  filteredCompletion,
  statusFilter,
  setStatusFilter,
  modeFilter,
  setModeFilter,
  trustFilter,
  setTrustFilter,
  sortBy,
  setSortBy,
  completionSearch,
  setCompletionSearch,
  formatSeconds,
  examId,
  navigate
}) {
  return (
    <section className="bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none rounded-lg shadow-none overflow-hidden space-y-4 p-6">
      {/* Filters & Sorting */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-md bg-white dark:bg-[#131926] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800/80 focus:outline-none cursor-pointer text-xs"
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
            className="px-2.5 py-1.5 rounded-md bg-white dark:bg-[#131926] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800/80 focus:outline-none cursor-pointer text-xs"
          >
            <option value="ALL">All Modes</option>
            <option value="OFFICIAL">Official Exams</option>
            <option value="PRACTICE">Practice Sessions</option>
          </select>

          {/* Trust score filter */}
          <select
            value={trustFilter}
            onChange={(e) => setTrustFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-md bg-white dark:bg-[#131926] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800/80 focus:outline-none cursor-pointer text-xs"
          >
            <option value="ALL">All Trust Scores</option>
            <option value="LOW">Low Trust (&lt; 70%)</option>
            <option value="HIGH">High Trust (≥ 80%)</option>
          </select>

          {/* Sort Order */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-2.5 py-1.5 rounded-md bg-white dark:bg-[#131926] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800/80 focus:outline-none cursor-pointer text-xs"
          >
            <option value="RECENT">Sort: Most Recent</option>
            <option value="SCORE_DESC">Sort: Highest Score</option>
            <option value="TRUST_ASC">Sort: Lowest Trust Score</option>
            <option value="VIOLATIONS_DESC">Sort: Most Violations</option>
          </select>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
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
        <div className="py-16 text-center text-slate-400 space-y-2">
          <FileText className="w-8 h-8 mx-auto opacity-40 text-slate-400" />
          <p className="text-xs font-medium">No candidate reports match the active filters.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200/80 dark:border-slate-800/80">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/75 dark:bg-[#0C0F17]/75 border-b border-slate-200/80 dark:border-slate-800/80 text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
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
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredCompletion.map((item, idx) => (
                <tr
                  key={idx}
                  className="hover:bg-slate-50/50 dark:hover:bg-[#162030]/50 transition-colors"
                >
                  {/* 1. User */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-semibold flex items-center justify-center text-[10px]">
                        {item.user?.name ? item.user.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <div>
                        <div className="font-medium text-slate-900 dark:text-slate-100">
                          {item.user?.name || 'Candidate'}
                        </div>
                        <div className="text-[10px] text-slate-400">{item.user?.email}</div>
                      </div>
                    </div>
                  </td>

                  {/* 2. Mode */}
                  <td className="py-3 px-4 whitespace-nowrap text-center">
                    {item.isPractice ? (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                        <FlaskConical className="w-3 h-3 text-slate-400" />
                        Practice
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-slate-700 dark:text-slate-300 font-medium">
                        <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        Official
                      </span>
                    )}
                  </td>

                  {/* 3. Status */}
                  <td className="py-3 px-4 whitespace-nowrap text-center">
                    <span className="inline-flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                      <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'SUBMITTED' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                      {item.status === 'SUBMITTED' ? 'Submitted' : item.status}
                    </span>
                  </td>

                  {/* 4. Time Taken */}
                  <td className="py-3 px-4 whitespace-nowrap text-center tabular-nums text-slate-600 dark:text-slate-300 font-mono">
                    {formatSeconds(item.timeTakenSeconds)}
                  </td>

                  {/* 5. Score */}
                  <td className="py-3 px-4 whitespace-nowrap text-center">
                    <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums text-sm">
                      {item.score}
                    </span>
                    <span className="text-[10px] text-slate-400 ml-1">pts</span>
                  </td>

                  {/* 6. Accuracy */}
                  <td className="py-3 px-4 whitespace-nowrap text-center font-medium tabular-nums">
                    <span className={item.accuracy >= 70 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-slate-600 dark:text-slate-400'}>
                      {item.accuracy}%
                    </span>
                  </td>

                  {/* 7. Answered / Unanswered */}
                  <td className="py-3 px-4 whitespace-nowrap text-center font-mono">
                    <span className="text-slate-800 dark:text-slate-200 font-semibold">{item.answeredCount}</span>
                    <span className="text-slate-400 mx-1">/</span>
                    <span className="text-slate-400">{item.unansweredCount}</span>
                  </td>

                  {/* 8. Violations Count */}
                  <td className="py-3 px-4 whitespace-nowrap text-center">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold tabular-nums ${
                      item.violationsCount > 0
                        ? 'bg-rose-50/60 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200/50 dark:border-rose-900/50'
                        : 'text-slate-400'
                    }`}>
                      {item.violationsCount}
                    </span>
                  </td>

                  {/* 9. Trust Score at End */}
                  <td className="py-3 px-4 whitespace-nowrap text-center">
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium tabular-nums text-slate-700 dark:text-slate-300">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        item.trustScore >= 80 ? 'bg-emerald-500' : item.trustScore >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                      }`} />
                      {item.trustScore}%
                    </span>
                  </td>

                  {/* 10. Submitted At */}
                  <td className="py-3 px-4 whitespace-nowrap text-right font-mono text-slate-500 text-[11px]">
                    {item.submittedAt ? formatDateTime12h(item.submittedAt) : '—'}
                  </td>

                  {/* 11. Actions */}
                  <td className="py-3 px-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => navigate(`/test/${examId}/review/${item.attemptId}`)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors cursor-pointer"
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
  );
}
