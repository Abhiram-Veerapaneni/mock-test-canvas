import { create } from 'zustand';
import api from '../services/api';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
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
    const token = localStorage.getItem('token');
    if (!token) {
      set({ user: null, isAuthenticated: false, isLoading: false });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/auth/me');
      if (response.data?.success && response.data?.user) {
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
      // Only wipe token if the server explicitly rejected the JWT as invalid/expired (401)
      if (status === 401) {
        console.warn('Session expired or invalid token');
        localStorage.removeItem('token');
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: err.response?.data?.message || 'Session expired'
        });
      } else {
        // Server is restarting (Render deploy), network drop, 502/503: Keep the token!
        console.warn('Server temporarily unavailable, preserving token:', err.message);
        set({
          isLoading: false,
          error: 'Unable to reach the server. Please try again in a moment.'
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
  logout: () => {
    localStorage.removeItem('token');
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
