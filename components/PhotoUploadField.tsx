'use client';

import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Trash2, RefreshCw, AlertCircle, CheckCircle } from 'lucide-react';

interface PhotoUploadFieldProps {
  value: string | null;
  onChange: (base64: string | null) => void;
  disabled?: boolean;
}

function compressImage(dataUrl: string, maxWidth = 800, maxHeight = 1000, quality = 0.85): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;

      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      resolve(compressedDataUrl);
    };
    img.onerror = () => {
      resolve(dataUrl);
    };
    img.src = dataUrl;
  });
}

export default function PhotoUploadField({
  value,
  onChange,
  disabled = false,
}: PhotoUploadFieldProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileProcess = (file: File) => {
    setError(null);
    if (!file.type.startsWith('image/')) {
      setError('画像ファイルをアップロードしてください / সঠিক ইমেজ ফাইল আপলোড করুন।');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setError('画像サイズは15MB以下にしてください / ছবির সাইজ ১৫ মেগাবাইটের বেশি হতে পারবে না।');
      return;
    }

    setProcessing(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const rawBase64 = e.target?.result as string;
        const compressedBase64 = await compressImage(rawBase64);
        onChange(compressedBase64);
      } catch (err) {
        console.error('Image compression error:', err);
        setError('ছবির সাইজ অপ্টিমাইজ করতে ব্যর্থ হয়েছে।');
      } finally {
        setProcessing(false);
      }
    };
    reader.onerror = () => {
      setProcessing(false);
      setError('ファイルの読み込みに失敗しました / ফাইলটি পড়তে ব্যর্থ হয়েছে।');
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div style={{ marginBottom: '24px' }}>
      <style>{`
        .photo-preview-wrap {
          display: flex;
          align-items: center;
          gap: 24px;
          padding: 18px 24px;
          background-color: #ffffff;
          border-radius: 12px;
          border: 1.5px solid #e2e8f0;
          box-shadow: 0 4px 15px rgba(31,56,100,0.05);
          flex-wrap: wrap;
        }
        .photo-actions-group {
          display: flex;
          align-items: center;
          gap: 10px;
          flex-wrap: wrap;
        }
        .photo-action-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 9px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          min-height: 42px;
          transition: all 0.15s ease;
        }
        @media (max-width: 640px) {
          .photo-preview-wrap {
            flex-direction: column !important;
            align-items: center !important;
            text-align: center !important;
            padding: 16px 12px !important;
            gap: 16px !important;
          }
          .photo-actions-group {
            width: 100% !important;
            flex-direction: column !important;
            gap: 8px !important;
          }
          .photo-action-btn {
            width: 100% !important;
            min-height: 44px !important;
            font-size: 14px !important;
          }
          .photo-dropzone-box {
            padding: 24px 14px !important;
          }
        }
      `}</style>
      {/* Field Label: Japanese / Bengali */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <label style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--nikkou-navy)' }}>
          写真 / ছবি
        </label>

        <span
          style={{
            fontSize: '11.5px',
            fontWeight: 700,
            color: '#b45309',
            backgroundColor: '#fffbeb',
            border: '1px solid #fde68a',
            padding: '3px 8px',
            borderRadius: '9999px',
          }}
        >
          45 mm × 35 mm (縦45mm × 横35mm)
        </span>
      </div>

      {/* Mandatory Instruction Box */}
      <div
        style={{
          backgroundColor: '#f8fafc',
          border: '1.5px solid #e2e8f0',
          borderLeft: '4px solid var(--nikkou-red)',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '14px',
          fontSize: '13px',
          lineHeight: '1.6',
        }}
      >
        <div style={{ fontWeight: 700, color: 'var(--nikkou-navy)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <AlertCircle size={16} color="var(--nikkou-red)" />
          <span>写真の規定 / ছবির নির্দেশিকা</span>
        </div>
        <div style={{ color: '#334155', fontWeight: 600 }}>
          フォーマルな服装（スーツ・襟付きシャツ等）、背景無地、サイズ <strong>45mm × 35mm</strong> の鮮明な写真をご使用ください。
        </div>
        <div style={{ color: '#475569', marginTop: '2px' }}>
          অবশ্যই <strong>ফরমাল পোশাক</strong> (স্যুট বা কলারযুক্ত ফরমাল শার্ট), পরিষ্কার একরঙা ব্যাকগ্রাউন্ড এবং <strong>৪৫ মিমি × ৩৫ মিমি</strong> সাইজের স্পষ্ট ছবি হতে হবে।
        </div>
      </div>

      {error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 14px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            borderRadius: '8px',
            fontSize: '13px',
            marginBottom: '12px',
          }}
        >
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/jpg"
        onChange={handleInputChange}
        disabled={disabled}
        style={{ display: 'none' }}
      />

      {/* Upload Zone / Live Preview */}
      {processing ? (
        <div
          className="photo-dropzone-box"
          style={{
            border: '2px dashed var(--nikkou-red)',
            backgroundColor: '#fef2f2',
            borderRadius: '12px',
            padding: '36px 20px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              backgroundColor: '#fee2e2',
              color: 'var(--nikkou-red)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px auto',
            }}
          >
            <RefreshCw size={26} className="animate-spin" />
          </div>
          <div style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--nikkou-navy)', marginBottom: '4px' }}>
            写真を最適化中... / ছবি অপ্টিমাইজ করা হচ্ছে...
          </div>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Processing & compressing image for fast upload...
          </div>
        </div>
      ) : !value ? (
        <div
          className="photo-dropzone-box"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: isDragging ? '2px dashed var(--nikkou-red)' : '2px dashed #cbd5e1',
            backgroundColor: isDragging ? '#fef2f2' : '#ffffff',
            borderRadius: '12px',
            padding: '36px 20px',
            textAlign: 'center',
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: isDragging ? '0 0 0 4px rgba(230,43,43,0.1)' : 'none',
          }}
        >
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              backgroundColor: isDragging ? '#fee2e2' : '#f1f5f9',
              color: isDragging ? 'var(--nikkou-red)' : 'var(--nikkou-navy)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px auto',
              transition: 'all 0.2s ease',
            }}
          >
            <Upload size={26} />
          </div>

          <div style={{ fontSize: '14.5px', fontWeight: 700, color: 'var(--nikkou-navy)', marginBottom: '4px' }}>
            写真をドラッグ＆ドロップ、またはクリックして選択
          </div>
          <div style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            ছবি এখানে ড্র্যাগ করুন অথবা ক্লিক করে ফাইল সিলেক্ট করুন
          </div>
        </div>
      ) : (
        /* Preview Container with exact 35:45 Japanese CV ratio */
        <div
          className="photo-preview-wrap"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            padding: '18px 24px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1.5px solid #e2e8f0',
            boxShadow: '0 4px 15px rgba(31,56,100,0.05)',
            flexWrap: 'wrap',
          }}
        >
          {/* Photo Frame (35mm x 45mm ratio = 140px x 180px) */}
          <div
            style={{
              position: 'relative',
              width: '140px',
              height: '180px',
              borderRadius: '8px',
              overflow: 'hidden',
              border: '2px solid #cbd5e1',
              backgroundColor: '#f8fafc',
              boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
              flexShrink: 0,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={value}
              alt="Selected Formal Photo Preview"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
              }}
            />

            {/* Dimension Tag */}
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                backgroundColor: 'rgba(31,56,100,0.85)',
                color: '#ffffff',
                fontSize: '10px',
                fontWeight: 700,
                textAlign: 'center',
                padding: '3px 0',
                letterSpacing: '0.4px',
              }}
            >
              45mm × 35mm
            </div>
          </div>

          {/* Action buttons & Details */}
          <div style={{ flex: 1, minWidth: '220px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#059669', fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>
              <CheckCircle size={18} />
              <span>写真選択完了 / ছবি নির্বাচন সম্পন্ন হয়েছে</span>
            </div>
            <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: '1.4' }}>
              日本の履歴書規定サイズ（45mm×35mm）で保存されます / জাপানি জীবনবৃত্তান্তের নির্ধারিত আকারে সংরক্ষিত হবে।
            </p>

            <div className="photo-actions-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                className="photo-action-btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  backgroundColor: '#ffffff',
                  border: '1.5px solid var(--border-light)',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--nikkou-navy)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <RefreshCw size={14} />
                写真変更 / ছবি পরিবর্তন
              </button>

              <button
                type="button"
                onClick={handleRemove}
                disabled={disabled}
                className="photo-action-btn"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  backgroundColor: '#fef2f2',
                  border: '1.5px solid #fecaca',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#dc2626',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Trash2 size={14} />
                削除 / মুছে ফেলুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
