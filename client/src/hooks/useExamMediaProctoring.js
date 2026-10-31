import { useState, useRef, useCallback, useEffect } from 'react';
import useExamStore from '../store/useExamStore';

export default function useExamMediaProctoring() {
  const [proctorStream, setProctorStream] = useState(null);
  const proctorStreamRef = useRef(null);
  const [isHardwareVerified, setIsHardwareVerified] = useState(false);

  // Unconditionally stops all camera and microphone hardware tracks
  const stopProctoringMedia = useCallback(() => {
    if (proctorStreamRef.current) {
      proctorStreamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (err) {
          console.warn('[ExamSession] Track stop error:', err);
        }
      });
      proctorStreamRef.current = null;
    }
    // Sweep any video elements in DOM to release hardware capture
    if (typeof document !== 'undefined') {
      document.querySelectorAll('video').forEach((video) => {
        if (video.srcObject && typeof video.srcObject.getTracks === 'function') {
          video.srcObject.getTracks().forEach((track) => {
            try { track.stop(); } catch (e) {}
          });
          video.srcObject = null;
        }
      });
    }
    setProctorStream(null);
  }, []);

  const handleHardwareVerified = useCallback((stream) => {
    proctorStreamRef.current = stream;
    setProctorStream(stream);
    setIsHardwareVerified(true);
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      try {
        useExamStore.getState().syncToLocalStorage();
      } catch (e) {
        console.warn('Failed to sync session to localStorage on unload:', e);
      }
      stopProctoringMedia();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      try {
        useExamStore.getState().syncToLocalStorage();
      } catch (e) {
        console.warn('Failed to sync session to localStorage on unmount:', e);
      }
      stopProctoringMedia();
    };
  }, [stopProctoringMedia]);

  return {
    proctorStream,
    isHardwareVerified,
    setIsHardwareVerified,
    stopProctoringMedia,
    handleHardwareVerified,
  };
}

