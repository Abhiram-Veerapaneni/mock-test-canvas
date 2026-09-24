import React, { useState, useEffect } from 'react';
import useAuthStore from '../../store/useAuthStore';
import useServerStatusStore from '../../store/useServerStatusStore';
import { X, Lock, Mail, User as UserIcon, ShieldCheck, Loader2, Eye, EyeOff, Server, KeyRound, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';

export default function AuthModal() {
  const {
    isAuthModalOpen,
    authModalConfig,
    closeAuthModal,
    login,
    register,
    sendOtp,
    isLoading,
    error,
    clearError
  } = useAuthStore();

  const { isWaking, elapsedSeconds } = useServerStatusStore();

  const [tab, setTab] = useState('login'); // 'login' | 'register'
  const [regStep, setRegStep] = useState('details'); // 'details' | 'otp'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (isAuthModalOpen) {
      setTab(authModalConfig.defaultTab || 'login');
      setRegStep('details');
      setLocalError('');
      setConfirmPassword('');
      setOtp('');
      clearError();
    }
  }, [isAuthModalOpen, authModalConfig, clearError]);

  // Resend timer countdown
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  if (!isAuthModalOpen) return null;

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setLocalError('');
    clearError();

    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      setLocalError('Please fill in all required fields.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim().toLowerCase())) {
      setLocalError('Please enter a valid email address (e.g. name@domain.com).');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }

    const result = await sendOtp(email.trim());
    if (result.success) {
      setRegStep('otp');
      setResendTimer(30);
    } else {
      useServerStatusStore.getState().dismiss();
      setLocalError(result.message || 'Failed to send verification code.');
    }
  };

  const handleVerifyAndRegister = async (e) => {
    if (e) e.preventDefault();
    setLocalError('');
    clearError();

    if (!otp.trim() || otp.trim().length !== 6) {
      setLocalError('Please enter the 6-digit verification code.');
      return;
    }

    const result = await register(name.trim(), email.trim(), password, otp.trim());
    if (result?.success) {
      useServerStatusStore.getState().markOnline();
      const callback = authModalConfig.onSuccess;
      closeAuthModal();
      if (typeof callback === 'function') {
        callback();
      }
    } else {
      useServerStatusStore.getState().dismiss();
      setLocalError(result?.message || 'Registration failed.');
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    if (!email.trim() || !password.trim()) {
      setLocalError('Please enter your email and password.');
      return;
    }

    const result = await login(email.trim(), password);
    if (result?.success) {
      const callback = authModalConfig.onSuccess;
      closeAuthModal();
      if (typeof callback === 'function') {
        callback();
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-slate-950/65 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
      onClick={closeAuthModal}
    >
      <div
        className="max-w-md w-full bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-[#1f293d] rounded-2xl shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="relative px-6 pt-6 pb-4 border-b border-slate-100 dark:border-[#1f293d] bg-slate-50/50 dark:bg-[#090d16]/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white leading-tight">
                {authModalConfig.title || 'Sign In to Continue'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {authModalConfig.subtitle || 'Access your account or create a new one in seconds.'}
              </p>
            </div>
          </div>
          <button
            onClick={closeAuthModal}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer border border-slate-200/80 dark:border-slate-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setRegStep('details');
                setLocalError('');
                clearError();
              }}
              className={`py-2 rounded-lg transition-all cursor-pointer ${
                tab === 'login'
                  ? 'bg-white dark:bg-[#111827] text-blue-600 dark:text-blue-400 shadow-xs border border-slate-200/60 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setTab('register');
                setRegStep('details');
                setLocalError('');
                clearError();
              }}
              className={`py-2 rounded-lg transition-all cursor-pointer ${
                tab === 'register'
                  ? 'bg-white dark:bg-[#111827] text-blue-600 dark:text-blue-400 shadow-xs border border-slate-200/60 dark:border-slate-700'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Cold Start Indicator - only show when waking and NO specific form/api error is active */}
          {isWaking && !localError && !error && (
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 flex items-center gap-2.5 text-xs text-blue-700 dark:text-blue-300">
              <Server className="w-4 h-4 text-blue-600 animate-pulse shrink-0" />
              <span>Backend booting up from idle mode ({elapsedSeconds}s)...</span>
            </div>
          )}

          {/* Error Message */}
          {(localError || error) && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs font-medium text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{localError || error}</span>
            </div>
          )}

          {/* LOGIN FORM */}
          {tab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1f293d] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none text-slate-900 dark:text-white placeholder-slate-400 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1f293d] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none text-slate-900 dark:text-white placeholder-slate-400 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/10 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>
          )}

          {/* REGISTER STEP 1: Details */}
          {tab === 'register' && regStep === 'details' && (
            <form onSubmit={handleSendOtp} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1f293d] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none text-slate-900 dark:text-white placeholder-slate-400 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1f293d] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none text-slate-900 dark:text-white placeholder-slate-400 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1f293d] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none text-slate-900 dark:text-white placeholder-slate-400 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1f293d] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none text-slate-900 dark:text-white placeholder-slate-400 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/10 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending Code...</span>
                  </>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>
          )}

          {/* REGISTER STEP 2: OTP Verification */}
          {tab === 'register' && regStep === 'otp' && (
            <form onSubmit={handleVerifyAndRegister} className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1f293d] flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Verifying:</span>
                  <span className="font-semibold text-slate-900 dark:text-white ml-1.5">{email}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setRegStep('details')}
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold text-xs flex items-center gap-1"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  6-Digit Verification Code
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit OTP"
                    className="w-full pl-9 pr-3 py-2 text-sm font-mono tracking-widest rounded-xl bg-slate-50 dark:bg-[#090d16] border border-slate-200 dark:border-[#1f293d] focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none text-slate-900 dark:text-white placeholder-slate-400 transition-all text-center"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-slate-500 dark:text-slate-400">Didn't receive code?</span>
                <button
                  type="button"
                  disabled={resendTimer > 0 || isLoading}
                  onClick={() => handleSendOtp()}
                  className="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>{resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-500/10 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  'Verify'
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
