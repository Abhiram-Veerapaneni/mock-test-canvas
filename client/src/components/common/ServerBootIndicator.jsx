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
      className="fixed bottom-5 right-5 z-[99999] max-w-md w-[calc(100vw-2.5rem)] animate-in fade-in slide-in-from-bottom-4 duration-300 pointer-events-auto"
    >
      <div
        className={`relative overflow-hidden rounded-2xl border p-4 shadow-2xl backdrop-blur-xl transition-all duration-500 ${
          justWokeUp
            ? 'bg-emerald-950/90 dark:bg-emerald-950/90 border-emerald-500/40 text-emerald-100 shadow-emerald-500/20'
            : 'bg-slate-900/95 dark:bg-slate-900/95 border-amber-500/30 text-slate-100 shadow-amber-500/10'
        }`}
      >
        {/* Ambient background glow */}
        <div
          className={`absolute -top-12 -right-12 w-32 h-32 rounded-full blur-2xl pointer-events-none transition-colors duration-500 ${
            justWokeUp ? 'bg-emerald-500/20' : 'bg-amber-500/15'
          }`}
        />

        <div className="flex items-start gap-3.5 relative z-10">
          {/* Animated Status Icon */}
          <div className="relative shrink-0 mt-0.5">
            {justWokeUp ? (
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-5 h-5 animate-bounce" />
              </div>
            ) : (
              <div className="relative w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                {/* Pulsing beacon ring */}
                <span className="absolute inset-0 rounded-xl bg-amber-400/20 animate-ping" />
                <Server className="w-5 h-5 relative z-10 animate-pulse" />
              </div>
            )}
          </div>

          {/* Text Content */}
          <div className="flex-1 min-w-0 pr-2">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-semibold tracking-tight text-white flex items-center gap-1.5">
                {justWokeUp ? (
                  <>
                    <span>Server Ready & Connected</span>
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  </>
                ) : (
                  <>
                    <span>Waking Up Backend Server</span>
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Cold Boot
                    </span>
                  </>
                )}
              </h4>
            </div>

            <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
              {justWokeUp
                ? 'Backend container is alive! Your requests will now process instantly.'
                : 'Render free tier spins down after 15 min of inactivity. Spinning up container (~30–50s)...'}
            </p>

            {/* Progress Bar & Timer */}
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span className="flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-amber-400" />
                  {justWokeUp ? 'Operational' : `Initializing container (${elapsedSeconds}s)`}
                </span>
                <span>{progressPercent}%</span>
              </div>

              {/* Progress bar line */}
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    justWokeUp
                      ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.8)]'
                      : 'bg-gradient-to-r from-amber-500 via-orange-400 to-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
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
                  className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-300 hover:text-amber-200 underline cursor-pointer"
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
            className="shrink-0 p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/80 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
