import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Breadcrumbs from '../components/common/Breadcrumbs';
import useNotificationStore from '../store/useNotificationStore';
import useAuthStore from '../store/useAuthStore';
import { formatDateTime12h } from '../utils/dateUtils';
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  Trash2,
  Filter,
  Search,
  AlertTriangle,
  Users,
  EyeOff,
  Volume2,
  Smartphone,
  BookOpen,
  FileCheck,
  ExternalLink,
  ShieldAlert,
  Eye,
  X,
  Clock,
  Shield,
  Calendar,
  Sparkles,
  Inbox,
  User,
} from 'lucide-react';

const VIOLATION_LABELS = {
  TAB_SWITCH: 'Tab Switched',
  WINDOW_BLUR: 'Window Focus Lost',
  FULLSCREEN_EXIT: 'Fullscreen Exited',
  NO_FACE: 'No Face Detected',
  MULTI_FACE: 'Multiple Faces Detected',
  NOISE_SPIKE: 'Excessive Noise Spike',
  CELL_PHONE: 'Mobile Phone Detected',
  PROHIBITED_BOOK: 'Book / Notes Detected',
  PROHIBITED_OBJECT: 'Prohibited Device Detected',
};

const formatTimeAgo = (dateInput) => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const getViolationIcon = (violationType) => {
  switch (violationType) {
    case 'CELL_PHONE':
      return <Smartphone className="w-4 h-4 text-rose-500" />;
    case 'PROHIBITED_BOOK':
      return <BookOpen className="w-4 h-4 text-amber-500" />;
    case 'MULTI_FACE':
      return <Users className="w-4 h-4 text-rose-500" />;
    case 'NO_FACE':
      return <EyeOff className="w-4 h-4 text-amber-500" />;
    case 'NOISE_SPIKE':
      return <Volume2 className="w-4 h-4 text-orange-500" />;
    default:
      return <AlertTriangle className="w-4 h-4 text-rose-500" />;
  }
};

