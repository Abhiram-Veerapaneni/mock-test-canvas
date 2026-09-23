import { create } from 'zustand';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Dedicated lightweight Axios instance for probing health
const healthAxios = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

export const useServerStatusStore = create((set, get) => {
  let timerInterval = null;
  let pollTimeout = null;

  const startTimer = () => {
    if (timerInterval) return;
    if (!get().wakeStartTime) {
      set({ wakeStartTime: Date.now(), elapsedSeconds: 0 });
    }
    timerInterval = setInterval(() => {
      const start = get().wakeStartTime;
      if (start) {
        set({ elapsedSeconds: Math.floor((Date.now() - start) / 1000) });
      }
    }, 1000);
  };

  const stopTimer = () => {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
  };

  return {
    status: 'idle', // 'idle' | 'waking' | 'online'
    isWaking: false,
    elapsedSeconds: 0,
    wakeStartTime: null,
    retryCount: 0,

    // Proactively verify health in background (no false alarms on refresh)
    checkHealth: async () => {
      try {
        const res = await healthAxios.get('/health', {
          headers: { 'Cache-Control': 'no-cache' }
        });

        if (res.data?.status === 'ok') {
          // Server is confirmed online - dismiss waking card immediately
          get().markOnline();
          return true;
        }
      } catch (err) {
        const status = err.response?.status;
        const isTimeout = err.code === 'ECONNABORTED';
        const isNetworkErr = !err.response;
        const isColdBoot = status === 502 || status === 503 || status === 504 || isTimeout || isNetworkErr;

        if (isColdBoot) {
          // Render free-tier container is actually asleep or spinning up
          set((prev) => ({
            status: 'waking',
            isWaking: true,
            retryCount: prev.retryCount + 1
          }));
          startTimer();

          // Poll health check every 3.5 seconds until container responds
          if (pollTimeout) clearTimeout(pollTimeout);
          pollTimeout = setTimeout(() => {
            get().checkHealth();
          }, 3500);
        }

        return false;
      }
    },

    // Triggered when an API request encounters a genuine cold start error (502/503/timeout)
    notifyColdStart: () => {
      const state = get();
      if (!state.isWaking) {
        set({ status: 'waking', isWaking: true });
        startTimer();
        get().checkHealth();
      }
    },

    // Called as soon as any API request or health check succeeds
    markOnline: () => {
      if (pollTimeout) {
        clearTimeout(pollTimeout);
        pollTimeout = null;
      }
      stopTimer();
      set({
        status: 'online',
        isWaking: false,
        wakeStartTime: null,
        elapsedSeconds: 0,
        retryCount: 0
      });
    },

    dismiss: () => {
      if (pollTimeout) clearTimeout(pollTimeout);
      stopTimer();
      set({
        isWaking: false,
        wakeStartTime: null,
        elapsedSeconds: 0
      });
    },

    reset: () => {
      if (pollTimeout) {
        clearTimeout(pollTimeout);
        pollTimeout = null;
      }
      stopTimer();
      set({
        status: 'idle',
        isWaking: false,
        elapsedSeconds: 0,
        wakeStartTime: null,
        retryCount: 0
      });
    }
  };
});

export default useServerStatusStore;
