import React from 'react';
import {
  Sliders,
  Sparkles,
  RotateCcw,
  Calendar,
  Clock,
  AlertCircle,
  ShieldCheck,
  BookOpen
} from 'lucide-react';

export default function TestSettingsTab({
  title,
  setTitle,
  description,
  setDescription,
  category,
  setCategory,
  durationMinutes,
  setDurationMinutes,
  correctMark,
  setCorrectMark,
  incorrectMark,
  setIncorrectMark,
  isUnlimitedAttempts,
  setIsUnlimitedAttempts,
  maxAttemptsValue,
  setMaxAttemptsValue,
  allowPracticeMode,
  setAllowPracticeMode,
  allowReviewResponses,
  setAllowReviewResponses,
  isScheduled,
  setIsScheduled,
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  faceCheck,
  setFaceCheck,
  audioCheck,
  setAudioCheck,
  fullScreenLock,
  setFullScreenLock,
  objectCheck,
  setObjectCheck,
  liveNotifications,
  setLiveNotifications
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
      {/* COLUMN 1: Assessment Details, Marking & Scheduling */}
      <div className="space-y-6">
        {/* Card 1: Core Parameters */}
        <div className="bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none rounded-lg p-5 sm:p-6 space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <h2 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-slate-500" />
              <span>Assessment Core Details</span>
            </h2>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Examination Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. JEE Advanced Full Mock 01"
              className="input-base text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Description & Guidelines
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Exam instructions or syllabus summary..."
              className="input-base text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Curriculum Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input-base text-xs cursor-pointer"
              >
                <option value="JEE">JEE</option>
                <option value="NEET">NEET</option>
                <option value="GATE">GATE</option>
                <option value="APTITUDE">APTITUDE</option>
                <option value="CUSTOM">CUSTOM</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Duration (Minutes)
              </label>
              <input
                type="number"
                min={5}
                max={360}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="input-base text-xs font-mono"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Scoring & Marking Scheme */}
        <div className="bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none rounded-lg p-5 sm:p-6 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-slate-500" />
              <span>Scoring & Negative Marking</span>
            </span>
            <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 tabular-nums font-mono">
              +{correctMark} / {incorrectMark} pts
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1 font-medium">Correct Mark (+)</span>
              <input
                type="number"
                value={correctMark}
                onChange={(e) => setCorrectMark(e.target.value)}
                className="input-base text-xs font-mono py-1.5"
              />
            </div>
            <div>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1 font-medium">Negative Mark (-)</span>
              <input
                type="number"
                value={incorrectMark}
                onChange={(e) => setIncorrectMark(e.target.value)}
                className="input-base text-xs font-mono py-1.5"
              />
            </div>
          </div>
          <p className="text-xs text-slate-400 leading-normal">
            Applied by default to newly added questions. Individual questions can override custom marks.
          </p>
        </div>

        {/* Card 3: Candidate Attempt Limits */}
        <div className="bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none rounded-lg p-5 sm:p-6 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <RotateCcw className="w-4 h-4 text-slate-500" />
              <span>Candidate Attempt Limits</span>
            </span>
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              {isUnlimitedAttempts ? 'Unlimited (∞)' : `${maxAttemptsValue} ${maxAttemptsValue === 1 ? 'Attempt' : 'Attempts'}`}
            </span>
          </div>

          {/* 3 Preset Mode Buttons */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              type="button"
              onClick={() => {
                setIsUnlimitedAttempts(false);
                setMaxAttemptsValue(1);
              }}
              className={`p-2.5 rounded-md border text-center transition-all cursor-pointer ${!isUnlimitedAttempts && Number(maxAttemptsValue) === 1
                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/40 border-indigo-600 dark:border-indigo-400 font-medium'
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#162030]/50'
                }`}
            >
              <span className="block text-xs font-medium">1 Attempt</span>
              <span className="block text-[11px] text-slate-400 mt-0.5">Strict Test</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsUnlimitedAttempts(false);
                if (Number(maxAttemptsValue) === 1) setMaxAttemptsValue(3);
              }}
              className={`p-2.5 rounded-md border text-center transition-all cursor-pointer ${!isUnlimitedAttempts && Number(maxAttemptsValue) > 1
                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/40 border-indigo-600 dark:border-indigo-400 font-medium'
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#162030]/50'
                }`}
            >
              <span className="block text-xs font-medium">Multiple</span>
              <span className="block text-[11px] text-slate-400 mt-0.5">Custom limit</span>
            </button>

            <button
              type="button"
              onClick={() => setIsUnlimitedAttempts(true)}
              className={`p-2.5 rounded-md border text-center transition-all cursor-pointer ${isUnlimitedAttempts
                ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/40 border-indigo-600 dark:border-indigo-400 font-medium'
                : 'bg-white dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#162030]/50'
                }`}
            >
              <span className="block text-xs font-medium">Unlimited</span>
              <span className="block text-[11px] text-slate-400 mt-0.5">Practice (∞)</span>
            </button>
          </div>

          {/* Number Stepper when Multiple is selected */}
          {!isUnlimitedAttempts && Number(maxAttemptsValue) > 1 && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                <span>Allowed Attempts:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMaxAttemptsValue(Math.max(2, Number(maxAttemptsValue) - 1))}
                    className="w-7 h-7 rounded-md bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#162030] flex items-center justify-center cursor-pointer"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={2}
                    max={50}
                    value={maxAttemptsValue}
                    onChange={(e) => setMaxAttemptsValue(Math.max(2, parseInt(e.target.value) || 2))}
                    className="w-14 text-center py-1 input-base text-xs font-semibold font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setMaxAttemptsValue(Math.min(50, Number(maxAttemptsValue) + 1))}
                    className="w-7 h-7 rounded-md bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#162030] flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-[11px] text-slate-400 uppercase font-medium mr-1">Presets:</span>
                {[2, 3, 5, 10].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setMaxAttemptsValue(preset)}
                    className={`px-2.5 py-0.5 rounded-md text-xs font-medium border transition-colors cursor-pointer ${Number(maxAttemptsValue) === preset
                      ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/40 border-indigo-600 dark:border-indigo-400'
                      : 'bg-white dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-[#162030]'
                      }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Card 4: Assessment Scheduling Window */}
        <div className="bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none rounded-lg p-5 sm:p-6 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-500" />
              <span>Scheduled Test Window</span>
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isScheduled}
                onChange={(e) => setIsScheduled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-8 h-4.5 bg-slate-200 peer-focus:outline-hidden rounded-full peer dark:bg-slate-800/80 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600 dark:peer-checked:bg-indigo-500"></div>
            </label>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
            {isScheduled
              ? 'Restricts candidate access strictly between opening and closing timestamp.'
              : 'Unscheduled — candidates can begin this evaluation at any convenient time.'}
          </p>

          {isScheduled && (
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span>Window Start Date & Time</span>
                </label>
                <input
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="input-base text-xs font-mono py-1.5"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-500" />
                  <span>Window End Date & Time</span>
                </label>
                <input
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="input-base text-xs font-mono py-1.5"
                />
              </div>

              {startTime && endTime && new Date(endTime) <= new Date(startTime) && (
                <p className="text-xs font-medium text-rose-600 dark:text-rose-400 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>End time must be later than start time!</span>
                </p>
              )}

              {startTime && endTime && new Date(endTime) > new Date(startTime) && (
                <div className="p-2.5 rounded-md bg-slate-50 dark:bg-[#162030] border border-slate-200 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>Window Span:</span>
                  <strong className="font-mono tabular-nums">
                    {Math.round((new Date(endTime) - new Date(startTime)) / (1000 * 60 * 60))} hours ({Math.round((new Date(endTime) - new Date(startTime)) / (1000 * 60))} mins)
                  </strong>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* COLUMN 2: Proctoring Security, Access Rules & Overview */}
      <div className="space-y-6">
        {/* Card 1: Proctoring Security Rules */}
        <div className="bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none rounded-lg p-5 sm:p-6 space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800/80 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-slate-500" />
                <span>Proctoring Security Rules</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Configure automated browser lockdown and AI vision monitoring safeguards.
              </p>
            </div>
          </div>

          <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
            {/* Facial Verification */}
            <label className="flex items-start gap-3 p-3 rounded-md bg-slate-50 dark:bg-[#162030] border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={faceCheck}
                onChange={(e) => setFaceCheck(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-slate-900 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-900 dark:text-slate-100">Facial Presence Verification</span>
                  <span className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <span className={`w-1.5 h-1.5 rounded-full ${faceCheck ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    {faceCheck ? 'Active' : 'Off'}
                  </span>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 leading-normal block mt-0.5">
                  MediaPipe vision tracking for candidate absence, head turns, and multiple face intrusions.
                </span>
              </div>
            </label>

            {/* Acoustic Audio */}
            <label className="flex items-start gap-3 p-3 rounded-md bg-slate-50 dark:bg-[#162030] border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={audioCheck}
                onChange={(e) => setAudioCheck(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-slate-900 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-900 dark:text-slate-100">Acoustic & Noise Level Detection</span>
                  <span className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <span className={`w-1.5 h-1.5 rounded-full ${audioCheck ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    {audioCheck ? 'Active' : 'Off'}
                  </span>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 leading-normal block mt-0.5">
                  Detects vocal murmur, background discussions, and ambient audio spikes in decibels.
                </span>
              </div>
            </label>

            {/* Fullscreen Lock */}
            <label className="flex items-start gap-3 p-3 rounded-md bg-slate-50 dark:bg-[#162030] border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={fullScreenLock}
                onChange={(e) => setFullScreenLock(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-slate-900 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-900 dark:text-slate-100">Strict Fullscreen & Focus Lockdown</span>
                  <span className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <span className={`w-1.5 h-1.5 rounded-full ${fullScreenLock ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    {fullScreenLock ? 'Enforced' : 'Off'}
                  </span>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 leading-normal block mt-0.5">
                  Immediately penalizes tab switching, window blurring, browser navigation, or devtool inspection.
                </span>
              </div>
            </label>

            {/* Device / Object Check */}
            <label className="flex items-start gap-3 p-3 rounded-md bg-slate-50 dark:bg-[#162030] border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={objectCheck}
                onChange={(e) => setObjectCheck(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-slate-900 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-900 dark:text-slate-100">Prohibited Device Detection</span>
                  <span className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <span className={`w-1.5 h-1.5 rounded-full ${objectCheck ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    {objectCheck ? 'Active' : 'Off'}
                  </span>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 leading-normal block mt-0.5">
                  COCO-SSD model scans video feed for mobile smartphones, notes, books, and external hardware.
                </span>
              </div>
            </label>

            {/* WebSocket Live Alerts */}
            <label className="flex items-start gap-3 p-3 rounded-md bg-slate-50 dark:bg-[#162030] border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={liveNotifications}
                onChange={(e) => setLiveNotifications(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-slate-900 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-900 dark:text-slate-100">Live Examiner Real-Time Alerts</span>
                  <span className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                    <span className={`w-1.5 h-1.5 rounded-full ${liveNotifications ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    {liveNotifications ? 'Active' : 'Off'}
                  </span>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 leading-normal block mt-0.5">
                  Instantly triggers live toasts with snapshot evidence directly on your examiner screen when candidates violate rules.
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Card 2: Candidate Access & Review Rules */}
        <div className="bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none rounded-lg p-5 sm:p-6 space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <h2 className="text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-slate-500" />
              <span>Candidate Access & Solutions Policy</span>
            </h2>
          </div>

          <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
            {/* Practice Mode Toggle */}
            <label className="flex items-start gap-3 p-3 rounded-md bg-slate-50 dark:bg-[#162030] border border-slate-200/80 dark:border-slate-800/80 cursor-pointer">
              <input
                type="checkbox"
                checked={allowPracticeMode}
                onChange={(e) => setAllowPracticeMode(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-slate-900 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <div className="flex-1 min-w-0">
                <span className="font-medium text-slate-900 dark:text-slate-100 block">Allow Practice Mode (Unproctored)</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 leading-normal mt-0.5 block">
                  Candidates can practice questions without webcam or audio lockdown. {isScheduled ? 'For scheduled exams, practice mode unlocks strictly after the scheduled window ends.' : 'Practice attempts remain private.'}
                </span>
              </div>
            </label>

            {/* View Responses / Answer Key Toggle */}
            <label className="flex items-start gap-3 p-3 rounded-md bg-slate-50 dark:bg-[#162030] border border-slate-200/80 dark:border-slate-800/80 cursor-pointer">
              <input
                type="checkbox"
                checked={allowReviewResponses}
                onChange={(e) => setAllowReviewResponses(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-slate-300 dark:border-slate-700 text-slate-900 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <div className="flex-1 min-w-0">
                <span className="font-medium text-slate-900 dark:text-slate-100 block">Allow View Responses & Solutions</span>
                <span className="text-xs text-slate-500 dark:text-slate-400 leading-normal mt-0.5 block">
                  Candidates can view their submission responses and comprehensive solutions after completing their test. {isScheduled ? 'For scheduled exams, solutions are released strictly after the scheduled window closes to prevent leaks.' : ''}
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Card 3: Security & Proctoring Status Overview */}
        <div className="bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Security & Integrity Overview</h3>
              <p className="text-xs text-slate-500 mt-0.5">Real-time candidate monitoring profile</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
              <span className={`w-1.5 h-1.5 rounded-full ${faceCheck && audioCheck && fullScreenLock && objectCheck
                ? 'bg-emerald-500'
                : (faceCheck || audioCheck || fullScreenLock)
                  ? 'bg-indigo-500'
                  : 'bg-amber-500'
                }`} />
              <span>
                {faceCheck && audioCheck && fullScreenLock && objectCheck
                  ? 'Maximum Lockdown'
                  : (faceCheck || audioCheck || fullScreenLock)
                    ? 'Standard Monitoring'
                    : 'Minimal Security'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-md bg-slate-50 dark:bg-[#162030] border border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between">
              <span className="text-slate-500">Facial Vision:</span>
              <span className={`font-medium ${faceCheck ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                {faceCheck ? 'Active' : 'Disabled'}
              </span>
            </div>
            <div className="p-2.5 rounded-md bg-slate-50 dark:bg-[#162030] border border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between">
              <span className="text-slate-500">Audio Proctor:</span>
              <span className={`font-medium ${audioCheck ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                {audioCheck ? 'Active' : 'Disabled'}
              </span>
            </div>
            <div className="p-2.5 rounded-md bg-slate-50 dark:bg-[#162030] border border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between">
              <span className="text-slate-500">Fullscreen Lock:</span>
              <span className={`font-medium ${fullScreenLock ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                {fullScreenLock ? 'Enforced' : 'Optional'}
              </span>
            </div>
            <div className="p-2.5 rounded-md bg-slate-50 dark:bg-[#162030] border border-slate-200/60 dark:border-slate-800/80 flex items-center justify-between">
              <span className="text-slate-500">Device Scan:</span>
              <span className={`font-medium ${objectCheck ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}>
                {objectCheck ? 'Active' : 'Disabled'}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-md bg-slate-50/70 dark:bg-[#162030] border border-slate-200/60 dark:border-slate-800/80 text-xs space-y-1.5 text-slate-600 dark:text-slate-400">
            <div className="flex items-center justify-between">
              <span>Schedule Window:</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">
                {isScheduled ? 'Restricted Date/Time' : 'Flexible (Anytime)'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Candidate Attempts:</span>
              <span className="font-medium text-slate-900 dark:text-slate-100 font-mono">
                {isUnlimitedAttempts ? 'Unlimited Retakes' : `${maxAttemptsValue} Attempts maximum`}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span>Live Examiner Alerts:</span>
              <span className={`font-medium ${liveNotifications ? 'text-slate-900 dark:text-slate-100' : 'text-slate-400'}`}>
                {liveNotifications ? 'Real-Time Toasts On' : 'Silent Logging'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
