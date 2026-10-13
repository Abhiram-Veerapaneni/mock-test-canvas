import React from 'react';
import { Camera, Mic, Maximize2, Smartphone } from 'lucide-react';

export default function ExamProctoringTab({ exam }) {
  const proctor = exam?.proctorSettings || {};

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* AI Biometric Face */}
      <div className="p-4 bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none rounded-lg space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                AI Biometric Face & Eye Gaze
              </h4>
              <p className="text-[11px] text-slate-400">MediaPipe Vision Face Mesh</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                proctor.faceCheck !== false ? 'bg-emerald-500' : 'bg-slate-400'
              }`}
            />
            <span>{proctor.faceCheck !== false ? 'Active' : 'Disabled'}</span>
          </div>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Tracks candidate gaze orientation, detects multi-person presence, and flags candidate absence during assessment.
        </p>
      </div>

      {/* Acoustic Audio */}
      <div className="p-4 bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none rounded-lg space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 flex items-center justify-center">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                Acoustic & Voice Activity
              </h4>
              <p className="text-[11px] text-slate-400">Web Audio API Spectrum</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                proctor.audioCheck !== false ? 'bg-emerald-500' : 'bg-slate-400'
              }`}
            />
            <span>{proctor.audioCheck !== false ? 'Active' : 'Disabled'}</span>
          </div>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Detects speech, whispering, background voices, and sudden volume spikes during test administration.
        </p>
      </div>

      {/* Fullscreen Lockdown */}
      <div className="p-4 bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none rounded-lg space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 flex items-center justify-center">
              <Maximize2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                Full-Screen Lockdown
              </h4>
              <p className="text-[11px] text-slate-400">Fullscreen API & Window Blur</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                proctor.fullScreenLock !== false ? 'bg-emerald-500' : 'bg-slate-400'
              }`}
            />
            <span>{proctor.fullScreenLock !== false ? 'Active' : 'Disabled'}</span>
          </div>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Forces continuous full-screen view. Flags window tab switching, minimizing, or cursor loss.
        </p>
      </div>

      {/* Prohibited Device Detection */}
      <div className="p-4 bg-white border border-slate-200/80 shadow-[0_1px_3px_rgba(0,0,0,0.03),0_6px_16px_rgba(0,0,0,0.02)] dark:bg-[#131926] dark:border-slate-800/80 dark:shadow-none rounded-lg space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 flex items-center justify-center">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                Prohibited Device Detection
              </h4>
              <p className="text-[11px] text-slate-400">COCO-SSD Object Classifier</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                proctor.objectCheck !== false ? 'bg-emerald-500' : 'bg-slate-400'
              }`}
            />
            <span>{proctor.objectCheck !== false ? 'Active' : 'Disabled'}</span>
          </div>
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          Real-time object detection detecting cell phones, notes, or books brought in front of the camera.
        </p>
      </div>
    </div>
  );
}
