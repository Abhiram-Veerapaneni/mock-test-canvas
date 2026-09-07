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
import LiveViolationToast from './components/proctoring/LiveViolationToast';
import { getSocket, joinCreatorRoom } from './services/socket';
import { X, ExternalLink } from 'lucide-react';

export default function App() {
  const { user, fetchMe } = useAuthStore();
  const [activeAlert, setActiveAlert] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  // Connect creator to personal Socket.IO room to receive live notifications across tests
  useEffect(() => {
    if (!user?._id) return;

    joinCreatorRoom(user._id);
    const socket = getSocket();

    const handleLiveViolation = (alertData) => {
      console.log('[Live Notification] Incoming violation alert:', alertData);
      setActiveAlert(alertData);
    };

    socket.on('violation:live', handleLiveViolation);

    return () => {
      socket.off('violation:live', handleLiveViolation);
    };
  }, [user?._id]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Auth Page */}
        <Route path="/login" element={<AuthPage />} />

        {/* Protected Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />

        {/* Protected Exam Authoring Studio */}
        <Route
          path="/create-test"
          element={
            <ProtectedRoute>
              <TestCreationPage />
            </ProtectedRoute>
          }
        />

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

        {/* Test Detail Page — shows metadata + attempt history */}
        <Route
          path="/test/:testId"
          element={
            <ProtectedRoute>
              <ExamDetailPage />
            </ProtectedRoute>
          }
        />
        {/* Backwards compatibility for /exam/:examId */}
        <Route
          path="/exam/:examId"
          element={
            <ProtectedRoute>
              <ExamDetailPage />
            </ProtectedRoute>
          }
        />

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
          className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl p-5 text-slate-100 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Live Proctoring Snapshot</h3>
                <p className="text-xs text-slate-400">
                  {previewImage.userName} • {previewImage.type} •{' '}
                  {new Date(previewImage.timestamp).toLocaleTimeString()}
                </p>
              </div>
              <button
                onClick={() => setPreviewImage(null)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden bg-black border border-slate-800 max-h-[60vh] flex items-center justify-center">
              <img
                src={previewImage.imageUrl}
                alt="Captured proctoring violation"
                className="max-h-[60vh] w-auto object-contain"
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="text-slate-400 font-mono text-[11px]">
                Violation: {previewImage.type} • Trust Score: {previewImage.trustScore}%
              </span>
              <a
                href={previewImage.imageUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 font-medium"
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
