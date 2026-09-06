import { useEffect, useRef, useCallback } from 'react';
import useExamStore from '../store/useExamStore';

/**
 * useExamTimer
 * Initializes a drift-free Web Worker countdown timer.
 *
 * @param {boolean} active      - Whether the timer should be running.
 * @param {function} onExpired  - Callback fired when the countdown reaches 0.
 *
 * The hook reads `timeRemainingSeconds` from useExamStore for initial seeding,
 * and writes back via `setTimeRemaining` + `syncToLocalStorage` on every tick.
 */
export default function useExamTimer({ active, onExpired }) {
  const workerRef = useRef(null);
  const onExpiredRef = useRef(onExpired);
  const hasStarted = useRef(false);

  // Keep the callback ref fresh so the worker message handler always has the latest
  useEffect(() => {
    onExpiredRef.current = onExpired;
  }, [onExpired]);

  const { timeRemainingSeconds, setTimeRemaining } = useExamStore();

  const stopTimer = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.postMessage({ command: 'stop' });
      workerRef.current.terminate();
      workerRef.current = null;
    }
    hasStarted.current = false;
  }, []);

  useEffect(() => {
    if (!active || hasStarted.current) return;

    // Guard: don't start if no time left
    if (timeRemainingSeconds <= 0) return;

    hasStarted.current = true;

    // Vite supports ?worker import, but for maximum compatibility we use the
    // Worker constructor with a URL so the file is treated as a classic worker.
    workerRef.current = new Worker(
      new URL('../workers/timer.worker.js', import.meta.url),
      { type: 'module' }
    );

    workerRef.current.onmessage = (e) => {
      const { type, remainingMs } = e.data;

      if (type === 'tick') {
        const secs = Math.round(remainingMs / 1000);
        setTimeRemaining(secs);
      }

      if (type === 'expired') {
        onExpiredRef.current?.();
        stopTimer();
      }
    };

    workerRef.current.onerror = (err) => {
      console.error('[TimerWorker] Error:', err.message);
    };

    // Seed the worker with current remaining time
    workerRef.current.postMessage({
      command: 'start',
      durationSeconds: timeRemainingSeconds,
    });

    return () => {
      stopTimer();
    };
    // Only run once when active becomes true
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  return { stopTimer };
}
