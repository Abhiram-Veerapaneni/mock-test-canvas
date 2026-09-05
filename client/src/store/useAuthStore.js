import { create } from 'zustand';
import api from '../services/api';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('token') || null,
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: false,
  error: null,

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
      console.warn('fetchMe failed:', err.response?.data?.message || err.message);
      localStorage.removeItem('token');
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: err.response?.data?.message || 'Session expired'
      });
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
      const message = err.response?.data?.message || 'Login failed. Please check credentials.';
      set({ isLoading: false, error: message });
      return { success: false, message };
    }
  },

  // Register method
  register: async (name, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/register', { name, email, password });
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
      const message = err.response?.data?.message || 'Registration failed.';
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
