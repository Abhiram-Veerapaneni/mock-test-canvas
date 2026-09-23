import { create } from 'zustand';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Dedicated lightweight Axios instance for probing health
const healthAxios = axios.create({
  baseURL: API_BASE,
  timeout: 12000,
});

export const useServerStatusStore = create((set, get) => {
  let timerInterval = null;
  let pollTimeout = null;
  let slowWarningTimeout = null;

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
    status: 'idle', // 'idle' | 'checking' | 'waking' | 'online'
    isWaking: false,
    justWokeUp: false,
    elapsedSeconds: 0,
    wakeStartTime: null,
    retryCount: 0,

    // Proactively check health or warm up
    checkHealth: async (isRetry = false) => {
      const state = get();

      // If already marked as woke up recently, skip duplicate checks
      if (state.justWokeUp) return true;

      // If a cold start hasn't been flagged yet and not in retry mode,
      // trigger 'waking' if the response takes longer than 2.5s (classic Render cold start)
      if (!isRetry && !state.isWaking) {
        if (slowWarningTimeout) clearTimeout(slowWarningTimeout);
        slowWarningTimeout = setTimeout(() => {
          if (!get().justWokeUp && get().status !== 'online') {
            set({ status: 'waking', isWaking: true });
            startTimer();
          }
        }, 2500);
      }

      try {
        const res = await healthAxios.get('/health', {
          headers: { 'Cache-Control': 'no-cache' }
        });

        if (slowWarningTimeout) clearTimeout(slowWarningTimeout);
        if (pollTimeout) clearTimeout(pollTimeout);

        if (res.data?.status === 'ok') {
          const wasWaking = get().isWaking;
          stopTimer();

          if (wasWaking) {
            set({
              status: 'online',
              isWaking: true, // Keep banner visible briefly for smooth success transition
              justWokeUp: true,
              retryCount: 0
            });

            // Smoothly dismiss the indicator after 3.2 seconds
            setTimeout(() => {
              set({ isWaking: false, justWokeUp: false, wakeStartTime: null, elapsedSeconds: 0 });
            }, 3200);
          } else {
            set({
              status: 'online',
              isWaking: false,
              justWokeUp: false,
              wakeStartTime: null,
              elapsedSeconds: 0
            });
          }
          return true;
        }
      } catch (err) {
        if (slowWarningTimeout) clearTimeout(slowWarningTimeout);

        // Cold boot: 502, 503, ECONNABORTED, or network error
        set((prev) => ({
          status: 'waking',
          isWaking: true,
          retryCount: prev.retryCount + 1
        }));
        startTimer();

        // Continue polling every 3.5 seconds until container comes alive
        if (pollTimeout) clearTimeout(pollTimeout);
        pollTimeout = setTimeout(() => {
          get().checkHealth(true);
        }, 3500);

        return false;
      }
    },

    // Triggered when an in-flight API request detects server sleeping / 502 / 503 / timeout
    notifyColdStart: () => {
      const state = get();
      if (!state.isWaking) {
        set({ status: 'waking', isWaking: true });
        startTimer();
        get().checkHealth(true);
      }
    },

    dismiss: () => {
      if (pollTimeout) clearTimeout(pollTimeout);
      if (slowWarningTimeout) clearTimeout(slowWarningTimeout);
      stopTimer();
      set({ isWaking: false, justWokeUp: false });
    }
  };
});

export default useServerStatusStore;
