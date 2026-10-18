'use client';

import React, { useEffect } from 'react';
import { Plus, Trash2, Users } from 'lucide-react';
import { FamilyMemberEntry } from '@/types/cv';

interface FamilyInfoSectionProps {
  entries: FamilyMemberEntry[];
  onChangeEntries: (entries: FamilyMemberEntry[]) => void;
  relativesInJapan: string;
  onChangeRelativesInJapan: (val: string) => void;
  familySupportJapan: string;
  onChangeFamilySupportJapan: (val: string) => void;
  disabled?: boolean;
}

export const RELATIONSHIP_OPTIONS = [
  '父 / পিতা',
  '母 / মা',
  '兄 / বড় ভাই',
  '弟 / ছোট ভাই',
  '姉 / বড় বোন',
  '妹 / ছোট বোন',
  '配偶者 / স্বামী/স্ত্রী',
  '夫 / স্বামী',
  '妻 / স্ত্রী',
  '長男 / বড় ছেলে',
  '長女 / বড় মেয়ে',
  '子 / সন্তান',
  '祖父 / দাদা/নানা',
  '祖母 / দাদী/নানী',
  'その他 / অন্যান্য',
];

export function toBengaliNumber(num: number): string {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num
    .toString()
    .split('')
    .map((d) => bnDigits[parseInt(d, 10)] ?? d)
    .join('');
}

export const DECEASED_AGE_OPTION = '死亡 / মৃত';

export function isDeceasedAge(val: string | null | undefined): boolean {
  if (!val) return false;
  const s = String(val).trim();
  return (
    s.includes('死亡') ||
    s.includes('মৃত') ||
    s.toLowerCase().includes('deceased') ||
    s.toLowerCase().includes('dead')
  );
}

export const FAMILY_AGE_OPTIONS: string[] = [
  DECEASED_AGE_OPTION,
  ...Array.from({ length: 100 }, (_, i) => {
    const age = i + 1;
    return `${age}歳 / ${toBengaliNumber(age)} বছর`;
  }),
];

export const OCCUPATION_OPTIONS = [
  '建設業 / কনস্ট্রাকশনের কাজ করেন',
  '専業主婦 / গৃহিণী',
  '学生 / শিক্ষার্থী',
  '農業 / কৃষক',
  '会社員 / চাকরিজীবী',
  '公務員 / সরকারি চাকরি',
  '自営業 / ব্যবসায়ী',
  '教員 / শিক্ষক',
  '医師・医療従事者 / ডাক্তার/স্বাস্থ্যকর্মী',
  '定年退職 / অবসরপ্রাপ্ত',
  '無職 / বেকার',
  'その他 / অন্যান্য',
];

export const INITIAL_FAMILY_ROWS: FamilyMemberEntry[] = [
  {
    id: 'fam-1',
    name: '',
    relationship: '',
    age: '',
    occupation: '',
  },
  {
    id: 'fam-2',
    name: '',
    relationship: '',
    age: '',
    occupation: '',
  },
  {
    id: 'fam-3',
    name: '',
    relationship: '',
    age: '',
    occupation: '',
  },
];

