import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export default function Breadcrumbs({ items = [], className = '' }) {
  if (!items || items.length === 0) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className={`flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 overflow-x-auto whitespace-nowrap py-1 ${className}`}
    >
      <Link
        to="/dashboard"
        className="flex items-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors p-0.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
        title="Dashboard"
      >
        <Home className="w-3.5 h-3.5" />
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <React.Fragment key={index}>
            <ChevronRight className="w-3 h-3 text-slate-400/80 dark:text-slate-600 shrink-0" />
            {isLast || !item.to ? (
              <span
                className={`font-semibold text-slate-900 dark:text-white truncate max-w-[200px] sm:max-w-xs ${
                  isLast ? 'text-slate-900 dark:text-white' : ''
                }`}
              >
                {item.label}
              </span>
            ) : (
              <Link
                to={item.to}
                className="hover:text-slate-900 dark:hover:text-slate-200 hover:underline underline-offset-2 transition-colors truncate max-w-[160px] sm:max-w-xs"
              >
                {item.label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