export default function NotificationsPage() {
  const { user } = useAuthStore();
  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  } = useNotificationStore();

  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'VIOLATION' | 'EXAM_SUBMISSION' | 'UNREAD'
  const [searchQuery, setSearchQuery] = useState('');
  const [snapshotPreview, setSnapshotPreview] = useState(null);

  useEffect(() => {
    fetchNotifications().then((res) => {
      // Automatically mark notifications as read when viewing them in the notification page
      if (res?.unreadCount > 0) {
        markAllAsRead();
      }
    });
  }, [fetchNotifications, markAllAsRead]);

  // Filter and search logic
  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      // Tab filter
      if (activeTab === 'VIOLATION' && item.type !== 'VIOLATION') return false;
      if (activeTab === 'EXAM_SUBMISSION' && item.type !== 'EXAM_SUBMISSION') return false;
      if (activeTab === 'UNREAD' && item.read) return false;

      // Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const titleMatch = item.title?.toLowerCase().includes(query);
        const messageMatch = item.message?.toLowerCase().includes(query);
        const candidateMatch = item.data?.candidateName?.toLowerCase().includes(query);
        const examMatch = item.data?.examTitle?.toLowerCase().includes(query);
        const violationMatch = item.data?.violationType?.toLowerCase().includes(query);
        return titleMatch || messageMatch || candidateMatch || examMatch || violationMatch;
      }

      return true;
    });
  }, [notifications, activeTab, searchQuery]);

  // Tab counts
  const violationCount = useMemo(
    () => notifications.filter((n) => n.type === 'VIOLATION').length,
    [notifications]
  );
  const submissionCount = useMemo(
    () => notifications.filter((n) => n.type === 'EXAM_SUBMISSION').length,
    [notifications]
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#0C0F17] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Breadcrumb Navigation */}
        <Breadcrumbs
          items={[
            { label: 'Dashboard', path: '/dashboard' },
            { label: 'Notifications', path: '/notifications' },
          ]}
        />

        {/* Page Header Banner */}
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
                onClick={() => markAllAsRead()}
                className="btn-secondary text-xs px-3 py-1.5 inline-flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all as read</span>
              </button>
            )}

            {notifications.length > 0 && (
              <button
                onClick={() => {
                  if (window.confirm('Are you sure you want to clear all notifications?')) {
                    clearAll();
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

        {/* Filters and Search Bar */}
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
                ({notifications.length})
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

        {/* Notifications List */}
        {isLoading && notifications.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-8 h-8 mx-auto border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Loading notifications...
            </p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="py-16 px-4 text-center rounded-lg bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none space-y-3">
            <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-slate-400">
              <Inbox className="w-5 h-5 opacity-60" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                No notifications found
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                {searchQuery
                  ? 'No notifications matched your search criteria. Try a different query.'
                  : activeTab === 'VIOLATION'
                  ? 'No proctoring violations recorded. All candidate sessions are currently clean.'
                  : activeTab === 'UNREAD'
                  ? 'You have caught up with all notifications!'
                  : 'Proctoring violations and test updates will appear here in real time.'}
              </p>
            </div>
            {(searchQuery || activeTab !== 'ALL') && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setActiveTab('ALL');
                }}
                className="btn-secondary text-xs px-3 py-1.5 cursor-pointer"
              >
                Reset filters
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-200/80 dark:divide-slate-800/80 border border-slate-200/80 dark:border-slate-800/80 rounded-lg bg-white dark:bg-[#131926] overflow-hidden shadow-none">
            {filteredNotifications.map((notification) => {
              const isViolation = notification.type === 'VIOLATION';
              const isSubmission = notification.type === 'EXAM_SUBMISSION';
              const vType = notification.data?.violationType;
              const hasSnapshot = !!notification.data?.imageUrl;

              return (
                <div
                  key={notification._id}
                  onClick={() => {
                    if (!notification.read) {
                      markAsRead(notification._id);
                    }
                  }}
                  className={`p-4 sm:p-5 flex flex-col sm:flex-row items-start gap-4 transition-colors hover:bg-slate-50/50 dark:hover:bg-[#162030]/50 cursor-pointer ${
                    !notification.read ? 'bg-slate-50/40 dark:bg-[#162030]/40' : ''
                  }`}
                >
                  {/* Status Indicator Dot & Icon */}
                  <div className="flex items-center gap-2 shrink-0 mt-0.5">
                    {!notification.read ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-900 dark:bg-slate-100 shrink-0" />
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
                              if (!notification.read) markAsRead(notification._id);
                              setSnapshotPreview(notification.data);
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
                              if (!notification.read) markAsRead(notification._id);
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
                            markAsRead(notification._id);
                          }}
                          title={notification.read ? 'Mark unread' : 'Mark as read'}
                          className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification._id);
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
                        if (!notification.read) markAsRead(notification._id);
                        setSnapshotPreview(notification.data);
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
            })}
          </div>
        )}
      </main>

      {/* Instant Snapshot Lightbox Modal */}
      {snapshotPreview && (
        <div
          className="fixed inset-0 z-[10000] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSnapshotPreview(null)}
        >
          <div
            className="max-w-xl w-full bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none rounded-lg overflow-hidden shadow-sm p-6 text-slate-900 dark:text-slate-100 space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-500" />
                  <span>Proctoring Violation Evidence Snapshot</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {snapshotPreview.candidateName || 'Candidate'} •{' '}
                  {VIOLATION_LABELS[snapshotPreview.violationType] || snapshotPreview.violationType} •{' '}
                  {snapshotPreview.timestamp
                    ? formatDateTime12h(snapshotPreview.timestamp, { includeYear: true, includeSeconds: true })
                    : 'Active Exam'}
                </p>
              </div>
              <button
                onClick={() => setSnapshotPreview(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-md transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-md overflow-hidden border border-slate-200/80 dark:border-slate-800/80 bg-slate-950 flex items-center justify-center min-h-[260px] max-h-[440px]">
              <img
                src={snapshotPreview.imageUrl}
                alt="Proctoring violation snapshot"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
              <span className="font-mono">
                Trust Score:{' '}
                <strong className="text-rose-600 dark:text-rose-400 font-medium">
                  {snapshotPreview.trustScore ?? '—'}%
                </strong>
              </span>

              {snapshotPreview.examId && (
                <Link
                  to={`/test/${snapshotPreview.examId}/audit`}
                  onClick={() => setSnapshotPreview(null)}
                  className="btn-primary text-xs inline-flex items-center gap-1.5 px-3 py-1.5"
                >
                  <span>Open Audit Report</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
