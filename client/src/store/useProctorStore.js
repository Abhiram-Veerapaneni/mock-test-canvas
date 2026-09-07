import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * useProctorStore
 *
 * Central Zustand store for all proctoring state.
 * Uses Zustand persist middleware so violations and trust score survive
 * page refreshes — a student can't reset their record by pressing F5.
 *
 * S2: Tiered trust score deductions by violation severity.
 * S1: Per-type cooldown (10 s) prevents rapid stacking from a single incident.
 *
 * Phase 4: Added NO_FACE, MULTI_FACE, NOISE_SPIKE violation types
 * and strikeCount tracking for the penalty engine.
 */

// S2: Tiered deductions — more deliberate acts cost more
const VIOLATION_DEDUCTIONS = {
  FULLSCREEN_EXIT: 20,   // deliberate, hard to do accidentally
  TAB_SWITCH: 15,        // moderate — common cheat vector
  WINDOW_BLUR: 10,       // often accidental (OS notification, etc.)
  EXTENDED_ABSENCE: 10,  // default; overridden dynamically based on duration
  NO_FACE: 15,           // candidate absent from frame
  MULTI_FACE: 20,        // extra person detected — likely assistance
  NOISE_SPIKE: 10,       // ambient noise exceeding threshold
};

// S1: Minimum milliseconds between successive violations of the same type
const VIOLATION_COOLDOWN_MS = 10_000; // 10 seconds

// Types that bypass the cooldown (fired once per discrete event, not continuously)
// Vision/audio violations use their own 3-second debounce in the hooks,
// so they bypass the store cooldown to avoid double-debouncing.
const NO_COOLDOWN_TYPES = new Set([
  'EXTENDED_ABSENCE',
  'NO_FACE',
  'MULTI_FACE',
  'NOISE_SPIKE',
]);

const useProctorStore = create(
  persist(
    (set, get) => ({
      /** @type {{ type: string, timestamp: string }[]} */
      violations: [],

      /** Total number of violations recorded */
      violationCount: 0,

      /**
       * Strike count: incremented each time a violation is successfully recorded.
       * Distinct from violationCount only semantically — both track the same events.
       * Used by the penalty engine to check against exam.proctorSettings.maxWarningsAllowed.
       */
      strikeCount: 0,

      /**
       * Trust score: starts at 100.
       * Decremented by a type-specific amount per violation (min 0).
       */
      trustScore: 100,

      /**
       * S1: Tracks the last time each violation type was recorded (Unix ms).
       * @type {Record<string, number>}
       */
      lastViolationTime: {},

      /**
       * examId scoping: store the examId so we can detect when a NEW exam
       * starts and auto-reset instead of carrying over old violations.
       */
      activeExamId: null,

      /**
       * addViolation
       * Records a new violation, enforces cooldown, applies tiered deduction.
       * @param {string}      type             Violation type string
       * @param {number|null} customDeduction  Override the default deduction
       * @returns {boolean}   true if recorded, false if cooldown suppressed it
       */
      addViolation: (type, customDeduction = null) => {
        const { violations, trustScore, strikeCount, lastViolationTime } = get();

        // S1: Enforce per-type cooldown (skipped for NO_COOLDOWN_TYPES)
        const now = Date.now();
        if (!NO_COOLDOWN_TYPES.has(type)) {
          const lastTime = lastViolationTime[type] ?? 0;
          if (now - lastTime < VIOLATION_COOLDOWN_MS) return false;
        }

        const deduction = customDeduction ?? (VIOLATION_DEDUCTIONS[type] ?? 15);
        const newViolation = { type, timestamp: new Date().toISOString() };

        set({
          violations: [...violations, newViolation],
          violationCount: violations.length + 1,
          strikeCount: strikeCount + 1,
          trustScore: Math.max(0, trustScore - deduction),
          lastViolationTime: { ...lastViolationTime, [type]: now },
        });

        return true;
      },

      /**
       * resetProctor
       * Clears all violation state. Call when a new exam session begins.
       * Pass the examId so the store can detect cross-exam reuse.
       */
      resetProctor: (examId = null) => {
        set({
          violations: [],
          violationCount: 0,
          strikeCount: 0,
          trustScore: 100,
          lastViolationTime: {},
          activeExamId: examId,
        });
      },
    }),
    {
      name: 'proctor-session', // localStorage key
      // Only persist the violation record fields, not the cooldown timestamps
      // (cooldown is session-only — restarting the browser should reset it)
      partialize: (state) => ({
        violations: state.violations,
        violationCount: state.violationCount,
        strikeCount: state.strikeCount,
        trustScore: state.trustScore,
        activeExamId: state.activeExamId,
      }),
    }
  )
);

export default useProctorStore;
