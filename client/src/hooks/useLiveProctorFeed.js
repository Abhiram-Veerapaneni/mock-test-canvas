import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';
import { getSocket, joinExamRoom } from '../services/socket';
import { isTimestampInFilter } from '../utils/dateUtils';

export default function useLiveProctorFeed({ activeExamId, enabled = true, defaultSound = true }) {
  const [exam, setExam] = useState(null);
  const [violations, setViolations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(defaultSound);
  const [mutedCandidates, setMutedCandidates] = useState(() => new Set());
  const [brokenImages, setBrokenImages] = useState(() => new Set());

  // Date & Time Filter state
  const [timePreset, setTimePreset] = useState('ALL');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [missedLiveCount, setMissedLiveCount] = useState(0);

  const filterStateRef = useRef({ timePreset, customStart, customEnd });
  useEffect(() => {
    filterStateRef.current = { timePreset, customStart, customEnd };
  }, [timePreset, customStart, customEnd]);

  // Rolling timer tick for relative presets ('15M', '1H')
  const [, setTimeTick] = useState(0);
  useEffect(() => {
    if (timePreset === '15M' || timePreset === '1H') {
      const interval = setInterval(() => {
        setTimeTick((t) => t + 1);
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [timePreset]);

  const audioContextRef = useRef(null);

  const markImageBroken = useCallback((url) => {
    setBrokenImages((prev) => new Set(prev).add(url));
  }, []);

  const toggleMuteCandidate = useCallback((candidateId) => {
    setMutedCandidates((prev) => {
      const next = new Set(prev);
      if (next.has(candidateId)) next.delete(candidateId);
      else next.add(candidateId);
      return next;
    });
  }, []);

  const playAlertChime = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (_) {}
  }, [soundEnabled]);

  const fetchViolations = useCallback(async () => {
    if (!activeExamId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get(`/exams/${activeExamId}/live-violations`);
      if (res.data?.success) {
        setViolations(res.data.violations || []);
        if (res.data.exam) {
          setExam(res.data.exam);
        }
      }
    } catch (err) {
      console.warn('Failed to load violations:', err);
      setError(err.response?.data?.message || 'Could not fetch proctoring infractions.');
    } finally {
      setIsLoading(false);
    }
  }, [activeExamId]);

  useEffect(() => {
    if (!enabled || !activeExamId) return;
    fetchViolations();

    const socket = getSocket();
    joinExamRoom(activeExamId);

    const handleConnect = () => setIsConnected(true);
    const handleDisconnect = () => setIsConnected(false);

    if (socket.connected) setIsConnected(true);

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    const handleLiveViolation = (data) => {
      if (data.examId === activeExamId) {
        setViolations((prev) => [data, ...prev]);
        playAlertChime();

        const { timePreset: currentPreset, customStart: currentStart, customEnd: currentEnd } = filterStateRef.current;
        if (currentPreset !== 'ALL') {
          const isWithinWindow = isTimestampInFilter(data.timestamp, {
            timePreset: currentPreset,
            customStart: currentStart,
            customEnd: currentEnd,
          });
          if (!isWithinWindow) {
            setMissedLiveCount((prev) => prev + 1);
          }
        }
      }
    };

    socket.on('violation:live', handleLiveViolation);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
      socket.off('violation:live', handleLiveViolation);
    };
  }, [enabled, activeExamId, fetchViolations, playAlertChime]);

  const handleResetTimeFilter = useCallback(() => {
    setTimePreset('ALL');
    setCustomStart('');
    setCustomEnd('');
    setMissedLiveCount(0);
  }, []);

  return {
    exam,
    violations,
    isLoading,
    error,
    isConnected,
    soundEnabled,
    setSoundEnabled,
    mutedCandidates,
    toggleMuteCandidate,
    brokenImages,
    markImageBroken,
    timePreset,
    setTimePreset,
    customStart,
    setCustomStart,
    customEnd,
    setCustomEnd,
    missedLiveCount,
    setMissedLiveCount,
    handleResetTimeFilter,
    fetchViolations,
  };
}

