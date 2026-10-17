'use client';

import React, { useState } from 'react';
import { Sparkles, RotateCcw, Loader2, CheckCircle2, AlertCircle, FileText } from 'lucide-react';

interface TranslatableTextareaProps {
  labelJp: string;
  labelBn: string;
  value: string;
  onChange: (val: string) => void;
  originalBn: string;
  onChangeOriginalBn: (val: string) => void;
  fieldType: 'hobbies' | 'personality' | 'motivation' | 'future_plan' | 'job_description' | 'general';
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
  aiEnabled?: boolean;
}

export default function TranslatableTextarea({
  labelJp,
  labelBn,
  value,
  onChange,
  originalBn,
  onChangeOriginalBn,
  fieldType,
  placeholder,
  rows = 3,
  disabled = false,
  aiEnabled = true,
}: TranslatableTextareaProps) {
  const [translating, setTranslating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [justTranslated, setJustTranslated] = useState(false);

  const handleTranslate = async () => {
    if (!value || !value.trim()) {
      setErrorMsg('অনুবাদ করার জন্য কিছু টেক্সট লিখুন / Please enter text to translate.');
      setTimeout(() => setErrorMsg(''), 3500);
      return;
    }

    try {
      setTranslating(true);
      setErrorMsg('');

      // Preserve current text as the original Bangla if not already saved
      const textToTranslate = value.trim();
      const currentOriginal = originalBn && originalBn.trim() ? originalBn : textToTranslate;
      onChangeOriginalBn(currentOriginal);

      const res = await fetch('/api/ai/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToTranslate,
          fieldType,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMsg(data.message || 'Translation failed. Please verify AI Settings.');
        setTimeout(() => setErrorMsg(''), 4500);
        return;
      }

      const japaneseText = data.translatedText;
      if (japaneseText) {
        onChange(japaneseText);
        setJustTranslated(true);
        setTimeout(() => setJustTranslated(false), 3000);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Network error during translation.');
      setTimeout(() => setErrorMsg(''), 4000);
    } finally {
      setTranslating(false);
    }
  };

  const handleReset = () => {
    if (originalBn && originalBn.trim()) {
      onChange(originalBn.trim());
      setErrorMsg('');
      setJustTranslated(false);
    }
  };

  const hasOriginalDifferent = originalBn && originalBn.trim() && originalBn.trim() !== value?.trim();

  return (
    <div style={{ marginBottom: '16px' }}>
      {/* Field Label */}
      <label
        style={{
          display: 'block',
          fontSize: '13px',
          fontWeight: 700,
          color: '#1e293b',
          marginBottom: '6px',
        }}
      >
        <span style={{ color: '#1f3864' }}>{labelJp}</span>
        <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600, marginLeft: '6px' }}>
          / {labelBn}
        </span>
      </label>

      {/* Textarea Input */}
      <textarea
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled || translating}
        style={{
          width: '100%',
          padding: '10px 12px',
          fontSize: '13.5px',
          fontFamily: 'inherit',
          lineHeight: 1.45,
          color: '#0f172a',
          background: disabled ? '#f8fafc' : '#ffffff',
          border: justTranslated ? '1.5px solid #10b981' : '1.5px solid #cbd5e1',
          borderRadius: '8px',
          outline: 'none',
          boxSizing: 'border-box',
          resize: 'vertical',
          transition: 'border-color 0.2s ease',
        }}
        onFocus={(e) => {
          if (!justTranslated) e.target.style.borderColor = '#1d4ed8';
        }}
        onBlur={(e) => {
          if (!justTranslated) e.target.style.borderColor = '#cbd5e1';
        }}
      />

      {/* Button Controls Row */}
      {(aiEnabled || (originalBn && originalBn.trim())) && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '6px',
            flexWrap: 'wrap',
          }}
        >
          {/* Translate Button - hidden if AI toggle is OFF */}
          {aiEnabled && (
            <button
              type="button"
              onClick={handleTranslate}
              disabled={disabled || translating || !value || !value.trim()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                fontSize: '12px',
                fontWeight: 700,
                color: '#1d4ed8',
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '6px',
                cursor: disabled || translating || !value?.trim() ? 'not-allowed' : 'pointer',
                opacity: disabled || translating || !value?.trim() ? 0.6 : 1,
                transition: 'all 0.15s ease',
              }}
              title="Translate Bangla/English to formal Japanese resume text"
            >
              {translating ? (
                <>
                  <Loader2 size={13} className="spin" />
                  <span>Translating... / অনুবাদ হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Sparkles size={13} color="#1d4ed8" />
                  <span>Translate Japanese / জাপানি অনুবাদ</span>
                </>
              )}
            </button>
          )}

          {/* Reset Button */}
          {originalBn && originalBn.trim() && (
            <button
              type="button"
              onClick={handleReset}
              disabled={disabled || translating || !originalBn || !originalBn.trim()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                fontSize: '12px',
                fontWeight: 600,
                color: '#dc2626',
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '6px',
                cursor: disabled || translating || !originalBn?.trim() ? 'not-allowed' : 'pointer',
                opacity: disabled || translating || !originalBn?.trim() ? 0.5 : 1,
                transition: 'all 0.15s ease',
              }}
              title="Revert back to the original Bangla text"
            >
              <RotateCcw size={12} />
              <span>Reset / রিসেট</span>
            </button>
          )}

          {/* Translated Success Badge */}
          {justTranslated && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11.5px',
                fontWeight: 700,
                color: '#15803d',
                background: '#dcfce7',
                padding: '3px 8px',
                borderRadius: '6px',
              }}
            >
              <CheckCircle2 size={13} />
              <span>Translated to Native Japanese!</span>
            </span>
          )}
        </div>
      )}

      {/* Error Message */}
      {errorMsg && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: '6px',
            fontSize: '12px',
            color: '#b91c1c',
          }}
        >
          <AlertCircle size={14} />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Original Bangla Display Box (Shown outside/below the field after translation) */}
      {hasOriginalDifferent && (
        <div
          style={{
            marginTop: '8px',
            padding: '8px 12px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderLeft: '3px solid #1f3864',
            borderRadius: '6px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              fontWeight: 700,
              color: '#475569',
              marginBottom: '3px',
            }}
          >
            <FileText size={12} color="#1f3864" />
            <span>Original Bangla Input (শিক্ষার্থীর মূল বাংলা লেখা):</span>
          </div>
          <div
            style={{
              fontSize: '12.5px',
              color: '#1e293b',
              lineHeight: 1.45,
              wordBreak: 'break-word',
            }}
          >
            {originalBn}
          </div>
        </div>
      )}
    </div>
  );
}
