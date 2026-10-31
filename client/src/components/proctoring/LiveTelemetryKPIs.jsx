import React from 'react';
import { Camera, ShieldAlert, AlertTriangle, User } from 'lucide-react';

export default function LiveTelemetryKPIs({
  totalSnapshots,
  phoneAlerts,
  faceAlerts,
  uniqueCandidates
}) {
  return (
    <section className="grid grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/80 dark:divide-slate-800/80 border border-slate-200/80 rounded-xl bg-white shadow-sm dark:bg-[#131926] dark:border-slate-800/80">
      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Evidence Snaps
          </span>
          <Camera className="w-4 h-4 text-slate-400 dark:text-slate-500" />
        </div>
        <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums mt-1">
          {totalSnapshots}
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Visual evidence captures</p>
      </div>

      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Hardware Flags
          </span>
          <ShieldAlert className="w-4 h-4 text-slate-400 dark:text-slate-500" />
        </div>
        <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums mt-1">
          {phoneAlerts}
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Mobile phones & devices</p>
      </div>

      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Biometric Flags
          </span>
          <AlertTriangle className="w-4 h-4 text-slate-400 dark:text-slate-500" />
        </div>
        <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums mt-1">
          {faceAlerts}
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">Face presence & orientation</p>
      </div>

      <div className="p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Active Candidates
          </span>
          <User className="w-4 h-4 text-slate-400 dark:text-slate-500" />
        </div>
        <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums mt-1">
          {uniqueCandidates}
        </p>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">In this proctoring stream</p>
      </div>
    </section>
  );
}

