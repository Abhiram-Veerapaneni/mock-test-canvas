import { create } from 'zustand';

const THEME_STORAGE_KEY = 'pmt_theme_mode';

// Detect OS system dark mode preference
const getSystemTheme = () => {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
};

// Resolve whether document should have .dark class
const resolveEffectiveTheme = (mode) => {
  if (mode === 'system') return getSystemTheme();
  return mode === 'dark' ? 'dark' : 'light';
};

const applyThemeToDocument = (resolvedTheme) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (resolvedTheme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};

// Resolve initial theme mode: defaults to 'system' unless user previously chose 'light' or 'dark'
const getInitialThemeMode = () => {
  if (typeof window === 'undefined') return 'system';
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    if (saved === 'dark' || saved === 'light' || saved === 'system') {
      return saved;
    }
  } catch {
    // ignore storage access errors
  }
  return 'system';
};

const initialMode = getInitialThemeMode();
const initialEffective = resolveEffectiveTheme(initialMode);
applyThemeToDocument(initialEffective);

export const useThemeStore = create((set, get) => ({
  theme: initialMode, // 'light' | 'dark' | 'system'
  resolvedTheme: initialEffective, // 'light' | 'dark'

  setTheme: (newTheme) => {
    if (newTheme !== 'dark' && newTheme !== 'light' && newTheme !== 'system') return;
    const effective = resolveEffectiveTheme(newTheme);
    applyThemeToDocument(effective);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
    } catch {}
    set({ theme: newTheme, resolvedTheme: effective });
  },

  // Cycles sequentially: light -> dark -> system -> light
  cycleTheme: () => {
    const current = get().theme;
    const nextTheme = current === 'light' ? 'dark' : current === 'dark' ? 'system' : 'light';
    get().setTheme(nextTheme);
  },

  // Backwards-compatible toggle: if light goes to dark, else goes to light
  toggleTheme: () => {
    get().cycleTheme();
  }
}));

// Listen to OS system color scheme changes if user is in 'system' mode
if (typeof window !== 'undefined' && window.matchMedia) {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const handleSystemChange = () => {
    const currentMode = useThemeStore.getState().theme;
    if (currentMode === 'system') {
      const effective = getSystemTheme();
      applyThemeToDocument(effective);
      useThemeStore.setState({ resolvedTheme: effective });
    }
  };

  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handleSystemChange);
  } else if (mediaQuery.addListener) {
    mediaQuery.addListener(handleSystemChange);
  }
}

export default useThemeStore;
