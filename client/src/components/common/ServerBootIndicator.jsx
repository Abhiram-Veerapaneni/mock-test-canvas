import React from 'react';
import { useServerStatusStore } from '../../store/useServerStatusStore';
import { Server, CheckCircle2, RefreshCw, X, Sparkles, Cpu } from 'lucide-react';

export default function ServerBootIndicator() {
  const { isWaking, justWokeUp, elapsedSeconds, checkHealth, dismiss } = useServerStatusStore();

  if (!isWaking) return null;

  // Approximate Render cold start window ~45 seconds
  const estimatedTotal = 45;
  const progressPercent = justWokeUp
    ? 100
    : Math.min(95, Math.max(5, Math.round((elapsedSeconds / estimatedTotal) * 100)));

  return (
    <aside
      aria-label="Backend Server Status"
      className="fixed bottom-5 right-5 z-[99999] max-w-sm w-[calc(100vw-2.5rem)] animate-in fade-in slide-in-from-bottom-2 duration-200 pointer-events-auto"
    >
      <div
        className={`relative overflow-hidden rounded-lg border p-4 shadow-sm transition-colors duration-200 ${
          justWokeUp
            ? 'bg-slate-900 border-emerald-500/30 text-slate-100'
            : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}
      >
        <div className="flex items-start gap-3 relative z-10">
          {/* Status Icon */}
          <div className="shrink-0 mt-0.5">
            {justWokeUp ? (
              <div className="w-8 h-8 rounded-md bg-emerald-950/60 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-md bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                <Server className="w-4 h-4 animate-pulse" />
              </div>
            )}
          </div>

          {/* Text Content */}
          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-semibold text-white flex items-center gap-1.5">
                {justWokeUp ? (
                  <span>Server Connected</span>
                ) : (
                  <>
                    <span>Waking Up Backend Server</span>
                    <span className="flex items-center gap-1 text-[10px] text-amber-400 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      Cold Boot
                    </span>
                  </>
                )}
              </h4>
            </div>

            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
              {justWokeUp
                ? 'Backend container is alive! Your requests will now process instantly.'
                : 'Server spins down after inactivity. Initializing container (~30–50s)...'}
            </p>

            {/* Progress Bar & Timer */}
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span className="flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-slate-400" />
                  {justWokeUp ? 'Operational' : `Initializing (${elapsedSeconds}s)`}
                </span>
                <span className="tabular-nums">{progressPercent}%</span>
              </div>

              {/* Progress bar line */}
              <div className="w-full h-1 bg-slate-800 rounded-sm overflow-hidden border border-slate-800">
                <div
                  className={`h-full transition-all duration-300 rounded-sm ${
                    justWokeUp ? 'bg-emerald-500' : 'bg-slate-100'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Quick Actions if taking longer than expected */}
            {!justWokeUp && elapsedSeconds > 40 && (
              <div className="mt-2.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => checkHealth(false)}
                  className="inline-flex items-center gap-1 text-[10px] font-medium text-slate-300 hover:text-white underline cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Check connection again
                </button>
              </div>
            )}
          </div>

          {/* Dismiss button */}
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss notification"
            className="shrink-0 p-1 text-slate-400 hover:text-white rounded-md hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
