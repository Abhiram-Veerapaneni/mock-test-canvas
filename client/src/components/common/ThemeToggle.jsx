import React from 'react';
import { Sun, Moon } from 'lucide-react';
import useThemeStore from '../../store/useThemeStore';

export default function ThemeToggle({ className = '' }) {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      className={`relative inline-flex items-center justify-center w-8 h-8 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100/80 dark:bg-slate-900/80 hover:bg-slate-200/80 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800/90 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${className}`}
    >
      <div className="relative w-4 h-4 flex items-center justify-center">
        <Sun
          className={`w-4 h-4 text-amber-500 transition-all duration-300 absolute inset-0 m-auto ${
            isDark
              ? 'opacity-0 rotate-90 scale-50 pointer-events-none'
              : 'opacity-100 rotate-0 scale-100'
          }`}
        />
        <Moon
          className={`w-4 h-4 text-blue-400 transition-all duration-300 absolute inset-0 m-auto ${
            isDark
              ? 'opacity-100 rotate-0 scale-100'
              : 'opacity-0 -rotate-90 scale-50 pointer-events-none'
          }`}
        />
      </div>
    </button>
  );
}
