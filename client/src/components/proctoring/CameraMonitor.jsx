import React, { useEffect, useRef, useState, useCallback } from 'react';
import useVisionProctor from '../../hooks/useVisionProctor';
import useAudioProctor from '../../hooks/useAudioProctor';
import api from '../../services/api';
import {
  Camera, CameraOff, Volume2, VolumeX, Eye, EyeOff,
  Users, AlertTriangle, Loader2, Mic, MicOff,
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

  const faceCheckEnabled = proctorSettings?.faceCheck !== false;
  const audioCheckEnabled = proctorSettings?.audioCheck !== false;

  // ── Setup MediaStream (from externalStream or requested locally) ─────────────
  const setupStream = useCallback((mediaStream, isInternal = false) => {
    if (isInternal) {
      internalStreamRef.current = mediaStream;
    }
    setStream(mediaStream);
    setAudioStream(mediaStream);
    setPermissionStatus('granted');

    if (videoRef.current && faceCheckEnabled) {
      if (videoRef.current.srcObject !== mediaStream) {
        videoRef.current.srcObject = mediaStream;
      }
      videoRef.current.play().catch(() => {});
    }

    // Monitor for track disconnections
    mediaStream.getTracks().forEach((track) => {
      track.onended = () => {
        console.warn(`[CameraMonitor] ${track.kind} track ended`);
        setPermissionStatus('lost');
      };
      track.onmute = () => {
        console.warn(`[CameraMonitor] ${track.kind} track muted`);
      };
    });
  }, [faceCheckEnabled]);

  const requestMedia = useCallback(async () => {
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
      setupStream(mediaStream, true);
      console.log('[CameraMonitor] Media access granted via fallback request');
    } catch (err) {
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
      setupStream(externalStream, false);
    } else if (active) {
      requestMedia();
    }
  }, [externalStream, active, setupStream, requestMedia]);

  // Ensure video element gets srcObject and actually plays
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !stream || !faceCheckEnabled) return;

    if (video.srcObject !== stream) {
      video.srcObject = stream;
    }

    const tryPlay = () => {
      video.play().catch((err) => {
        console.warn('[CameraMonitor] video.play() note:', err?.message);
      });
    };

    video.addEventListener('loadedmetadata', tryPlay);
    tryPlay();

    return () => {
      video.removeEventListener('loadedmetadata', tryPlay);
    };
  }, [stream, faceCheckEnabled]);

  // Clean up only streams that CameraMonitor created internally (never externalStream)
  useEffect(() => {
    return () => {
      if (internalStreamRef.current) {
        internalStreamRef.current.getTracks().forEach((t) => t.stop());
        internalStreamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!active && internalStreamRef.current) {
      internalStreamRef.current.getTracks().forEach((t) => t.stop());
      internalStreamRef.current = null;
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

  // ── Vision proctoring (face detection) ────────────────────────────────────
  const { alertState, isModelLoaded, detectedFaces } = useVisionProctor({
    videoRef,
    active: active && faceCheckEnabled && permissionStatus === 'granted',
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
    if (alertState === 'MULTI_FACE') return '#ef4444'; // red
    if (alertState === 'NO_FACE') return '#f59e0b';    // amber
    if (isNoiseAlert) return '#f97316';                 // orange
    return '#22c55e';                                    // green (all clear)
  };

  const getAlertIcon = () => {
    if (alertState === 'MULTI_FACE') return <Users size={12} />;
    if (alertState === 'NO_FACE') return <EyeOff size={12} />;
    if (isNoiseAlert) return <Volume2 size={12} />;
    return <Eye size={12} />;
  };

  const getAlertText = () => {
    if (alertState === 'MULTI_FACE') return 'Multiple faces';
    if (alertState === 'NO_FACE') return 'No face detected';
    if (isNoiseAlert) return 'Noise detected';
    if (isCalibrating && audioCheckEnabled) return 'Calibrating mic...';
    if (!isModelLoaded && faceCheckEnabled) return 'Loading model...';
    if (detectedFaces === 1) return 'Face detected';
    return 'Monitoring';
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '16px',
        right: '16px',
        zIndex: 9990,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '6px',
        pointerEvents: 'none',
      }}
    >
      {/* Video preview */}
      {faceCheckEnabled && (
        <div
          style={{
            width: '140px',
            height: '105px',
            borderRadius: '10px',
            overflow: 'hidden',
            border: `2px solid ${getAlertColor()}`,
            boxShadow: `0 0 12px ${getAlertColor()}40, 0 4px 20px rgba(0,0,0,0.4)`,
            background: '#0a0a0a',
            transition: 'border-color 0.3s, box-shadow 0.3s',
            pointerEvents: 'auto',
          }}
        >
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              display: permissionStatus === 'granted' ? 'block' : 'none',
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: 'scaleX(-1)', // mirror
            }}
          />

          {permissionStatus === 'pending' && (
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#6b7280',
            }}>
              <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
            </div>
          )}

          {permissionStatus !== 'granted' && permissionStatus !== 'pending' && (
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              color: '#ef4444', gap: '2px', padding: '6px',
              textAlign: 'center', fontSize: '10px',
            }}>
              <CameraOff size={16} />
              <span>{permissionStatus === 'denied' ? 'Permission denied' : permissionStatus === 'lost' ? 'Feed lost' : 'Camera error'}</span>
              <button
                onClick={requestMedia}
                style={{
                  marginTop: '2px',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: '#ef4444',
                  color: '#ffffff',
                  fontSize: '9px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Reconnect
              </button>
            </div>
          )}
        </div>
      )}

      {/* Status pill */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          borderRadius: '20px',
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(8px)',
          border: `1px solid ${getAlertColor()}60`,
          color: getAlertColor(),
          fontSize: '11px',
          fontWeight: 600,
          fontFamily: "'Inter', system-ui, sans-serif",
          letterSpacing: '0.02em',
          transition: 'all 0.3s',
          pointerEvents: 'auto',
        }}
      >
        {/* Pulsing dot */}
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: getAlertColor(),
            animation: (alertState || isNoiseAlert)
              ? 'pulse-dot 1s ease-in-out infinite'
              : 'none',
            flexShrink: 0,
          }}
        />
        {getAlertIcon()}
        <span>{getAlertText()}</span>

        {/* Audio level indicator */}
        {audioCheckEnabled && permissionStatus === 'granted' && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '3px', marginLeft: '4px',
            borderLeft: '1px solid rgba(255,255,255,0.15)', paddingLeft: '6px',
          }}>
            {isNoiseAlert ? <Volume2 size={10} /> : <Mic size={10} style={{ opacity: 0.7 }} />}
            <div style={{
              width: '26px', height: '4px', borderRadius: '2px',
              background: 'rgba(255,255,255,0.15)', overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${Math.min(100, Math.max(6, currentRMS))}%`,
                background: isNoiseAlert ? '#ef4444' : currentRMS > 40 ? '#f59e0b' : '#22c55e',
                borderRadius: '2px',
                transition: 'width 0.15s ease-out',
              }} />
            </div>
          </div>
        )}
      </div>

      {/* CSS animation for pulsing dot */}
      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.5); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// Default threshold multiplier used in the audio level bar
const thresholdMultiplier = 2.5;
