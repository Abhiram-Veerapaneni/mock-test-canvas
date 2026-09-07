import { useEffect, useRef, useState, useCallback } from 'react';
import { FaceDetector, FilesetResolver } from '@mediapipe/tasks-vision';

/**
 * useVisionProctor
 *
 * MediaPipe-powered face detection hook that monitors a <video> element
 * for absence (0 faces) and extra persons (>1 face).
 *
 * Detection runs once every second using requestAnimationFrame + timestamp gating.
 * - NO_FACE requires 7 continuous seconds of absence to escalate (prevents false alerts when looking at notes/keyboard).
 * - MULTI_FACE requires 4 continuous seconds of multiple faces to escalate.
 *
 * @param {Object}   options
 * @param {React.RefObject<HTMLVideoElement>} options.videoRef  Ref to the live <video> element
 * @param {boolean}  options.active      Whether detection should be running
 * @param {function} options.onViolation Called with 'NO_FACE' or 'MULTI_FACE' on confirmed violation
 * @returns {{ alertState: string|null, isModelLoaded: boolean, detectedFaces: number }}
 */
export default function useVisionProctor({ videoRef, active, onViolation }) {
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [alertState, setAlertState] = useState(null);       // 'NO_FACE' | 'MULTI_FACE' | null
  const [detectedFaces, setDetectedFaces] = useState(0);

  const detectorRef = useRef(null);
  const animFrameRef = useRef(null);
  const lastDetectTimeRef = useRef(0);
  const onViolationRef = useRef(onViolation);

  // Debounce tracking: when a violation alert first appeared
  const violationStartRef = useRef(null);   // { type: string, startTime: number } | null
  const firedAlertsRef = useRef(new Set()); // track which alerts already fired in this streak

  const DETECT_INTERVAL_MS = 1000;         // run inference every 1 second
  const NO_FACE_DEBOUNCE_MS = 7000;        // 7s absence debounce (prevents false positives)
  const MULTI_FACE_DEBOUNCE_MS = 4000;     // 4s multi-face debounce

  // Keep onViolation ref fresh
  useEffect(() => { onViolationRef.current = onViolation; }, [onViolation]);

  // ── Initialize MediaPipe FaceDetector ──────────────────────────────────────
  useEffect(() => {
    if (!active) return;

    let cancelled = false;

    const initDetector = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm'
        );

        if (cancelled) return;

        let detector = null;
        const modelUrl = 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite';

        // Attempt GPU acceleration first; fallback gracefully to CPU
        try {
          detector = await FaceDetector.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: modelUrl,
              delegate: 'GPU',
            },
            runningMode: 'VIDEO',
            minDetectionConfidence: 0.28,
          });
          console.log('[VisionProctor] MediaPipe FaceDetector initialized with GPU delegate');
        } catch (gpuErr) {
          console.warn('[VisionProctor] GPU delegate init failed, falling back to CPU:', gpuErr?.message);
          detector = await FaceDetector.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: modelUrl,
              delegate: 'CPU',
            },
            runningMode: 'VIDEO',
            minDetectionConfidence: 0.28,
          });
          console.log('[VisionProctor] MediaPipe FaceDetector initialized with CPU delegate');
        }

        if (cancelled) {
          detector?.close();
          return;
        }

        detectorRef.current = detector;
        setIsModelLoaded(true);
      } catch (err) {
        console.error('[VisionProctor] Failed to initialize FaceDetector:', err);
      }
    };

    initDetector();

    return () => {
      cancelled = true;
      if (detectorRef.current) {
        try {
          detectorRef.current.close();
        } catch (e) {}
        detectorRef.current = null;
      }
      setIsModelLoaded(false);
    };
  }, [active]);

  // ── Detection loop ────────────────────────────────────────────────────────
  const runDetection = useCallback(() => {
    if (!active || !detectorRef.current || !videoRef?.current) {
      animFrameRef.current = requestAnimationFrame(runDetection);
      return;
    }

    const video = videoRef.current;

    // Ensure video is playing
    if (video.paused && video.readyState >= 2) {
      video.play().catch(() => {});
    }

    // Only run if the video has valid dimensions and is ready
    if (video.readyState < 2 || video.videoWidth === 0 || video.videoHeight === 0) {
      animFrameRef.current = requestAnimationFrame(runDetection);
      return;
    }

    const now = performance.now();

    // Gate: only detect every DETECT_INTERVAL_MS
    if (now - lastDetectTimeRef.current >= DETECT_INTERVAL_MS) {
      // Ensure strictly monotonically increasing timestamp for MediaPipe VIDEO mode
      const detectionTimestamp = Math.max(now, lastDetectTimeRef.current + 1);
      lastDetectTimeRef.current = detectionTimestamp;

      try {
        const result = detectorRef.current.detectForVideo(video, detectionTimestamp);
        const faceCount = result?.detections?.length ?? 0;
        setDetectedFaces(faceCount);

        // Determine current alert state
        let currentAlert = null;
        if (faceCount === 0) currentAlert = 'NO_FACE';
        else if (faceCount > 1) currentAlert = 'MULTI_FACE';

        setAlertState(currentAlert);

        // ── Debounce logic ──────────────────────────────────────────────
        if (currentAlert) {
          const wallNow = Date.now();
          const debounceLimit = currentAlert === 'NO_FACE' ? NO_FACE_DEBOUNCE_MS : MULTI_FACE_DEBOUNCE_MS;

          if (
            violationStartRef.current &&
            violationStartRef.current.type === currentAlert
          ) {
            // Same alert persists — check if debounce threshold exceeded
            const elapsed = wallNow - violationStartRef.current.startTime;
            if (elapsed >= debounceLimit && !firedAlertsRef.current.has(currentAlert)) {
              // Escalate: fire the violation callback
              firedAlertsRef.current.add(currentAlert);
              onViolationRef.current?.(currentAlert);
              console.warn(
                `[VisionProctor] ${currentAlert} persisted for ${(elapsed / 1000).toFixed(1)}s — violation escalated`
              );
            }
          } else {
            // New alert — start tracking
            violationStartRef.current = { type: currentAlert, startTime: wallNow };
            firedAlertsRef.current.clear();
          }
        } else {
          // All clear — face present and single
          violationStartRef.current = null;
          firedAlertsRef.current.clear();
        }
      } catch (err) {
        console.warn('[VisionProctor] Detection error (skipped):', err?.message);
      }
    }

    animFrameRef.current = requestAnimationFrame(runDetection);
  }, [active, videoRef]);

  // Start/stop the detection loop
  useEffect(() => {
    if (!active || !isModelLoaded) return;

    lastDetectTimeRef.current = 0;
    animFrameRef.current = requestAnimationFrame(runDetection);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      // Reset state on deactivation
      setAlertState(null);
      setDetectedFaces(0);
      violationStartRef.current = null;
      firedAlertsRef.current.clear();
    };
  }, [active, isModelLoaded, runDetection]);

  return { alertState, isModelLoaded, detectedFaces };
}
