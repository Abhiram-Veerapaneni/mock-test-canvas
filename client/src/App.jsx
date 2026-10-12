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
import ExamResponsesPage from './pages/ExamResponsesPage';
import NotificationsPage from './pages/NotificationsPage';
import UnderDevelopmentPage from './pages/UnderDevelopmentPage';
import LiveViolationToast from './components/proctoring/LiveViolationToast';
import SnapshotPreviewModal from './components/proctoring/SnapshotPreviewModal';
import AuthModal from './components/common/AuthModal';
import { getSocket, joinCreatorRoom, joinUserRoom } from './services/socket';
import useNotificationStore from './store/useNotificationStore';

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

        {/* Modules in active development */}
        <Route path="/question-bank" element={<UnderDevelopmentPage featureKey="/question-bank" />} />
        <Route path="/analytics" element={<UnderDevelopmentPage featureKey="/analytics" />} />
        <Route path="/assessments-overview" element={<UnderDevelopmentPage featureKey="/assessments-overview" />} />
        <Route path="/telemetry" element={<UnderDevelopmentPage featureKey="/telemetry" />} />

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

        {/* Dedicated Candidate Response Sheet & Solutions Review Page */}
        <Route
          path="/test/:testId/review/:attemptId"
          element={
            <ProtectedRoute>
              <ExamResponsesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exam/:examId/review/:attemptId"
          element={
            <ProtectedRoute>
              <ExamResponsesPage />
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
      <SnapshotPreviewModal
        snapshot={previewImage}
        onClose={() => setPreviewImage(null)}
      />
    </BrowserRouter>
  );
}
