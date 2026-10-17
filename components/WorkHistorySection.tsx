'use client';

import React from 'react';
import { Plus, Trash2, Briefcase, Check } from 'lucide-react';
import { WorkExperienceEntry } from '@/types/cv';

interface WorkHistorySectionProps {
  entries: WorkExperienceEntry[];
  onChange: (entries: WorkExperienceEntry[]) => void;
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
  return '';
}

export const INITIAL_WORK_ROWS: WorkExperienceEntry[] = [
  {
    id: 'work-1',
    start_year_month: '',
    end_year_month: '',
    company_name: '',
    job_description: '',
  },
];

export default function WorkHistorySection({
  entries,
  onChange,
  disabled = false,
}: WorkHistorySectionProps) {
  const handleFieldChange = (index: number, field: keyof WorkExperienceEntry, value: string) => {
    const updated = [...entries];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const handleAddRow = () => {
    const newEntry: WorkExperienceEntry = {
      id: `work-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      start_year_month: '',
      end_year_month: '',
      company_name: '',
      job_description: '',
    };
    onChange([...entries, newEntry]);
  };

  const handleRemoveRow = (index: number) => {
    if (entries.length <= 1) {
      // Clear the single row instead of leaving 0 rows
      onChange([
        {
          id: `work-${Date.now()}`,
          start_year_month: '',
          end_year_month: '',
          company_name: '',
          job_description: '',
        },
      ]);
      return;
    }
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
            職歴 / কাজের ইতিহাস
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
        ※ 職歴がある場合は、古い順にご記入ください。（ない場合は空欄のままで構いません）
        <br />
        (যদি কাজের অভিজ্ঞতা থাকে তবে ধারাবাহিকভাবে লিখুন। না থাকলে খালি রাখতে পারেন)
      </p>

      <style>{`
        .work-card {
          background: #ffffff;
          border: 1.5px solid var(--border-light);
          border-radius: 12px;
          padding: 20px;
          box-shadow: var(--shadow-sm);
          position: relative;
        }
        .work-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 16px;
          margin-bottom: 16px;
        }
        @media (max-width: 640px) {
          .work-card {
            padding: 14px 10px !important;
          }
          .work-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
        }
      `}</style>

      {/* Rows Container */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {entries.map((entry, idx) => {
          const isCurrent = entry.end_year_month === '現在も';
          const monthInputVal = parseJapaneseYearMonthToInput(entry.start_year_month);
          const endMonthInputVal = isCurrent ? '' : parseJapaneseYearMonthToInput(entry.end_year_month);

          return (
            <div
              key={entry.id || `work-row-${idx}`}
              className="work-card"
            >
              {/* Row Top Bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                  paddingBottom: '10px',
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
                    <Briefcase size={12} />
                    職歴 / কাজের অভিজ্ঞতা #{idx + 1}
                  </span>
                </div>

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
              </div>

              {/* Grid 1: Dates & Company Name */}
              <div
                className="work-grid"
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                  gap: '16px',
                  marginBottom: '16px',
                }}
              >
                {/* Field 1: 開始年/শুরুর বছর */}
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: 'var(--nikkou-navy)',
                      marginBottom: '6px',
                    }}
                  >
                    開始年 / শুরুর বছর
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type="month"
                      value={monthInputVal}
                      disabled={disabled}
                      onChange={(e) => {
                        const formatted = formatToJapaneseYearMonth(e.target.value);
                        handleFieldChange(idx, 'start_year_month', formatted);
                      }}
                      title="カレンダーから選択 / ক্যালেন্ডার থেকে নির্বাচন"
                      style={{
                        width: '44px',
                        height: '42px',
                        padding: '0 4px',
                        borderRadius: '8px',
                        border: '1.5px solid var(--border-light)',
                        background: '#ffffff',
                        cursor: 'pointer',
                        outline: 'none',
                        flexShrink: 0,
                      }}
                    />
                    <input
                      type="text"
                      value={entry.start_year_month}
                      disabled={disabled}
                      onChange={(e) => handleFieldChange(idx, 'start_year_month', e.target.value)}
                      placeholder="例: 2021年01月"
                      style={{
                        flex: 1,
                        minWidth: 0,
                        height: '42px',
                        padding: '0 12px',
                        borderRadius: '8px',
                        border: '1.5px solid var(--border-light)',
                        fontSize: '13.5px',
                        color: 'var(--text-primary)',
                        outline: 'none',
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px', display: 'block' }}>
                    直接入力またはカレンダー / সরাসরি লিখুন বা ক্যালেন্ডার
                  </span>
                </div>

                {/* Field 2: 終了年/সমাপ্তি বছর */}
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: '6px',
                    }}
                  >
                    <label
                      style={{
                        fontSize: '13px',
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
                      disabled={disabled}
                      title="現在も勤務中の場合に切り替え / বর্তমানে কর্মরত থাকলে টগল করুন"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        background: isCurrent ? 'var(--nikkou-red)' : '#f1f5f9',
                        color: isCurrent ? '#ffffff' : 'var(--text-secondary)',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '3px 8px',
                        fontSize: '11px',
                        fontWeight: 700,
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <Check size={11} />
                      {isCurrent ? '現在も / বর্তমানে কর্মরত' : '現在も？ / বর্তমানে?'}
                    </button>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <input
                      type="month"
                      value={endMonthInputVal}
                      disabled={disabled}
                      onChange={(e) => {
                        const formatted = formatToJapaneseYearMonth(e.target.value);
                        handleFieldChange(idx, 'end_year_month', formatted);
                      }}
                      title="カレンダーから選択 / ক্যালেন্ডার থেকে নির্বাচন"
                      style={{
                        width: '44px',
                        height: '42px',
                        padding: '0 4px',
                        borderRadius: '8px',
                        border: '1.5px solid var(--border-light)',
                        background: '#ffffff',
                        cursor: 'pointer',
                        outline: 'none',
                        flexShrink: 0,
                      }}
                    />
                    <input
                      type="text"
                      value={entry.end_year_month}
                      disabled={disabled}
                      onChange={(e) => handleFieldChange(idx, 'end_year_month', e.target.value)}
                      placeholder="例: 2023年12月 または 現在も"
                      style={{
                        flex: 1,
                        minWidth: 0,
                        height: '42px',
                        padding: '0 12px',
                        borderRadius: '8px',
                        border: isCurrent ? '1.5px solid #86efac' : '1.5px solid var(--border-light)',
                        background: isCurrent ? '#f0fdf4' : '#ffffff',
                        fontSize: '13.5px',
                        fontWeight: isCurrent ? 700 : 400,
                        color: isCurrent ? '#15803d' : 'var(--text-primary)',
                        outline: 'none',
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px', display: 'block' }}>
                    直接入力またはカレンダー / সরাসরি লিখুন বা ক্যালেন্ডার
                  </span>
                </div>

                {/* Field 3: 会社名/কোম্পানির নাম */}
                <div style={{ gridColumn: 'span 1' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '13px',
                      fontWeight: 700,
                      color: 'var(--nikkou-navy)',
                      marginBottom: '6px',
                    }}
                  >
                    会社名 / কোম্পানির নাম
                  </label>
                  <input
                    type="text"
                    value={entry.company_name}
                    disabled={disabled}
                    onChange={(e) => handleFieldChange(idx, 'company_name', e.target.value)}
                    placeholder="ハワラダー・ビルディング・アンド・コンストラクション・リミテッド"
                    style={{
                      width: '100%',
                      height: '42px',
                      padding: '0 12px',
                      borderRadius: '8px',
                      border: '1.5px solid var(--border-light)',
                      fontSize: '13px',
                      color: 'var(--text-primary)',
                      outline: 'none',
                    }}
                  />
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px', display: 'block' }}>
                    勤務先の会社名 / কোম্পানির নাম
                  </span>
                </div>
              </div>

              {/* Field 4: 業務内容/আপনি কি ধরনের কাজ করেছেন দয়া করে বিস্তারিত লিখুন। */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: 'var(--nikkou-navy)',
                    marginBottom: '6px',
                  }}
                >
                  業務内容 / আপনি কি ধরনের কাজ করেছেন দয়া করে বিস্তারিত লিখুন।
                </label>
                <textarea
                  value={entry.job_description}
                  disabled={disabled}
                  onChange={(e) => handleFieldChange(idx, 'job_description', e.target.value)}
                  rows={4}
                  placeholder="家族を支えるため、私は幼い頃から父と一緒に建設の仕事をしてきました。1年前に父が仕事を引退した後、私は父の仕事を引き継ぎました。現在は、建設に関するすべての仕事を自分で管理・運営しています / পরিবারকে সহযোগিতা করার জন্য ছোটবেলা থেকেই বাবার সঙ্গে নির্মাণের কাজ করে আসছি..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--border-light)',
                    fontSize: '13.5px',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    lineHeight: '1.6',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                  }}
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '3px', display: 'block' }}>
                  業務業務内容の詳細をご記入ください / দায়িত্ব ও কাজের বিস্তারিত বিবরণ লিখুন
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
