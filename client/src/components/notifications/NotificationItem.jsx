import React from 'react';
import { Link } from 'react-router-dom';
import {
  FileCheck,
  ShieldAlert,
  Clock,
  User,
  Shield,
  Eye,
  ExternalLink,
  Check,
  Trash2,
} from 'lucide-react';
import {
  VIOLATION_LABELS,
  formatTimeAgo,
  getViolationIcon,
} from './notificationConstants';

export default function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  onOpenSnapshot,
}) {
  const isViolation = notification.type === 'VIOLATION';
  const isSubmission = notification.type === 'EXAM_SUBMISSION';
  const vType = notification.data?.violationType;
  const hasSnapshot = Boolean(notification.data?.imageUrl);

  return (
    <div
      onClick={() => {
        if (!notification.read) {
          onMarkAsRead(notification._id);
        }
      }}
      className={`p-4 sm:p-5 flex flex-col sm:flex-row items-start gap-4 transition-colors hover:bg-slate-50/50 dark:hover:bg-[#162030]/50 cursor-pointer ${
        !notification.read ? 'bg-slate-50/40 dark:bg-[#162030]/40' : ''
      }`}
    >
      {/* Status Indicator Dot & Icon */}
      <div className="flex items-center gap-2 shrink-0 mt-0.5">
        {!notification.read ? (
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 shrink-0" />
        ) : (
          <span className="w-1.5 h-1.5 rounded-full bg-transparent shrink-0" />
        )}
        <div className="w-8 h-8 rounded-md bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-slate-500 shrink-0">
          {isViolation ? (
            getViolationIcon(vType)
          ) : isSubmission ? (
            <FileCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <ShieldAlert className="w-4 h-4 text-slate-500" />
          )}
        </div>
      </div>

      {/* Notification Body */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
              {isViolation
                ? VIOLATION_LABELS[vType] || 'Proctor Violation'
                : isSubmission
                ? 'Submission Completed'
                : 'Notice'}
            </span>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {notification.title}
            </h2>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono tabular-nums shrink-0">
            <Clock className="w-3 h-3" />
            <span>{formatTimeAgo(notification.createdAt)}</span>
          </div>
        </div>

        {/* Main Message */}
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          {notification.message}
        </p>

        {/* Detailed Metadata Group */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-slate-500">
          {notification.data?.candidateName && (
            <span className="inline-flex items-center gap-1">
              <User className="w-3 h-3 text-slate-400" />
              <span>{notification.data.candidateName}</span>
            </span>
          )}

          {notification.data?.examTitle && (
            <>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <Shield className="w-3 h-3 text-slate-400" />
                <span className="truncate max-w-[200px]">
                  {notification.data.examTitle}
                </span>
              </span>
            </>
          )}

          {isViolation && notification.data?.trustScore != null && (
            <>
              <span>•</span>
              <span className="text-rose-600 dark:text-rose-400 font-medium tabular-nums">
                Trust: {notification.data.trustScore}%
              </span>
            </>
          )}

          {isSubmission && notification.data?.score != null && (
            <>
              <span>•</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium tabular-nums">
                Score: {notification.data.score}/{notification.data.totalMarks} ({notification.data.accuracy}%)
              </span>
            </>
          )}
        </div>

        {/* Actions Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-3">
            {/* Snapshot Button */}
            {hasSnapshot && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!notification.read) onMarkAsRead(notification._id);
                  onOpenSnapshot(notification.data);
                }}
                className="btn-secondary text-xs px-2.5 py-1 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                <span>View Snapshot</span>
              </button>
            )}

            {/* Link to Audit Report */}
            {notification.link && (
              <Link
                to={notification.link}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!notification.read) onMarkAsRead(notification._id);
                }}
                className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors cursor-pointer"
              >
                <span>Inspect in Audit Report</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>

          {/* Card Controls */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMarkAsRead(notification._id);
              }}
              title={notification.read ? 'Mark unread' : 'Mark as read'}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(notification._id);
              }}
              title="Delete notification"
              className="p-1 rounded-md text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Snapshot Thumbnail Preview on Right (Desktop) */}
      {hasSnapshot && (
        <div
          onClick={(e) => {
            e.stopPropagation();
            if (!notification.read) onMarkAsRead(notification._id);
            onOpenSnapshot(notification.data);
          }}
          className="hidden sm:block w-16 h-16 rounded-md bg-slate-100 dark:bg-[#0C0F17] border border-slate-200/80 dark:border-slate-800/80 overflow-hidden shrink-0 cursor-pointer group/thumb relative shadow-none hover:border-slate-400 transition-colors"
        >
          <img
            src={notification.data.imageUrl}
            alt="Proctoring violation snapshot evidence"
            className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-200"
          />
          <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
            <Eye className="w-4 h-4 text-white" />
          </div>
        </div>
      )}
    </div>
  );
}

