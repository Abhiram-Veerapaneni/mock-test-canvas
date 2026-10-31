import React from 'react';
import {
  Smartphone,
  BookOpen,
  Users,
  EyeOff,
  Volume2,
  AlertTriangle,
} from 'lucide-react';

export const VIOLATION_LABELS = {
  TAB_SWITCH: 'Tab Switched',
  WINDOW_BLUR: 'Window Focus Lost',
  FULLSCREEN_EXIT: 'Fullscreen Exited',
  NO_FACE: 'No Face Detected',
  MULTI_FACE: 'Multiple Faces Detected',
  NOISE_SPIKE: 'Excessive Noise Spike',
  CELL_PHONE: 'Mobile Phone Detected',
  PROHIBITED_BOOK: 'Book / Notes Detected',
  PROHIBITED_OBJECT: 'Prohibited Device Detected',
};

export const formatTimeAgo = (dateInput) => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  const now = new Date();
  const seconds = Math.floor((now - date) / 1000);

  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

export const getViolationIcon = (violationType) => {
  switch (violationType) {
    case 'CELL_PHONE':
      return <Smartphone className="w-4 h-4 text-rose-500" />;
    case 'PROHIBITED_BOOK':
      return <BookOpen className="w-4 h-4 text-amber-500" />;
    case 'MULTI_FACE':
      return <Users className="w-4 h-4 text-rose-500" />;
    case 'NO_FACE':
      return <EyeOff className="w-4 h-4 text-amber-500" />;
    case 'NOISE_SPIKE':
      return <Volume2 className="w-4 h-4 text-orange-500" />;
    default:
      return <AlertTriangle className="w-4 h-4 text-rose-500" />;
  }
};

