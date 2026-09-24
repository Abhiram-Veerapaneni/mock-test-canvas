import React, { useState, useEffect } from 'react';
import useAuthStore from '../../store/useAuthStore';
import useServerStatusStore from '../../store/useServerStatusStore';
import useThemeStore from '../../store/useThemeStore';
import { X, Lock, Mail, User as UserIcon, ShieldCheck, Loader2, Eye, EyeOff, Server, KeyRound, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';

export default function AuthModal() {
  const {
    isAuthModalOpen,
    authModalConfig,
    closeAuthModal,
    login,
    register,
    sendOtp,
    loginWithGoogle,
    isLoading,
    error,
    clearError
  } = useAuthStore();

  const { isWaking, elapsedSeconds } = useServerStatusStore();
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme);

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

  // Initialize Google Identity Services inside AuthModal
  useEffect(() => {
    if (!isAuthModalOpen || (tab === 'register' && regStep === 'otp')) return;

    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!googleClientId || googleClientId.includes('your_google_client_id')) {
      return;
    }

    const initModalGoogle = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response) => {
            if (response.credential) {
              setLocalError('');
              clearError();
              const res = await loginWithGoogle(response.credential);
              if (res?.success) {
                useServerStatusStore.getState().markOnline();
                const callback = authModalConfig.onSuccess;
                closeAuthModal();
                if (typeof callback === 'function') {
                  callback();
                }
              } else {
                useServerStatusStore.getState().dismiss();
                setLocalError(res?.message || 'Google authentication failed.');
              }
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true
        });

        const btnContainer = document.getElementById('modalGoogleSignInButton');
        if (btnContainer) {
          btnContainer.innerHTML = '';
          window.google.accounts.id.renderButton(btnContainer, {
            type: 'standard',
            theme: resolvedTheme === 'dark' ? 'filled_black' : 'outline',
            size: 'large',
            width: '350',
            text: 'continue_with',
            shape: 'rectangular',
            logo_alignment: 'left'
          });
        }
      }
    };

    const timer = setTimeout(() => {
      if (window.google?.accounts?.id) {
        initModalGoogle();
      } else {
        const interval = setInterval(() => {
          if (window.google?.accounts?.id) {
            clearInterval(interval);
            initModalGoogle();
          }
        }, 200);
        return () => clearInterval(interval);
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [isAuthModalOpen, tab, regStep, loginWithGoogle, authModalConfig, closeAuthModal, clearError, resolvedTheme]);

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
        className="max-w-md w-full bg-white dark:bg-[#1e293b] border border-slate-200/90 dark:border-[#334155] rounded-2xl elevation-card overflow-hidden text-slate-900 dark:text-slate-100 transition-colors shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="relative px-6 pt-6 pb-4 border-b border-slate-100 dark:border-[#334155] bg-slate-50/70 dark:bg-[#151f32] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-base font-bold text-slate-900 dark:text-white leading-tight">
                {authModalConfig.title || 'Sign In to Continue'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {authModalConfig.subtitle || 'Access your account or create a new one in seconds.'}
              </p>
            </div>
          </div>
          <button
            onClick={closeAuthModal}
            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-[#151f32] dark:hover:bg-[#243147] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer border border-slate-200/80 dark:border-[#334155]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-100 dark:bg-[#151f32] border border-slate-200/80 dark:border-[#334155] text-xs font-semibold">
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
                  ? 'bg-white dark:bg-[#1e293b] text-blue-600 dark:text-blue-400 shadow-xs border border-slate-200/80 dark:border-[#334155]'
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
                  ? 'bg-white dark:bg-[#1e293b] text-blue-600 dark:text-blue-400 shadow-xs border border-slate-200/80 dark:border-[#334155]'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Cold Start Indicator */}
          {isWaking && !localError && !error && (
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center gap-2.5 text-xs text-blue-700 dark:text-blue-300">
              <Server className="w-4 h-4 text-blue-500 animate-pulse shrink-0" />
              <span>Backend booting up from idle mode ({elapsedSeconds}s)...</span>
            </div>
          )}

          {/* Error Message */}
          {(localError || error) && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-medium text-rose-700 dark:text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{localError || error}</span>
            </div>
          )}

          {/* LOGIN FORM */}
          {tab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl input-base transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2 text-xs rounded-xl input-base transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl btn-primary font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
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
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl input-base transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl input-base transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2 text-xs rounded-xl input-base transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2 text-xs rounded-xl input-base transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 rounded-xl btn-primary font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
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
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#151f32] border border-slate-200/80 dark:border-[#334155] flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-500 dark:text-slate-400">Verifying:</span>
                  <span className="font-semibold text-slate-900 dark:text-white ml-1.5">{email}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setRegStep('details')}
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 font-semibold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  6-Digit Verification Code
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit OTP"
                    className="w-full pl-9 pr-3 py-2 text-sm font-mono tracking-widest rounded-xl input-base transition-all text-center"
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
                className="w-full py-2.5 rounded-xl btn-primary font-semibold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
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

          {/* Social Google Login - visible on login and register details */}
          {regStep !== 'otp' && (
            <div className="space-y-3 pt-1">
              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-[#334155]" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2.5 bg-white dark:bg-[#1e293b] text-slate-500 dark:text-slate-400 text-[11px] font-medium">
                    Or continue with
                  </span>
                </div>
              </div>

              <div id="modalGoogleSignInButton" className="w-full flex justify-center min-h-[44px]"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
