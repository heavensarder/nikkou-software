'use client';

import React from 'react';
import { Award, CheckCircle2, Clock } from 'lucide-react';
import {
  getSkillTestsForCategory,
  SkillTestItem,
} from '@/lib/skill-tests';
import { normalizeProgramId } from '@/lib/programs';

interface SkillTestSectionProps {
  program: string;
  subProgram: string;
  skillTests: Record<string, string>;
  onChange: (testId: string, value: string) => void;
  disabled?: boolean;
}

export default function SkillTestSection({
  program,
  subProgram,
  skillTests,
  onChange,
  disabled = false,
}: SkillTestSectionProps) {
  const normProg = normalizeProgramId(program);

  // This section is only displayed when SSW (特定技能) is selected
  if (normProg !== 'SSW') {
    return null;
  }

  const tests: SkillTestItem[] = getSkillTestsForCategory('SSW', subProgram);

  return (
    <div
      className="skill-test-section"
      style={{
        background: '#ffffff',
        border: '1.5px solid #e2e8f0',
        borderRadius: '12px',
        padding: '24px',
        marginBottom: '28px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
        transition: 'all 0.2s ease',
      }}
    >
      <style>{`
        @media (max-width: 768px) {
          .skill-test-section {
            padding: 16px 12px !important;
            margin-bottom: 20px !important;
            border-radius: 10px !important;
          }
          .skill-test-header-title {
            font-size: 16px !important;
          }
          .skill-test-card {
            flex-direction: column !important;
            align-items: stretch !important;
            padding: 14px 12px !important;
            gap: 12px !important;
          }
          .skill-test-options-group {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 8px !important;
            width: 100% !important;
          }
          .skill-test-option-btn {
            width: 100% !important;
            justifyContent: center !important;
            padding: 10px 8px !important;
            font-size: 13px !important;
          }
        }

        @media (max-width: 480px) {
          .skill-test-options-group {
            grid-template-columns: 1fr !important;
            gap: 8px !important;
          }
          .skill-test-option-btn {
            padding: 11px 12px !important;
            font-size: 13.5px !important;
          }
        }
      `}</style>

      {/* Section Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '18px',
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
            className="skill-test-header-title"
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
            <Award size={20} />
            技能試験 / স্কিল টেস্ট (Skill Test)
          </h2>
        </div>

        <span
          style={{
            fontSize: '11.5px',
            fontWeight: 700,
            color: '#c2410c',
            backgroundColor: '#fff7ed',
            border: '1px solid #fed7aa',
            padding: '3px 10px',
            borderRadius: '9999px',
          }}
        >
          特定技能 (SSW) 対象
        </span>
      </div>

      <p style={{ fontSize: '13.5px', color: '#64748b', margin: '0 0 16px 0', lineHeight: 1.5 }}>
        আবেদনকারীর নির্দিষ্ট দক্ষ কর্মী (SSW) পরীক্ষার মূল্যায়ন ও স্থিতি নির্বাচন করুন (Select Skill Test Status):
      </p>

      {tests.length === 0 ? (
        <div
          style={{
            padding: '16px',
            background: '#f8fafc',
            border: '1px dashed #cbd5e1',
            borderRadius: '8px',
            color: '#64748b',
            fontSize: '13.5px',
            textAlign: 'center',
            lineHeight: 1.5,
          }}
        >
          {subProgram ? (
            <span>
              現在選択中の職種（<strong>{subProgram}</strong>）には追加の技能試験設定はありません。
            </span>
          ) : (
            <span>
              職種・分野（Sub-Category）を選択すると、該当する技能試験の選択肢が表示されます。
            </span>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {tests.map((test) => {
            const currentVal = skillTests[test.id] || test.defaultOption || '';

            return (
              <div
                key={test.id}
                className="skill-test-card"
                style={{
                  background: '#f8fafc',
                  border: '1.5px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '16px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div style={{ flex: '1 1 240px' }}>
                  <div
                    style={{
                      fontSize: '15px',
                      fontWeight: 800,
                      color: 'var(--nikkou-navy, #1e293b)',
                      marginBottom: '4px',
                    }}
                  >
                    {test.nameJp}
                  </div>
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 600,
                      color: '#475569',
                      lineHeight: 1.35,
                    }}
                  >
                    {test.nameEn}
                    {test.nameBn ? ` · ${test.nameBn}` : ''}
                  </div>
                </div>

                <div
                  className="skill-test-options-group"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                  }}
                >
                  {test.options.map((opt) => {
                    const isPassed = opt.value.includes('合格');
                    const isSelected =
                      currentVal === opt.value ||
                      (isPassed && (currentVal.includes('合格') || currentVal.toLowerCase().includes('pass'))) ||
                      (!isPassed && (currentVal.includes('準備中') || currentVal.toLowerCase().includes('prep')));

                    const activeBorder = isPassed ? '#16a34a' : '#2563eb';
                    const activeBg = isPassed ? '#f0fdf4' : '#eff6ff';
                    const activeColor = isPassed ? '#15803d' : '#1d4ed8';

                    return (
                      <button
                        key={opt.value}
                        type="button"
                        disabled={disabled}
                        onClick={() => onChange(test.id, opt.value)}
                        className="skill-test-option-btn"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '10px 16px',
                          borderRadius: '8px',
                          fontSize: '13.5px',
                          fontWeight: 700,
                          cursor: disabled ? 'not-allowed' : 'pointer',
                          border: isSelected ? `2px solid ${activeBorder}` : '1.5px solid #cbd5e1',
                          background: isSelected ? activeBg : '#ffffff',
                          color: isSelected ? activeColor : '#334155',
                          boxShadow: isSelected ? '0 2px 6px rgba(0,0,0,0.06)' : 'none',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {isPassed ? (
                          <CheckCircle2
                            size={16}
                            color={isSelected ? activeColor : '#94a3b8'}
                            strokeWidth={isSelected ? 2.5 : 2}
                          />
                        ) : (
                          <Clock
                            size={16}
                            color={isSelected ? activeColor : '#94a3b8'}
                            strokeWidth={isSelected ? 2.5 : 2}
                          />
                        )}
                        <span>{opt.value}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
