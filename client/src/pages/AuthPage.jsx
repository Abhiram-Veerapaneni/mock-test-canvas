import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { Lock, Mail, User, ShieldCheck, AlertCircle, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';

export default function AuthPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  const { login, register, loginWithGoogle, isAuthenticated, isLoading, error, clearError } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isAuthenticated) {
      const origin = location.state?.from?.pathname || '/dashboard';
      navigate(origin, { replace: true });
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
            theme: 'outline',
            size: 'large',
            width: '334',
            text: 'continue_with',
            shape: 'rectangular',
            logo_alignment: 'left'
          });
        }

        // Display Google One Tap floating prompt (top-right card)
        window.google.accounts.id.prompt();
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
  }, [navigate, loginWithGoogle, clearError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    if (!email.trim() || !password) {
      setLocalError('Please enter email and password.');
      return;
    }

    if (isRegister && !name.trim()) {
      setLocalError('Please enter your full name.');
      return;
    }

    if (isRegister) {
      const res = await register(name, email, password);
      if (res.success) {
        navigate('/dashboard');
      }
    } else {
      const res = await login(email, password);
      if (res.success) {
        navigate('/dashboard');
      }
    }
  };

  const handleFillDemo = (demoEmail, demoPassword) => {
    setIsRegister(false);
    setEmail(demoEmail);
    setPassword(demoPassword);
    setLocalError('');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-blue-600 text-white shadow-xs mb-3">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
            Mock Test Canvas
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Enterprise Examination & Performance Engine
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
          {/* Segmented Control / Tabs */}
          <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-lg border border-slate-200 dark:border-slate-800 mb-5">
            <button
              type="button"
              onClick={() => {
                setIsRegister(false);
                setLocalError('');
                clearError();
              }}
              className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${
                !isRegister
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegister(true);
                setLocalError('');
                clearError();
              }}
              className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${
                isRegister
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Register
            </button>
          </div>

          {(localError || error) && (
            <div className="mb-4 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{localError || error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {isRegister && (
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <div className="relative group">
                  <User className="w-4 h-4 text-slate-400 group-focus-within:text-blue-600 absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-150" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Candidate Name"
                    className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 transition-all duration-150 outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative group">
                <Mail className="w-4 h-4 text-slate-400 group-focus-within:text-blue-600 absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-150" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 transition-all duration-150 outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Password
              </label>
              <div className="relative group">
                <Lock className="w-4 h-4 text-slate-400 group-focus-within:text-blue-600 absolute left-3 top-1/2 -translate-y-1/2 transition-colors duration-150" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 transition-all duration-150 outline-none focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-500/15"
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
              className="w-full mt-2 py-2.5 rounded-lg font-medium text-xs text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 shadow-xs focus:ring-2 focus:ring-blue-500/20 focus:outline-none flex items-center justify-center gap-1.5 transition-colors disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>{isRegister ? 'Create Account' : 'Sign In'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Social Sign In Divider */}
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase tracking-wider font-semibold">
              <span className="px-2.5 bg-white dark:bg-slate-900 text-slate-400 dark:text-slate-500">
                or continue with
              </span>
            </div>
          </div>

          {/* Google Sign-In Button */}
          <div className="w-full flex justify-center min-h-[42px]">
            <div id="googleSignInButton" className="w-full flex justify-center"></div>
          </div>

          {/* Quick Demo Access Bar */}
          <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500 block mb-2 text-center">
              Quick Demo Access
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleFillDemo('candidate@mockcanvas.com', 'Password123!')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300 transition-colors text-center"
              >
                Demo User 1
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('admin@mockcanvas.com', 'AdminPassword123!')}
                className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 text-[11px] font-medium text-slate-700 dark:text-slate-300 transition-colors text-center"
              >
                Demo User 2
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
