import React, { useState } from 'react';
import { X, RotateCcw, Ban, AlertTriangle, Loader2 } from 'lucide-react';

export default function AuditRevokeModal({
  attemptItem,
  onClose,
  onConfirm,
  isSubmitting = false
}) {
  if (!attemptItem) return null;

  const [actionType, setActionType] = useState('RESET_FOR_RETAKE');
  const [reason, setReason] = useState('');

  const retakePresets = [
    'Technical / network disconnection',
    'Accidental premature submission',
    'System crash during examination',
    'Approved examiner re-attempt'
  ];

  const disqualifyPresets = [
    'Multiple face / presence detected',
    'Excessive tab switches / window blur',
    'Prohibited device / materials detected',
    'Confirmed academic dishonesty'
  ];

  const activePresets = actionType === 'RESET_FOR_RETAKE' ? retakePresets : disqualifyPresets;

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm({
      attemptId: attemptItem.attemptId,
      action: actionType,
      reason: reason.trim() || (actionType === 'RESET_FOR_RETAKE' ? 'Technical reset granted by examiner' : 'Disqualified for malpractice')
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="max-w-lg w-full bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none rounded-lg p-5 text-slate-900 dark:text-slate-100 space-y-4 shadow-sm"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-md ${actionType === 'RESET_FOR_RETAKE' ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400'}`}>
              {actionType === 'RESET_FOR_RETAKE' ? <RotateCcw className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Revoke Candidate Attempt
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Manage attempt validity, attempt quota, and disciplinary status
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Candidate Info Card */}
        <div className="p-3 rounded-md bg-slate-50/75 dark:bg-[#0C0F17]/75 border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 font-semibold flex items-center justify-center text-xs">
              {attemptItem.user?.name ? attemptItem.user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <div className="font-semibold text-slate-900 dark:text-slate-100">
                {attemptItem.user?.name || 'Candidate'}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {attemptItem.user?.email || 'No email'}
              </div>
            </div>
          </div>

          <div className="text-right text-[11px] space-y-0.5">
            <div>
              Score:{' '}
              <span className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                {attemptItem.score ?? 0} pts
              </span>
            </div>
            <div>
              Violations:{' '}
              <span className={`font-semibold tabular-nums ${attemptItem.violationsCount > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-500'}`}>
                {attemptItem.violationsCount ?? 0}
              </span>
            </div>
          </div>
        </div>

        {/* Action Type Selection */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Select Revocation Action
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Option 1: Reset for Retake */}
              <label
                className={`p-3 rounded-lg border text-left cursor-pointer transition-all flex flex-col justify-between ${
                  actionType === 'RESET_FOR_RETAKE'
                    ? 'border-indigo-600 bg-indigo-50/40 dark:border-indigo-500 dark:bg-indigo-950/30'
                    : 'border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#131926] hover:bg-slate-50 dark:hover:bg-[#162030]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-1.5 font-semibold text-xs text-indigo-700 dark:text-indigo-400">
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset for Retake</span>
                  </div>
                  <input
                    type="radio"
                    name="actionType"
                    value="RESET_FOR_RETAKE"
                    checked={actionType === 'RESET_FOR_RETAKE'}
                    onChange={() => setActionType('RESET_FOR_RETAKE')}
                    className="w-3.5 h-3.5 text-indigo-600 focus:ring-indigo-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                  Restores <strong>1 attempt quota</strong>. Use for technical glitches or accidental submissions.
                </p>
              </label>

              {/* Option 2: Disqualify */}
              <label
                className={`p-3 rounded-lg border text-left cursor-pointer transition-all flex flex-col justify-between ${
                  actionType === 'DISQUALIFY'
                    ? 'border-rose-600 bg-rose-50/40 dark:border-rose-500 dark:bg-rose-950/30'
                    : 'border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#131926] hover:bg-slate-50 dark:hover:bg-[#162030]'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-1.5 font-semibold text-xs text-rose-700 dark:text-rose-400">
                    <Ban className="w-3.5 h-3.5" />
                    <span>Disqualify Candidate</span>
                  </div>
                  <input
                    type="radio"
                    name="actionType"
                    value="DISQUALIFY"
                    checked={actionType === 'DISQUALIFY'}
                    onChange={() => setActionType('DISQUALIFY')}
                    className="w-3.5 h-3.5 text-rose-600 focus:ring-rose-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                  Marks attempt as <strong>Disqualified</strong>. Quota is consumed; candidate cannot retake.
                </p>
              </label>
            </div>
          </div>

          {/* Reason Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Reason / Note for Candidate
              </label>
              <span className="text-[10px] text-slate-400">Sent via notification</span>
            </div>

            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={actionType === 'RESET_FOR_RETAKE' ? 'e.g., Network disconnection during section 2' : 'e.g., Unregistered device visible in proctoring feed'}
              className="input-base text-xs px-3 py-2 w-full"
            />

            {/* Quick Chips */}
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] text-slate-400 font-medium mr-0.5">Quick presets:</span>
              {activePresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setReason(preset)}
                  className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Notice Alert */}
          <div className="p-2.5 rounded-md bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 flex items-start gap-2 text-[11px] text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <span>
              {actionType === 'RESET_FOR_RETAKE'
                ? 'This will exclude this attempt from official leaderboards and unlock another attempt for this candidate.'
                : 'This candidate’s score will be excluded from leaderboards and rankings, and they will be notified of disqualification.'}
            </span>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-3.5 py-1.5 rounded-md border border-slate-200/80 dark:border-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#162030] text-xs font-medium cursor-pointer transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-3.5 py-1.5 rounded-md text-white text-xs font-medium cursor-pointer transition-colors flex items-center gap-1.5 shadow-xs ${
                actionType === 'RESET_FOR_RETAKE'
                  ? 'bg-indigo-600 hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400'
                  : 'bg-rose-600 hover:bg-rose-500 dark:bg-rose-600 dark:hover:bg-rose-500'
              }`}
            >
              {isSubmitting && <Loader2 className="w-3 h-3 animate-spin" />}
              <span>
                {actionType === 'RESET_FOR_RETAKE' ? 'Reset & Unlock Retake' : 'Confirm Disqualification'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

