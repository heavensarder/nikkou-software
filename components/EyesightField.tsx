'use client';

import React from 'react';
import { EYE_POWER_OPTIONS, parseEyesight, formatEyesight } from '@/types/cv';

interface EyesightFieldProps {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
  selectClassName?: string;
}

export default function EyesightField({
  value,
  onChange,
  disabled = false,
  label = '視力 / দৃষ্টিশক্তি',
  className,
  selectClassName,
}: EyesightFieldProps) {
  const { right: rightEye, left: leftEye } = parseEyesight(value);

  const handleRightChange = (newRight: string) => {
    if (!newRight && !leftEye) {
      onChange('');
      return;
    }
    const newLeft = leftEye || newRight;
    onChange(formatEyesight(newRight, newLeft));
  };

  const handleLeftChange = (newLeft: string) => {
    if (!newLeft && !rightEye) {
      onChange('');
      return;
    }
    const newRight = rightEye || newLeft;
    onChange(formatEyesight(newRight, newLeft));
  };

  return (
    <div className={className}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '6px', flexWrap: 'wrap', gap: '4px' }}>
        <label
          style={{
            fontSize: '13.5px',
            fontWeight: 700,
            color: 'var(--nikkou-navy, #1f3864)',
            margin: 0,
          }}
        >
          {label}
        </label>
        <span style={{ fontSize: '11px', color: '#0284c7', fontWeight: 600 }}>
          (Select 1.0 for Normal Vision)
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
        {/* Right Eye (右 / ডান) */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '11.5px',
              fontWeight: 700,
              color: '#334155',
              marginBottom: '4px',
            }}
          >
            右 / ডান
          </label>
          <select
            value={rightEye}
            disabled={disabled}
            onChange={(e) => handleRightChange(e.target.value)}
            className={selectClassName}
            style={
              selectClassName
                ? undefined
                : {
                    width: '100%',
                    height: '42px',
                    padding: '0 8px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--border-light, #cbd5e1)',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: rightEye ? 'var(--text-primary, #0f172a)' : '#94a3b8',
                    background: disabled ? '#f8fafc' : '#ffffff',
                    outline: 'none',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                  }
            }
          >
            <option value="">選択 / নির্বাচন</option>
            {EYE_POWER_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt === '1.0' ? '1.0 (Normal Vision)' : opt}
              </option>
            ))}
            {rightEye && !EYE_POWER_OPTIONS.includes(rightEye as any) && (
              <option value={rightEye}>{rightEye}</option>
            )}
          </select>
        </div>

        {/* Left Eye (左 / বাম) */}
        <div>
          <label
            style={{
              display: 'block',
              fontSize: '11.5px',
              fontWeight: 700,
              color: '#334155',
              marginBottom: '4px',
            }}
          >
            左 / বাম
          </label>
          <select
            value={leftEye}
            disabled={disabled}
            onChange={(e) => handleLeftChange(e.target.value)}
            className={selectClassName}
            style={
              selectClassName
                ? undefined
                : {
                    width: '100%',
                    height: '42px',
                    padding: '0 8px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--border-light, #cbd5e1)',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: leftEye ? 'var(--text-primary, #0f172a)' : '#94a3b8',
                    background: disabled ? '#f8fafc' : '#ffffff',
                    outline: 'none',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                  }
            }
          >
            <option value="">選択 / নির্বাচন</option>
            {EYE_POWER_OPTIONS.map((opt) => (
              <option key={opt} value={opt}>
                {opt === '1.0' ? '1.0 (Normal Vision)' : opt}
              </option>
            ))}
            {leftEye && !EYE_POWER_OPTIONS.includes(leftEye as any) && (
              <option value={leftEye}>{leftEye}</option>
            )}
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px', flexWrap: 'wrap', gap: '4px' }}>
        <span style={{ fontSize: '11px', color: '#0284c7', fontWeight: 600 }}>
          (Select 1.0 for Normal Vision)
        </span>
        {value && (
          <span
            style={{
              fontSize: '11px',
              color: '#64748b',
              fontWeight: 600,
            }}
          >
            出力 / Output: <strong style={{ color: '#1f3864' }}>{value}</strong>
          </span>
        )}
      </div>
    </div>
  );
}
