import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera, CameraOff, Mic, MicOff, CheckCircle2,
  AlertTriangle, ShieldCheck, Maximize, Loader2,
  RefreshCw, Lock
} from 'lucide-react';

/**
 * ProctoringCheckGate
 *
 * Mandatory pre-exam verification gate that requires candidates to grant camera
 * and microphone permissions before the examination session and timer start.
 *
 * Provides:
 * - Live camera mirror preview
 * - Live real-time microphone volume visualizer
 * - Clear troubleshooting instructions if permissions are blocked
 * - Clean transition to fullscreen exam session
 *
 * @param {Object}   props
 * @param {Object}   props.exam             The exam object with title, proctorSettings, etc.
 * @param {function} props.onVerified       Callback called with active MediaStream when ready
 * @param {function} props.onCancel         Callback to exit back to exam details / dashboard
 */
export default function ProctoringCheckGate({ exam, onVerified, onCancel }) {
  const proctorSettings = exam?.proctorSettings || {};
  const faceCheckEnabled = proctorSettings.faceCheck !== false;
  const audioCheckEnabled = proctorSettings.audioCheck !== false;

  const [permissionState, setPermissionState] = useState('prompt'); // 'prompt' | 'requesting' | 'granted' | 'denied' | 'error'
  const [errorMessage, setErrorMessage] = useState('');
  const [activeStream, setActiveStream] = useState(null);

  const videoPreviewRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const streamRef = useRef(null);
  const handedOffRef = useRef(false);
  const isMountedRef = useRef(true);

  // Direct DOM refs for high-performance audio meter (zero React re-renders)
  const meterBarRef = useRef(null);
  const micStatusTextRef = useRef(null);
  const micIconRef = useRef(null);

  // ── Cleanup streams when gate unmounts (unless handed off to exam session) ──
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (!handedOffRef.current && streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = null;
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().catch(() => {});
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  // ── Attach stream to preview video once available ─────────────────────────
  useEffect(() => {
    const video = videoPreviewRef.current;
    if (video && activeStream && faceCheckEnabled) {
      video.muted = true;
      video.playsInline = true;
      if (video.srcObject !== activeStream) {
        video.srcObject = activeStream;
      }
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('[ProctoringGate] video.play() note:', err?.message);
        });
      }
    }
  }, [activeStream, faceCheckEnabled, permissionState]);

  // ── Real-time Audio Level Visualizer (runs at 60 FPS without re-rendering React) ──
  const startAudioMeter = useCallback((stream) => {
    if (!audioCheckEnabled) return;
    const audioTracks = stream.getAudioTracks();
    if (audioTracks.length === 0) return;

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      // Chrome requires explicit resume if AudioContext was suspended
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 512;
      analyser.smoothingTimeConstant = 0.3;
      analyserRef.current = analyser;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      const buffer = new Uint8Array(analyser.fftSize);

      const updateMeter = () => {
        if (!analyserRef.current) return;
        // True acoustic volume via time-domain data
        analyserRef.current.getByteTimeDomainData(buffer);
        let sumSquares = 0;
        for (let i = 0; i < buffer.length; i++) {
          const norm = (buffer[i] - 128) / 128;
          sumSquares += norm * norm;
        }
        const rms = Math.sqrt(sumSquares / buffer.length);
        // Speaking amplitude typically ranges from 0.04 to 0.4
        const normalized = Math.min(100, Math.round(rms * 350));

        // Direct DOM updates for butter-smooth visualizer without React re-renders
        if (meterBarRef.current) {
          meterBarRef.current.style.width = `${Math.max(6, normalized)}%`;
        }
        if (micStatusTextRef.current) {
          micStatusTextRef.current.innerText = normalized > 10 ? 'Receiving audio input ✓' : 'Speak to test your mic';
          micStatusTextRef.current.style.color = normalized > 10 ? '#2563eb' : '#64748b';
        }

        animFrameRef.current = requestAnimationFrame(updateMeter);
      };

      updateMeter();
    } catch (err) {
      console.warn('[ProctoringGate] Audio visualizer error:', err);
    }
  }, [audioCheckEnabled]);

  // ── Request Camera & Microphone via direct user gesture ───────────────────
  const handleRequestPermissions = async () => {
    setPermissionState('requesting');
    setErrorMessage('');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setPermissionState('error');
      setErrorMessage(
        'Media access is not supported in this browser or is blocked because this connection is not secure (requires HTTPS or localhost).'
      );
      return;
    }

    try {
      const constraints = {
        video: faceCheckEnabled,
        audio: audioCheckEnabled,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (!isMountedRef.current) {
        stream.getTracks().forEach((t) => {
          try { t.stop(); } catch (e) {}
        });
        return;
      }

      streamRef.current = stream;
      setActiveStream(stream);
      setPermissionState('granted');

      // Attach stream to video immediately
      if (videoPreviewRef.current) {
        videoPreviewRef.current.muted = true;
        videoPreviewRef.current.playsInline = true;
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.play().catch(() => {});
      }

      // Start audio meter
      startAudioMeter(stream);
    } catch (err) {
      if (!isMountedRef.current) return;
      console.warn('[ProctoringGate] getUserMedia error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionState('denied');
        setErrorMessage('Camera or microphone permission was denied. Please allow access in your browser site settings.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setPermissionState('error');
        setErrorMessage('No camera or microphone was found on your device. Please connect working devices.');
      } else {
        setPermissionState('error');
        setErrorMessage(err.message || 'Unable to access camera and microphone.');
      }
    }
  };

  // ── Check if permissions were already granted previously on mount ─────────
  useEffect(() => {
    if (navigator.permissions && navigator.permissions.query) {
      Promise.all([
        navigator.permissions.query({ name: 'camera' }).catch(() => null),
        navigator.permissions.query({ name: 'microphone' }).catch(() => null),
      ]).then(([camStatus, micStatus]) => {
        if (
          (faceCheckEnabled ? camStatus?.state === 'granted' : true) &&
          (audioCheckEnabled ? micStatus?.state === 'granted' : true)
        ) {
          handleRequestPermissions();
        }
      }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Complete Verification & Enter Fullscreen Exam ─────────────────────────
  const handleBeginExam = async () => {
    if (!streamRef.current) return;
    handedOffRef.current = true;

    // Detach preview video element before handing stream to main exam player
    if (videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = null;
    }

    // Request fullscreen using the click gesture
    if (document.fullscreenEnabled && !document.fullscreenElement) {
      try {
        await document.documentElement.requestFullscreen({ navigationUI: 'hide' });
      } catch (err) {
        console.warn('[ProctoringGate] Fullscreen entry warning:', err);
      }
    }

    // Pass the active stream up to ExamSessionPage
    onVerified(streamRef.current);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-2xl w-full bg-white dark:bg-[#111827] border border-slate-200/90 dark:border-[#1f293d] rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 text-slate-900 dark:text-slate-100">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200/80 dark:border-blue-900/60 text-blue-700 dark:text-blue-400 text-[11px] font-bold tracking-wider uppercase">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Biometric Proctoring Verification</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
            Camera & Microphone Setup
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
            This examination is protected with AI vision & audio proctoring. Verify your webcam and audio stream to begin.
          </p>
        </div>

        {/* ── Symmetrical Device Checks Grid ─────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* Camera Card */}
          <div className="bg-slate-50 dark:bg-[#090d16]/70 border border-slate-200/90 dark:border-[#1f293d] rounded-2xl p-5 flex flex-col justify-between min-h-[260px] text-center relative overflow-hidden shadow-xs">
            <div className="w-full flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              <span className="flex items-center gap-2 font-bold">
                <Camera className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Webcam Feed</span>
              </span>
              {permissionState === 'granted' && faceCheckEnabled ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Verified
                </span>
              ) : permissionState === 'denied' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  Blocked
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Required
                </span>
              )}
            </div>

            {/* Video preview / placeholder */}
            <div className="w-full flex-1 rounded-xl bg-slate-100 dark:bg-[#111827] border border-slate-200/80 dark:border-[#1f293d] overflow-hidden flex items-center justify-center relative min-h-[170px] h-[170px]">
              <video
                ref={videoPreviewRef}
                autoPlay
                playsInline
                muted
                style={{
                  display: permissionState === 'granted' && faceCheckEnabled ? 'block' : 'none',
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transform: 'scaleX(-1)',
                }}
              />

              {!(permissionState === 'granted' && faceCheckEnabled) && (
                <>
                  {permissionState === 'requesting' ? (
                    <div className="flex flex-col items-center gap-2.5 text-slate-500 dark:text-slate-400">
                      <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
                      <span className="text-xs font-medium">Requesting camera access...</span>
                    </div>
                  ) : permissionState === 'denied' ? (
                    <div className="flex flex-col items-center gap-2 p-3 text-rose-600 dark:text-rose-400">
                      <CameraOff className="w-8 h-8 opacity-80" />
                      <span className="text-xs font-semibold">Webcam Access Denied</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 p-3 text-slate-400 dark:text-slate-500">
                      <Camera className="w-8 h-8 opacity-50" />
                      <span className="text-xs">Camera preview will show here</span>
                    </div>
                  )}
                </>
              )}
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2.5">
              Keep your face centered and well lit.
            </p>
          </div>

          {/* Microphone Card */}
          <div className="bg-slate-50 dark:bg-[#090d16]/70 border border-slate-200/90 dark:border-[#1f293d] rounded-2xl p-5 flex flex-col justify-between min-h-[260px] text-center relative overflow-hidden shadow-xs">
            <div className="w-full flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              <span className="flex items-center gap-2 font-bold">
                <Mic className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Microphone Audio</span>
              </span>
              {permissionState === 'granted' && audioCheckEnabled ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Active
                </span>
              ) : permissionState === 'denied' ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  Blocked
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Required
                </span>
              )}
            </div>

            {/* Mic visualizer / placeholder */}
            <div className="w-full flex-1 rounded-xl bg-slate-100 dark:bg-[#111827] border border-slate-200/80 dark:border-[#1f293d] p-4 flex flex-col items-center justify-center relative min-h-[170px] h-[170px] space-y-3">
              {permissionState === 'granted' && audioCheckEnabled ? (
                <>
                  <div
                    ref={micIconRef}
                    className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/60 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-xs"
                  >
                    <Mic className="w-6 h-6" />
                  </div>

                  {/* Dynamic Audio Level Meter */}
                  <div className="w-full max-w-[200px] space-y-2">
                    <div className="h-2.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-300/60 dark:border-slate-700/60">
                      <div
                        ref={meterBarRef}
                        className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full transition-all"
                        style={{ width: '8%' }}
                      />
                    </div>
                    <span
                      ref={micStatusTextRef}
                      className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block"
                    >
                      Speak aloud to test microphone
                    </span>
                  </div>
                </>
              ) : permissionState === 'requesting' ? (
                <div className="flex flex-col items-center gap-2.5 text-slate-500 dark:text-slate-400">
                  <Loader2 className="w-7 h-7 animate-spin text-blue-600" />
                  <span className="text-xs font-medium">Requesting audio input...</span>
                </div>
              ) : permissionState === 'denied' ? (
                <div className="flex flex-col items-center gap-2 p-3 text-rose-600 dark:text-rose-400">
                  <MicOff className="w-8 h-8 opacity-80" />
                  <span className="text-xs font-semibold">Microphone Access Denied</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 p-3 text-slate-400 dark:text-slate-500">
                  <Mic className="w-8 h-8 opacity-50" />
                  <span className="text-xs">Audio meter activates after grant</span>
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2.5">
              Continuous background noise monitoring.
            </p>
          </div>
        </div>

        {/* ── Status & Guidance Callout ──────────────────────────────────── */}
        {permissionState === 'denied' && (
          <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-rose-900 dark:text-rose-200">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Permissions Blocked by Browser</span>
            </div>
            <p className="text-rose-700 dark:text-rose-300/90 leading-relaxed">
              To proceed with this proctored examination:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-slate-700 dark:text-slate-300 pl-1">
              <li>Click the <strong>Lock / Permissions icon</strong> <Lock className="inline w-3.5 h-3.5 mx-1 text-slate-500" /> in the browser address bar.</li>
              <li>Toggle both <strong>Camera</strong> and <strong>Microphone</strong> to <strong>Allow</strong>.</li>
              <li>Click <strong>Retry Permissions</strong> below.</li>
            </ol>
          </div>
        )}

        {permissionState === 'error' && errorMessage && (
          <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-3">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-900 dark:text-amber-200">Device Detection Error: </span>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* ── Candidate Proctoring Disclosure & Notice ── */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#090d16]/80 border border-slate-200/90 dark:border-[#1f293d] text-xs space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-slate-100">
              <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
              <span>Candidate Privacy & Proctoring Protocol</span>
            </div>
            {proctorSettings?.liveNotifications && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/60 text-blue-700 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
                Live Alerts
              </span>
            )}
          </div>
          <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
            Your testing environment is evaluated in real-time. Unauthorized actions (looking away, secondary people, mobile phones, or tab switches) capture timestamped snapshots that are transmitted to the <strong>exam creator</strong>.
          </p>
        </div>

        {/* ── Action Buttons ─────────────────────────────────────────────── */}
        <div className="space-y-3 pt-1">
          {permissionState === 'granted' ? (
            <button
              onClick={handleBeginExam}
              className="w-full py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer hover:shadow-md"
            >
              <Maximize className="w-4 h-4" />
              <span>Enter Fullscreen & Begin Assessment</span>
            </button>
          ) : (
            <button
              onClick={handleRequestPermissions}
              disabled={permissionState === 'requesting'}
              className={`w-full py-3 px-6 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs hover:shadow-md ${
                permissionState === 'denied'
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {permissionState === 'requesting' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Awaiting Browser Approval...</span>
                </>
              ) : permissionState === 'denied' ? (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Retry Device Permissions</span>
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4" />
                  <span>Grant Camera & Microphone Permissions</span>
                </>
              )}
            </button>
          )}

          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
            <span className="flex items-center gap-1.5 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span>Secure local inference — video stream is never saved</span>
            </span>
            <button
              onClick={onCancel}
              className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 underline underline-offset-2 transition-colors cursor-pointer text-xs"
            >
              Cancel & Return
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
