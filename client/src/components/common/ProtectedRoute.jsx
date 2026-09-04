import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/useAuthStore';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading, fetchMe } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    // Attempt revalidation if token is present but user state is not loaded yet
    const token = localStorage.getItem('token');
    if (token && !isAuthenticated && !isLoading) {
      fetchMe();
    }
  }, [fetchMe, isAuthenticated, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-200">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400 mb-3" />
        <p className="text-sm font-medium tracking-wide">Securing session...</p>
      </div>
    );
  }

  if (!isAuthenticated && !localStorage.getItem('token')) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
