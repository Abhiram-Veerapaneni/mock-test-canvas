import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  GraduationCap, 
  Sun, 
  Moon, 
  LogOut, 
  CheckCircle2, 
  ShieldCheck, 
  Brain, 
  BookOpen, 
  Award,
  ArrowRight,
  AlertTriangle
} from 'lucide-react';
import '../styles/Auth.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout, darkMode, toggleTheme } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  return (
    <div className="dashboard-page" data-theme={darkMode ? 'dark' : 'light'}>
      {/* Navbar Header */}
      <header className="auth-navbar">
        <div className="brand-wrapper">
          <div className="brand-icon">
            <GraduationCap style={{ width: '24px', height: '24px' }} />
          </div>
          <div>
            <h1 className="brand-title">AI-Proctored Mock Tests</h1>
            <p className="brand-subtitle">Candidate Home Dashboard</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            type="button"
            className="theme-toggle-btn" 
            onClick={toggleTheme}
            title="Toggle Light/Dark Theme"
          >
            {darkMode ? (
              <>
                <Sun style={{ width: '16px', height: '16px', color: '#f59e0b' }} />
                <span>Light Mode</span>
              </>
            ) : (
              <>
                <Moon style={{ width: '16px', height: '16px', color: '#2563eb' }} />
                <span>Dark Mode</span>
              </>
            )}
          </button>

          <button type="button" className="logout-btn" onClick={() => setShowLogoutModal(true)}>
            <LogOut style={{ width: '14px', height: '14px' }} />
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Dashboard Main Content */}
      <main className="dashboard-container">
        {/* Welcome Hero Banner */}
        <div className="dashboard-hero-card">
          <div className="user-profile-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div className="avatar">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Welcome, {user?.name || 'Candidate'}!</h2>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{user?.email}</p>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginTop: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399', fontSize: '0.875rem', fontWeight: 700 }}>
              <CheckCircle2 style={{ width: '18px', height: '18px' }} />
              <span>Email Verified • Ready for Examination</span>
            </div>
          </div>
        </div>

        {/* Dashboard Placeholder Grid Cards */}
        <div className="dashboard-grid">
          {/* Card 1: Exams */}
          <div className="dashboard-card-item">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <BookOpen style={{ width: '22px', height: '22px', color: 'var(--accent-primary)' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Available Mock Tests</h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Select target exam tracks (JEE, GATE, NEET, Aptitude) to begin adaptive proctored mock tests.
            </p>
            <div style={{ marginTop: 'auto', paddingTop: '12px' }}>
              <button 
                onClick={() => navigate('/exams')}
                className="submit-btn" 
                style={{ fontSize: '0.85rem', padding: '10px' }}
              >
                Browse Exam Catalog <ArrowRight style={{ width: '16px', height: '16px' }} />
              </button>
            </div>
          </div>

          {/* Card 2: AI Diagnostics */}
          <div className="dashboard-card-item">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Brain style={{ width: '22px', height: '22px', color: 'var(--accent-primary)' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Gemini AI Diagnostics</h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Complete mock tests to generate automated skill matrices, topic weak/strong critiques, and personalized study plans.
            </p>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 'auto' }}>
              No diagnostics generated yet.
            </span>
          </div>

          {/* Card 3: Proctoring Readiness */}
          <div className="dashboard-card-item">
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <ShieldCheck style={{ width: '22px', height: '22px', color: 'var(--accent-primary)' }} />
              <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>AI Proctoring Engine</h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Client-side webcam face detection, tab-switching hooks, and fullscreen enforcement are ready for deployment.
            </p>
            <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 700, marginTop: 'auto' }}>
              ● Engine Online & Calibrated
            </span>
          </div>
        </div>
      </main>

      {/* Confirm Logout Modal */}
      {showLogoutModal && (
        <div className="modal-overlay" onClick={() => setShowLogoutModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-icon-badge">
                <LogOut style={{ width: '22px', height: '22px', color: '#ef4444' }} />
              </div>
              <h3 className="modal-title">Confirm Logout</h3>
            </div>
            <p className="modal-description">
              Are you sure you want to sign out of your candidate examination portal session?
            </p>
            <div className="modal-actions">
              <button 
                type="button" 
                className="modal-cancel-btn" 
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="modal-confirm-btn" 
                onClick={logout}
              >
                Confirm Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
