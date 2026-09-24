import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import useServerStatusStore from '../store/useServerStatusStore';
import useThemeStore from '../store/useThemeStore';
import ThemeToggle from '../components/common/ThemeToggle';
import { Lock, Mail, User, ShieldCheck, AlertCircle, ArrowRight, Loader2, Eye, EyeOff, Server, KeyRound, RefreshCw, ArrowLeft } from 'lucide-react';

export default function AuthPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [regStep, setRegStep] = useState('details'); // 'details' | 'otp'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  const { login, register, sendOtp, loginWithGoogle, isAuthenticated, isLoading, error, clearError } = useAuthStore();
  const { isWaking, elapsedSeconds } = useServerStatusStore();
  const resolvedTheme = useThemeStore((s) => s.resolvedTheme);
  const navigate = useNavigate();
  const location = useLocation();

  // Reset cold start timer
  useEffect(() => {
    useServerStatusStore.getState().reset();
  }, []);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  useEffect(() => {
    if (isAuthenticated) {
      const fromState = location.state?.from;
      const targetOrigin = typeof fromState === 'string' 
        ? fromState 
        : (fromState?.pathname || '/dashboard');
      navigate(targetOrigin, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Initialize Google Identity Services
  useEffect(() => {
    const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!googleClientId || googleClientId.includes('your_google_client_id')) {
      return;
    }

    const initializeGoogle = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: async (response) => {
            if (response.credential) {
              setLocalError('');
              clearError();
              const res = await loginWithGoogle(response.credential);
              if (res.success) {
                navigate('/dashboard');
              }
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true
        });

        const btnContainer = document.getElementById('googleSignInButton');
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

    if (window.google?.accounts?.id) {
      initializeGoogle();
    } else {
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          initializeGoogle();
        }
      }, 200);
      return () => clearInterval(interval);
    }
  }, [navigate, loginWithGoogle, clearError, resolvedTheme]);

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    setLocalError('');
    clearError();

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
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

    const res = await register(name.trim(), email.trim(), password, otp.trim());
    if (res.success) {
      useServerStatusStore.getState().markOnline();
      navigate('/dashboard');
    } else {
      useServerStatusStore.getState().dismiss();
      setLocalError(res.message || 'Registration failed.');
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    if (!email.trim() || !password) {
      setLocalError('Please enter email and password.');
      return;
    }

    const res = await login(email.trim(), password);
    if (res.success) {
      useServerStatusStore.getState().markOnline();
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#edf2f9] dark:bg-[#0f172a] text-slate-900 dark:text-slate-100 flex flex-col items-center justify-center p-4 relative transition-colors duration-200">
      {/* Top Bar Controls: Theme Switcher */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20 mb-3.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Mock Test Canvas
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Enterprise Examination & Performance Engine
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white dark:bg-[#1e293b] border border-slate-200/90 dark:border-[#334155] rounded-2xl p-6 sm:p-7 shadow-xl elevation-card transition-colors duration-200">
          {/* Segmented Control / Tabs */}
          <div className="flex bg-slate-100 dark:bg-[#151f32] p-1 rounded-xl border border-slate-200/80 dark:border-[#334155] mb-5">
            <button
              type="button"
              onClick={() => {
                setIsRegister(false);
                setRegStep('details');
                setLocalError('');
                clearError();
              }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                !isRegister
                  ? 'bg-white dark:bg-[#243147] text-blue-600 dark:text-blue-300 border border-slate-200/60 dark:border-[#334155] shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegister(true);
                setRegStep('details');
                setLocalError('');
                clearError();
              }}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                isRegister
                  ? 'bg-white dark:bg-[#243147] text-blue-600 dark:text-blue-300 border border-slate-200/60 dark:border-[#334155] shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              Register
            </button>
          </div>

          {/* Cold Start Indicator */}
          {isWaking && !localError && !error && (
            <div className="mb-4 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs flex items-center justify-between gap-2 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 min-w-0">
                <span className="relative flex h-2 w-2 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <span className="font-medium truncate">
                  Backend is booting up, please wait ~30s...
                </span>
              </div>
              <span className="shrink-0 font-mono text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-500/30">
                {elapsedSeconds}s
              </span>
            </div>
          )}

          {/* Error Message */}
          {(localError || error) && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{localError || error}</span>
            </div>
          )}

          {/* LOGIN FORM */}
          {!isRegister && (
            <form onSubmit={handleLoginSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative group">
                  <Mail className="w-4 h-4 text-slate-400 group-focus-within:text-blue-500 absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-150" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-[#151f32] border border-slate-200 dark:border-[#334155] rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all duration-150 outline-none focus:bg-white dark:focus:bg-[#151f32] focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative group">
                  <Lock className="w-4 h-4 text-slate-400 group-focus-within:text-blue-500 absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-150" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 dark:bg-[#151f32] border border-slate-200 dark:border-[#334155] rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all duration-150 outline-none focus:bg-white dark:focus:bg-[#151f32] focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-2.5 rounded-xl font-semibold text-xs text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-md shadow-blue-500/15 focus:ring-2 focus:ring-blue-500/20 focus:outline-none flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-75"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* REGISTER STEP 1: Details */}
          {isRegister && regStep === 'details' && (
            <form onSubmit={handleSendOtp} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Full Name
                </label>
                <div className="relative group">
                  <User className="w-4 h-4 text-slate-400 group-focus-within:text-blue-500 absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-150" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Candidate Name"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-[#151f32] border border-slate-200 dark:border-[#334155] rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all duration-150 outline-none focus:bg-white dark:focus:bg-[#151f32] focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Email Address
                </label>
                <div className="relative group">
                  <Mail className="w-4 h-4 text-slate-400 group-focus-within:text-blue-500 absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-150" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-[#151f32] border border-slate-200 dark:border-[#334155] rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all duration-150 outline-none focus:bg-white dark:focus:bg-[#151f32] focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Password
                </label>
                <div className="relative group">
                  <Lock className="w-4 h-4 text-slate-400 group-focus-within:text-blue-500 absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-150" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 dark:bg-[#151f32] border border-slate-200 dark:border-[#334155] rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all duration-150 outline-none focus:bg-white dark:focus:bg-[#151f32] focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Confirm Password
                </label>
                <div className="relative group">
                  <Lock className="w-4 h-4 text-slate-400 group-focus-within:text-blue-500 absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-150" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 dark:bg-[#151f32] border border-slate-200 dark:border-[#334155] rounded-xl text-xs text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 transition-all duration-150 outline-none focus:bg-white dark:focus:bg-[#151f32] focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full mt-2 py-2.5 rounded-xl font-semibold text-xs text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-md shadow-blue-500/15 focus:ring-2 focus:ring-blue-500/20 focus:outline-none flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-75"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Sending Code...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* REGISTER STEP 2: OTP Verification */}
          {isRegister && regStep === 'otp' && (
            <form onSubmit={handleVerifyAndRegister} className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#151f32] border border-slate-200 dark:border-[#334155] flex items-center justify-between text-xs">
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
                  <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit OTP"
                    className="w-full pl-9 pr-3.5 py-2.5 text-sm font-mono tracking-widest rounded-xl bg-slate-50 dark:bg-[#151f32] border border-slate-200 dark:border-[#334155] text-slate-900 dark:text-white text-center focus:border-blue-500 dark:focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
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
                className="w-full py-2.5 rounded-xl font-semibold text-xs text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-md shadow-blue-500/15 focus:ring-2 focus:ring-blue-500/20 focus:outline-none flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-75"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying...</span>
                  </>
                ) : (
                  <>
                    <span>Verify & Continue</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Social Sign In Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-[#334155]"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-wider font-semibold">
              <span className="px-2.5 bg-white dark:bg-[#1e293b] text-slate-400 dark:text-slate-400">
                or continue with
              </span>
            </div>
          </div>

          {/* Google Sign-In Button */}
          <div className="w-full flex justify-center min-h-[42px]">
            <div id="googleSignInButton" className="w-full flex justify-center"></div>
          </div>

          {/* Continue Without Login Section */}
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-[#334155]">
            <button
              type="button"
              onClick={() => {
                try {
                  sessionStorage.setItem('dismissedGoogleOneTap', 'true');
                  window.google?.accounts?.id?.cancel();
                } catch (_) {}
                navigate('/dashboard');
              }}
              className="w-full py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-[#243147] dark:hover:bg-[#2e3e59] border border-slate-200/90 dark:border-[#334155] transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <span>Continue Without Login</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
