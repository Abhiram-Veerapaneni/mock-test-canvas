import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  GraduationCap, 
  Sun, 
  Moon, 
  User, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import '../styles/Auth.css';

export default function AuthPage() {
  const { 
    user, 
    register, 
    verifyOTP, 
    resendOTP, 
    login, 
    error, 
    setError, 
    darkMode, 
    toggleTheme 
  } = useAuth();

  const [mode, setMode] = useState('register'); // 'register' | 'verify_otp' | 'login'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    targetExamTrack: 'JEE'
  });
  const [otpCode, setOtpCode] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const tracks = ['JEE', 'GATE', 'NEET', 'Aptitude'];

  // Automatically redirect authenticated candidate to /dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (error) setError(null);
  };

  const handleTrackSelect = (track) => {
    setFormData({ ...formData, targetExamTrack: track });
  };

  const handleRegisterOrLogin = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMessage('');
    setError(null);

    try {
      if (mode === 'register') {
        if (!formData.name.trim()) {
          throw new Error('Please enter your full name');
        }
        await register(
          formData.name,
          formData.email,
          formData.password,
          formData.targetExamTrack
        );
        setPendingEmail(formData.email);
        setMode('verify_otp');
        setSuccessMessage('Registration successful! Please enter the 6-digit OTP sent to your email.');
      } else if (mode === 'login') {
        await login(formData.email, formData.password);
        setSuccessMessage('Welcome back! Logged in successfully.');
      }
    } catch (err) {
      if (err.requiresOTP) {
        setPendingEmail(formData.email);
        setMode('verify_otp');
        setSuccessMessage('Your account requires verification. Please enter the OTP code.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.trim().length !== 6) {
      setError('Please enter a valid 6-digit OTP code');
      return;
    }

    setSubmitting(true);
    setSuccessMessage('');
    setError(null);

    try {
      const emailToVerify = pendingEmail || formData.email;
      await verifyOTP(emailToVerify, otpCode.trim());
      setSuccessMessage('Email verified successfully! Redirecting...');
    } catch (err) {
      // Managed in AuthContext
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendOTP = async () => {
    const targetEmail = pendingEmail || formData.email;
    if (!targetEmail) {
      setError('Please enter your email address to resend OTP.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await resendOTP(targetEmail);
      setSuccessMessage('A fresh 6-digit OTP has been sent to your email.');
    } catch (err) {
      // Managed in AuthContext
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoFill = () => {
    const demoEmail = `candidate_${Math.floor(Math.random() * 1000)}@exam.com`;
    if (mode === 'register') {
      setFormData({
        name: 'Aarav Sharma',
        email: demoEmail,
        password: 'password123',
        targetExamTrack: 'JEE'
      });
    } else {
      setFormData({
        name: '',
        email: 'teststudent@exam.com',
        password: 'password123',
        targetExamTrack: 'JEE'
      });
    }
  };

  return (
    <div className="auth-page" data-theme={darkMode ? 'dark' : 'light'}>
      {/* Navigation Header */}
      <header className="auth-navbar">
        <div className="brand-wrapper">
          <div className="brand-icon">
            <GraduationCap style={{ width: '24px', height: '24px' }} />
          </div>
          <div>
            <h1 className="brand-title">AI-Proctored Mock Tests</h1>
            <p className="brand-subtitle">National Competitive Examination Portal</p>
          </div>
        </div>

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
      </header>

      {/* Main Content Body */}
      <main className="auth-main">
        <div className="auth-card">
          {/* Tab Switcher */}
          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
              onClick={() => {
                setMode('register');
                setError(null);
                setSuccessMessage('');
              }}
            >
              Register
            </button>
            <button
              type="button"
              className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => {
                setMode('login');
                setError(null);
                setSuccessMessage('');
              }}
            >
              Sign In
            </button>
          </div>

          {/* Title Header */}
          <div className="card-header">
            <h2 className="card-title">
              {mode === 'verify_otp'
                ? 'Email OTP Verification'
                : mode === 'register'
                ? 'Candidate Registration'
                : 'Candidate Sign In'}
            </h2>
            <p className="card-subtitle">
              {mode === 'verify_otp'
                ? `Enter the 6-digit OTP code sent to ${pendingEmail || formData.email}`
                : mode === 'register'
                ? 'Create an account to receive confirmation OTP'
                : 'Enter your registered candidate credentials'}
            </p>
          </div>

          {/* Error & Success Alerts */}
          {error && (
            <div className="alert-box alert-error">
              <AlertCircle style={{ width: '18px', height: '18px' }} />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="alert-box alert-success">
              <CheckCircle2 style={{ width: '18px', height: '18px' }} />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Form Modes */}
          {mode === 'verify_otp' ? (
            /* OTP Form */
            <form className="auth-form" onSubmit={handleVerifyOTP}>
              <div className="form-group">
                <label className="form-label" style={{ textAlign: 'center', display: 'block' }}>
                  Enter 6-Digit OTP Code
                </label>
                <div className="input-container">
                  <input
                    type="text"
                    maxLength={6}
                    className="form-input otp-input"
                    placeholder="• • • • • •"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                    required
                    autoFocus
                  />
                </div>
              </div>

              <button type="submit" className="submit-btn" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin" style={{ width: '18px', height: '18px' }} />
                    Verifying OTP...
                  </>
                ) : (
                  <>
                    Verify OTP & Activate Account
                    <ShieldCheck style={{ width: '18px', height: '18px' }} />
                  </>
                )}
              </button>
            </form>
          ) : (
            /* Register / Login Form */
            <form className="auth-form" onSubmit={handleRegisterOrLogin}>
              {mode === 'register' && (
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <div className="input-container">
                    <User className="input-icon-left" />
                    <input
                      type="text"
                      name="name"
                      className="form-input"
                      placeholder="e.g. Aarav Sharma"
                      value={formData.name}
                      onChange={handleChange}
                      required={mode === 'register'}
                    />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div className="input-container">
                  <Mail className="input-icon-left" />
                  <input
                    type="email"
                    name="email"
                    className="form-input"
                    placeholder="candidate@exam.edu"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="input-container">
                  <Lock className="input-icon-left" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    className="form-input"
                    style={{ paddingRight: '40px' }}
                    placeholder="••••••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    className="input-icon-right"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff style={{ width: '18px', height: '18px' }} />
                    ) : (
                      <Eye style={{ width: '18px', height: '18px' }} />
                    )}
                  </button>
                </div>
              </div>

              {mode === 'register' && (
                <div className="form-group">
                  <label className="form-label">Target Exam Track</label>
                  <div className="track-grid">
                    {tracks.map((track) => (
                      <button
                        key={track}
                        type="button"
                        className={`track-btn ${formData.targetExamTrack === track ? 'selected' : ''}`}
                        onClick={() => handleTrackSelect(track)}
                      >
                        {track}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button type="submit" className="submit-btn" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin" style={{ width: '18px', height: '18px' }} />
                    Processing...
                  </>
                ) : (
                  <>
                    {mode === 'register' ? 'Register & Send OTP' : 'Sign In'}
                    <ArrowRight style={{ width: '18px', height: '18px' }} />
                  </>
                )}
              </button>
            </form>
          )}

          <div className="card-footer">
            {mode === 'verify_otp' && (
              <button type="button" className="resend-btn" onClick={handleResendOTP} disabled={submitting}>
                Didn't receive code? Click to Resend OTP
              </button>
            )}

            {mode !== 'verify_otp' && (
              <button type="button" className="demo-btn" onClick={handleDemoFill}>
                <Sparkles style={{ width: '14px', height: '14px', display: 'inline', marginRight: '4px' }} />
                Auto-fill Demo Credentials
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
