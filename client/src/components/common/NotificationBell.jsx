import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useNotificationStore from '../../store/useNotificationStore';
import useAuthStore from '../../store/useAuthStore';
import {
  Bell,
  Check,
  CheckCheck,
  ShieldAlert,
  AlertTriangle,
  Users,
  EyeOff,
  Volume2,
  Smartphone,
  BookOpen,
  FileCheck,
  ExternalLink,
  ChevronRight,
} from 'lucide-react';

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
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const getNotificationIcon = (type, violationType) => {
  if (type === 'VIOLATION') {
    switch (violationType) {
      case 'CELL_PHONE':
        return <Smartphone className="w-3.5 h-3.5 text-rose-500" />;
      case 'PROHIBITED_BOOK':
        return <BookOpen className="w-3.5 h-3.5 text-amber-500" />;
      case 'MULTI_FACE':
        return <Users className="w-3.5 h-3.5 text-rose-500" />;
      case 'NO_FACE':
        return <EyeOff className="w-3.5 h-3.5 text-amber-500" />;
      case 'NOISE_SPIKE':
        return <Volume2 className="w-3.5 h-3.5 text-orange-500" />;
      default:
        return <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />;
    }
  }
  if (type === 'EXAM_SUBMISSION') {
    return <FileCheck className="w-3.5 h-3.5 text-emerald-500" />;
  }
  return <ShieldAlert className="w-3.5 h-3.5 text-blue-500" />;
};

export default function NotificationBell() {
  const { user, isAuthenticated } = useAuthStore();
  const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead } =
    useNotificationStore();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated, fetchNotifications]);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Automatically mark notifications as read after reading them in the popup
  useEffect(() => {
    if (!isOpen) return;

    if (unreadCount > 0) {
      // Mark as read after 1.2s of having the popup open (giving time to view)
      const timer = setTimeout(() => {
        markAllAsRead();
      }, 1200);

      return () => {
        clearTimeout(timer);
        // When closing after viewing, ensure unread notifications are marked as read
        markAllAsRead();
      };
    }
  }, [isOpen, unreadCount, markAllAsRead]);

  if (!isAuthenticated) return null;

  const recentNotifications = notifications.slice(0, 5);

  const handleItemClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification._id);
    }
    setIsOpen(false);
    if (notification.link) {
      navigate(notification.link);
    } else {
      navigate('/notifications');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Open notifications"
        aria-expanded={isOpen}
        title="Notifications"
        className="relative inline-flex items-center justify-center w-8 h-8 rounded-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-[#131926] hover:bg-slate-50 dark:hover:bg-[#162030] border border-slate-200/80 dark:border-slate-800/80 transition-colors cursor-pointer shadow-sm"
      >
        <Bell className="w-4 h-4" />

        {/* Unread Counter Badge */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-3.5 min-w-3.5 px-0.5 items-center justify-center rounded-full bg-indigo-600 dark:bg-indigo-400 text-[9px] font-mono font-medium text-white dark:text-[#0C0F17] shadow-none ring-1 ring-white dark:ring-[#0C0F17]">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-lg bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none z-50 overflow-hidden animate-in fade-in-50 duration-150">
          {/* Header */}
          <div className="px-4 py-2.5 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/75 dark:bg-[#0C0F17]/50">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 font-mono">
                  ({unreadCount} unread)
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={() => markAllAsRead()}
                className="text-[11px] font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <CheckCheck className="w-3 h-3" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[340px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
            {recentNotifications.length === 0 ? (
              <div className="py-8 text-center px-4">
                <div className="w-8 h-8 mx-auto mb-2 rounded-md bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-slate-400">
                  <Bell className="w-4 h-4 opacity-60" />
                </div>
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  No notifications yet
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                  Live proctoring alerts and submission updates will appear here
                </p>
              </div>
            ) : (
              recentNotifications.map((n) => {
                const isViolation = n.type === 'VIOLATION';
                const vType = n.data?.violationType;

                return (
                  <div
                    key={n._id}
                    onClick={() => handleItemClick(n)}
                    onMouseEnter={() => {
                      if (!n.read) {
                        markAsRead(n._id);
                      }
                    }}
                    className={`p-3 transition-colors cursor-pointer flex items-start gap-3 text-left hover:bg-slate-50 dark:hover:bg-[#162030] ${
                      !n.read
                        ? 'bg-indigo-50/40 dark:bg-indigo-950/20'
                        : 'bg-white dark:bg-transparent'
                    }`}
                  >
                    {/* Icon Box */}
                    <div
                      className={`w-7 h-7 rounded-md shrink-0 flex items-center justify-center border mt-0.5 ${
                        isViolation
                          ? 'bg-rose-50/60 dark:bg-rose-950/40 border-rose-200/60 dark:border-rose-900/60 text-rose-600'
                          : 'bg-slate-100 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      {getNotificationIcon(n.type, vType)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {n.title}
                        </p>
                        <span className="text-[10px] text-slate-400 font-mono shrink-0">
                          {formatTimeAgo(n.createdAt)}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-600 dark:text-slate-300 line-clamp-2 mt-0.5">
                        {n.message}
                      </p>

                      {isViolation && n.data?.candidateName && (
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                          <span className="font-medium text-slate-700 dark:text-slate-300 truncate">
                            {n.data.candidateName}
                          </span>
                          {n.data.trustScore != null && (
                            <span className="font-mono text-rose-600 dark:text-rose-400 tabular-nums">
                              Trust: {n.data.trustScore}%
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Unread indicator dot */}
                    {!n.read && (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400 shrink-0 mt-2" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/75 dark:bg-[#0C0F17]/50 text-center">
            <Link
              to="/notifications"
              onClick={() => setIsOpen(false)}
              className="w-full py-1 px-3 rounded-md text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>View all notifications</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
