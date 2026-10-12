import React, { useEffect, useRef, useState, useCallback } from 'react';
import useVisionProctor from '../../hooks/useVisionProctor';
import useAudioProctor from '../../hooks/useAudioProctor';
import api from '../../services/api';
import {
  Camera, CameraOff, Volume2, VolumeX, Eye, EyeOff,
  Users, AlertTriangle, Loader2, Mic, MicOff,
  Smartphone, BookOpen
} from 'lucide-react';

/**
 * CameraMonitor
 *
 * Manages camera/microphone access, renders a small docked video preview,
 * and orchestrates the vision + audio proctoring hooks.
 *
 * Respects exam.proctorSettings to conditionally enable face/audio checks.
 *
 * @param {Object}      props
 * @param {boolean}     props.active           Whether proctoring should be active
 * @param {Object}      props.proctorSettings  From exam.proctorSettings
 * @param {function}    props.onViolation      Called with violation type string
 * @param {string}      props.attemptId        Active attempt ID for server-side logging
 * @param {MediaStream} [props.mediaStream]    Pre-acquired MediaStream from ProctoringCheckGate
 */
export default function CameraMonitor({
  active,
  proctorSettings,
  onViolation,
  attemptId,
  mediaStream: externalStream,
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(externalStream || null);
  const [permissionStatus, setPermissionStatus] = useState(externalStream ? 'granted' : 'pending'); // 'pending' | 'granted' | 'denied' | 'error' | 'lost'

  // Rate-limit uploads: max 1 per 10 seconds per violation type
  const lastUploadTimeRef = useRef({});
  const UPLOAD_COOLDOWN_MS = 10_000;
  const [audioStream, setAudioStream] = useState(externalStream || null);
  const internalStreamRef = useRef(null);
  const isMountedRef = useRef(true);
  const activeRef = useRef(active);
  const hadExternalStreamRef = useRef(Boolean(externalStream));

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  const faceCheckEnabled = proctorSettings?.faceCheck !== false;
  const audioCheckEnabled = proctorSettings?.audioCheck !== false;

  // ── Setup MediaStream (from externalStream or requested locally) ─────────────
  const setupStream = useCallback((mediaStream, isInternal = false) => {
    if (!isMountedRef.current) {
      if (isInternal) {
        mediaStream.getTracks().forEach((t) => {
          try { t.stop(); } catch (e) {}
        });
      }
      return;
    }

    if (isInternal) {
      internalStreamRef.current = mediaStream;
    }
    setStream(mediaStream);
    setAudioStream(mediaStream);
    setPermissionStatus('granted');

    if (videoRef.current && faceCheckEnabled) {
      const video = videoRef.current;
      video.muted = true;
      video.playsInline = true;
      if (video.srcObject !== mediaStream) {
        video.srcObject = mediaStream;
      }
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('[CameraMonitor] play error:', err?.message);
        });
      }
    }

    // Monitor for track disconnections
    mediaStream.getTracks().forEach((track) => {
      track.onended = () => {
        console.warn(`[CameraMonitor] ${track.kind} track ended`);
        if (activeRef.current && isMountedRef.current) {
          setPermissionStatus('lost');
        }
      };
      track.onmute = () => {
        console.warn(`[CameraMonitor] ${track.kind} track muted`);
      };
    });
  }, [faceCheckEnabled]);

  const requestMedia = useCallback(async () => {
    // If externalStream was provided, parent controls stream lifecycle — never run rogue fallback
    if (hadExternalStreamRef.current || !activeRef.current || !isMountedRef.current) {
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setPermissionStatus('error');
      return;
    }
    setPermissionStatus('pending');
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: faceCheckEnabled ? { facingMode: 'user', width: 320, height: 240 } : false,
        audio: audioCheckEnabled,
      });

      // If unmounted or deactivated while awaiting getUserMedia, release hardware tracks immediately!
      if (!isMountedRef.current || !activeRef.current) {
        mediaStream.getTracks().forEach((t) => {
          try { t.stop(); } catch (e) {}
        });
        return;
      }

      setupStream(mediaStream, true);
      console.log('[CameraMonitor] Media access granted via fallback request');
    } catch (err) {
      if (!isMountedRef.current) return;
      if (err.name === 'NotAllowedError') {
        setPermissionStatus('denied');
        console.warn('[CameraMonitor] Camera/mic permission denied by user');
      } else if (err.name === 'NotFoundError') {
        setPermissionStatus('error');
        console.warn('[CameraMonitor] Camera/mic not found on device');
      } else {
        setPermissionStatus('error');
        console.error('[CameraMonitor] getUserMedia error:', err);
      }
    }
  }, [faceCheckEnabled, audioCheckEnabled, setupStream]);

  // Handle externalStream changes or fallback request
  useEffect(() => {
    if (externalStream) {
      hadExternalStreamRef.current = true;
      setupStream(externalStream, false);
    } else if (active && !hadExternalStreamRef.current) {
      requestMedia();
    }
  }, [externalStream, active, setupStream, requestMedia]);

  // Ensure video element gets srcObject and actually plays
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream || !faceCheckEnabled) return;

    video.muted = true;
    video.playsInline = true;

    if (video.srcObject !== stream) {
      video.srcObject = stream;
    }

    const tryPlay = () => {
      if (videoRef.current) {
        videoRef.current.muted = true;
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn('[CameraMonitor] video.play() note:', err?.message);
          });
        }
      }
    };

    video.addEventListener('loadedmetadata', tryPlay);
    video.addEventListener('canplay', tryPlay);
    tryPlay();

    return () => {
      video.removeEventListener('loadedmetadata', tryPlay);
      video.removeEventListener('canplay', tryPlay);
    };
  }, [stream, faceCheckEnabled]);

  // Clean up ONLY internal streams that CameraMonitor created itself (NEVER parent's externalStream)
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (internalStreamRef.current) {
        internalStreamRef.current.getTracks().forEach((t) => {
          try { t.stop(); } catch (e) {}
        });
        internalStreamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  // Clean up internal streams if active toggles to false
  useEffect(() => {
    if (!active) {
      if (internalStreamRef.current) {
        internalStreamRef.current.getTracks().forEach((t) => {
          try { t.stop(); } catch (e) {}
        });
        internalStreamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
  }, [active]);

  // ── Snapshot capture ────────────────────────────────────────────────────────
  const captureSnapshot = useCallback(() => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0) return null;

    if (!canvasRef.current) {
      canvasRef.current = document.createElement('canvas');
    }
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => resolve(blob),
        'image/jpeg',
        0.7
      );
    });
  }, []);

  // ── Violation handler: wraps onViolation with snapshot capture + API upload ─
  const handleViolationWithSnapshot = useCallback(async (type) => {
    // Always fire the local violation callback immediately
    onViolation?.(type);

    // Rate-limit server uploads
    const now = Date.now();
    const lastTime = lastUploadTimeRef.current[type] || 0;
    if (now - lastTime < UPLOAD_COOLDOWN_MS) return;
    lastUploadTimeRef.current[type] = now;

    // Only upload if we have an active attempt
    if (!attemptId) return;

    try {
      const formData = new FormData();
      formData.append('type', type);

      // Capture snapshot from video (only if face check is enabled and video is active)
      if (faceCheckEnabled && videoRef.current) {
        const blob = await captureSnapshot();
        if (blob) {
          formData.append('snapshot', blob, `violation_${type}_${Date.now()}.jpg`);
        }
      }

      await api.post(`/submissions/${attemptId}/violation`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 10000,
      });
    } catch (err) {
      // Don't disrupt the exam if upload fails — violation is already logged locally
      console.warn('[CameraMonitor] Violation upload failed:', err.message);
    }
  }, [onViolation, attemptId, faceCheckEnabled, captureSnapshot]);

  // ── Vision proctoring (face & object detection) ───────────────────────────
  const { alertState, objectAlert, isModelLoaded, detectedFaces } = useVisionProctor({
    videoRef,
    active: active && faceCheckEnabled && permissionStatus === 'granted',
    objectCheckEnabled: proctorSettings?.objectCheck !== false,
    onViolation: handleViolationWithSnapshot,
  });

  // ── Audio proctoring (noise detection) ────────────────────────────────────
  const { currentRMS, baselineRMS, isCalibrating, isNoiseAlert } = useAudioProctor({
    audioStream,
    active: active && audioCheckEnabled && permissionStatus === 'granted',
    onViolation: handleViolationWithSnapshot,
  });

  // ── Don't render if neither check is enabled ──────────────────────────────
  if (!faceCheckEnabled && !audioCheckEnabled) return null;

  // ── Alert indicator color ─────────────────────────────────────────────────
  const getAlertColor = () => {
    if (objectAlert === 'CELL_PHONE' || objectAlert === 'PROHIBITED_OBJECT') return '#ef4444'; // red
    if (objectAlert === 'PROHIBITED_BOOK') return '#f97316'; // orange
    if (alertState === 'MULTI_FACE') return '#ef4444'; // red
    if (alertState === 'NO_FACE') return '#f59e0b';    // amber
    if (isNoiseAlert) return '#f97316';                 // orange
    return '#22c55e';                                    // green (all clear)
  };

  const getAlertIcon = () => {
    if (objectAlert === 'CELL_PHONE') return <Smartphone size={12} />;
    if (objectAlert === 'PROHIBITED_BOOK') return <BookOpen size={12} />;
    if (objectAlert === 'PROHIBITED_OBJECT') return <AlertTriangle size={12} />;
    if (alertState === 'MULTI_FACE') return <Users size={12} />;
    if (alertState === 'NO_FACE') return <EyeOff size={12} />;
    if (isNoiseAlert) return <Volume2 size={12} />;
    return <Eye size={12} />;
  };

  const getAlertText = () => {
    if (objectAlert === 'CELL_PHONE') return 'Phone detected!';
    if (objectAlert === 'PROHIBITED_BOOK') return 'Book detected!';
    if (objectAlert === 'PROHIBITED_OBJECT') return 'Prohibited device!';
    if (alertState === 'MULTI_FACE') return 'Multiple faces';
    if (alertState === 'NO_FACE') return 'No face detected';
    if (isNoiseAlert) return 'Noise detected';
    if (isCalibrating && audioCheckEnabled) return 'Calibrating mic...';
    if (!isModelLoaded && faceCheckEnabled) return 'Loading model...';
    if (detectedFaces === 1) return 'Face detected';
    return 'Monitoring';
  };

  return (
    <div className="fixed bottom-4 right-4 z-[9990] flex flex-col items-end gap-1.5 pointer-events-none">
      {/* Video preview */}
      {faceCheckEnabled && (
        <div
          className={`w-36 h-28 rounded-md overflow-hidden border shadow-sm bg-zinc-950 pointer-events-auto transition-colors ${
            alertState === 'MULTI_FACE' || objectAlert
              ? 'border-rose-500'
              : alertState === 'NO_FACE' || isNoiseAlert
              ? 'border-amber-500'
              : 'border-zinc-800'
          }`}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover -scale-x-100"
            style={{
              display: permissionStatus === 'granted' ? 'block' : 'none',
            }}
          />

          {permissionStatus === 'pending' && (
            <div className="w-full h-full flex items-center justify-center text-zinc-400">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          )}

          {permissionStatus !== 'granted' && permissionStatus !== 'pending' && (
            <div className="w-full h-full flex flex-col items-center justify-center text-rose-500 gap-1 p-2 text-center text-[10px]">
              <CameraOff className="w-4 h-4" />
              <span>{permissionStatus === 'denied' ? 'Permission denied' : permissionStatus === 'lost' ? 'Feed lost' : 'Camera error'}</span>
              <button
                onClick={requestMedia}
                className="mt-0.5 px-2 py-0.5 rounded bg-rose-600 text-white text-[9px] font-medium cursor-pointer"
              >
                Reconnect
              </button>
            </div>
          )}
        </div>
      )}

      {/* Status indicator */}
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900/95 backdrop-blur-xs border border-zinc-800 text-zinc-200 text-xs font-medium pointer-events-auto shadow-sm">
        {/* Status dot */}
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
            alertState === 'MULTI_FACE' || objectAlert
              ? 'bg-rose-500'
              : alertState === 'NO_FACE' || isNoiseAlert
              ? 'bg-amber-500'
              : 'bg-emerald-500'
          }`}
        />
        {getAlertIcon()}
        <span className="text-[11px]">{getAlertText()}</span>

        {/* Audio level indicator */}
        {audioCheckEnabled && permissionStatus === 'granted' && (
          <div className="flex items-center gap-1.5 ml-1 border-l border-zinc-700/80 pl-1.5">
            {isNoiseAlert ? <Volume2 className="w-3 h-3 text-rose-400" /> : <Mic className="w-3 h-3 text-zinc-400" />}
            <div className="w-6 h-1 rounded-sm bg-zinc-800 overflow-hidden">
              <div
                className={`h-full transition-all duration-150 rounded-sm ${
                  isNoiseAlert ? 'bg-rose-500' : currentRMS > 40 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(6, currentRMS))}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Default threshold multiplier used in the audio level bar
const thresholdMultiplier = 2.5;
