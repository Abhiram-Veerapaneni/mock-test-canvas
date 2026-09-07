import { useEffect, useRef, useState, useCallback } from 'react';
import { FaceDetector, ObjectDetector, FilesetResolver } from '@mediapipe/tasks-vision';

/**
 * useVisionProctor
 *
 * MediaPipe-powered vision proctoring hook that monitors a <video> element for:
 *  1. Candidate absence (0 faces)
 *  2. Multiple persons (>1 face)
 *  3. Prohibited objects (cell phones, books, secondary laptops)
 *
 * Latency: Debounced to fire alerts in 1.0 - 1.5 seconds.
 *
 * @param {Object}   options
 * @param {React.RefObject<HTMLVideoElement>} options.videoRef           Ref to live <video> element
 * @param {boolean}  options.active                                     Whether detection is running
 * @param {boolean}  [options.objectCheckEnabled=true]                  Whether object detection is active
 * @param {function} options.onViolation                                Called with violation type
 * @returns {{ alertState: string|null, objectAlert: string|null, isModelLoaded: boolean, detectedFaces: number, detectedObjects: Array }}
 */
export default function useVisionProctor({
  videoRef,
  active,
  objectCheckEnabled = true,
  onViolation,
}) {
  const [isModelLoaded, setIsModelLoaded] = useState(false);
  const [alertState, setAlertState] = useState(null);           // 'NO_FACE' | 'MULTI_FACE' | null
  const [objectAlert, setObjectAlert] = useState(null);         // 'CELL_PHONE' | 'PROHIBITED_BOOK' | null
  const [detectedFaces, setDetectedFaces] = useState(0);
  const [detectedObjects, setDetectedObjects] = useState([]);

  const detectorRef = useRef(null);
  const objectDetectorRef = useRef(null);
  const animFrameRef = useRef(null);
  const lastDetectTimeRef = useRef(0);
  const onViolationRef = useRef(onViolation);

  // Debounce tracking
  const violationStartRef = useRef(null);       // { type: string, startTime: number } | null
  const objectViolationStartRef = useRef(null); // { type: string, startTime: number } | null
  const firedAlertsRef = useRef(new Set());     // track which alerts already fired in this streak

  // ── Ultra-responsive Debounce Timing (1.0 - 1.5 seconds) ───────────────────
  const DETECT_INTERVAL_MS = 350;              // Run inference every 350ms (~3 fps)
  const NO_FACE_DEBOUNCE_MS = 1200;            // 1.2s absence debounce (fires in 1.2 - 1.5s)
  const MULTI_FACE_DEBOUNCE_MS = 1000;         // 1.0s multi-face debounce (fires in 1.0 - 1.3s)
  const OBJECT_DEBOUNCE_MS = 1000;             // 1.0s prohibited object debounce (fires in 1.0 - 1.3s)

  // Keep onViolation ref fresh
  useEffect(() => { onViolationRef.current = onViolation; }, [onViolation]);

  // ── Initialize MediaPipe FaceDetector & ObjectDetector ─────────────────────
  useEffect(() => {
    if (!active) return;

    let cancelled = false;

    const initDetectors = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm'
        );

        if (cancelled) return;

        // 1. Initialize Face Detector
        const faceModelUrl = 'https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite';
        let faceDetector = null;
        try {
          faceDetector = await FaceDetector.createFromOptions(vision, {
            baseOptions: { modelAssetPath: faceModelUrl, delegate: 'GPU' },
            runningMode: 'VIDEO',
            minDetectionConfidence: 0.28,
          });
          console.log('[VisionProctor] FaceDetector initialized (GPU)');
        } catch (gpuErr) {
          faceDetector = await FaceDetector.createFromOptions(vision, {
            baseOptions: { modelAssetPath: faceModelUrl, delegate: 'CPU' },
            runningMode: 'VIDEO',
            minDetectionConfidence: 0.28,
          });
          console.log('[VisionProctor] FaceDetector initialized (CPU)');
        }

        if (cancelled) {
          faceDetector?.close();
          return;
        }
        detectorRef.current = faceDetector;

        // 2. Initialize Object Detector (for cell phone, books, devices)
        if (objectCheckEnabled) {
          const objectModelUrl = 'https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite';
          let objectDetector = null;
          try {
            objectDetector = await ObjectDetector.createFromOptions(vision, {
              baseOptions: { modelAssetPath: objectModelUrl, delegate: 'GPU' },
              runningMode: 'VIDEO',
              scoreThreshold: 0.35,
            });
            console.log('[VisionProctor] ObjectDetector initialized (GPU)');
          } catch (objGpuErr) {
            try {
              objectDetector = await ObjectDetector.createFromOptions(vision, {
                baseOptions: { modelAssetPath: objectModelUrl, delegate: 'CPU' },
                runningMode: 'VIDEO',
                scoreThreshold: 0.35,
              });
              console.log('[VisionProctor] ObjectDetector initialized (CPU)');
            } catch (objErr) {
              console.warn('[VisionProctor] ObjectDetector fallback note:', objErr?.message);
            }
          }

          if (cancelled) {
            objectDetector?.close();
            return;
          }
          objectDetectorRef.current = objectDetector;
        }

        setIsModelLoaded(true);
      } catch (err) {
        console.error('[VisionProctor] Failed to initialize vision detectors:', err);
      }
    };

    initDetectors();

    return () => {
      cancelled = true;
      if (detectorRef.current) {
        try { detectorRef.current.close(); } catch (e) {}
        detectorRef.current = null;
      }
      if (objectDetectorRef.current) {
        try { objectDetectorRef.current.close(); } catch (e) {}
        objectDetectorRef.current = null;
      }
      setIsModelLoaded(false);
    };
  }, [active, objectCheckEnabled]);

  // ── Detection loop ────────────────────────────────────────────────────────
  const runDetection = useCallback(() => {
    if (!active) return;

    if (!detectorRef.current || !videoRef?.current) {
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

    // Gate: detect every DETECT_INTERVAL_MS (350ms)
    if (now - lastDetectTimeRef.current >= DETECT_INTERVAL_MS) {
      const detectionTimestamp = Math.max(now, lastDetectTimeRef.current + 1);
      lastDetectTimeRef.current = detectionTimestamp;

      try {
        // ── 1. Face Detection ───────────────────────────────────────────────
        const faceResult = detectorRef.current.detectForVideo(video, detectionTimestamp);
        const faceCount = faceResult?.detections?.length ?? 0;
        setDetectedFaces(faceCount);

        let currentFaceAlert = null;
        if (faceCount === 0) currentFaceAlert = 'NO_FACE';
        else if (faceCount > 1) currentFaceAlert = 'MULTI_FACE';

        setAlertState(currentFaceAlert);

        // Face Debounce Logic (1.0 - 1.5s)
        const wallNow = Date.now();
        if (currentFaceAlert) {
          const debounceLimit = currentFaceAlert === 'NO_FACE' ? NO_FACE_DEBOUNCE_MS : MULTI_FACE_DEBOUNCE_MS;

          if (violationStartRef.current && violationStartRef.current.type === currentFaceAlert) {
            const elapsed = wallNow - violationStartRef.current.startTime;
            if (elapsed >= debounceLimit && !firedAlertsRef.current.has(currentFaceAlert)) {
              firedAlertsRef.current.add(currentFaceAlert);
              onViolationRef.current?.(currentFaceAlert);
              console.warn(`[VisionProctor] ${currentFaceAlert} escalated in ${(elapsed / 1000).toFixed(1)}s`);
            }
          } else {
            violationStartRef.current = { type: currentFaceAlert, startTime: wallNow };
          }
        } else {
          violationStartRef.current = null;
          firedAlertsRef.current.delete('NO_FACE');
          firedAlertsRef.current.delete('MULTI_FACE');
        }

        // ── 2. Object Detection (Cell phones, books, devices) ───────────────
        if (objectDetectorRef.current && objectCheckEnabled) {
          const objResult = objectDetectorRef.current.detectForVideo(video, detectionTimestamp);
          const detections = objResult?.detections || [];
          const foundLabels = [];

          let detectedProhibitedType = null;

          for (const det of detections) {
            for (const cat of det.categories || []) {
              const name = (cat.categoryName || '').toLowerCase().trim();
              foundLabels.push({ name, score: cat.score });

              if (cat.score >= 0.35) {
                if (name.includes('cell phone') || name.includes('mobile phone') || name === 'phone') {
                  detectedProhibitedType = 'CELL_PHONE';
                  break;
                } else if (name === 'book') {
                  detectedProhibitedType = 'PROHIBITED_BOOK';
                  break;
                } else if (name === 'laptop') {
                  detectedProhibitedType = 'PROHIBITED_OBJECT';
                  break;
                }
              }
            }
            if (detectedProhibitedType) break;
          }

          setDetectedObjects(foundLabels);
          setObjectAlert(detectedProhibitedType);

          // Object Debounce Logic (1.0 - 1.3s)
          if (detectedProhibitedType) {
            if (objectViolationStartRef.current && objectViolationStartRef.current.type === detectedProhibitedType) {
              const objElapsed = wallNow - objectViolationStartRef.current.startTime;
              if (objElapsed >= OBJECT_DEBOUNCE_MS && !firedAlertsRef.current.has(detectedProhibitedType)) {
                firedAlertsRef.current.add(detectedProhibitedType);
                onViolationRef.current?.(detectedProhibitedType);
                console.warn(`[VisionProctor] Prohibited object ${detectedProhibitedType} escalated in ${(objElapsed / 1000).toFixed(1)}s`);
              }
            } else {
              objectViolationStartRef.current = { type: detectedProhibitedType, startTime: wallNow };
            }
          } else {
            objectViolationStartRef.current = null;
            firedAlertsRef.current.delete('CELL_PHONE');
            firedAlertsRef.current.delete('PROHIBITED_BOOK');
            firedAlertsRef.current.delete('PROHIBITED_OBJECT');
          }
        }
      } catch (err) {
        console.warn('[VisionProctor] Detection tick note:', err?.message);
      }
    }

    animFrameRef.current = requestAnimationFrame(runDetection);
  }, [active, objectCheckEnabled, videoRef]);

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
      setAlertState(null);
      setObjectAlert(null);
      setDetectedFaces(0);
      setDetectedObjects([]);
      violationStartRef.current = null;
      objectViolationStartRef.current = null;
      firedAlertsRef.current.clear();
    };
  }, [active, isModelLoaded, runDetection]);

  return { alertState, objectAlert, isModelLoaded, detectedFaces, detectedObjects };
}

