'use client';

import React from 'react';
import { Plus, Trash2, GraduationCap, Check } from 'lucide-react';
import { EducationEntry } from '@/types/cv';

interface EducationHistorySectionProps {
  entries: EducationEntry[];
  onChange: (entries: EducationEntry[]) => void;
  disabled?: boolean;
}

// Convert YYYY-MM to Japanese format YYYY年MM月
export function formatToJapaneseYearMonth(val: string): string {
  if (!val) return '';
  if (val === '現在も') return '現在も';
  const match = val.match(/^(\d{4})[-/.](\d{1,2})/);
  if (match) {
    const year = match[1];
    const month = match[2].padStart(2, '0');
    return `${year}年${month}月`;
  }
  return val;
}

// Helper to convert Japanese format back to HTML month picker format YYYY-MM
export function parseJapaneseYearMonthToInput(val: string): string {
  if (!val || val === '現在も') return '';
  const match = val.match(/^(\d{4})年(\d{1,2})月/);
  if (match) {
    return `${match[1]}-${match[2].padStart(2, '0')}`;
  }
  const ymMatch = val.match(/^(\d{4})[-/.](\d{1,2})/);
  if (ymMatch) {
    return `${ymMatch[1]}-${ymMatch[2].padStart(2, '0')}`;
  }
  return '';
}

export const SUBJECT_OPTIONS = [
  '芸術系 / মানবিক বিভাগ',
  '科学系 / বিজ্ঞান বিভাগ',
  '商業系 / ব্যবসায় শিক্ষা বিভাগ',
  'JLPT N5 / জাপানি N5',
  'JLPT N4 / জাপানি N4',
  'JLPT N3 / জাপানি N3',
  'JFT-Basic / জেএফটি-বেসিক',
  '専門学校/Diploma',
];

export function normalizeSubject(val: string | null | undefined): string {
  if (!val) return '';
  const trimmed = String(val).trim();
  if (SUBJECT_OPTIONS.includes(trimmed)) return trimmed;
  if (trimmed.includes('専門学校') || trimmed.toLowerCase().includes('diploma') || trimmed.includes('ডিপ্লোমা')) {
    return '専門学校/Diploma';
  }
  if (trimmed.includes('自然科学') || trimmed.includes('科学') || trimmed.includes('বিজ্ঞান')) {
    return '科学系 / বিজ্ঞান বিভাগ';
  }
  if (trimmed.includes('芸術') || trimmed.includes('人文') || trimmed.includes('মানবিক')) {
    return '芸術系 / মানবিক বিভাগ';
  }
  if (trimmed.includes('商業') || trimmed.includes('ব্যবসা') || trimmed.includes('ব্যবসায়')) {
    return '商業系 / ব্যবসায় শিক্ষা বিভাগ';
  }
  if (/n5/i.test(trimmed)) return 'JLPT N5 / জাপানি N5';
  if (/n4/i.test(trimmed)) return 'JLPT N4 / জাপানি N4';
  if (/n3/i.test(trimmed)) return 'JLPT N3 / জাপানি N3';
  if (/jft/i.test(trimmed)) return 'JFT-Basic / জেএফটি-বেসিক';
  return trimmed;
}

export const QUALIFICATION_OPTIONS = [
  '中学校卒業 / মাধ্যমিক পাস (SSC)',
  '高校卒業 / উচ্চ মাধ্যমিক পাস (HSC)',
  '専門学校/Diploma',
  '大学卒業 / স্নাতক (Honours / Bachelor)',
  '大学院修了 / স্নাতকোত্তর (Master\'s)',
  '日本語 / জাপানি ভাষা (JLPT / NAT)',
  'その他 / অন্যান্য',
];

export const INITIAL_EDUCATION_ROWS: EducationEntry[] = [
  {
    id: 'edu-1',
    start_year_month: '',
    end_year_month: '',
    school_name: '',
    major_subject: '',
    qualification: '',
  },
  {
    id: 'edu-2',
    start_year_month: '',
    end_year_month: '',
    school_name: '',
    major_subject: '',
    qualification: '',
  },
  {
    id: 'edu-3',
    start_year_month: '',
    end_year_month: '',
    school_name: '',
    major_subject: '',
    qualification: '',
  },
];

