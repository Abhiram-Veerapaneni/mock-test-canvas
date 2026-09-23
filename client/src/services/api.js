import axios from 'axios';
import { useServerStatusStore } from '../store/useServerStatusStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 65000, // 65 seconds to comfortably tolerate Render free-tier cold boots (~30-50s)
});

// Request interceptor appending JWT Bearer token & tracking slow requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Attach slow request detector for cold start feedback
    config._slowTimer = setTimeout(() => {
      // If request has been pending for over 2.5s, signal server might be waking up
      useServerStatusStore.getState().notifyColdStart();
    }, 2500);

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for cold start detection & unified error handling
api.interceptors.response.use(
  (response) => {
    if (response.config?._slowTimer) {
      clearTimeout(response.config._slowTimer);
    }
    return response;
  },
  (error) => {
    if (error.config?._slowTimer) {
      clearTimeout(error.config._slowTimer);
    }

    const status = error.response?.status;
    const isTimeout = error.code === 'ECONNABORTED';
    const isNetworkError = !error.response && error.message?.includes('Network Error');
    const isColdStartCode = status === 502 || status === 503 || status === 504;

    if (isColdStartCode || isTimeout || isNetworkError) {
      // Render free-tier container cold start or spinning up
      useServerStatusStore.getState().notifyColdStart();
    }

    if (status === 401) {
      // Clear token if expired or explicitly unauthorized
      localStorage.removeItem('token');
    }

    return Promise.reject(error);
  }
);

export default api;
