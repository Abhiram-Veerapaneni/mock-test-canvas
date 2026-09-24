import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import Breadcrumbs from '../components/common/Breadcrumbs';
import useNotificationStore from '../store/useNotificationStore';
import useAuthStore from '../store/useAuthStore';
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
    <div className="min-h-screen bg-[#edf2f9] dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      <Navbar />

      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Breadcrumb Navigation */}
        <Breadcrumbs
          items={[
            { label: 'Dashboard', path: '/dashboard' },
            { label: 'Notifications', path: '/notifications' },
          ]}
        />

        {/* Page Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-white dark:bg-[#1e293b] border border-slate-200/80 dark:border-[#334155] shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200/80 dark:border-blue-900/50 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-xs">
                <BellRing className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Notifications & Alerts</span>
                  {unreadCount > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500 text-white shadow-xs">
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
          <div className="flex items-center gap-2.5 shrink-0">
            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800/80 transition-colors cursor-pointer shadow-xs"
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
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 bg-white dark:bg-slate-800/60 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-900/50 transition-colors cursor-pointer shadow-xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear all</span>
              </button>
            )}
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Tab Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#151f32] border border-slate-200/80 dark:border-[#334155] w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'ALL'
                  ? 'bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span>All</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200/70 dark:bg-[#334155] text-slate-600 dark:text-slate-300 font-mono">
                {notifications.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('VIOLATION')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'VIOLATION'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Violations</span>
              {violationCount > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    activeTab === 'VIOLATION'
                      ? 'bg-white/20 text-white'
                      : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                  }`}
                >
                  {violationCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('EXAM_SUBMISSION')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'EXAM_SUBMISSION'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Submissions</span>
              {submissionCount > 0 && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    activeTab === 'EXAM_SUBMISSION'
                      ? 'bg-white/20 text-white'
                      : 'bg-slate-200/70 dark:bg-[#334155] text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {submissionCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('UNREAD')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'UNREAD'
                  ? 'bg-white dark:bg-[#1e293b] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <span>Unread</span>
              {unreadCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 font-mono font-bold">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notifications..."
              className="input-base text-xs pl-8 pr-7 py-2"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
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
          <div className="py-16 px-4 text-center rounded-2xl bg-white dark:bg-[#1e293b] border border-slate-200/80 dark:border-[#334155] shadow-xs space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-slate-400">
              <Inbox className="w-6 h-6 opacity-60" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
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
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                Reset filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
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
                  className={`group relative rounded-2xl border transition-all duration-200 overflow-hidden shadow-xs hover:shadow-md cursor-pointer ${
                    !notification.read
                      ? 'bg-blue-50/30 dark:bg-blue-950/15 border-blue-200/80 dark:border-blue-900/50'
                      : 'bg-white dark:bg-[#1e293b] border-slate-200/80 dark:border-[#334155]'
                  }`}
                >
                  <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start gap-4">
                    {/* Icon Badge */}
                    <div
                      className={`w-10 h-10 rounded-xl shrink-0 flex items-center justify-center border mt-0.5 shadow-xs ${
                        isViolation
                          ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60'
                          : isSubmission
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60'
                          : 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900/60'
                      }`}
                    >
                      {isViolation ? (
                        getViolationIcon(vType)
                      ) : isSubmission ? (
                        <FileCheck className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <ShieldAlert className="w-4 h-4 text-blue-500" />
                      )}
                    </div>

                    {/* Notification Body */}
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md ${
                              isViolation
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-400'
                                : isSubmission
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-400'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {isViolation
                              ? VIOLATION_LABELS[vType] || 'Proctor Violation'
                              : isSubmission
                              ? 'Submission Completed'
                              : 'Notice'}
                          </span>

                          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                            {notification.title}
                          </h2>

                          {!notification.read && (
                            <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400" />
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 font-medium shrink-0">
                          <Clock className="w-3 h-3" />
                          <span>{formatTimeAgo(notification.createdAt)}</span>
                        </div>
                      </div>

                      {/* Main Message */}
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        {notification.message}
                      </p>

                      {/* Detailed Metadata Pill Group */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {notification.data?.candidateName && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            <User className="w-3 h-3 text-slate-400" />
                            <span>{notification.data.candidateName}</span>
                          </span>
                        )}

                        {notification.data?.examTitle && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            <Shield className="w-3 h-3 text-slate-400" />
                            <span className="truncate max-w-[200px]">
                              {notification.data.examTitle}
                            </span>
                          </span>
                        )}

                        {isViolation && notification.data?.trustScore != null && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-mono font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-400 border border-rose-200/80 dark:border-rose-900/60">
                            Trust Score: {notification.data.trustScore}%
                          </span>
                        )}

                        {isSubmission && notification.data?.score != null && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-900/60">
                            Score: {notification.data.score}/{notification.data.totalMarks} (
                            {notification.data.accuracy}%)
                          </span>
                        )}
                      </div>

                      {/* Snapshot Thumbnail + Actions */}
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                        <div className="flex items-center gap-2">
                          {/* Snapshot Button / Thumbnail */}
                          {hasSnapshot && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!notification.read) markAsRead(notification._id);
                                setSnapshotPreview(notification.data);
                              }}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-blue-500" />
                              <span>View Snapshot Evidence</span>
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
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                            >
                              <span>Inspect in Audit Report</span>
                              <ExternalLink className="w-3 h-3" />
                            </Link>
                          )}
                        </div>

                        {/* Card Controls: Mark read toggle + Delete */}
                        <div className="flex items-center gap-2 ml-auto">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification._id);
                            }}
                            title={notification.read ? 'Read' : 'Mark as read'}
                            className={`p-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                              notification.read
                                ? 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                                : 'text-blue-600 dark:text-blue-400 bg-blue-100/70 dark:bg-blue-950/70 hover:bg-blue-200 dark:hover:bg-blue-900/80 ring-1 ring-blue-500/30'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification._id);
                            }}
                            title="Delete notification"
                            className="p-1.5 rounded-lg text-xs text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
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
                        className="hidden sm:block w-20 h-20 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shrink-0 cursor-pointer group/thumb relative shadow-xs hover:border-blue-500 transition-colors"
                      >
                        <img
                          src={notification.data.imageUrl}
                          alt="Proctoring violation snapshot evidence"
                          className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-200"
                        />
                        <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
                          <Eye className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Instant Snapshot Lightbox Modal */}
      {snapshotPreview && (
        <div
          className="fixed inset-0 z-[10000] bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setSnapshotPreview(null)}
        >
          <div
            className="max-w-xl w-full bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-[#334155] rounded-2xl overflow-hidden shadow-2xl p-6 text-slate-900 dark:text-slate-100 space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-500" />
                  <span>Proctoring Violation Evidence Snapshot</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {snapshotPreview.candidateName || 'Candidate'} •{' '}
                  {VIOLATION_LABELS[snapshotPreview.violationType] || snapshotPreview.violationType} •{' '}
                  {snapshotPreview.timestamp
                    ? new Date(snapshotPreview.timestamp).toLocaleTimeString()
                    : 'Active Exam'}
                </p>
              </div>
              <button
                onClick={() => setSnapshotPreview(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-black flex items-center justify-center min-h-[260px] max-h-[440px]">
              <img
                src={snapshotPreview.imageUrl}
                alt="Proctoring violation snapshot"
                className="w-full h-full object-contain"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
              <span className="font-mono">
                Trust Score:{' '}
                <strong className="text-rose-600 dark:text-rose-400 font-semibold">
                  {snapshotPreview.trustScore ?? '—'}%
                </strong>
              </span>

              {snapshotPreview.examId && (
                <Link
                  to={`/test/${snapshotPreview.examId}/audit`}
                  onClick={() => setSnapshotPreview(null)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-xs transition-colors"
                >
                  <span>Open Full Audit Report</span>
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
