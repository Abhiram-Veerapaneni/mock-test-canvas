export const VIOLATION_CONFIG = {
  CELL_PHONE: { label: 'Mobile Phone', tone: 'critical' },
  PROHIBITED_OBJECT: { label: 'Prohibited Device', tone: 'critical' },
  MULTI_FACE: { label: 'Multiple Faces', tone: 'warning' },
  NO_FACE: { label: 'No Face', tone: 'warning' },
  PROHIBITED_BOOK: { label: 'Study Material', tone: 'warning' },
  NOISE_SPIKE: { label: 'Noise Detected', tone: 'warning' },
  TAB_SWITCH: { label: 'Tab Switch', tone: 'neutral' },
  WINDOW_BLUR: { label: 'Focus Lost', tone: 'neutral' },
  FULLSCREEN_EXIT: { label: 'Fullscreen Exit', tone: 'neutral' },
};

export const getViolationDetails = (type) => {
  if (!type) return { label: 'Infraction', tone: 'warning' };
  if (VIOLATION_CONFIG[type]) return VIOLATION_CONFIG[type];
  const formatted = type.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase());
  return { label: formatted, tone: 'warning' };
};

export const getViolationBadgeStyle = (tone) => {
  if (tone === 'critical') {
    return 'bg-white dark:bg-[#131926] text-rose-700 dark:text-rose-400 border border-rose-300 dark:border-rose-800 shadow-xs font-semibold';
  }
  if (tone === 'warning') {
    return 'bg-white dark:bg-[#131926] text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800 shadow-xs font-semibold';
  }
  return 'bg-white dark:bg-[#131926] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-xs font-semibold';
};

export const getTrustScoreStyle = (score) => {
  const val = score ?? 100;
  if (val >= 80) {
    return {
      badgeClass: 'text-emerald-700 dark:text-emerald-400 bg-white dark:bg-[#131926] border border-emerald-300 dark:border-emerald-800 shadow-xs font-semibold',
      label: 'Good'
    };
  }
  if (val >= 50) {
    return {
      badgeClass: 'text-amber-700 dark:text-amber-400 bg-white dark:bg-[#131926] border border-amber-300 dark:border-amber-800 shadow-xs font-semibold',
      label: 'Review'
    };
  }
  return {
    badgeClass: 'text-rose-700 dark:text-rose-400 bg-white dark:bg-[#131926] border border-rose-300 dark:border-rose-800 shadow-xs font-semibold',
    label: 'High Risk'
  };
};

