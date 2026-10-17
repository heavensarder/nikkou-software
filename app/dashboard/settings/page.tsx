'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Key,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Cpu,
  Loader2,
  Save,
  Check,
  FileText,
  Info,
} from 'lucide-react';
import styles from '../cv-maker/cv-maker.module.css';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  // AI Settings State
  const [aiEnabled, setAiEnabled] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [hasStoredKey, setHasStoredKey] = useState(false);
  const [maskedKey, setMaskedKey] = useState('');
  const [aiModel, setAiModel] = useState('gpt-4o-mini');

  // Feedback notifications
  const [testStatus, setTestStatus] = useState<{
    type: 'idle' | 'success' | 'error';
    message: string;
  }>({ type: 'idle', message: '' });

  const [saveStatus, setSaveStatus] = useState<{
    type: 'idle' | 'success' | 'error';
    message: string;
  }>({ type: 'idle', message: '' });

  // Fetch initial settings from server
  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        const res = await fetch('/api/settings/ai');
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setAiEnabled(Boolean(data.enabled));
            setHasStoredKey(Boolean(data.hasApiKey));
            setMaskedKey(data.maskedApiKey || '');
            if (data.model) setAiModel(data.model);
            if (data.maskedApiKey) {
              setApiKey(data.maskedApiKey);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load AI settings', err);
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  // Save Settings Handler
  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setSaveStatus({ type: 'idle', message: '' });

      const payload: any = {
        enabled: aiEnabled,
        model: aiModel,
      };

      // Only send apiKey if modified from original masked value
      if (apiKey && apiKey !== maskedKey) {
        payload.apiKey = apiKey.trim();
      }

      const res = await fetch('/api/settings/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSaveStatus({
          type: 'success',
          message: 'AI settings updated and saved successfully!',
        });
        if (payload.apiKey) {
          setHasStoredKey(true);
          const newMasked = `${payload.apiKey.slice(0, 4)}...${payload.apiKey.slice(-4)}`;
          setMaskedKey(newMasked);
          setApiKey(newMasked);
          setShowApiKey(false);
        }
        setTimeout(() => setSaveStatus({ type: 'idle', message: '' }), 4000);
      } else {
        setSaveStatus({
          type: 'error',
          message: data.message || 'Failed to save AI settings.',
        });
      }
    } catch (err: any) {
      setSaveStatus({
        type: 'error',
        message: err.message || 'Network error occurred while saving.',
      });
    } finally {
      setSaving(false);
    }
  };

  // Test Connection Handler
  const handleTestConnection = async () => {
    try {
      setTesting(true);
      setTestStatus({ type: 'idle', message: '' });

      const payload: any = {};
      if (apiKey && apiKey !== maskedKey) {
        payload.apiKey = apiKey.trim();
      }

      const res = await fetch('/api/settings/ai/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setTestStatus({
          type: 'success',
          message: data.message || 'Connection successful! AI service is active.',
        });
      } else {
        setTestStatus({
          type: 'error',
          message: data.message || 'Connection test failed. Please check the API key.',
        });
      }
    } catch (err: any) {
      setTestStatus({
        type: 'error',
        message: err.message || 'Could not contact AI service.',
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '360px', gap: '12px' }}>
        <Loader2 className={styles.spin} size={28} color="var(--nikkou-red)" />
        <span style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-muted)' }}>
          Loading system settings...
        </span>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.headerLeft}>
          <h2>Settings / システム設定</h2>
          <p>Configure administrative features, AI document processing, and system preferences.</p>
        </div>
      </div>

      {/* Main Settings Card */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
          overflow: 'hidden',
        }}
      >
        {/* Card Header */}
        <div
          style={{
            padding: '24px 28px',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
            background: 'linear-gradient(to right, #ffffff, #f8fafc)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                border: '1.5px solid #bfdbfe',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#1d4ed8',
                boxShadow: '0 2px 8px rgba(29, 78, 216, 0.12)',
              }}
            >
              <Sparkles size={24} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
                AI Document Auto-Fill / AIドキュメント自動入力
              </h3>
              <p style={{ margin: '3px 0 0 0', fontSize: '13px', color: '#64748b' }}>
                Enable AI-powered document extraction to automatically read CV documents and populate form fields.
              </p>
            </div>
          </div>

          {/* Toggle Switch */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <span
              style={{
                fontSize: '13px',
                fontWeight: 700,
                color: aiEnabled ? '#15803d' : '#64748b',
                padding: '4px 10px',
                borderRadius: '20px',
                background: aiEnabled ? '#dcfce7' : '#f1f5f9',
                border: aiEnabled ? '1px solid #86efac' : '1px solid #e2e8f0',
                transition: 'all 0.2s ease',
              }}
            >
              {aiEnabled ? 'AI Enabled (有効)' : 'AI Disabled (無効)'}
            </span>

            {/* iOS-style Switch */}
            <button
              type="button"
              role="switch"
              aria-checked={aiEnabled}
              onClick={() => setAiEnabled(!aiEnabled)}
              style={{
                position: 'relative',
                width: '56px',
                height: '30px',
                borderRadius: '15px',
                background: aiEnabled ? '#1d4ed8' : '#cbd5e1',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                transition: 'background-color 0.25s ease',
                outline: 'none',
              }}
              title="Toggle AI Document Auto-Fill"
            >
              <span
                style={{
                  position: 'absolute',
                  top: '3px',
                  left: aiEnabled ? '29px' : '3px',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
                  transition: 'left 0.25s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {aiEnabled ? <Check size={14} color="#1d4ed8" strokeWidth={3} /> : null}
              </span>
            </button>
          </div>
        </div>

        {/* Card Body */}
        <div style={{ padding: '28px' }}>
          {/* Status Alert Banner */}
          <div
            style={{
              padding: '14px 18px',
              borderRadius: '10px',
              marginBottom: '26px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              background: aiEnabled ? '#f0fdf4' : '#fffbeb',
              border: aiEnabled ? '1px solid #bbf7d0' : '1px solid #fde68a',
              color: aiEnabled ? '#166534' : '#92400e',
            }}
          >
            {aiEnabled ? (
              <CheckCircle2 size={20} style={{ flexShrink: 0, marginTop: '1px' }} />
            ) : (
              <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '1px' }} />
            )}
            <div style={{ fontSize: '13px', lineHeight: 1.5 }}>
              {aiEnabled ? (
                <>
                  <strong>AI Document Auto-Fill is Active:</strong> When creating a new student CV, staff will see the{' '}
                  <span style={{ fontWeight: 700, color: '#1d4ed8' }}>&ldquo;✨ Fill data with document&rdquo;</span>{' '}
                  button to upload documents and automatically populate matching form fields.
                </>
              ) : (
                <>
                  <strong>AI Document Auto-Fill is Inactive:</strong> The &ldquo;Fill data with document&rdquo; button is
                  hidden from the CV creation form. Toggle it ON above to enable AI-powered data extraction.
                </>
              )}
            </div>
          </div>

          {/* Form Fields Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '22px', maxWidth: '720px' }}>
            {/* Field 1: AI API Key */}
            <div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  color: '#1e293b',
                  marginBottom: '8px',
                }}
              >
                <Key size={16} color="#1d4ed8" />
                <span>AI API Key / AI APIキー</span>
                {hasStoredKey && (
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#059669',
                      background: '#ecfdf5',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      border: '1px solid #a7f3d0',
                    }}
                  >
                    Key Configured
                  </span>
                )}
              </label>

              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={hasStoredKey ? maskedKey : 'Enter your AI API key (e.g. sk-proj-...)'}
                  style={{
                    width: '100%',
                    height: '44px',
                    padding: '0 44px 0 14px',
                    fontSize: '14px',
                    fontFamily: showApiKey ? 'monospace' : 'inherit',
                    borderRadius: '8px',
                    border: '1.5px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#0f172a',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.2s ease',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#1d4ed8')}
                  onBlur={(e) => (e.target.style.borderColor = '#cbd5e1')}
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title={showApiKey ? 'Hide Key' : 'Show Key'}
                >
                  {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                <ShieldCheck size={14} color="#64748b" />
                <span style={{ fontSize: '12px', color: '#64748b' }}>
                  The API key is securely encrypted in your private database and never exposed publicly.
                </span>
              </div>
            </div>

            {/* Field 2: AI Model Selection */}
            <div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  color: '#1e293b',
                  marginBottom: '8px',
                }}
              >
                <Cpu size={16} color="#1d4ed8" />
                <span>AI Processing Model / AIモデル</span>
              </label>

              <select
                value={aiModel}
                onChange={(e) => setAiModel(e.target.value)}
                style={{
                  width: '100%',
                  height: '44px',
                  padding: '0 14px',
                  fontSize: '14px',
                  fontWeight: 600,
                  borderRadius: '8px',
                  border: '1.5px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#0f172a',
                  outline: 'none',
                  boxSizing: 'border-box',
                  cursor: 'pointer',
                }}
              >
                <option value="gpt-4o-mini">gpt-4o-mini (Recommended — Ultra-fast, highly accurate vision & cost-effective)</option>
                <option value="gpt-4o">gpt-4o (High Performance — Complex document tables & handwritten scans)</option>
              </select>

              <span style={{ display: 'block', fontSize: '12px', color: '#64748b', marginTop: '6px' }}>
                Both models support bilingual Japanese/Bengali document analysis and image OCR vision.
              </span>
            </div>
          </div>

          {/* Test & Save Status Messages */}
          {testStatus.message && (
            <div
              style={{
                marginTop: '20px',
                padding: '12px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: testStatus.type === 'success' ? '#f0fdf4' : '#fef2f2',
                border: testStatus.type === 'success' ? '1px solid #bbf7d0' : '1px solid #fecaca',
                color: testStatus.type === 'success' ? '#15803d' : '#b91c1c',
              }}
            >
              {testStatus.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span>{testStatus.message}</span>
            </div>
          )}

          {saveStatus.message && (
            <div
              style={{
                marginTop: '20px',
                padding: '12px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: saveStatus.type === 'success' ? '#f0fdf4' : '#fef2f2',
                border: saveStatus.type === 'success' ? '1px solid #bbf7d0' : '1px solid #fecaca',
                color: saveStatus.type === 'success' ? '#15803d' : '#b91c1c',
              }}
            >
              {saveStatus.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
              <span>{saveStatus.message}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div
            style={{
              marginTop: '30px',
              paddingTop: '20px',
              borderTop: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            {/* Test Connection Button */}
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={testing || (!apiKey && !hasStoredKey)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '8px',
                border: '1.5px solid #cbd5e1',
                background: '#ffffff',
                color: '#334155',
                fontSize: '13.5px',
                fontWeight: 700,
                cursor: testing || (!apiKey && !hasStoredKey) ? 'not-allowed' : 'pointer',
                opacity: testing || (!apiKey && !hasStoredKey) ? 0.6 : 1,
                transition: 'all 0.2s ease',
              }}
            >
              {testing ? <Loader2 size={16} className={styles.spin} /> : <Sparkles size={16} color="#1d4ed8" />}
              <span>{testing ? 'Testing Connection...' : 'Test Connection / 接続テスト'}</span>
            </button>

            {/* Save Settings Button */}
            <button
              type="button"
              onClick={handleSaveSettings}
              disabled={saving}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 24px',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)',
                color: '#ffffff',
                fontSize: '13.5px',
                fontWeight: 700,
                cursor: saving ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 12px rgba(29, 78, 216, 0.25)',
                transition: 'all 0.2s ease',
              }}
            >
              {saving ? <Loader2 size={16} className={styles.spin} /> : <Save size={16} />}
              <span>{saving ? 'Saving Settings...' : 'Save Settings / 設定を保存'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Helper Info Card */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '24px 28px',
          boxShadow: '0 2px 10px rgba(0, 0, 0, 0.02)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <Info size={18} color="var(--nikkou-navy)" />
          <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--nikkou-navy)' }}>
            How AI Document Auto-Fill Works / AIドキュメント自動入力の使い方
          </h4>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
            <div style={{ fontWeight: 800, color: '#1f3864', fontSize: '13px', marginBottom: '4px' }}>
              1. Attach Any Document
            </div>
            <div style={{ fontSize: '12.5px', color: '#64748b', lineHeight: 1.45 }}>
              Upload an image (JPG, PNG), scanned PDF, or resume document. The AI reads Japanese, English, and Bengali text.
            </div>
          </div>

          <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
            <div style={{ fontWeight: 800, color: '#1f3864', fontSize: '13px', marginBottom: '4px' }}>
              2. Optional Custom Prompt
            </div>
            <div style={{ fontSize: '12.5px', color: '#64748b', lineHeight: 1.45 }}>
              You can provide additional context (e.g. &ldquo;Candidate passed JLPT N4 in 2024&rdquo;) to help the AI map specific fields.
            </div>
          </div>

          <div style={{ padding: '14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
            <div style={{ fontWeight: 800, color: '#1f3864', fontSize: '13px', marginBottom: '4px' }}>
              3. Automatic Mapping
            </div>
            <div style={{ fontSize: '12.5px', color: '#64748b', lineHeight: 1.45 }}>
              AI extracts education, personal details, work history, and family members. Any data not found remains blank and editable.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
