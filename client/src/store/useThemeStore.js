import { create } from 'zustand';

const THEME_STORAGE_KEY = 'pmt_theme_mode';

// Resolve initial theme: default is 'light' unless explicitly saved by user
const getInitialTheme = () => {
  if (typeof window === 'undefined') return 'light';
  try {
    // Clear legacy key if present to prevent stale auto-dark from previous session
    localStorage.removeItem('pmt_theme');
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') {
      return saved;
    }
  } catch {
    // ignore storage access errors
  }
  return 'light';
};

const applyThemeToDocument = (theme) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

// Initial theme application on module load
const initialTheme = getInitialTheme();
applyThemeToDocument(initialTheme);

export const useThemeStore = create((set) => ({
  theme: initialTheme,

  toggleTheme: () => {
    set((state) => {
      const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
      applyThemeToDocument(nextTheme);
      try {
        localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
      } catch {}
      return { theme: nextTheme };
    });
  },

  setTheme: (newTheme) => {
    if (newTheme !== 'dark' && newTheme !== 'light') return;
    applyThemeToDocument(newTheme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {}
    set({ theme: newTheme });
  }
}));

export default useThemeStore;

