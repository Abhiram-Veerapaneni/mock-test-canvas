import { useEffect, useRef, useCallback } from 'react';

/**
 * useBrowserLockdown
 *
 * Enforces browser security constraints during an active exam session.
 * Handles:
 *   - Full-screen entry and re-entry enforcement
 *   - Full-screen exit detection (fires onViolation + shows overlay)
 *   - Tab switch and window blur traps (with debounce to prevent double-firing)
 *   - Right-click, clipboard, and dev-tool key suppression
 *   - Fullscreen API support detection (S6)
 *
 * @param {boolean}  active       - Whether lockdown should be in effect.
 * @param {function} onViolation  - Called with a violation type string on each infraction.
 */
export default function useBrowserLockdown({ active, onViolation }) {
  const onViolationRef = useRef(onViolation);
  const isBlockedRef = useRef(false);
  const activeRef = useRef(active);

  // Bug #1 fix: track when TAB_SWITCH fired so WINDOW_BLUR can skip if co-fired
  const lastTabSwitchTimeRef = useRef(0);
  // Wall-clock timestamp of when the tab was hidden (for elapsed-time correction on return)
  const tabHiddenAtRef = useRef(null);

  // Keep refs fresh
  useEffect(() => { onViolationRef.current = onViolation; }, [onViolation]);
  useEffect(() => { activeRef.current = active; }, [active]);

  /** Request fullscreen on the document root */
  const enterFullscreen = useCallback(async () => {
    // S6: Guard against browsers without fullscreen support (e.g. Safari iOS)
    if (!document.fullscreenEnabled) {
      console.warn('[Lockdown] Fullscreen API not supported in this browser.');
      return;
    }
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
      }
    } catch (err) {
      console.warn('[Lockdown] Fullscreen request failed:', err.message);
      // Browser blocked auto-fullscreen (requires user gesture) — notify UI to show gate screen
      window.dispatchEvent(new CustomEvent('lockdown:fullscreengate'));
    }
  }, []);

  /** Called when the blocker overlay "Re-enter Fullscreen" button is clicked */
  const dismissBlocker = useCallback(() => {
    isBlockedRef.current = false;
    enterFullscreen();
    window.dispatchEvent(new CustomEvent('lockdown:unblock'));
  }, [enterFullscreen]);

  useEffect(() => {
    if (!active) return;

    // ── 1. Auto-enter fullscreen on mount ────────────────────────────────────
    enterFullscreen();

    // S6: Notify UI if fullscreen is unsupported
    if (!document.fullscreenEnabled) {
      window.dispatchEvent(new CustomEvent('lockdown:nofullscreen'));
    }

    // ── 2. Fullscreen exit handler ───────────────────────────────────────────
    const handleFullscreenChange = () => {
      if (!activeRef.current) return;
      if (!document.fullscreenElement) {
        isBlockedRef.current = true;
        onViolationRef.current?.('FULLSCREEN_EXIT');
        window.dispatchEvent(new CustomEvent('lockdown:block'));
      }
    };

    // ── 3. Tab switch (Page Visibility API) ──────────────────────────────────
    // Records timestamp so the blur handler can skip if this fired first.
    // Also tracks wall-clock hide time so we can subtract real elapsed time on return.
    const handleVisibilityChange = () => {
      if (!activeRef.current) return;
      if (document.visibilityState === 'hidden') {
        lastTabSwitchTimeRef.current = Date.now();
        tabHiddenAtRef.current = Date.now();
        onViolationRef.current?.('TAB_SWITCH');
      } else if (document.visibilityState === 'visible' && tabHiddenAtRef.current !== null) {
        // Tab returned — measure actual wall-clock time away and notify the timer
        const elapsedMs = Date.now() - tabHiddenAtRef.current;
        tabHiddenAtRef.current = null;
        window.dispatchEvent(
          new CustomEvent('lockdown:tabreturn', { detail: { elapsedMs } })
        );
      }
    };

    // ── 4. Window blur (alt-tab / other apps) ─────────────────────────────
    // Bug #1 fix: skip WINDOW_BLUR if TAB_SWITCH fired within the last 500 ms —
    // both events co-fire on a tab switch, which would double-count the violation.
    const handleWindowBlur = () => {
      if (!activeRef.current) return;
      if (Date.now() - lastTabSwitchTimeRef.current < 500) return;
      onViolationRef.current?.('WINDOW_BLUR');
      // Notify UI to show the blur overlay
      window.dispatchEvent(new CustomEvent('lockdown:windowblur'));
    };

    // Window regains focus — dismiss the blur overlay
    const handleWindowFocus = () => {
      if (!activeRef.current) return;
      window.dispatchEvent(new CustomEvent('lockdown:windowfocus'));
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
        (e.altKey && e.key === 'F4') || // Close window (Windows)
        // Belt-and-suspenders clipboard block (copy event handler is primary)
        (!e.shiftKey && e.ctrlKey && e.key === 'c') || // Ctrl+C copy
        (!e.shiftKey && e.ctrlKey && e.key === 'x') || // Ctrl+X cut
        (!e.shiftKey && e.ctrlKey && e.key === 'v') || // Ctrl+V paste
        (!e.shiftKey && e.ctrlKey && e.key === 'a');   // Ctrl+A select all

      if (blocked) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // Register all listeners
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleClipboard);
    document.addEventListener('cut', handleClipboard);
    document.addEventListener('paste', handleClipboard);
    document.addEventListener('keydown', handleKeyDown, true);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
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
