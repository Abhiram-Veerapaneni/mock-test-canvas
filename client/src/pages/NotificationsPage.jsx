import React, { useState, useEffect, useMemo } from 'react';
import Navbar from '../components/common/Navbar';
import Breadcrumbs from '../components/common/Breadcrumbs';
import NotificationHeader from '../components/notifications/NotificationHeader';
import NotificationFilterBar from '../components/notifications/NotificationFilterBar';
import NotificationItem from '../components/notifications/NotificationItem';
import NotificationSnapshotModal from '../components/notifications/NotificationSnapshotModal';
import useNotificationStore from '../store/useNotificationStore';
import { Inbox } from 'lucide-react';

export default function NotificationsPage() {
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

  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'VIOLATION' | 'EXAM_SUBMISSION' | 'UNREAD'
  const [searchQuery, setSearchQuery] = useState('');
  const [snapshotPreview, setSnapshotPreview] = useState(null);

  useEffect(() => {
    fetchNotifications().then((res) => {
      if (res?.unreadCount > 0) {
        markAllAsRead();
      }
    });
  }, [fetchNotifications, markAllAsRead]);

  // Filter and search logic
  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      if (activeTab === 'VIOLATION' && item.type !== 'VIOLATION') return false;
      if (activeTab === 'EXAM_SUBMISSION' && item.type !== 'EXAM_SUBMISSION') return false;
      if (activeTab === 'UNREAD' && item.read) return false;

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
        <Breadcrumbs
          items={[
            { label: 'Dashboard', path: '/dashboard' },
            { label: 'Notifications', path: '/notifications' },
          ]}
        />

        {/* Page Header Banner */}
        <NotificationHeader
          unreadCount={unreadCount}
          totalCount={notifications.length}
          onMarkAllAsRead={markAllAsRead}
          onClearAll={clearAll}
        />

        {/* Filters and Search Bar */}
        <NotificationFilterBar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          totalCount={notifications.length}
          violationCount={violationCount}
          submissionCount={submissionCount}
          unreadCount={unreadCount}
        />

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
            {filteredNotifications.map((notification) => (
              <NotificationItem
                key={notification._id}
                notification={notification}
                onMarkAsRead={markAsRead}
                onDelete={deleteNotification}
                onOpenSnapshot={setSnapshotPreview}
              />
            ))}
          </div>
        )}
      </main>

      {/* Snapshot Modal */}
      <NotificationSnapshotModal
        snapshotPreview={snapshotPreview}
        onClose={() => setSnapshotPreview(null)}
      />
    </div>
  );
}
