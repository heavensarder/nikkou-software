export interface SkillTestOption {
  value: string; // '合格 / Passed' or '準備中 / Preparing'
  valueJp: string; // '合格' or '準備中'
  valueEn: string; // 'Passed' or 'Preparing'
  valueBn?: string;
}

export interface SkillTestItem {
  id: string;
  nameJp: string;
  nameEn: string;
  nameBn?: string;
  options: SkillTestOption[];
  defaultOption?: string;
}

export const SSW_SKILL_TESTS: Record<string, SkillTestItem[]> = {
  'Nursing / Caregiver': [
    {
      id: 'nursing_care_japanese_eval',
      nameJp: '介護分野特定技能日本語評価試験',
      nameEn: 'Long-term Care SSW Japanese Language Evaluation Test',
      nameBn: 'কেয়ারগিভার নির্দিষ্ট দক্ষ কর্মী জাপানি ভাষা মূল্যায়ন পরীক্ষা',
      options: [
        {
          value: '合格 / Passed',
          valueJp: '合格',
          valueEn: 'Passed',
          valueBn: 'উত্তীর্ণ',
        },
        {
          value: '準備中 / Preparing',
          valueJp: '準備中',
          valueEn: 'Preparing',
          valueBn: 'প্রস্তুতি চলছে',
        },
      ],
      defaultOption: '準備中 / Preparing',
    },
  ],
};

/**
 * Returns the list of skill tests defined for the chosen SSW subcategory.
 */
export function getSkillTestsForCategory(
  program?: string | null,
  subProgram?: string | null
): SkillTestItem[] {
  if (!program) return [];
  const progUpper = program.trim().toUpperCase();
  if (progUpper !== 'SSW' && !progUpper.includes('特定技能')) {
    return [];
  }
  if (!subProgram) return [];
  const lowerSub = subProgram.toLowerCase();
  if (lowerSub.includes('nursing') || lowerSub.includes('caregiver') || lowerSub.includes('介護')) {
    return SSW_SKILL_TESTS['Nursing / Caregiver'] || [];
  }
  return [];
}

/**
 * Format the test status based on the selected print/display version.
 * Japanese version displays pure Japanese ('合格' or '準備中') with NO English.
 * Student version displays bilingual ('合格 / Passed' or '準備中 / Preparing').
 */
export function formatSkillTestStatus(
  status?: string | null,
  printVersion: 'japanese' | 'student' = 'student'
): string {
  if (!status) return '—';
  const s = status.trim();

  if (printVersion === 'japanese') {
    if (s.includes('合格') || s.toLowerCase().includes('pass')) return '合格';
    if (s.includes('準備中') || s.toLowerCase().includes('prep')) return '準備中';
    // Strip everything after slash or English
    const firstPart = s.split('/')[0].trim();
    return firstPart || s;
  }

  // Student version
  if (s === '合格' || s.toLowerCase() === 'passed') return '合格 / Passed';
  if (s === '準備中' || s.toLowerCase() === 'preparing') return '準備中 / Preparing';
  if (!s.includes('/') && s.includes('合格')) return '合格 / Passed';
  if (!s.includes('/') && s.includes('準備中')) return '準備中 / Preparing';
  return s;
}

