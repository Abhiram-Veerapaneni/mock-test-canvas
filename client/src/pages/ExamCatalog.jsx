import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  BookOpen,
  Search,
  Filter,
  Calendar,
  Clock,
  Award,
  ArrowRight,
  GraduationCap,
  Sun,
  Moon,
  ArrowLeft,
  ShieldCheck,
  FileText,
  AlertTriangle
} from 'lucide-react';
import '../styles/Auth.css';

const FALLBACK_CATALOG = [
  {
    _id: 'jee-adv-2024-p1',
    title: 'JEE Advanced 2024 - Paper 1 (Slot 1)',
    examType: 'JEE_ADVANCED',
    year: 2024,
    paperNumber: 'Paper 1 (Slot 1)',
    description: 'Official JEE Advanced 2024 Paper 1 with Physics, Chemistry & Mathematics sections.',
    durationMinutes: 180,
    totalMarks: 180,
    totalQuestions: 51,
    isPreviousYearPaper: true
  },
  {
    _id: 'gate-cs-2024-mock',
    title: 'GATE CS 2024 Mock Examination',
    examType: 'GATE_CS',
    year: 2024,
    paperNumber: 'Mock Test 1',
    description: 'Comprehensive GATE Computer Science & IT Full Length Mock Test with General Aptitude.',
    durationMinutes: 180,
    totalMarks: 100,
    totalQuestions: 65,
    isPreviousYearPaper: false
  },
  {
    _id: 'neet-ug-2024-model',
    title: 'NEET UG 2024 Full Mock Paper',
    examType: 'NEET',
    year: 2024,
    paperNumber: 'Model Paper A',
    description: 'Standard NEET UG pattern test covering Physics, Chemistry, Botany & Zoology.',
    durationMinutes: 200,
    totalMarks: 720,
    totalQuestions: 200,
    isPreviousYearPaper: false
  }
];

