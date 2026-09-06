import { useEffect, useRef, useCallback } from 'react';

/**
 * useBrowserLockdown
 *
 * Enforces browser security constraints during an active exam session.
 * Handles:
 *   - Full-screen entry and re-entry enforcement
 *   - Full-screen exit detection (fires onViolation + shows overlay)
 *   - The overlay is managed externally via the returned state/callbacks
 *
 * Usage:
 *   const { enterFullscreen, isFullscreenBlocked, dismissBlocker } = useBrowserLockdown({ active, onViolation });
 *
 * @param {boolean}  active       - Whether lockdown should be in effect.
 * @param {function} onViolation  - Called with a violation type string on each infraction.
 */
export default function useBrowserLockdown({ active, onViolation }) {
  const onViolationRef = useRef(onViolation);
  const isBlockedRef = useRef(false); // tracks whether the fullscreen-exit overlay is showing
  const activeRef = useRef(active);

  // Keep refs fresh
  useEffect(() => { onViolationRef.current = onViolation; }, [onViolation]);
  useEffect(() => { activeRef.current = active; }, [active]);

  /** Request fullscreen on the document root */
  const enterFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
      }
    } catch (err) {
      console.warn('[Lockdown] Fullscreen request failed:', err.message);
    }
  }, []);

  /** Called when the blocker overlay "Re-enter Fullscreen" button is clicked */
  const dismissBlocker = useCallback(() => {
    isBlockedRef.current = false;
    enterFullscreen();
    // Dispatch a custom event so the UI can hide the overlay reactively
    window.dispatchEvent(new CustomEvent('lockdown:unblock'));
  }, [enterFullscreen]);

  useEffect(() => {
    if (!active) return;

    // ── 1. Auto-enter fullscreen on mount ────────────────────────────────────
    enterFullscreen();

    // ── 2. Fullscreen exit handler ───────────────────────────────────────────
    const handleFullscreenChange = () => {
      if (!activeRef.current) return;
      if (!document.fullscreenElement) {
        // User exited fullscreen — show blocking overlay
        isBlockedRef.current = true;
        onViolationRef.current?.('FULLSCREEN_EXIT');
        window.dispatchEvent(new CustomEvent('lockdown:block'));
      }
    };

    // ── 3. Tab switch (Page Visibility API) ──────────────────────────────────
    const handleVisibilityChange = () => {
      if (!activeRef.current) return;
      if (document.visibilityState === 'hidden') {
        onViolationRef.current?.('TAB_SWITCH');
      }
    };

    // ── 4. Window blur (alt-tab / other apps) ────────────────────────────────
    const handleWindowBlur = () => {
      if (!activeRef.current) return;
      onViolationRef.current?.('WINDOW_BLUR');
    };

    // ── 5. Right-click suppression ───────────────────────────────────────────
    const handleContextMenu = (e) => {
      if (activeRef.current) e.preventDefault();
    };

    // ── 6. Clipboard suppression ─────────────────────────────────────────────
    const handleClipboard = (e) => {
      if (activeRef.current) e.preventDefault();
    };

    // ── 7. Dev-tool & browser shortcut suppression ───────────────────────────
    const handleKeyDown = (e) => {
      if (!activeRef.current) return;
      const blocked =
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && ['I', 'J', 'C', 'K'].includes(e.key)) || // DevTools
        (e.ctrlKey && e.key === 'U') || // View Source
        (e.ctrlKey && e.key === 'S') || // Save
        (e.ctrlKey && e.key === 'P') || // Print
        (e.altKey && e.key === 'F4');   // Close window (Windows)

      if (blocked) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // Register all listeners
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleClipboard);
    document.addEventListener('cut', handleClipboard);
    document.addEventListener('paste', handleClipboard);
    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleClipboard);
      document.removeEventListener('cut', handleClipboard);
      document.removeEventListener('paste', handleClipboard);
      document.removeEventListener('keydown', handleKeyDown, true);

      // Exit fullscreen cleanly when the exam ends
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, [active, enterFullscreen]);

  return { enterFullscreen, dismissBlocker };
}
