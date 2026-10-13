export const VIOLATION_LABELS = {
  TAB_SWITCH: 'Tab Switch',
  WINDOW_BLUR: 'Focus Lost',
  FULLSCREEN_EXIT: 'Fullscreen Exit',
  NO_FACE: 'No Face Detected',
  MULTI_FACE: 'Multiple Faces',
  NOISE_SPIKE: 'Excessive Noise',
  CELL_PHONE: 'Mobile Phone Detected',
  PROHIBITED_BOOK: 'Study Material / Book',
  PROHIBITED_OBJECT: 'Prohibited Device'
};

export const getBadgeStyle = (type) => {
  switch (type) {
    case 'CELL_PHONE':
    case 'PROHIBITED_OBJECT':
      return 'text-rose-700 dark:text-rose-400 bg-rose-50/60 dark:bg-rose-950/40 border border-rose-200/50 dark:border-rose-900/50';
    case 'PROHIBITED_BOOK':
      return 'text-amber-700 dark:text-amber-400 bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200/50 dark:border-amber-900/50';
    case 'MULTI_FACE':
      return 'text-rose-700 dark:text-rose-400 bg-rose-50/60 dark:bg-rose-950/40 border border-rose-200/50 dark:border-rose-900/50';
    case 'NO_FACE':
      return 'text-amber-700 dark:text-amber-400 bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200/50 dark:border-amber-900/50';
    case 'NOISE_SPIKE':
      return 'text-amber-700 dark:text-amber-400 bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200/50 dark:border-amber-900/50';
    default:
      return 'text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700';
  }
};
