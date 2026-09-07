import React from 'react';
import { AlertTriangle, ShieldAlert, X, Eye, EyeOff, Users, Volume2 } from 'lucide-react';

/**
 * StrikeModal
 *
 * Premium warning modal displayed when a proctoring violation is confirmed.
 * Shows violation details, current strike count, and a visual trust score bar.
 *
 * @param {Object}   props
 * @param {string}   props.type         Violation type (NO_FACE, MULTI_FACE, NOISE_SPIKE, etc.)
 * @param {number}   props.strikeCount  Current total strike count
 * @param {number}   props.trustScore   Current trust score (0–100)
 * @param {number}   props.maxWarnings  Max allowed warnings from exam settings
 * @param {boolean}  props.isOpen       Whether the modal is visible
 * @param {function} props.onClose      Dismiss handler
 */

const VIOLATION_INFO = {
  NO_FACE: {
    icon: EyeOff,
    label: 'No Face Detected',
    description: 'Your face was not visible to the camera for an extended period. Please ensure you remain in front of the webcam.',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.08)',
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  MULTI_FACE: {
    icon: Users,
    label: 'Multiple Faces Detected',
    description: 'More than one person was detected in the camera frame. Only the exam candidate should be visible.',
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  NOISE_SPIKE: {
    icon: Volume2,
    label: 'Excessive Noise Detected',
    description: 'Unusually loud or sustained noise was detected from your microphone. Please ensure a quiet testing environment.',
    color: '#f97316',
    bgColor: 'rgba(249, 115, 22, 0.08)',
    borderColor: 'rgba(249, 115, 22, 0.25)',
  },
  FULLSCREEN_EXIT: {
    icon: ShieldAlert,
    label: 'Fullscreen Exited',
    description: 'You exited fullscreen mode during the exam. This is a proctoring violation.',
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.08)',
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  TAB_SWITCH: {
    icon: AlertTriangle,
    label: 'Tab Switch Detected',
    description: 'You switched to another browser tab during the exam.',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.08)',
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  WINDOW_BLUR: {
    icon: AlertTriangle,
    label: 'Window Focus Lost',
    description: 'The exam window lost focus, possibly due to switching applications.',
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.08)',
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
};

const DEFAULT_INFO = {
  icon: AlertTriangle,
  label: 'Proctoring Violation',
  description: 'A proctoring violation has been detected.',
  color: '#f59e0b',
  bgColor: 'rgba(245, 158, 11, 0.08)',
  borderColor: 'rgba(245, 158, 11, 0.25)',
};

export default function StrikeModal({ type, strikeCount, trustScore, maxWarnings, isOpen, onClose }) {
  if (!isOpen) return null;

  const info = VIOLATION_INFO[type] || DEFAULT_INFO;
  const IconComponent = info.icon;

  // Severity-dependent color for the strike counter
  const getSeverityColor = () => {
    const ratio = maxWarnings > 0 ? strikeCount / maxWarnings : 0;
    if (ratio >= 0.8) return '#ef4444'; // red — critical
    if (ratio >= 0.5) return '#f97316'; // orange — warning
    return '#f59e0b';                    // amber — caution
  };

  // Trust score bar color
  const getTrustColor = () => {
    if (trustScore >= 70) return '#22c55e'; // green
    if (trustScore >= 40) return '#f59e0b'; // amber
    return '#ef4444';                        // red
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        background: 'rgba(2, 6, 23, 0.7)',
        backdropFilter: 'blur(6px)',
        animation: 'strikeModalFadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '380px',
          background: '#0f172a',
          border: `1px solid ${info.borderColor}`,
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: `0 0 40px ${info.color}15, 0 8px 32px rgba(0,0,0,0.5)`,
          animation: 'strikeModalSlideUp 0.25s ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top accent bar */}
        <div style={{
          height: '3px',
          background: `linear-gradient(to right, ${info.color}, ${info.color}80)`,
        }} />

        <div style={{ padding: '24px' }}>
          {/* Icon + Title */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '20px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: info.bgColor,
              border: `1px solid ${info.borderColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}>
              <IconComponent size={22} color={info.color} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{
                margin: 0,
                fontSize: '15px',
                fontWeight: 700,
                color: '#f1f5f9',
                fontFamily: "'Inter', system-ui, sans-serif",
              }}>
                {info.label}
              </h3>
              <p style={{
                margin: '4px 0 0',
                fontSize: '12px',
                color: '#94a3b8',
                lineHeight: 1.5,
                fontFamily: "'Inter', system-ui, sans-serif",
              }}>
                {info.description}
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
            marginBottom: '16px',
          }}>
            {/* Strike count */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(148, 163, 184, 0.1)',
              borderRadius: '12px',
              padding: '12px',
              textAlign: 'center',
            }}>
              <div style={{
                fontSize: '10px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#64748b',
                marginBottom: '4px',
                fontFamily: "'Inter', system-ui, sans-serif",
              }}>
                Strikes
              </div>
              <div style={{
                fontSize: '22px',
                fontWeight: 800,
                color: getSeverityColor(),
                fontVariantNumeric: 'tabular-nums',
                fontFamily: "'Inter', system-ui, sans-serif",
              }}>
                {strikeCount}
                <span style={{
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#475569',
                  marginLeft: '2px',
                }}>
                  / {maxWarnings || '∞'}
                </span>
              </div>
            </div>

            {/* Trust score */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(148, 163, 184, 0.1)',
              borderRadius: '12px',
              padding: '12px',
              textAlign: 'center',
            }}>
              <div style={{
                fontSize: '10px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: '#64748b',
                marginBottom: '4px',
                fontFamily: "'Inter', system-ui, sans-serif",
              }}>
                Trust Score
              </div>
              <div style={{
                fontSize: '22px',
                fontWeight: 800,
                color: getTrustColor(),
                fontVariantNumeric: 'tabular-nums',
                fontFamily: "'Inter', system-ui, sans-serif",
              }}>
                {trustScore}
                <span style={{
                  fontSize: '12px',
                  fontWeight: 500,
                  color: '#475569',
                  marginLeft: '2px',
                }}>
                  /100
                </span>
              </div>
            </div>
          </div>

          {/* Trust score progress bar */}
          <div style={{
            width: '100%',
            height: '6px',
            borderRadius: '3px',
            background: 'rgba(148, 163, 184, 0.1)',
            overflow: 'hidden',
            marginBottom: '16px',
          }}>
            <div style={{
              height: '100%',
              width: `${trustScore}%`,
              borderRadius: '3px',
              background: `linear-gradient(to right, ${getTrustColor()}, ${getTrustColor()}cc)`,
              transition: 'width 0.5s ease-out, background 0.3s',
            }} />
          </div>

          {/* Warning text */}
          <p style={{
            margin: '0 0 16px',
            fontSize: '11px',
            color: '#64748b',
            textAlign: 'center',
            lineHeight: 1.5,
            fontFamily: "'Inter', system-ui, sans-serif",
          }}>
            Repeated violations will result in automatic exam termination.
          </p>

          {/* Dismiss button */}
          <button
            onClick={onClose}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '10px',
              border: 'none',
              background: `linear-gradient(135deg, ${info.color}, ${info.color}cc)`,
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: "'Inter', system-ui, sans-serif",
              transition: 'transform 0.1s, opacity 0.2s',
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.97)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            I Understand
          </button>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes strikeModalFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes strikeModalSlideUp {
          from { opacity: 0; transform: translateY(12px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
