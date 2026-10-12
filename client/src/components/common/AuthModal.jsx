import React, { useState, useEffect } from 'react';
import useAuthStore from '../../store/useAuthStore';
import useServerStatusStore from '../../store/useServerStatusStore';
import useThemeStore from '../../store/useThemeStore';
import { X, Lock, Mail, User as UserIcon, ShieldCheck, Loader2, Eye, EyeOff, KeyRound, ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';

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
            width: '334',
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
      setLocalError('Please enter a valid email address.');
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
      className="fixed inset-0 z-[9999] bg-zinc-950/50 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={closeAuthModal}
    >
      <div
        className="max-w-sm w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden text-zinc-900 dark:text-zinc-100 shadow-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
                {authModalConfig.title || 'Sign In to Continue'}
              </h2>
            </div>
          </div>
          <button
            onClick={closeAuthModal}
            className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Segmented Control / Tabs */}
          <div className="flex bg-zinc-100 dark:bg-zinc-800/80 p-0.5 rounded-md border border-zinc-200/80 dark:border-zinc-800 text-xs font-medium">
            <button
              type="button"
              onClick={() => {
                setTab('login');
                setRegStep('details');
                setLocalError('');
                clearError();
              }}
              className={`flex-1 py-1 rounded transition-colors cursor-pointer ${
                tab === 'login'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
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
              className={`flex-1 py-1 rounded transition-colors cursor-pointer ${
                tab === 'register'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              Register
            </button>
          </div>

          {/* Cold Start Indicator */}
          {isWaking && !localError && !error && (
            <div className="p-2.5 rounded-md bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/40 text-amber-800 dark:text-amber-300 text-xs flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                <span>Backend booting up...</span>
              </div>
              <span className="font-mono text-[11px]">{elapsedSeconds}s</span>
            </div>
          )}

          {/* Error Message */}
          {(localError || error) && (
            <div className="p-2.5 rounded-md bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200/50 dark:border-rose-800/40 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{localError || error}</span>
            </div>
          )}

          {/* LOGIN FORM */}
          {tab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-8 pr-8 py-1.5 text-xs rounded-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full py-2 mt-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
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
            <form onSubmit={handleSendOtp} className="space-y-3.5">
              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-8 pr-8 py-1.5 text-xs rounded-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-8 pr-8 py-1.5 text-xs rounded-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full py-2 mt-1"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Sending code...</span>
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
              <div className="p-2.5 rounded-md bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-zinc-500">Verifying:</span>
                  <span className="font-medium text-zinc-900 dark:text-zinc-100 ml-1.5">{email}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setRegStep('details')}
                  className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium text-xs flex items-center gap-1 cursor-pointer"
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>Edit</span>
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                  6-Digit Verification Code
                </label>
                <div className="relative">
                  <KeyRound className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit OTP"
                    className="w-full pl-8 pr-3 py-1.5 text-sm font-mono tracking-widest rounded-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 text-center focus:outline-none focus:ring-1 focus:ring-zinc-400 dark:focus:ring-zinc-600 transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-0.5">
                <span className="text-zinc-500">Didn't receive code?</span>
                <button
                  type="button"
                  disabled={resendTimer > 0 || isLoading}
                  onClick={() => handleSendOtp()}
                  className="font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-50 flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>{resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend Code'}</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading || otp.length !== 6}
                className="btn-primary w-full py-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  'Verify'
                )}
              </button>
            </form>
          )}

          {/* Social Google Login */}
          {regStep !== 'otp' && (
            <div className="space-y-3 pt-1">
              <div className="relative my-3">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-200 dark:border-zinc-800" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-white dark:bg-zinc-900 text-zinc-400 text-[11px] font-medium">
                    or continue with
                  </span>
                </div>
              </div>

              <div id="modalGoogleSignInButton" className="w-full flex justify-center min-h-[40px]"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
