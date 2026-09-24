import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/useAuthStore';
import ProtectedRoute from './components/common/ProtectedRoute';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import TestCreationPage from './pages/TestCreationPage';
import ExamDetailPage from './pages/ExamDetailPage';
import ExamSessionPage from './pages/ExamSessionPage';
import ExamAuditReportPage from './pages/ExamAuditReportPage';
import ExamLiveMonitorPage from './pages/ExamLiveMonitorPage';
import NotificationsPage from './pages/NotificationsPage';
import LiveViolationToast from './components/proctoring/LiveViolationToast';
import AuthModal from './components/common/AuthModal';
import { getSocket, joinCreatorRoom, joinUserRoom } from './services/socket';
import useNotificationStore from './store/useNotificationStore';
import { X, ExternalLink } from 'lucide-react';

export default function App() {
  const { user, fetchMe } = useAuthStore();
  const [activeAlert, setActiveAlert] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  // Connect user and creator to personal Socket.IO rooms to receive live notifications across tests
  useEffect(() => {
    if (!user?._id) return;

    joinCreatorRoom(user._id);
    joinUserRoom(user._id);
    const socket = getSocket();

    const handleLiveViolation = (alertData) => {
      console.log('[Live Notification] Incoming violation alert:', alertData);
      setActiveAlert(alertData);
    };

    const handleNewNotification = (notification) => {
      console.log('[Notification] Incoming new notification:', notification);
      useNotificationStore.getState().addNotification(notification);
    };

    socket.on('violation:live', handleLiveViolation);
    socket.on('notification:new', handleNewNotification);

    return () => {
      socket.off('violation:live', handleLiveViolation);
      socket.off('notification:new', handleNewNotification);
    };
  }, [user?._id]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Auth Page */}
        <Route path="/login" element={<AuthPage />} />

        {/* Dashboard — Publicly accessible (Guest Mode supported) */}
        <Route path="/dashboard" element={<DashboardPage />} />

        {/* Protected Notifications Center */}
        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />

        {/* Exam Authoring Studio — Publicly accessible for building/previewing */}
        <Route path="/create-test" element={<TestCreationPage />} />

        {/* Dedicated Creator Audit Report & Completion Page */}
        <Route
          path="/test/:testId/audit"
          element={
            <ProtectedRoute>
              <ExamAuditReportPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exam/:examId/audit"
          element={
            <ProtectedRoute>
              <ExamAuditReportPage />
            </ProtectedRoute>
          }
        />

        {/* Dedicated Pop-up Live Proctoring Workstation */}
        <Route
          path="/test/:testId/live"
          element={
            <ProtectedRoute>
              <ExamLiveMonitorPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exam/:examId/live"
          element={
            <ProtectedRoute>
              <ExamLiveMonitorPage />
            </ProtectedRoute>
          }
        />

        {/* Test Detail Page — Publicly accessible (Guest Mode supported) */}
        <Route path="/test/:testId" element={<ExamDetailPage />} />
        {/* Backwards compatibility for /exam/:examId */}
        <Route path="/exam/:examId" element={<ExamDetailPage />} />

        {/* Interactive Exam Session Player — generic SPA route during active test */}
        <Route
          path="/test"
          element={
            <ProtectedRoute>
              <ExamSessionPage />
            </ProtectedRoute>
          }
        />

        {/* Root Redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>

      {/* Global Auth Modal Pop-up */}
      <AuthModal />

      {/* Floating Live Proctor Alert Toast for Creator */}
      {activeAlert && (
        <LiveViolationToast
          alert={activeAlert}
          onClose={() => setActiveAlert(null)}
          onViewEvidence={(alert) => {
            if (alert.imageUrl) {
              setPreviewImage(alert);
            }
          }}
        />
      )}

      {/* Instant Snapshot Lightbox Preview */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[10000] bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="max-w-2xl w-full bg-white dark:bg-[#1e293b] border border-slate-200/90 dark:border-[#334155] rounded-2xl overflow-hidden shadow-2xl p-6 text-slate-900 dark:text-slate-100 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Live Proctoring Snapshot</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {previewImage.userName} • {previewImage.type} •{' '}
                  {new Date(previewImage.timestamp).toLocaleTimeString()}
                </p>
              </div>
              <button
                onClick={() => setPreviewImage(null)}
                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#151f32] dark:hover:bg-[#243147] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors border border-slate-200/80 dark:border-[#334155]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-xl overflow-hidden bg-slate-100 dark:bg-[#0f172a] border border-slate-200/80 dark:border-[#334155] max-h-[60vh] flex items-center justify-center">
              <img
                src={previewImage.imageUrl}
                alt="Captured proctoring violation"
                className="max-h-[60vh] w-auto object-contain"
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                Violation: {previewImage.type} • Trust Score: <strong className="text-rose-600 dark:text-rose-400">{previewImage.trustScore}%</strong>
              </span>
              <a
                href={previewImage.imageUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                <span>Full Resolution</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </BrowserRouter>
  );
}
