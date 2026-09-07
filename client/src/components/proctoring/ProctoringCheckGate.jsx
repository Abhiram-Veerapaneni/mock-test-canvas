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

  // Direct DOM refs for high-performance audio meter (zero React re-renders)
  const meterBarRef = useRef(null);
  const micStatusTextRef = useRef(null);
  const micIconRef = useRef(null);

  // ── Cleanup streams when gate unmounts (unless handed off to exam session) ──
  useEffect(() => {
    return () => {
      if (!handedOffRef.current && streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
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
      if (video.srcObject !== activeStream) {
        video.srcObject = activeStream;
      }
      video.play().catch((err) => {
        console.warn('[ProctoringGate] video.play() note:', err?.message);
      });
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
          micStatusTextRef.current.style.color = normalized > 10 ? '#34d399' : '#94a3b8';
        }
        if (micIconRef.current) {
          micIconRef.current.style.transform = normalized > 10 ? 'scale(1.2)' : 'scale(1)';
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
      streamRef.current = stream;
      setActiveStream(stream);
      setPermissionState('granted');

      // Attach stream to video immediately
      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream;
        videoPreviewRef.current.play().catch(() => {});
      }

      // Start audio meter
      startAudioMeter(stream);
    } catch (err) {
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
    <div className="fixed inset-0 z-50 bg-slate-950 text-slate-100 flex items-center justify-center p-4 overflow-y-auto">
      <div className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold tracking-wide uppercase">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Proctored Environment Verification</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Camera & Microphone Setup
          </h1>
          <p className="text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
            This examination is monitored with AI proctoring. You must grant camera and microphone access to verify test integrity before entering the exam.
          </p>
        </div>

        {/* ── Device Checks Grid ─────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Camera Card */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-between min-h-[220px] text-center relative overflow-hidden">
            <div className="w-full flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
              <span className="flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-blue-400" />
                Webcam Feed
              </span>
              {permissionState === 'granted' && faceCheckEnabled ? (
                <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                  <CheckCircle2 className="w-3 h-3" /> Ready
                </span>
              ) : (
                <span className="text-amber-400 text-[11px]">Required</span>
              )}
            </div>

            {/* Video preview / placeholder */}
            <div className="w-full flex-1 rounded-xl bg-slate-900 border border-slate-800/80 overflow-hidden flex items-center justify-center relative min-h-[160px] h-[160px]">
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
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                      <span className="text-xs">Requesting camera...</span>
                    </div>
                  ) : permissionState === 'denied' ? (
                    <div className="flex flex-col items-center gap-2 p-3 text-rose-400">
                      <CameraOff className="w-8 h-8 opacity-80" />
                      <span className="text-xs font-medium">Camera Blocked</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2 p-3 text-slate-500">
                      <Camera className="w-8 h-8 opacity-40" />
                      <span className="text-xs">Preview will appear here</span>
                    </div>
                  )}
                </>
              )}
            </div>

            <p className="text-[11px] text-slate-500 mt-2">
              Ensure your face is clearly visible and centered.
            </p>
          </div>

          {/* Microphone Card */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 flex flex-col items-center justify-between min-h-[220px] text-center relative overflow-hidden">
            <div className="w-full flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
              <span className="flex items-center gap-1.5">
                <Mic className="w-4 h-4 text-purple-400" />
                Microphone Audio
              </span>
              {permissionState === 'granted' && audioCheckEnabled ? (
                <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                  <CheckCircle2 className="w-3 h-3" /> Ready
                </span>
              ) : (
                <span className="text-amber-400 text-[11px]">Required</span>
              )}
            </div>

            {/* Mic visualizer / placeholder */}
            <div className="w-full flex-1 rounded-xl bg-slate-900 border border-slate-800/80 p-4 flex flex-col items-center justify-center relative min-h-[160px] h-[160px] space-y-3">
              {permissionState === 'granted' && audioCheckEnabled ? (
                <>
                  <div
                    ref={micIconRef}
                    className="w-12 h-12 rounded-full bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 transition-transform duration-75"
                  >
                    <Mic className="w-5 h-5" />
                  </div>

                  {/* Dynamic Audio Level Meter */}
                  <div className="w-full max-w-[180px] space-y-1.5">
                    <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
                      <div
                        ref={meterBarRef}
                        className="h-full bg-gradient-to-r from-emerald-500 via-yellow-500 to-rose-500 rounded-full"
                        style={{ width: '6%', transition: 'width 60ms linear' }}
                      />
                    </div>
                    <span
                      ref={micStatusTextRef}
                      className="text-[10px] text-slate-400 font-medium transition-colors"
                    >
                      Speak to test your mic
                    </span>
                  </div>
                </>
              ) : permissionState === 'requesting' ? (
                <div className="flex flex-col items-center gap-2 text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
                  <span className="text-xs">Requesting microphone...</span>
                </div>
              ) : permissionState === 'denied' ? (
                <div className="flex flex-col items-center gap-2 p-3 text-rose-400">
                  <MicOff className="w-8 h-8 opacity-80" />
                  <span className="text-xs font-medium">Microphone Blocked</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 p-3 text-slate-500">
                  <Mic className="w-8 h-8 opacity-40" />
                  <span className="text-xs">Mic test will activate on grant</span>
                </div>
              )}
            </div>

            <p className="text-[11px] text-slate-500 mt-2">
              Detects ambient room noise and speech.
            </p>
          </div>
        </div>

        {/* ── Status & Guidance Callout ──────────────────────────────────── */}
        {permissionState === 'denied' && (
          <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs space-y-2">
            <div className="flex items-center gap-2 font-semibold text-rose-200">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Permission Denied in Browser</span>
            </div>
            <p className="text-rose-300/90 leading-relaxed">
              To enable camera and microphone access:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-slate-300 pl-1">
              <li>Click the <strong>Lock / Settings icon</strong> <Lock className="inline w-3 h-3 mx-1 text-slate-400" /> on the left of your browser address bar.</li>
              <li>Change <strong>Camera</strong> and <strong>Microphone</strong> permissions to <strong>Allow</strong>.</li>
              <li>Click <strong>Retry Permissions</strong> below.</li>
            </ol>
          </div>
        )}

        {permissionState === 'error' && errorMessage && (
          <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-800/80 text-amber-300 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-amber-200">Device Error: </span>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* ── Candidate Proctoring Disclosure & Creator Transmission Notice ── */}
        <div className="p-4 rounded-2xl bg-slate-950/80 border border-amber-500/30 text-xs space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-semibold text-amber-300">
              <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Mandatory Proctoring Disclosure</span>
            </div>
            {proctorSettings?.liveNotifications && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/40 text-rose-300 text-[10px] font-semibold uppercase tracking-wider animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                Live Creator Alerts
              </span>
            )}
          </div>
          <p className="text-slate-300 leading-relaxed text-[11px]">
            Please be advised that your webcam and environment are continuously analyzed for test integrity. Any detected infractions (leaving camera view, presence of multiple individuals, loud noises, or tab switching) are automatically recorded with <strong>webcam snapshots</strong> and transmitted directly to the <strong>test creator</strong>.
          </p>
          {proctorSettings?.liveNotifications && (
            <div className="p-2 rounded-xl bg-rose-950/30 border border-rose-900/50 text-[11px] text-rose-200 flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
              <span>
                <strong>Real-Time Notice:</strong> The examiner has enabled live notifications. Violation alerts and captured images will be sent to the examiner immediately as they occur during your test.
              </span>
            </div>
          )}
        </div>

        {/* ── Action Buttons ─────────────────────────────────────────────── */}
        <div className="space-y-3 pt-2">
          {permissionState === 'granted' ? (
            <button
              onClick={handleBeginExam}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer"
            >
              <Maximize className="w-4 h-4" />
              <span>Enter Fullscreen & Begin Examination</span>
            </button>
          ) : (
            <button
              onClick={handleRequestPermissions}
              disabled={permissionState === 'requesting'}
              className={`w-full py-3.5 px-6 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer ${
                permissionState === 'denied'
                  ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/20'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25'
              }`}
            >
              {permissionState === 'requesting' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Waiting for browser approval...</span>
                </>
              ) : permissionState === 'denied' ? (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>Retry Permissions</span>
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4" />
                  <span>Grant Camera & Microphone Access</span>
                </>
              )}
            </button>
          )}

          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Edge AI processing — no raw video is streamed to server</span>
            </span>
            <button
              onClick={onCancel}
              className="text-slate-400 hover:text-slate-200 underline underline-offset-2 transition-colors cursor-pointer"
            >
              Cancel & Return
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
