import React from 'react';
import { BellRing, CheckCheck, Trash2 } from 'lucide-react';

export default function NotificationHeader({
  unreadCount,
  totalCount,
  onMarkAllAsRead,
  onClearAll,
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-lg bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none">
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/40 flex items-center justify-center shrink-0">
            <BellRing className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Notifications & Alerts</span>
              {unreadCount > 0 && (
                <span className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium ml-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  {unreadCount} unread
                </span>
              )}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Real-time proctoring violations, exam submissions, and system notices
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 shrink-0">
        {unreadCount > 0 && (
          <button
            onClick={onMarkAllAsRead}
            className="btn-secondary text-xs px-3 py-1.5 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Mark all as read</span>
          </button>
        )}

        {totalCount > 0 && (
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to clear all notifications?')) {
                onClearAll();
              }
            }}
            className="btn-secondary text-xs px-3 py-1.5 inline-flex items-center gap-1.5 text-slate-600 hover:text-rose-600 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear all</span>
          </button>
        )}
      </div>
    </div>
  );
}

