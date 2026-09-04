import React from 'react';
import { Delete, RotateCcw } from 'lucide-react';

export default function NatInput({ value = '', onChangeValue }) {
  const handleKeyPress = (char) => {
    let newValue = String(value);

    if (char === 'CLEAR') {
      newValue = '';
    } else if (char === 'BACKSPACE') {
      newValue = newValue.slice(0, -1);
    } else if (char === '-') {
      if (newValue.startsWith('-')) {
        newValue = newValue.slice(1);
      } else {
        newValue = '-' + newValue;
      }
    } else if (char === '.') {
      if (!newValue.includes('.')) {
        newValue += '.';
      }
    } else {
      newValue += char;
    }

    onChangeValue(newValue);
  };

  return (
    <div style={{ maxWidth: '420px', margin: '20px 0', padding: '20px', backgroundColor: 'var(--jee-bg-card)', border: '2px solid var(--jee-border-card)', borderRadius: '12px' }}>
      <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#16a34a', marginBottom: '12px' }}>
        Numerical Answer Input (On-Screen Keypad):
      </div>

      <div style={{ position: 'relative', marginBottom: '16px' }}>
        <input
          type="text"
          readOnly
          value={value}
          placeholder="e.g. 25 or -3.14"
          style={{ width: '100%', padding: '12px 16px', fontSize: '1.25rem', fontFamily: 'monospace', fontWeight: 800, textAlign: 'center', backgroundColor: 'var(--jee-sidebar-bg)', color: '#16a34a', border: '2px solid #16a34a', borderRadius: '10px', outline: 'none' }}
        />
        {value && (
          <button
            onClick={() => handleKeyPress('CLEAR')}
            style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer' }}
            title="Clear Input"
          >
            <RotateCcw size={18} />
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', fontFamily: 'monospace', fontWeight: 800 }}>
        {['7', '8', '9'].map((digit) => (
          <button
            key={digit}
            onClick={() => handleKeyPress(digit)}
            style={{ padding: '12px', fontSize: '1.1rem', backgroundColor: 'var(--jee-sidebar-bg)', color: 'var(--jee-text-primary)', border: '1px solid var(--jee-border-card)', borderRadius: '8px', cursor: 'pointer' }}
          >
            {digit}
          </button>
        ))}
        <button
          onClick={() => handleKeyPress('BACKSPACE')}
          style={{ padding: '12px', backgroundColor: '#fef3c7', color: '#b45309', border: '1px solid #f59e0b', borderRadius: '8px', cursor: 'pointer', display: 'flex', itemsCenter: 'center', justifyContent: 'center' }}
        >
          <Delete size={20} />
        </button>

        {['4', '5', '6'].map((digit) => (
          <button
            key={digit}
            onClick={() => handleKeyPress(digit)}
            style={{ padding: '12px', fontSize: '1.1rem', backgroundColor: 'var(--jee-sidebar-bg)', color: 'var(--jee-text-primary)', border: '1px solid var(--jee-border-card)', borderRadius: '8px', cursor: 'pointer' }}
          >
            {digit}
          </button>
        ))}
        <button
          onClick={() => handleKeyPress('-')}
          style={{ padding: '12px', fontSize: '1.1rem', backgroundColor: 'var(--jee-sidebar-bg)', color: '#2563eb', border: '1px solid var(--jee-border-card)', borderRadius: '8px', cursor: 'pointer' }}
        >
          &plusmn;
        </button>

        {['1', '2', '3'].map((digit) => (
          <button
            key={digit}
            onClick={() => handleKeyPress(digit)}
            style={{ padding: '12px', fontSize: '1.1rem', backgroundColor: 'var(--jee-sidebar-bg)', color: 'var(--jee-text-primary)', border: '1px solid var(--jee-border-card)', borderRadius: '8px', cursor: 'pointer' }}
          >
            {digit}
          </button>
        ))}
        <button
          onClick={() => handleKeyPress('.')}
          style={{ padding: '12px', fontSize: '1.1rem', backgroundColor: 'var(--jee-sidebar-bg)', color: '#2563eb', border: '1px solid var(--jee-border-card)', borderRadius: '8px', cursor: 'pointer' }}
        >
          .
        </button>

        <button
          onClick={() => handleKeyPress('0')}
          style={{ gridColumn: 'span 2', padding: '12px', fontSize: '1.1rem', backgroundColor: 'var(--jee-sidebar-bg)', color: 'var(--jee-text-primary)', border: '1px solid var(--jee-border-card)', borderRadius: '8px', cursor: 'pointer' }}
        >
          0
        </button>
        <button
          onClick={() => handleKeyPress('CLEAR')}
          style={{ gridColumn: 'span 2', padding: '10px', fontSize: '0.75rem', fontWeight: 800, backgroundColor: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', borderRadius: '8px', cursor: 'pointer', textTransform: 'uppercase' }}
        >
          Clear
        </button>
      </div>
    </div>
  );
}
