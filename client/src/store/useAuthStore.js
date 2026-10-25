import { create } from 'zustand';
import api from '../services/api';

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
};

export const useAuthStore = create((set, get) => ({
  user: getStoredUser(),
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!getStoredUser() || !!localStorage.getItem('token'),
  isLoading: false,
  error: null,

  // Global Auth Modal state
  isAuthModalOpen: false,
  authModalConfig: {
    title: 'Sign In to Continue',
    subtitle: 'Access your account or create a new one in seconds.',
    defaultTab: 'login', // 'login' | 'register'
    onSuccess: null
  },

  openAuthModal: (config = {}) => {
    set({
      isAuthModalOpen: true,
      authModalConfig: {
        title: config.title || 'Sign In to Continue',
        subtitle: config.subtitle || 'Access your account or create a new one in seconds.',
        defaultTab: config.defaultTab || 'login',
        onSuccess: config.onSuccess || null
      },
      error: null
    });
  },

  closeAuthModal: () => {
    set({
      isAuthModalOpen: false,
      error: null
    });
  },

  // Initialize auth session on app start
  fetchMe: async () => {
    const hasCachedAuth = Boolean(localStorage.getItem('token') || localStorage.getItem('user'));
    
    // Only show full-screen blocking loader if user was previously signed in
    if (hasCachedAuth) {
      set({ isLoading: true, error: null });
    }

    try {
      const response = await api.get('/auth/me');
      if (response.data?.success && response.data?.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
        set({
          user: response.data.user,
          isAuthenticated: true,
          isLoading: false
        });
      } else {
        throw new Error('Invalid user payload');
      }
    } catch (err) {
      const status = err.response?.status;
      // Only wipe state if server explicitly rejected auth (401)
      if (status === 401) {
        if (hasCachedAuth) {
          console.warn('Session expired or invalid token');
        }
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: hasCachedAuth ? (err.response?.data?.message || 'Session expired') : null
        });
      } else {
        // Server is restarting (Render cold start) or offline: Preserve cached state
        if (hasCachedAuth) {
          console.warn('Server temporarily unavailable, preserving session:', err.message);
        }
        set({
          isLoading: false,
          error: hasCachedAuth ? 'Unable to reach the server. Please try again in a moment.' : null
        });
      }
    }
  },

  // Login method
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
      return { success: true, user };
    } catch (err) {
      const apiMessage = err.response?.data?.message;
      const isColdStart = !apiMessage && (
        err.response?.status === 502 ||
        err.response?.status === 503 ||
        err.response?.status === 504 ||
        err.code === 'ECONNABORTED' ||
        (!err.response && err.message?.includes('Network Error'))
      );

      const message = apiMessage || (isColdStart
        ? 'Backend is booting up from sleep mode (Render cold start). Please wait ~30s...'
        : 'Login failed. Please check credentials.');

      set({ isLoading: false, error: message });
      return { success: false, message };
    }
  },

  // Send OTP method
  sendOtp: async (email) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/send-otp', { email });
      set({ isLoading: false, error: null });
      return { success: true, message: response.data?.message };
    } catch (err) {
      const apiMessage = err.response?.data?.message;
      const isColdStart = !apiMessage && (
        err.response?.status === 502 ||
        err.response?.status === 503 ||
        err.response?.status === 504 ||
        err.code === 'ECONNABORTED' ||
        (!err.response && err.message?.includes('Network Error'))
      );

      const message = apiMessage || (isColdStart
        ? 'Backend is booting up from sleep mode (Render cold start). Please wait ~30s...'
        : 'Failed to send verification code.');

      set({ isLoading: false, error: message });
      return { success: false, message };
    }
  },

  // Verify OTP method
  verifyOtp: async (email, otp) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/verify-otp', { email, otp });
      set({ isLoading: false, error: null });
      return { success: true, message: response.data?.message };
    } catch (err) {
      const apiMessage = err.response?.data?.message;
      const isColdStart = !apiMessage && (
        err.response?.status === 502 ||
        err.response?.status === 503 ||
        err.response?.status === 504 ||
        err.code === 'ECONNABORTED' ||
        (!err.response && err.message?.includes('Network Error'))
      );

      const message = apiMessage || (isColdStart
        ? 'Backend is booting up from sleep mode (Render cold start). Please wait ~30s...'
        : 'Invalid verification code.');

      set({ isLoading: false, error: message });
      return { success: false, message };
    }
  },

  // Register method
  register: async (name, email, password, otp) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/register', { name, email, password, otp });
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
      return { success: true, user };
    } catch (err) {
      const apiMessage = err.response?.data?.message;
      const isColdStart = !apiMessage && (
        err.response?.status === 502 ||
        err.response?.status === 503 ||
        err.response?.status === 504 ||
        err.code === 'ECONNABORTED' ||
        (!err.response && err.message?.includes('Network Error'))
      );

      const message = apiMessage || (isColdStart
        ? 'Backend is booting up from sleep mode (Render cold start). Please wait ~30s...'
        : 'Registration failed.');

      set({ isLoading: false, error: message });
      return { success: false, message };
    }
  },

  // Google OAuth Login method
  loginWithGoogle: async (credential) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/google', { credential });
      const { token, user } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });
      return { success: true, user };
    } catch (err) {
      const message = err.response?.data?.message || 'Google authentication failed.';
      set({ isLoading: false, error: message });
      return { success: false, message };
    }
  },

  // Logout method
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (err) {
      console.warn('Server logout notice:', err?.message);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    try {
      sessionStorage.removeItem('dismissedGoogleOneTap');
    } catch (_) {}
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null
    });
  },

  // Clear error
  clearError: () => set({ error: null })
}));

export default useAuthStore;
