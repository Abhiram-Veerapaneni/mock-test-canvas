import { useEffect, useRef, useState } from 'react';

/**
 * useAudioProctor
 *
 * Web Audio API hook that monitors microphone input for ambient noise spikes.
 *
 * Uses Time-Domain Acoustic RMS analysis with AudioContext resume handling.
 * - Samples live acoustic levels every 100ms for a real-time UI level visualizer.
 * - Auto-calibrates ambient room noise over the first 2 seconds.
 * - If volume exceeds baseline threshold for 3+ consecutive seconds, fires onViolation('NOISE_SPIKE').
 *
 * @param {Object}       options
 * @param {MediaStream}  options.audioStream  Microphone MediaStream from getUserMedia
 * @param {boolean}      options.active       Whether monitoring should be running
 * @param {function}     options.onViolation  Called with 'NOISE_SPIKE' on confirmed violation
 * @param {number}       [options.thresholdMultiplier=2.2]
 * @returns {{ currentRMS: number, baselineRMS: number, isCalibrating: boolean, isNoiseAlert: boolean }}
 */
export default function useAudioProctor({
  audioStream,
  active,
  onViolation,
  thresholdMultiplier = 2.2,
}) {
  const [currentRMS, setCurrentRMS] = useState(0);
  const [baselineRMS, setBaselineRMS] = useState(10);
  const [isCalibrating, setIsCalibrating] = useState(true);
  const [isNoiseAlert, setIsNoiseAlert] = useState(false);

  const onViolationRef = useRef(onViolation);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const sourceRef = useRef(null);
  const meterTimerRef = useRef(null);

  // Calibration data
  const calibrationSamplesRef = useRef([]);
  const CALIBRATION_TICKS = 20; // 20 * 100ms = 2.0 seconds

  // Noise spike debounce
  const consecutiveHighTicksRef = useRef(0);
  const HIGH_TICKS_THRESHOLD = 30; // 3.0 seconds (30 * 100ms)
  const hasFiredRef = useRef(false);

  // Keep ref fresh
  useEffect(() => { onViolationRef.current = onViolation; }, [onViolation]);

  // ── Setup AudioContext and AnalyserNode ──────────────────────────────────
  useEffect(() => {
    if (!active || !audioStream) return;

    // Ensure we have at least one audio track
    const audioTracks = audioStream.getAudioTracks();
    if (audioTracks.length === 0) {
      return;
    }

    let ctx;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      ctx = new AudioCtx();
    } catch (err) {
      console.error('[AudioProctor] AudioContext creation failed:', err);
      return;
    }

    // Explicitly resume suspended AudioContext
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    analyser.smoothingTimeConstant = 0.3;

    let source;
    try {
      source = ctx.createMediaStreamSource(audioStream);
      source.connect(analyser);
    } catch (err) {
      console.warn('[AudioProctor] MediaStreamSource connection note:', err?.message);
      return;
    }

    audioContextRef.current = ctx;
    analyserRef.current = analyser;
    sourceRef.current = source;

    // Reset state
    calibrationSamplesRef.current = [];
    consecutiveHighTicksRef.current = 0;
    hasFiredRef.current = false;
    setIsCalibrating(true);
    setIsNoiseAlert(false);

    const buffer = new Uint8Array(analyser.fftSize);

    // ── Sampling loop: every 100ms for smooth live feedback ───────────────
    meterTimerRef.current = setInterval(() => {
      if (!analyserRef.current) return;

      // Resume context if browser suspended it in background
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      analyserRef.current.getByteTimeDomainData(buffer);
      let sumSquares = 0;
      for (let i = 0; i < buffer.length; i++) {
        const norm = (buffer[i] - 128) / 128;
        sumSquares += norm * norm;
      }
      const rawRms = Math.sqrt(sumSquares / buffer.length);
      // Normalized speaking volume scale (0 to 100)
      const level = Math.min(100, Math.round(rawRms * 250));
      setCurrentRMS(level);

      // Phase 1: Auto-Calibration (first 2 seconds)
      if (calibrationSamplesRef.current.length < CALIBRATION_TICKS) {
        calibrationSamplesRef.current.push(level);

        if (calibrationSamplesRef.current.length >= CALIBRATION_TICKS) {
          const sum = calibrationSamplesRef.current.reduce((a, b) => a + b, 0);
          const avg = sum / calibrationSamplesRef.current.length;
          const baseline = Math.max(Math.round(avg), 8);
          setBaselineRMS(baseline);
          setIsCalibrating(false);
          console.log(`[AudioProctor] Calibrated baseline volume: ${baseline}`);
        }
        return;
      }

      // Phase 2: Active Monitoring
      const currentBaseline = Math.max(baselineRMS, 8);
      const threshold = Math.max(
        Math.round(currentBaseline * thresholdMultiplier),
        currentBaseline + 20,
        35
      );

      if (level > threshold) {
        consecutiveHighTicksRef.current += 1;

        if (
          consecutiveHighTicksRef.current >= HIGH_TICKS_THRESHOLD &&
          !hasFiredRef.current
        ) {
          setIsNoiseAlert(true);
          hasFiredRef.current = true;
          onViolationRef.current?.('NOISE_SPIKE');
          console.warn(
            `[AudioProctor] NOISE_SPIKE — level ${level} exceeded threshold ${threshold} for 3s`
          );
        }
      } else {
        if (consecutiveHighTicksRef.current > 0) {
          consecutiveHighTicksRef.current = 0;
          hasFiredRef.current = false;
          setIsNoiseAlert(false);
        }
      }
    }, 100);

    return () => {
      if (meterTimerRef.current) {
        clearInterval(meterTimerRef.current);
        meterTimerRef.current = null;
      }
      if (sourceRef.current) {
        try {
          sourceRef.current.disconnect();
        } catch (e) {}
        sourceRef.current = null;
      }
      if (audioContextRef.current) {
        try {
          if (audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close().catch(() => {});
          }
        } catch (e) {}
        audioContextRef.current = null;
      }
      analyserRef.current = null;
      setCurrentRMS(0);
      setIsNoiseAlert(false);
      setIsCalibrating(true);
    };
  }, [active, audioStream, baselineRMS, thresholdMultiplier]);

  return { currentRMS, baselineRMS, isCalibrating, isNoiseAlert };
}
