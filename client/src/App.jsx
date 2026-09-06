import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/useAuthStore';
import ProtectedRoute from './components/common/ProtectedRoute';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import TestCreationPage from './pages/TestCreationPage';
import ExamDetailPage from './pages/ExamDetailPage';
import ExamSessionPage from './pages/ExamSessionPage';

export default function App() {
  const { fetchMe } = useAuthStore();

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

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

        {/* Test Detail Page — shows metadata + attempt history */}
        <Route
          path="/exam/:examId"
          element={
            <ProtectedRoute>
              <ExamDetailPage />
            </ProtectedRoute>
          }
        />

        {/* Interactive Exam Session Player */}
        <Route
          path="/exam/:examId/take"
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
    </BrowserRouter>
  );
}