export default function ExamCatalog() {
  const navigate = useNavigate();
  const { user, darkMode, toggleTheme } = useAuth();

  const [catalog, setCatalog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOffline, setIsOffline] = useState(false);

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrack, setSelectedTrack] = useState('ALL');
  const [selectedYear, setSelectedYear] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');

  // Fetch catalog from backend API
  const fetchCatalog = async () => {
    try {
      setLoading(true);
      setError(null);
      const API_BASE = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/$/, '');
      const res = await fetch(`${API_BASE}/exams`);
      const data = await res.json();

      if (data.success && data.catalog && data.catalog.length > 0) {
        setCatalog(data.catalog);
        setIsOffline(false);
      } else {
        setCatalog(FALLBACK_CATALOG);
        setIsOffline(true);
      }
    } catch (err) {
      console.warn('Backend server connection failed; running in offline catalog mode:', err);
      setCatalog(FALLBACK_CATALOG);
      setIsOffline(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  // Filtered Exam List
  const filteredExams = useMemo(() => {
    return catalog.filter((item) => {
      // Search Query Filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const titleMatch = item.title.toLowerCase().includes(query);
        const descMatch = (item.description || '').toLowerCase().includes(query);
        if (!titleMatch && !descMatch) return false;
      }

      // Track Filter
      if (selectedTrack !== 'ALL' && item.examType !== selectedTrack) {
        return false;
      }

      // Year Filter
      if (selectedYear !== 'ALL' && String(item.year) !== String(selectedYear)) {
        return false;
      }

      // Type Filter
      if (selectedType === 'PYP' && !item.isPreviousYearPaper) return false;
      if (selectedType === 'MOCK' && item.isPreviousYearPaper) return false;

      return true;
    });
  }, [catalog, searchQuery, selectedTrack, selectedYear, selectedType]);

  return (
    <div className="dashboard-page" data-theme={darkMode ? 'dark' : 'light'}>
      {/* Header Bar */}
      <header className="auth-navbar">
        <div className="brand-wrapper">
          <div className="brand-icon">
            <GraduationCap style={{ width: '24px', height: '24px' }} />
          </div>
          <div>
            <h1 className="brand-title">Available Examination Papers</h1>
            <p className="brand-subtitle">AI-Proctored Previous Year Papers & Mock Tests</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            className="theme-toggle-btn"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft style={{ width: '16px', height: '16px' }} />
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            className="theme-toggle-btn"
            onClick={toggleTheme}
            title="Toggle Light/Dark Theme"
          >
            {darkMode ? (
              <>
                <Sun style={{ width: '16px', height: '16px', color: '#f59e0b' }} />
                <span>Light</span>
              </>
            ) : (
              <>
                <Moon style={{ width: '16px', height: '16px', color: '#2563eb' }} />
                <span>Dark</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="dashboard-container">
        {/* Search & Filter Controls Card */}
        <div className="dashboard-hero-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
            <BookOpen style={{ width: '26px', height: '26px', color: 'var(--accent-primary)' }} />
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Explore Test Catalog</h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Filter by Exam Track, Previous Year, or Keyword to launch your proctored session.
              </p>
            </div>
          </div>

          {/* Search Input Bar */}
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <div className="input-container">
              <Search className="input-icon-left" />
              <input
                type="text"
                className="form-input"
                placeholder="Search by title (e.g. JEE Advanced 2024 Paper 1)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Filter Bar Controls */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            {/* Track Filter */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Filter style={{ width: '14px', height: '14px', color: 'var(--accent-primary)' }} />
                <span>Exam Track</span>
              </label>
              <select
                className="form-input"
                style={{ paddingLeft: '14px' }}
                value={selectedTrack}
                onChange={(e) => setSelectedTrack(e.target.value)}
              >
                <option value="ALL">All Exam Tracks</option>
                <option value="JEE_ADVANCED">JEE Advanced</option>
                <option value="GATE_CS">GATE CS</option>
                <option value="NEET">NEET UG</option>
              </select>
            </div>

            {/* Year Filter */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar style={{ width: '14px', height: '14px', color: 'var(--accent-primary)' }} />
                <span>Year Filter</span>
              </label>
              <select
                className="form-input"
                style={{ paddingLeft: '14px' }}
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
              >
                <option value="ALL">All Years</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
                <option value="2021">2021</option>
              </select>
            </div>

            {/* Type Filter */}
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText style={{ width: '14px', height: '14px', color: 'var(--accent-primary)' }} />
                <span>Paper Category</span>
              </label>
              <select
                className="form-input"
                style={{ paddingLeft: '14px' }}
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
              >
                <option value="ALL">All Categories</option>
                <option value="PYP">Previous Year Papers</option>
                <option value="MOCK">Mock Tests</option>
              </select>
            </div>
          </div>
        </div>

        {/* Offline Status Warning Banner */}
        {isOffline && !loading && (
          <div className="alert-box" style={{ backgroundColor: 'rgba(234, 179, 8, 0.12)', border: '1px solid rgba(234, 179, 8, 0.3)', color: '#d97706', marginBottom: '20px', borderRadius: 'var(--radius-md)', padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertTriangle style={{ width: '20px', height: '20px', flexShrink: 0 }} />
              <div>
                <strong style={{ fontSize: '0.9rem' }}>Backend Server Unreachable (http://localhost:5000)</strong>
                <p style={{ fontSize: '0.8rem', margin: '2px 0 0 0', opacity: 0.9 }}>
                  Running in offline catalog mode. To connect to live Express API, run <code>cd backend && npm start</code>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={fetchCatalog}
              style={{ padding: '6px 14px', fontSize: '0.8rem', fontWeight: 700, backgroundColor: '#d97706', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
            >
              Retry Server
            </button>
          </div>
        )}

        {/* Loading / Error States */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-secondary)' }}>
            <p style={{ fontWeight: 700 }}>Loading Exam Catalog...</p>
          </div>
        )}

        {error && (
          <div className="alert-box alert-error">
            <span>{error}</span>
          </div>
        )}

        {/* Exam Cards Grid */}
        {!loading && !error && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyBetween: 'space-between', marginBottom: '4px' }}>
              <span style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-secondary)' }}>
                Showing {filteredExams.length} {filteredExams.length === 1 ? 'Exam' : 'Exams'}
              </span>
            </div>

            {filteredExams.length === 0 ? (
              <div className="dashboard-card-item" style={{ textAlign: 'center', padding: '48px 24px' }}>
                <BookOpen style={{ width: '48px', height: '48px', color: 'var(--text-muted)', margin: '0 auto 12px' }} />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>No Matching Exams Found</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Try resetting your search query or year/track filters.
                </p>
              </div>
            ) : (
              <div className="dashboard-grid">
                {filteredExams.map((item) => (
                  <div key={item._id} className="dashboard-card-item" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {/* Badges Bar */}
                    <div style={{ display: 'flex', itemsCenter: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span className="user-badge" style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent-primary)' }}>
                        {item.examType.replace('_', ' ')}
                      </span>

                      {item.year && (
                        <span className="user-badge" style={{ backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                          Year {item.year}
                        </span>
                      )}

                      {item.isPreviousYearPaper && (
                        <span className="user-badge" style={{ backgroundColor: 'rgba(147, 51, 234, 0.15)', color: '#9333ea' }}>
                          Official Paper
                        </span>
                      )}
                    </div>

                    {/* Paper Title */}
                    <div>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.3 }}>
                        {item.title}
                      </h3>
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.5 }}>
                        {item.description}
                      </p>
                    </div>

                    {/* Meta Stats Row */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', padding: '12px', backgroundColor: 'var(--bg-input)', borderRadius: 'var(--radius-md)', fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-secondary)', textAlign: 'center' }}>
                      <div>
                        <Clock style={{ width: '14px', height: '14px', margin: '0 auto 4px', color: 'var(--accent-primary)' }} />
                        <span>{item.durationMinutes} Mins</span>
                      </div>
                      <div>
                        <BookOpen style={{ width: '14px', height: '14px', margin: '0 auto 4px', color: '#10b981' }} />
                        <span>{item.totalQuestions} Qs</span>
                      </div>
                      <div>
                        <Award style={{ width: '14px', height: '14px', margin: '0 auto 4px', color: '#f59e0b' }} />
                        <span>{item.totalMarks} Marks</span>
                      </div>
                    </div>

                    {/* Start Button */}
                    <div style={{ marginTop: 'auto', paddingTop: '8px' }}>
                      <button
                        className="submit-btn"
                        onClick={() => navigate(`/exam/${item._id}`)}
                      >
                        <span>Start Proctored Exam</span>
                        <ArrowRight style={{ width: '16px', height: '16px' }} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
