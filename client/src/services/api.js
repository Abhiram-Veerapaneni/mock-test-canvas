import axios from 'axios';
import { useServerStatusStore } from '../store/useServerStatusStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 65000, // 65 seconds to comfortably tolerate Render free-tier cold boots (~30-50s)
});

// Request interceptor appending JWT Bearer token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for cold start recovery & error handling
api.interceptors.response.use(
  (response) => {
    // Whenever any data is fetched successfully, ensure waking indicator is dismissed
    const serverStore = useServerStatusStore.getState();
    if (serverStore.isWaking) {
      serverStore.markOnline();
    }
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const isTimeout = error.code === 'ECONNABORTED';
    const isNetworkError = !error.response && error.message?.includes('Network Error');
    const isColdStartCode = status === 502 || status === 503 || status === 504;

    // Trigger waking card ONLY on genuine cold boot signals (502, 503, 504, timeout, disconnect)
    if (isColdStartCode || isTimeout || isNetworkError) {
      useServerStatusStore.getState().notifyColdStart();
    }

    if (status === 401) {
      localStorage.removeItem('token');
    }

    return Promise.reject(error);
  }
);

export default api;
