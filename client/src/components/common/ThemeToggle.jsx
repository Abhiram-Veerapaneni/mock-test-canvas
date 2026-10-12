import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor, Check } from 'lucide-react';
import useThemeStore from '../../store/useThemeStore';

export default function ThemeToggle({ className = '' }) {
  const { theme, resolvedTheme, setTheme } = useThemeStore();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const options = [
    { id: 'light', label: 'Light', icon: Sun, color: 'text-amber-500' },
    { id: 'dark', label: 'Dark', icon: Moon, color: 'text-blue-400' },
    { id: 'system', label: 'System', icon: Monitor, color: 'text-indigo-400' },
  ];

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        title={`Theme: ${theme === 'system' ? `System (${resolvedTheme})` : theme === 'dark' ? 'Dark' : 'Light'}`}
        aria-label="Toggle theme mode"
        className="relative inline-flex items-center justify-center w-8 h-8 rounded-md text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 transition-colors cursor-pointer shadow-sm"
      >
        {resolvedTheme === 'dark' ? (
          <Moon className="w-4 h-4 text-zinc-400" />
        ) : (
          <Sun className="w-4 h-4 text-zinc-500" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-36 rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-1 shadow-sm z-50 animate-in fade-in duration-100">
          <div className="px-2 py-1 text-[10px] font-medium uppercase tracking-wider text-zinc-400">
            Theme Mode
          </div>
          <div className="space-y-0.5">
            {options.map((opt) => {
              const Icon = opt.icon;
              const isSelected = theme === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    setTheme(opt.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white'
                      : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                    <span>{opt.label}</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-zinc-900 dark:text-white" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