export default function FamilyInfoSection({
  entries,
  onChangeEntries,
  relativesInJapan,
  onChangeRelativesInJapan,
  familySupportJapan,
  onChangeFamilySupportJapan,
  disabled = false,
}: FamilyInfoSectionProps) {
  // Synchronize occupation to '-' if any entry is deceased
  useEffect(() => {
    let hasChanges = false;
    const checked = entries.map((entry) => {
      if (isDeceasedAge(entry.age) && entry.occupation !== '-') {
        hasChanges = true;
        return { ...entry, occupation: '-' };
      }
      return entry;
    });
    if (hasChanges) {
      onChangeEntries(checked);
    }
  }, [entries, onChangeEntries]);

  const handleFieldChange = (index: number, field: keyof FamilyMemberEntry, value: string) => {
    const updated = [...entries];
    if (field === 'age') {
      const isDeceased = isDeceasedAge(value);
      if (isDeceased) {
        updated[index] = { ...updated[index], age: value, occupation: '-' };
      } else {
        const wasDeceased = isDeceasedAge(updated[index].age);
        const newOccupation =
          wasDeceased && updated[index].occupation === '-' ? '' : updated[index].occupation;
        updated[index] = { ...updated[index], age: value, occupation: newOccupation };
      }
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    onChangeEntries(updated);
  };

  const handleAddRow = () => {
    const newEntry: FamilyMemberEntry = {
      id: `fam-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name: '',
      relationship: '',
      age: '',
      occupation: '',
    };
    onChangeEntries([...entries, newEntry]);
  };

  const handleRemoveRow = (index: number) => {
    if (entries.length <= 1) {
      onChangeEntries([
        {
          id: `fam-${Date.now()}`,
          name: '',
          relationship: '',
          age: '',
          occupation: '',
        },
      ]);
      return;
    }
    const updated = entries.filter((_, i) => i !== index);
    onChangeEntries(updated);
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
            家族 / পরিবার
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
        ※ ご両親、ご兄弟などの家族構成をご記入ください。（同居・別居問わず）
        <br />
        (পিতা-মাতা, ভাই-বোন সহ পরিবারের সদস্যদের তথ্য লিখুন)
      </p>



      <style>{`
        .fam-card {
          background: #ffffff;
          border: 1.5px solid var(--border-light);
          border-radius: 12px;
          padding: 18px;
          box-shadow: var(--shadow-sm);
        }
        .fam-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 14px;
        }
        .fam-bottom-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
        }
        @media (max-width: 640px) {
          .fam-card {
            padding: 14px 10px !important;
          }
          .fam-grid,
          .fam-bottom-grid {
            grid-template-columns: 1fr !important;
            gap: 12px !important;
          }
        }
      `}</style>

      {/* Rows Container */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {entries.map((entry, idx) => (
          <div
            key={entry.id || `fam-row-${idx}`}
            className="fam-card"
          >
            {/* Row Top Bar */}
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
                  <Users size={12} />
                  家族 / পরিবারের সদস্য #{idx + 1}
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

            {/* Grid: 4 columns */}
            <div
              className="fam-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '14px',
              }}
            >
              {/* Field 1: 氏名/পরিবারের সদস্যের নাম */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: 'var(--nikkou-navy)',
                    marginBottom: '5px',
                  }}
                >
                  氏名 / পরিবারের সদস্যের নাম
                </label>
                <input
                  type="text"
                  value={entry.name}
                  disabled={disabled}
                  onChange={(e) => handleFieldChange(idx, 'name', e.target.value)}
                  placeholder="Full Name"
                  style={{
                    width: '100%',
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

              {/* Field 2: 続柄/সম্পর্ক */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: 'var(--nikkou-navy)',
                    marginBottom: '5px',
                  }}
                >
                  続柄 / সম্পর্ক
                </label>
                <select
                  value={entry.relationship}
                  disabled={disabled}
                  onChange={(e) => handleFieldChange(idx, 'relationship', e.target.value)}
                  style={{
                    width: '100%',
                    height: '42px',
                    padding: '0 12px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--border-light)',
                    fontSize: '13.5px',
                    color: entry.relationship ? 'var(--text-primary)' : '#94a3b8',
                    background: '#ffffff',
                    outline: 'none',
                  }}
                >
                  <option value="">選択してください / নির্বাচন করুন</option>
                  {RELATIONSHIP_OPTIONS.map((rel) => (
                    <option key={rel} value={rel}>
                      {rel}
                    </option>
                  ))}
                  {entry.relationship && !RELATIONSHIP_OPTIONS.includes(entry.relationship) && (
                    <option value={entry.relationship}>{entry.relationship}</option>
                  )}
                </select>
              </div>

              {/* Field 3: 年齢/বয়স */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: 'var(--nikkou-navy)',
                    marginBottom: '5px',
                  }}
                >
                  年齢 / বয়স
                </label>
                <select
                  value={entry.age}
                  disabled={disabled}
                  onChange={(e) => handleFieldChange(idx, 'age', e.target.value)}
                  style={{
                    width: '100%',
                    height: '42px',
                    padding: '0 12px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--border-light)',
                    fontSize: '13.5px',
                    color: entry.age ? 'var(--text-primary)' : '#94a3b8',
                    background: '#ffffff',
                    outline: 'none',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                  }}
                >
                  <option value="">年齢を選択 / বয়স নির্বাচন করুন</option>
                  {FAMILY_AGE_OPTIONS.map((ageOpt) => (
                    <option key={ageOpt} value={ageOpt}>
                      {ageOpt}
                    </option>
                  ))}
                  {entry.age && !FAMILY_AGE_OPTIONS.includes(entry.age) && (
                    <option value={entry.age}>{entry.age}</option>
                  )}
                </select>
              </div>

              {/* Field 4: 職業/পেশা */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: 'var(--nikkou-navy)',
                    marginBottom: '5px',
                  }}
                >
                  職業 / পেশা
                </label>
                {(() => {
                  const isDeceased = isDeceasedAge(entry.age);
                  return (
                    <>
                      <select
                        value={
                          isDeceased
                            ? '-'
                            : OCCUPATION_OPTIONS.includes(entry.occupation)
                              ? entry.occupation
                              : entry.occupation
                                ? (entry.occupation === '-' ? '-' : 'その他 / অন্যান্য')
                                : ''
                        }
                        disabled={disabled || isDeceased}
                        onChange={(e) => handleFieldChange(idx, 'occupation', e.target.value)}
                        style={{
                          width: '100%',
                          height: '42px',
                          padding: '0 12px',
                          borderRadius: '8px',
                          border: isDeceased ? '1.5px solid #cbd5e1' : '1.5px solid var(--border-light)',
                          fontSize: '13.5px',
                          color: isDeceased ? '#64748b' : entry.occupation ? 'var(--text-primary)' : '#94a3b8',
                          background: isDeceased ? '#f1f5f9' : '#ffffff',
                          outline: 'none',
                          cursor: disabled || isDeceased ? 'not-allowed' : 'pointer',
                          fontWeight: isDeceased ? 700 : 400,
                        }}
                        title={
                          isDeceased
                            ? '年齢が「死亡」のため、職業は「-」に設定されています / বয়স মৃত হওয়ায় পেশা প্রযোজ্য নয় (-)'
                            : undefined
                        }
                      >
                        {isDeceased ? (
                          <option value="-">-</option>
                        ) : (
                          <>
                            <option value="">職業を選択 / পেশা নির্বাচন করুন</option>
                            <option value="-">-</option>
                            {OCCUPATION_OPTIONS.map((occ) => (
                              <option key={occ} value={occ}>
                                {occ}
                              </option>
                            ))}
                            {entry.occupation && entry.occupation !== '-' && !OCCUPATION_OPTIONS.includes(entry.occupation) && (
                              <option value={entry.occupation}>{entry.occupation}</option>
                            )}
                          </>
                        )}
                      </select>
                      {!isDeceased &&
                        (entry.occupation === 'その他 / অন্যান্য' ||
                          (!OCCUPATION_OPTIONS.includes(entry.occupation) &&
                            entry.occupation &&
                            entry.occupation !== '-')) && (
                          <input
                            type="text"
                            value={entry.occupation === 'その他 / অন্যান্য' ? '' : entry.occupation}
                            disabled={disabled}
                            onChange={(e) => handleFieldChange(idx, 'occupation', e.target.value || 'その他 / অন্যান্য')}
                            placeholder="具体的な職業を入力 / পেশার বিবরণ লিখুন"
                            style={{
                              width: '100%',
                              height: '38px',
                              padding: '0 10px',
                              borderRadius: '6px',
                              border: '1.5px solid var(--border-light)',
                              fontSize: '12.5px',
                              color: 'var(--text-primary)',
                              outline: 'none',
                              marginTop: '6px',
                            }}
                          />
                        )}
                    </>
                  );
                })()}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Card: 2 Family Questions */}
      <div
        style={{
          marginTop: '24px',
          background: '#ffffff',
          border: '1.5px solid var(--border-light)',
          borderRadius: '12px',
          padding: '20px',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div
          className="fam-bottom-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
          }}
        >
          {/* Question 1: 在日親戚/জাপানে আছে আত্মীয় */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13.5px',
                fontWeight: 700,
                color: 'var(--nikkou-navy)',
                marginBottom: '6px',
              }}
            >
              在日親族 / জাপানে আত্মীয়
            </label>
            <select
              value={relativesInJapan}
              disabled={disabled}
              onChange={(e) => onChangeRelativesInJapan(e.target.value)}
              style={{
                width: '100%',
                height: '44px',
                padding: '0 14px',
                borderRadius: '8px',
                border: '1.5px solid var(--border-light)',
                fontSize: '14px',
                color: relativesInJapan ? 'var(--text-primary)' : '#94a3b8',
                background: '#ffffff',
                outline: 'none',
              }}
            >
              <option value="">選択してください / নির্বাচন করুন</option>
              <option value="無 / না">無 / না</option>
              <option value="有 / হ্যাঁ">有 / হ্যাঁ</option>
            </select>
          </div>

          {/* Question 2: あなたの家族は日本に行くことに賛成ですか。/পরিবার কি রাজি আপনার জাপান যেতে । */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '13.5px',
                fontWeight: 700,
                color: 'var(--nikkou-navy)',
                marginBottom: '6px',
              }}
            >
              家族の賛成 / পরিবারের সম্মতি (আপনার জাপান যেতে)
            </label>
            <select
              value={familySupportJapan}
              disabled={disabled}
              onChange={(e) => onChangeFamilySupportJapan(e.target.value)}
              style={{
                width: '100%',
                height: '44px',
                padding: '0 14px',
                borderRadius: '8px',
                border: '1.5px solid var(--border-light)',
                fontSize: '14px',
                color: familySupportJapan ? 'var(--text-primary)' : '#94a3b8',
                background: '#ffffff',
                outline: 'none',
              }}
            >
              <option value="">選択してください / নির্বাচন করুন</option>
              <option value="賛成 / রাজি">賛成 / রাজি</option>
              <option value="反対 / রাজি নয়">反対 / রাজি নয়</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
