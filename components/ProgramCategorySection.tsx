'use client';

import React from 'react';
import {
  PROGRAM_OPTIONS,
  getSubPrograms,
  normalizeProgramId,
  isSubProgramMatching,
  formatProgramBadge,
} from '@/lib/programs';
import { Layers, CheckCircle2, Lock } from 'lucide-react';

interface ProgramCategorySectionProps {
  program: string;
  subProgram: string;
  onChangeProgram: (program: string) => void;
  onChangeSubProgram: (subProgram: string) => void;
  lockedProgram?: boolean;
  lockedSubProgram?: boolean;
  lockedCategoryOnly?: boolean;
}

export default function ProgramCategorySection({
  program,
  subProgram,
  onChangeProgram,
  onChangeSubProgram,
  lockedProgram = false,
  lockedSubProgram = false,
  lockedCategoryOnly = false,
}: ProgramCategorySectionProps) {
  const normalizedProg = normalizeProgramId(program);
  const currentSubPrograms = getSubPrograms(normalizedProg);
  const isAnyLocked = Boolean(lockedProgram || lockedSubProgram || lockedCategoryOnly);

  const handleProgramSelect = (selectedProg: string) => {
    if (lockedProgram) return;
    if (normalizedProg === selectedProg) {
      onChangeProgram('');
      onChangeSubProgram('');
      return;
    }
    onChangeProgram(selectedProg);
    // Auto-reset subProgram when main program changes
    onChangeSubProgram('');
  };

  return (
    <div
      className="prog-card-container"
      style={{
        background: '#ffffff',
        border: '1.5px solid #e2e8f0',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '28px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
      }}
    >
      <style>{`
        @media (max-width: 640px) {
          .prog-card-container {
            padding: 16px 12px !important;
            margin-bottom: 20px !important;
          }
          .prog-options-grid {
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }
          .subprog-options-grid {
            grid-template-columns: 1fr !important;
            gap: 8px !important;
          }
          .prog-header-title {
            font-size: 15.5px !important;
          }
        }
      `}</style>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          paddingBottom: '12px',
          borderBottom: '1px solid var(--border-light, #e2e8f0)',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '8px',
              height: '22px',
              background: 'var(--nikkou-red, #dc2626)',
              borderRadius: '4px',
            }}
          />
          <h2
            className="prog-header-title"
            style={{
              fontSize: '18px',
              fontWeight: 800,
              color: 'var(--nikkou-red, #dc2626)',
              letterSpacing: '0.3px',
              margin: 0,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Layers size={20} />
            プログラム選択 / প্রোগ্রাম নির্বাচন (Category)
          </h2>
        </div>

        {isAnyLocked ? (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '11.5px',
              fontWeight: 800,
              color: '#b91c1c',
              backgroundColor: '#fef2f2',
              border: '1.5px solid #fca5a5',
              padding: '4px 12px',
              borderRadius: '9999px',
            }}
          >
            <Lock size={13} />
            固定カテゴリー / ক্যাটাগরি নির্ধারিত (Fixed)
          </span>
        ) : (
          <span
            style={{
              fontSize: '11.5px',
              fontWeight: 700,
              color: '#64748b',
              backgroundColor: '#f1f5f9',
              border: '1px solid #cbd5e1',
              padding: '3px 10px',
              borderRadius: '9999px',
            }}
          >
            任意 / ঐচ্ছিক
          </span>
        )}
      </div>

      {isAnyLocked ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            padding: '12px 16px',
            marginBottom: '18px',
            borderRadius: '10px',
            backgroundColor: '#fff7ed',
            border: '1.5px solid #fdba74',
            color: '#9a3412',
            fontSize: '13px',
            lineHeight: 1.5,
          }}
        >
          <Lock size={18} style={{ flexShrink: 0, marginTop: '2px', color: '#ea580c' }} />
          <div>
            <div style={{ fontWeight: 800, color: '#7c2d12', marginBottom: '2px' }}>
              Application Category Fixed: {formatProgramBadge(program, subProgram)}
            </div>
            <div>
              এই ফর্মটি উপরোক্ত নির্ধারিত প্রোগ্রাম ও ক্যাটাগরির আবেদনের জন্য নির্ধারিত (Category is locked by administration and cannot be changed).
            </div>
          </div>
        </div>
      ) : (
        <p style={{ fontSize: '13.5px', color: '#64748b', margin: '0 0 16px 0', lineHeight: 1.5 }}>
          আবেদনের ধরণ এবং কাজের ক্ষেত্র/বিষয় নির্বাচন করুন (Select the program and field/course for this application):
        </p>
      )}

      {/* Program Selection Cards / Pills */}
      <div style={{ marginBottom: '22px' }}>
        <label
          style={{
            display: 'block',
            fontSize: '13.5px',
            fontWeight: 700,
            color: 'var(--nikkou-navy, #1e293b)',
            marginBottom: '10px',
          }}
        >
          1. プログラム / প্রোগ্রাম (Select Program)
        </label>

        <div
          className="prog-options-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '12px',
          }}
        >
          {PROGRAM_OPTIONS.map((opt) => {
            const isSelected = normalizedProg === opt.id;
            const isOptionDisabled = lockedProgram && !isSelected;
            return (
              <button
                key={opt.id}
                type="button"
                disabled={lockedProgram}
                onClick={() => handleProgramSelect(opt.id)}
                style={{
                  textAlign: 'left',
                  padding: '14px 16px',
                  borderRadius: '10px',
                  border: isSelected
                    ? '2px solid var(--nikkou-red, #dc2626)'
                    : '1.5px solid #e2e8f0',
                  background: isSelected ? '#fef2f2' : isOptionDisabled ? '#f8fafc' : '#ffffff',
                  cursor: lockedProgram ? 'not-allowed' : 'pointer',
                  opacity: isOptionDisabled ? 0.42 : 1,
                  transition: 'all 0.18s ease-in-out',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  boxShadow: isSelected ? '0 4px 12px rgba(220,38,38,0.12)' : 'none',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: '15px',
                      fontWeight: 800,
                      color: isSelected ? 'var(--nikkou-red, #dc2626)' : 'var(--nikkou-navy, #1e293b)',
                      marginBottom: '3px',
                    }}
                  >
                    {opt.label}
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>
                    {opt.labelJp} · {opt.labelBn}
                  </div>
                </div>

                <div
                  style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    border: isSelected ? '2px solid var(--nikkou-red, #dc2626)' : '2px solid #cbd5e1',
                    background: isSelected ? 'var(--nikkou-red, #dc2626)' : '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    marginTop: '2px',
                  }}
                >
                  {isSelected && <CheckCircle2 size={14} color="#ffffff" strokeWidth={3} />}
                </div>
              </button>
            );
          })}
        </div>

        {normalizedProg && !lockedProgram && (
          <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={() => {
                onChangeProgram('');
                onChangeSubProgram('');
              }}
              style={{
                fontSize: '12px',
                color: '#64748b',
                background: 'transparent',
                border: 'none',
                textDecoration: 'underline',
                cursor: 'pointer',
                padding: '2px 4px',
              }}
            >
              Clear program selection
            </button>
          </div>
        )}
      </div>

      {/* Sub-Program / Field Selection */}
      {normalizedProg && (
        <div
          style={{
            padding: '18px',
            background: '#f8fafc',
            borderRadius: '10px',
            border: '1.5px solid #e2e8f0',
            animation: 'fadeIn 0.2s ease',
          }}
        >
          <label
            style={{
              display: 'block',
              fontSize: '13.5px',
              fontWeight: 700,
              color: 'var(--nikkou-navy, #1e293b)',
              marginBottom: '10px',
            }}
          >
            2. 職種・分野・専攻 / ক্ষেত্র বা কোর্স (Category under {normalizedProg})
          </label>

          <div
            className="subprog-options-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '10px',
            }}
          >
            {currentSubPrograms.map((sub) => {
              const hasSubOptions = Array.isArray(sub.subOptions) && sub.subOptions.length > 0;
              const isSelected = isSubProgramMatching(subProgram, sub.id);
              const isCategoryLocked = lockedSubProgram || lockedCategoryOnly;
              const isOptionDisabled = isCategoryLocked && !isSelected;

              const handleCategoryClick = () => {
                if (isCategoryLocked) return;
                if (isSelected) {
                  onChangeSubProgram('');
                } else if (hasSubOptions) {
                  // Default to first sub-option (General Crop Farming) when clicking Agriculture
                  onChangeSubProgram(sub.subOptions![0].id);
                } else {
                  onChangeSubProgram(sub.id);
                }
              };

              return (
                <button
                  key={sub.id}
                  type="button"
                  disabled={isCategoryLocked}
                  onClick={handleCategoryClick}
                  style={{
                    textAlign: 'left',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: isSelected
                      ? '2px solid var(--nikkou-red, #dc2626)'
                      : '1.5px solid #cbd5e1',
                    background: isSelected ? '#ffffff' : isOptionDisabled ? '#f1f5f9' : '#ffffff',
                    cursor: isCategoryLocked ? 'not-allowed' : 'pointer',
                    opacity: isOptionDisabled ? 0.42 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    boxShadow: isSelected ? '0 2px 8px rgba(220,38,38,0.15)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: '13.5px',
                        fontWeight: 700,
                        color: isSelected ? 'var(--nikkou-red, #dc2626)' : '#1e293b',
                      }}
                    >
                      {sub.label}
                    </div>
                    <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                      {sub.labelJp} · {sub.labelBn}
                    </div>
                  </div>

                  <div
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      border: isSelected ? '2px solid var(--nikkou-red, #dc2626)' : '1.5px solid #cbd5e1',
                      background: isSelected ? 'var(--nikkou-red, #dc2626)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {isSelected && <CheckCircle2 size={12} color="#ffffff" strokeWidth={3} />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Nested Sub-options under SSW > Agriculture */}
          {(() => {
            const agriOption = currentSubPrograms.find((s) => s.id === 'Agriculture' && Array.isArray(s.subOptions));
            const isAgriActive = agriOption && isSubProgramMatching(subProgram, 'Agriculture');

            if (!isAgriActive || !agriOption || !agriOption.subOptions) return null;

            return (
              <div
                style={{
                  marginTop: '16px',
                  padding: '16px',
                  background: '#ffffff',
                  borderRadius: '10px',
                  border: '1.5px solid #fed7aa',
                  boxShadow: '0 2px 8px rgba(234,88,12,0.06)',
                  animation: 'fadeIn 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '13.5px', fontWeight: 800, color: '#c2410c' }}>
                    🌾 農業の作業分野を選択 / Select Agriculture Sector (SSW):
                  </span>
                  <span style={{ fontSize: '11.5px', color: '#9a3412', fontWeight: 600 }}>
                    {lockedSubProgram
                      ? '🔒 固定された作業分野 / নির্ধারিত কৃষি ক্ষেত্র (Fixed Sector)'
                      : '※ 耕種農業または畜産農業を選択してください'}
                  </span>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: '10px',
                  }}
                >
                  {agriOption.subOptions.map((subOpt) => {
                    const isSubOptSelected = isSubProgramMatching(subProgram, subOpt.id);
                    const isSubOptDisabled = lockedSubProgram && !isSubOptSelected;

                    return (
                      <button
                        key={subOpt.id}
                        type="button"
                        disabled={lockedSubProgram}
                        onClick={() => {
                          if (lockedSubProgram) return;
                          onChangeSubProgram(subOpt.id);
                        }}
                        style={{
                          textAlign: 'left',
                          padding: '12px 14px',
                          borderRadius: '8px',
                          border: isSubOptSelected ? '2px solid #ea580c' : '1.5px solid #fed7aa',
                          background: isSubOptSelected ? '#fff7ed' : isSubOptDisabled ? '#f8fafc' : '#ffffff',
                          cursor: lockedSubProgram ? 'not-allowed' : 'pointer',
                          opacity: isSubOptDisabled ? 0.42 : 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          boxShadow: isSubOptSelected ? '0 2px 6px rgba(234,88,12,0.15)' : 'none',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div>
                          <div
                            style={{
                              fontSize: '13.5px',
                              fontWeight: 800,
                              color: isSubOptSelected ? '#c2410c' : '#1e293b',
                            }}
                          >
                            {subOpt.label}
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#7c2d12', marginTop: '2px', fontWeight: 600 }}>
                            {subOpt.labelJp} · {subOpt.labelBn}
                          </div>
                        </div>

                        <div
                          style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '50%',
                            border: isSubOptSelected ? '2px solid #ea580c' : '1.5px solid #fed7aa',
                            background: isSubOptSelected ? '#ea580c' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {isSubOptSelected && <CheckCircle2 size={12} color="#ffffff" strokeWidth={3} />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {subProgram && !lockedSubProgram && !lockedCategoryOnly && (
            <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={() => onChangeSubProgram('')}
                style={{
                  fontSize: '12px',
                  color: '#64748b',
                  background: 'transparent',
                  border: 'none',
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  padding: '2px 4px',
                }}
              >
                Clear category selection
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
