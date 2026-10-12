import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Camera, CameraOff, Mic, MicOff, CheckCircle2,
  AlertTriangle, ShieldCheck, Maximize, Loader2,
  RefreshCw, Lock, ChevronDown, ChevronUp
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
  const [isProtocolExpanded, setIsProtocolExpanded] = useState(false);

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
    <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-2xl w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg p-6 sm:p-8 shadow-sm space-y-6 text-zinc-900 dark:text-zinc-100">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Biometric Proctoring Verification</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-900 dark:text-white">
            Camera & Microphone Setup
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-lg mx-auto leading-relaxed">
            This examination is protected with AI vision & audio proctoring. Verify your webcam and audio stream to begin.
          </p>
        </div>

        {/* ── Symmetrical Device Checks Grid ─────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Camera Card */}
          <div className="bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 flex flex-col justify-between min-h-[250px] text-center relative overflow-hidden shadow-none">
            <div className="w-full flex items-center justify-between text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              <span className="flex items-center gap-1.5 font-semibold text-zinc-900 dark:text-zinc-100">
                <Camera className="w-4 h-4 text-zinc-500" />
                <span>Webcam Feed</span>
              </span>
              {permissionState === 'granted' && faceCheckEnabled ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Verified
                </span>
              ) : permissionState === 'denied' ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-rose-700 dark:text-rose-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  Blocked
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                  Required
                </span>
              )}
            </div>

            {/* Video preview / placeholder */}
            <div className="w-full flex-1 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden flex items-center justify-center relative min-h-[160px] h-[160px]">
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

              {/* Facial Framing Guide */}
              {permissionState === 'granted' && faceCheckEnabled && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <svg className="w-24 h-32 text-zinc-400/50" viewBox="0 0 100 130" fill="none" stroke="currentColor">
                    <ellipse cx="50" cy="65" rx="36" ry="48" strokeWidth="1.5" strokeDasharray="4 3" />
                  </svg>
                  <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-zinc-900/80 text-[10px] font-mono text-zinc-200">
                    720p HD
                  </span>
                </div>
              )}

              {!(permissionState === 'granted' && faceCheckEnabled) && (
                <>
                  {permissionState === 'requesting' ? (
                    <div className="flex flex-col items-center gap-2 text-zinc-500 dark:text-zinc-400">
                      <Loader2 className="w-5 h-5 animate-spin text-zinc-900 dark:text-zinc-100" />
                      <span className="text-xs font-medium">Requesting camera access...</span>
                    </div>
                  ) : permissionState === 'denied' ? (
                    <div className="flex flex-col items-center gap-1.5 p-3 text-rose-600 dark:text-rose-400">
                      <CameraOff className="w-6 h-6 opacity-80" />
                      <span className="text-xs font-medium">Webcam Access Denied</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-1.5 p-3 text-zinc-400 dark:text-zinc-500">
                      <Camera className="w-6 h-6 opacity-60" />
                      <span className="text-xs">Camera preview will show here</span>
                    </div>
                  )}
                </>
              )}
            </div>

            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-2">
              Keep your face centered and well lit.
            </p>
          </div>

          {/* Microphone Card */}
          <div className="bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200 dark:border-zinc-800 rounded-lg p-4 flex flex-col justify-between min-h-[250px] text-center relative overflow-hidden shadow-none">
            <div className="w-full flex items-center justify-between text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              <span className="flex items-center gap-1.5 font-semibold text-zinc-900 dark:text-zinc-100">
                <Mic className="w-4 h-4 text-zinc-500" />
                <span>Microphone Audio</span>
              </span>
              {permissionState === 'granted' && audioCheckEnabled ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Active
                </span>
              ) : permissionState === 'denied' ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-rose-700 dark:text-rose-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  Blocked
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-400" />
                  Required
                </span>
              )}
            </div>

            {/* Mic visualizer / placeholder */}
            <div className="w-full flex-1 rounded-md bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-4 flex flex-col items-center justify-center relative min-h-[160px] h-[160px] space-y-3">
              {permissionState === 'granted' && audioCheckEnabled ? (
                <>
                  <div
                    ref={micIconRef}
                    className="w-10 h-10 rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-700 dark:text-zinc-300 shadow-none"
                  >
                    <Mic className="w-5 h-5" />
                  </div>

                  {/* Dynamic Audio Level Meter */}
                  <div className="w-full max-w-[180px] space-y-1.5">
                    <div className="h-2 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden p-0.5 border border-zinc-300 dark:border-zinc-700">
                      <div
                        ref={meterBarRef}
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: '8%' }}
                      />
                    </div>
                    <span
                      ref={micStatusTextRef}
                      className="text-[11px] text-zinc-500 dark:text-zinc-400 font-mono block"
                    >
                      Speak aloud to test microphone
                    </span>
                  </div>
                </>
              ) : permissionState === 'requesting' ? (
                <div className="flex flex-col items-center gap-2 text-zinc-500 dark:text-zinc-400">
                  <Loader2 className="w-5 h-5 animate-spin text-zinc-900 dark:text-zinc-100" />
                  <span className="text-xs font-medium">Requesting audio input...</span>
                </div>
              ) : permissionState === 'denied' ? (
                <div className="flex flex-col items-center gap-1.5 p-3 text-rose-600 dark:text-rose-400">
                  <MicOff className="w-6 h-6 opacity-80" />
                  <span className="text-xs font-medium">Microphone Access Denied</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5 p-3 text-zinc-400 dark:text-zinc-500">
                  <Mic className="w-6 h-6 opacity-60" />
                  <span className="text-xs">Audio meter activates after grant</span>
                </div>
              )}
            </div>

            <p className="text-[11px] text-zinc-400 dark:text-zinc-500 mt-2">
              Continuous background noise monitoring.
            </p>
          </div>
        </div>

        {/* ── Status & Guidance Callout ──────────────────────────────────── */}
        {permissionState === 'denied' && (
          <div className="p-3.5 rounded-lg bg-rose-50/60 dark:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs space-y-2">
            <div className="flex items-center gap-2 font-semibold text-rose-900 dark:text-rose-200">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>Permissions Blocked by Browser</span>
            </div>
            <p className="text-rose-700 dark:text-rose-300/90 leading-relaxed">
              To proceed with this proctored examination:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-zinc-700 dark:text-zinc-300 pl-1">
              <li>Click the <strong>Lock / Permissions icon</strong> <Lock className="inline w-3.5 h-3.5 mx-1 text-zinc-500" /> in the browser address bar.</li>
              <li>Toggle both <strong>Camera</strong> and <strong>Microphone</strong> to <strong>Allow</strong>.</li>
              <li>Click <strong>Retry Device Permissions</strong> below.</li>
            </ol>
          </div>
        )}

        {permissionState === 'error' && errorMessage && (
          <div className="p-3.5 rounded-lg bg-amber-50/60 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-amber-900 dark:text-amber-200">Device Detection Error: </span>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* ── Candidate Proctoring Disclosure & Protocol Accordion ── */}
        <div className="rounded-lg bg-zinc-50/60 dark:bg-zinc-950/40 border border-zinc-200 dark:border-zinc-800 text-xs overflow-hidden transition-colors">
          <button
            type="button"
            onClick={() => setIsProtocolExpanded(!isProtocolExpanded)}
            className="w-full p-3.5 flex items-center justify-between gap-2 text-left cursor-pointer hover:bg-zinc-100/60 dark:hover:bg-zinc-800/40 transition-colors"
          >
            <div className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-100">
              <ShieldCheck className="w-4 h-4 text-zinc-500 shrink-0" />
              <span>Candidate Privacy & Proctoring Protocol</span>
            </div>
            <div className="flex items-center gap-2">
              {proctorSettings?.liveNotifications && (
                <span className="inline-flex items-center gap-1.5 text-xs text-zinc-500 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Live Alerts
                </span>
              )}
              {isProtocolExpanded ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
            </div>
          </button>

          {isProtocolExpanded && (
            <div className="px-3.5 pb-3.5 pt-1 space-y-2 border-t border-zinc-200/80 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 leading-relaxed text-[11px]">
              <p>
                Your testing environment is evaluated in real-time. Unauthorized actions (looking away from display, secondary faces, mobile phones, or tab switches) log timestamped event flags for audit.
              </p>
              <p className="text-[10px] text-zinc-400">
                🔒 Privacy Guarantee: Video frames are processed strictly in-memory using WebAssembly/WebGL models. Continuous video recording is never stored or broadcast.
              </p>
            </div>
          )}
        </div>

        {/* ── Action Buttons ─────────────────────────────────────────────── */}
        <div className="space-y-2.5 pt-1">
          {permissionState === 'granted' ? (
            <button
              onClick={handleBeginExam}
              className="w-full py-2.5 px-4 rounded-md bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-medium text-xs shadow-sm flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <Maximize className="w-4 h-4" />
              <span>Enter Fullscreen & Begin Assessment</span>
            </button>
          ) : (
            <button
              onClick={handleRequestPermissions}
              disabled={permissionState === 'requesting'}
              className={`w-full py-2.5 px-4 rounded-md font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm ${
                permissionState === 'denied'
                  ? 'bg-rose-600 hover:bg-rose-700 text-white'
                  : 'bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-900'
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

          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 px-1">
            <span className="flex items-center gap-1.5 text-[11px]">
              <ShieldCheck className="w-3.5 h-3.5 text-zinc-400" />
              <span>Secure local inference — video stream is never saved</span>
            </span>
            <button
              onClick={onCancel}
              className="text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 underline underline-offset-2 transition-colors cursor-pointer text-xs"
            >
              Cancel & Return
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
