import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Theme mode: 'dark' (Black-Blue) or 'light' (White-Blue)
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('pmt_theme');
    return saved ? saved === 'dark' : true;
  });

  useEffect(() => {
    localStorage.setItem('pmt_theme', darkMode ? 'dark' : 'light');
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const res = await api.getProfile();
        if (res.success && res.user) {
          setUser(res.user);
        }
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const register = async (name, email, password, targetExamTrack) => {
    setError(null);
    try {
      const res = await api.register({ name, email, password, targetExamTrack });
      return res;
    } catch (err) {
      setError(err.message || 'Registration failed');
      throw err;
    }
  };

  const verifyOTP = async (email, otp) => {
    setError(null);
    try {
      const res = await api.verifyOTP({ email, otp });
      if (res.success && res.user) {
        if (res.token) {
          localStorage.setItem('pmt_token', res.token);
        }
        setUser(res.user);
      }
      return res;
    } catch (err) {
      setError(err.message || 'OTP Verification failed');
      throw err;
    }
  };

  const resendOTP = async (email) => {
    setError(null);
    try {
      const res = await api.resendOTP({ email });
      return res;
    } catch (err) {
      setError(err.message || 'Failed to resend OTP');
      throw err;
    }
  };

  const login = async (email, password) => {
    setError(null);
    try {
      const res = await api.login({ email, password });
      if (res.success && res.user) {
        if (res.token) {
          localStorage.setItem('pmt_token', res.token);
        }
        setUser(res.user);
      }
      return res;
    } catch (err) {
      setError(err.message || 'Login failed');
      throw err;
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('pmt_token');
      setUser(null);
    }
  };

  const toggleTheme = () => {
    setDarkMode((prev) => !prev);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        setError,
        darkMode,
        toggleTheme,
        register,
        verifyOTP,
        resendOTP,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
