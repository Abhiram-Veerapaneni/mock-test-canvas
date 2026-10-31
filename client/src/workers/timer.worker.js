/**
 * timer.worker.js
 * Drift-free countdown timer using self-correcting delta timestamps.
 * Uses performance.now() so the timer stays accurate even when the tab
 * is backgrounded or the browser throttles setTimeout/setInterval.
 */

let intervalId = null;   // Holds reference to the active setTimeout so we can stop it
let expectedTime = null; // The exact stopwatch timestamp when the NEXT tick should occur
let remainingMs = 0;     // Total exam milliseconds remaining (e.g., 180 mins = 10,800,000 ms)

/**
 * Corrected tick loop — schedules the next tick to compensate for any
 * drift introduced by the browser's JS engine or throttling.
 */
function tick() {
  const now = performance.now();
  const drift = now - expectedTime;

  remainingMs -= 1000;
  // timer ran out
  if (remainingMs <= 0) {
    remainingMs = 0;
    self.postMessage({ type: 'tick', remainingMs: 0 }); // sends data to react
    self.postMessage({ type: 'expired' });
    clearTimeout(intervalId);
    intervalId = null;
    return;
  }

  self.postMessage({ type: 'tick', remainingMs });

  // Schedule next tick, correcting for drift
  const nextDelay = Math.max(0, 1000 - drift);
  expectedTime += 1000;
  intervalId = setTimeout(tick, nextDelay);
}

// listens for commands from react
self.onmessage = (e) => {
  const { command, durationSeconds } = e.data;

  if (command === 'start') {
    // Clear any existing timer
    if (intervalId !== null) {
      clearTimeout(intervalId);
      intervalId = null;
    }

    remainingMs = durationSeconds * 1000;
    expectedTime = performance.now() + 1000;

    // Fire first tick immediately to confirm start, then schedule loop
    self.postMessage({ type: 'tick', remainingMs });
    intervalId = setTimeout(tick, 1000);
  }

  if (command === 'stop') {
    if (intervalId !== null) {
      clearTimeout(intervalId);
      intervalId = null;
    }
    self.postMessage({ type: 'stopped' });
  }
};
