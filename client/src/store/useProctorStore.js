import { create } from 'zustand';

/**
 * useProctorStore
 *
 * Central Zustand store for all proctoring state.
 * Tracks live violations, violation count, and a derived trust score.
 *
 * Trust score starts at 100 and decrements by 15 per violation (floor 0).
 * Used by Phase 3 (lockdown hooks) and Phase 4 (camera/audio proctoring).
 */
const useProctorStore = create((set, get) => ({
  /** @type {{ type: string, timestamp: string }[]} */
  violations: [],

  /** Total number of violations recorded */
  violationCount: 0,

  /**
   * Trust score: starts at 100, decremented by 15 per violation, min 0.
   * Indicates candidate integrity level throughout the exam session.
   */
  trustScore: 100,

  /**
   * addViolation
   * Records a new violation event, increments count, and decrements trust score.
   * @param {string} type  Violation type identifier, e.g. 'TAB_SWITCH', 'FULLSCREEN_EXIT'
   */
  addViolation: (type) => {
    const { violations, trustScore } = get();
    const newViolation = { type, timestamp: new Date().toISOString() };
    set({
      violations: [...violations, newViolation],
      violationCount: violations.length + 1,
      trustScore: Math.max(0, trustScore - 15),
    });
  },

  /**
   * resetProctor
   * Clears all violation state. Call when a new exam session begins.
   */
  resetProctor: () => {
    set({
      violations: [],
      violationCount: 0,
      trustScore: 100,
    });
  },
}));

export default useProctorStore;