export default function EducationHistorySection({
  entries,
  onChange,
  disabled = false,
}: EducationHistorySectionProps) {
  const handleFieldChange = (index: number, field: keyof EducationEntry, value: string) => {
    const updated = [...entries];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const handleAddRow = () => {
    const newEntry: EducationEntry = {
      id: `edu-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      start_year_month: '',
      end_year_month: '',
      school_name: '',
      major_subject: '',
      qualification: '',
    };
    onChange([...entries, newEntry]);
  };

  const handleRemoveRow = (index: number) => {
    if (entries.length <= 1) return;
    const updated = entries.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleToggleCurrent = (index: number) => {
    const current = entries[index].end_year_month;
    if (current === '現在も') {
      handleFieldChange(index, 'end_year_month', '');
    } else {
      handleFieldChange(index, 'end_year_month', '現在も');
    }
  };

  return (
    <div style={{ marginTop: '36px', marginBottom: '28px' }}>
      {/* Section Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '2px solid #fecaca',
          paddingBottom: '10px',
          marginBottom: '20px',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '8px',
              height: '22px',
              background: 'var(--nikkou-red)',
              borderRadius: '4px',
            }}
          />
          <h2
            style={{
              fontSize: '18px',
              fontWeight: 800,
              color: 'var(--nikkou-red)',
              letterSpacing: '0.3px',
              margin: 0,
            }}
          >
            学歴 / শিক্ষাগত যোগ্যতা
          </h2>
        </div>

        <button
          type="button"
          onClick={handleAddRow}
          disabled={disabled}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            background: '#fff',
            border: '1.5px solid var(--nikkou-navy)',
            borderRadius: '8px',
            color: 'var(--nikkou-navy)',
            fontSize: '13px',
            fontWeight: 700,
            cursor: disabled ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <Plus size={15} />
          <span>行を追加 / আরও যোগ করুন</span>
        </button>
      </div>

      <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
        ※ 中学校（SSC）、高校（HSC）、日本語学校（Nikkou Centre等）の順でご記入ください。
        <br />
        (দয়া করে মাধ্যমিক, উচ্চ মাধ্যমিক, এবং জাপানিজ ভাষা স্কুলের তথ্য ধারাবাহিকভাবে লিখুন)
      </p>

      <style>{`
        .edu-card {
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: 12px;
          padding: 18px;
          position: relative;
          box-shadow: 0 2px 6px rgba(0,0,0,0.02);
        }
        .edu-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
          gap: 14px;
        }
        @media (max-width: 768px) {
          .edu-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        @media (max-width: 640px) {
          .edu-card {
            padding: 14px 10px !important;
          }
          .edu-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
        }
      `}</style>

      {/* Rows Container */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {entries.map((entry, idx) => {
          const isCurrent = entry.end_year_month === '現在も';
          const monthInputVal = parseJapaneseYearMonthToInput(entry.start_year_month);
          const endMonthInputVal = isCurrent ? '' : parseJapaneseYearMonthToInput(entry.end_year_month);

          return (
            <div
              key={entry.id || `edu-row-${idx}`}
              className="edu-card"
            >
              {/* Row Badge & Actions */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '14px',
                  paddingBottom: '8px',
                  borderBottom: '1px dashed var(--border-light)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      background: 'rgba(230, 43, 43, 0.1)',
                      color: 'var(--nikkou-red)',
                      fontSize: '12px',
                      fontWeight: 700,
                      padding: '3px 10px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <GraduationCap size={13} />
                    {entry.qualification || entry.school_name
                      ? `${entry.qualification || entry.school_name}`
                      : idx === 0
                        ? '中学校 / মাধ্যমিক'
                        : idx === 1
                          ? '高等学校 / উচ্চ মাধ্যমিক'
                          : idx === 2
                            ? '日本語学校 / কোর্স'
                            : `学歴 #${idx + 1} / শিক্ষাগত যোগ্যতা`}
                  </span>
                </div>

                {entries.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveRow(idx)}
                    disabled={disabled}
                    title="削除 / মুছুন"
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#dc2626',
                      cursor: disabled ? 'not-allowed' : 'pointer',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '12px',
                      fontWeight: 600,
                    }}
                  >
                    <Trash2 size={14} />
                    <span>削除 / মুছুন</span>
                  </button>
                )}
              </div>

              {/* Grid for 5 Columns */}
              <div className="edu-grid">
                {/* Col 1: 開始年 / শুরুর বছর */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      color: 'var(--nikkou-navy)',
                      marginBottom: '5px',
                    }}
                  >
                    開始年 / শুরুর বছর
                  </label>
                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <input
                      type="month"
                      value={monthInputVal}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleFieldChange(idx, 'start_year_month', formatToJapaneseYearMonth(val));
                      }}
                      style={{
                        width: '44px',
                        height: '42px',
                        padding: '0 4px',
                        borderRadius: '8px',
                        border: '1.5px solid var(--border-light)',
                        fontSize: '13px',
                        color: 'var(--text-primary)',
                        background: '#ffffff',
                        outline: 'none',
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                      title="カレンダーから選択 / ক্যালেন্ডার থেকে নির্বাচন"
                    />
                    <input
                      type="text"
                      value={entry.start_year_month}
                      onChange={(e) => handleFieldChange(idx, 'start_year_month', e.target.value)}
                      placeholder="例: 2013年01月"
                      style={{
                        flex: 1,
                        height: '42px',
                        padding: '0 12px',
                        borderRadius: '8px',
                        border: '1.5px solid var(--border-light)',
                        fontSize: '13.5px',
                        color: 'var(--text-primary)',
                        background: '#ffffff',
                        outline: 'none',
                        minWidth: 0,
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px', display: 'block' }}>
                    YYYY年MM月 (সরাসরি সম্পাদনাযোগ্য)
                  </span>
                </div>

                {/* Col 2: 終了年 / সমাপ্তি বছর + 現在も toggle */}
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '5px',
                    }}
                  >
                    <label
                      style={{
                        fontSize: '12.5px',
                        fontWeight: 700,
                        color: 'var(--nikkou-navy)',
                        margin: 0,
                      }}
                    >
                      終了年 / সমাপ্তি বছর
                    </label>

                    <button
                      type="button"
                      onClick={() => handleToggleCurrent(idx)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 7px',
                        borderRadius: '4px',
                        border: isCurrent ? '1px solid #059669' : '1px solid #cbd5e1',
                        background: isCurrent ? '#ecfdf5' : '#f8fafc',
                        color: isCurrent ? '#059669' : '#64748b',
                        cursor: 'pointer',
                      }}
                    >
                      {isCurrent && <Check size={11} />}
                      現在も / চলমান
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <input
                      type="month"
                      value={endMonthInputVal}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleFieldChange(idx, 'end_year_month', formatToJapaneseYearMonth(val));
                      }}
                      style={{
                        width: '44px',
                        height: '42px',
                        padding: '0 4px',
                        borderRadius: '8px',
                        border: '1.5px solid var(--border-light)',
                        fontSize: '13px',
                        color: 'var(--text-primary)',
                        background: '#ffffff',
                        outline: 'none',
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                      title="カレンダーから選択 / ক্যালেন্ডার থেকে নির্বাচন"
                    />
                    <input
                      type="text"
                      value={entry.end_year_month}
                      onChange={(e) => handleFieldChange(idx, 'end_year_month', e.target.value)}
                      placeholder="例: 2018年02月 または 現在も"
                      style={{
                        flex: 1,
                        height: '42px',
                        padding: '0 12px',
                        borderRadius: '8px',
                        border: isCurrent ? '1.5px solid #059669' : '1.5px solid var(--border-light)',
                        fontSize: '13.5px',
                        color: isCurrent ? '#059669' : 'var(--text-primary)',
                        fontWeight: isCurrent ? 700 : 400,
                        background: isCurrent ? '#ecfdf5' : '#ffffff',
                        outline: 'none',
                        minWidth: 0,
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px', display: 'block' }}>
                    YYYY年MM月 または「現在も」
                  </span>
                </div>

                {/* Col 3: 学校名 / স্কুলের নাম */}
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '5px',
                    }}
                  >
                    <label
                      style={{
                        fontSize: '12.5px',
                        fontWeight: 700,
                        color: 'var(--nikkou-navy)',
                      }}
                    >
                      学校名 / স্কুলের নাম
                    </label>

                    <button
                      type="button"
                      onClick={() => handleFieldChange(idx, 'school_name', 'NIKKOU CENTRE')}
                      style={{
                        fontSize: '11px',
                        fontWeight: 600,
                        padding: '1px 6px',
                        borderRadius: '4px',
                        border: '1px dashed #cbd5e1',
                        background: '#f8fafc',
                        color: 'var(--nikkou-navy)',
                        cursor: 'pointer',
                      }}
                    >
                      + Nikkou Centre
                    </button>
                  </div>

                  <input
                    type="text"
                    value={entry.school_name}
                    onChange={(e) => handleFieldChange(idx, 'school_name', e.target.value.toUpperCase())}
                    placeholder="例: JHALMALIA HIGH SCHOOL"
                    style={{
                      width: '100%',
                      height: '42px',
                      padding: '0 12px',
                      borderRadius: '8px',
                      border: '1.5px solid var(--border-light)',
                      fontSize: '13.5px',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      textTransform: 'uppercase',
                    }}
                  />
                </div>

                {/* Col 4: 専攻 / সাবজেক্ট (Dropdown + Freely Typable Text Input) */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      color: 'var(--nikkou-navy)',
                      marginBottom: '5px',
                    }}
                  >
                    専攻 / সাবজেক্ট
                  </label>
                  <select
                    value={normalizeSubject(entry.major_subject)}
                    onChange={(e) => handleFieldChange(idx, 'major_subject', e.target.value)}
                    style={{
                      width: '100%',
                      height: '42px',
                      padding: '0 12px',
                      borderRadius: '8px',
                      border: '1.5px solid var(--border-light)',
                      fontSize: '13.5px',
                      color: normalizeSubject(entry.major_subject) ? 'var(--text-primary)' : '#94a3b8',
                      background: '#ffffff',
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="">選択してください / বিভাগ নির্বাচন করুন</option>
                    {SUBJECT_OPTIONS.map((subj) => (
                      <option key={subj} value={subj}>
                        {subj}
                      </option>
                    ))}
                    {entry.major_subject && !SUBJECT_OPTIONS.includes(normalizeSubject(entry.major_subject)) && (
                      <option value={entry.major_subject}>{entry.major_subject}</option>
                    )}
                  </select>
                  <input
                    type="text"
                    value={entry.major_subject}
                    onChange={(e) => handleFieldChange(idx, 'major_subject', e.target.value)}
                    placeholder="または直接入力 / অথবা সরাসরি লিখুন"
                    style={{
                      width: '100%',
                      height: '36px',
                      padding: '0 10px',
                      borderRadius: '6px',
                      border: '1.5px solid var(--border-light)',
                      fontSize: '12.5px',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      marginTop: '6px',
                      background: '#ffffff',
                    }}
                  />
                </div>

                {/* Col 5: 学位 / লাইসেন্স・ যোগ্যতা (Dropdown + Freely Typable Text Input) */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      color: 'var(--nikkou-navy)',
                      marginBottom: '5px',
                    }}
                  >
                    学位 / লাইসেন্স・ যোগ্যতা
                  </label>
                  <select
                    value={
                      QUALIFICATION_OPTIONS.includes(entry.qualification)
                        ? entry.qualification
                        : (entry.qualification?.toLowerCase().includes('diploma') || entry.qualification?.includes('専門学校')
                            ? '専門学校/Diploma'
                            : (entry.qualification ? 'その他 / অন্যান্য' : ''))
                    }
                    onChange={(e) => handleFieldChange(idx, 'qualification', e.target.value)}
                    style={{
                      width: '100%',
                      height: '42px',
                      padding: '0 12px',
                      borderRadius: '8px',
                      border: '1.5px solid var(--border-light)',
                      fontSize: '13.5px',
                      color: entry.qualification ? 'var(--text-primary)' : '#94a3b8',
                      background: '#ffffff',
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="">選択してください / যোগ্যতা নির্বাচন করুন</option>
                    {QUALIFICATION_OPTIONS.map((q) => (
                      <option key={q} value={q}>
                        {q}
                      </option>
                    ))}
                    {entry.qualification && !QUALIFICATION_OPTIONS.includes(entry.qualification) && (
                      <option value={entry.qualification}>{entry.qualification}</option>
                    )}
                  </select>
                  <input
                    type="text"
                    value={entry.qualification === 'その他 / অন্যান্য' ? '' : entry.qualification}
                    onChange={(e) => handleFieldChange(idx, 'qualification', e.target.value || 'その他 / অন্যান্য')}
                    placeholder="具体的な資格名・学位を直接入力 / সরাসরি যোগ্যতা লিখুন"
                    style={{
                      width: '100%',
                      height: '36px',
                      padding: '0 10px',
                      borderRadius: '6px',
                      border: '1.5px solid var(--border-light)',
                      fontSize: '12.5px',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      marginTop: '6px',
                      background: '#ffffff',
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
