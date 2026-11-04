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
  'General Crop Farming': [
    {
      id: 'agri_crop_skill_assessment_1',
      nameJp: '農業技能測定試験1号（一般耕種農業）',
      nameEn: 'Agriculture Skill Assessment Test Level 1 (General Crop Farming)',
      nameBn: 'কৃষি দক্ষতা মূল্যায়ন পরীক্ষা লেভেল ১ (সাধারণ ফসল চাষ)',
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
  'General Livestock Farming': [
    {
      id: 'agri_livestock_skill_assessment_1',
      nameJp: '農業技能測定試験1号（一般畜産農業）',
      nameEn: 'Agriculture Skill Assessment Test Level 1 (General Livestock Farming)',
      nameBn: 'কৃষি দক্ষতা মূল্যায়ন পরীক্ষা লেভেল ১ (সাধারণ গবাদিপশু পালন)',
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
  'Construction': [
    {
      id: 'construction_skill_eval_1_building',
      nameJp: '建設分野特定技能1号評価試験（建築）',
      nameEn: 'Construction Field Specified Skilled Worker (i) Evaluation Test (Building)',
      nameBn: 'নির্মাণ ক্ষেত্র নির্দিষ্ট দক্ষ কর্মী (১) মূল্যায়ন পরীক্ষা (ভবন নির্মাণ)',
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
  'Building Cleaning': [
    {
      id: 'building_cleaning_skill_eval_1',
      nameJp: 'ビルクリーニング分野特定技能1号評価試験',
      nameEn: 'Building Cleaning Management Field Specified Skilled Worker (i) Evaluation Test',
      nameBn: 'বিল্ডিং ক্লিনিং ম্যানেজমেন্ট ক্ষেত্র নির্দিষ্ট দক্ষ কর্মী (১) মূল্যায়ন পরীক্ষা',
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
  'Driver': [
    {
      id: 'driver_automobile_transport_eval',
      nameJp: '自動車運送業分野特定技能評価試験',
      nameEn: 'The Automobile Transportation Business Field Skill Test',
      nameBn: 'অটোমোবাইল পরিবহন ব্যবসা ক্ষেত্র নির্দিষ্ট দক্ষ কর্মী মূল্যায়ন পরীক্ষা',
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

  // Nursing / Caregiver
  if (lowerSub.includes('nursing') || lowerSub.includes('caregiver') || lowerSub.includes('介護')) {
    return SSW_SKILL_TESTS['Nursing / Caregiver'] || [];
  }

  // Building Cleaning
  if (lowerSub.includes('cleaning') || lowerSub.includes('ビルクリーニング')) {
    return SSW_SKILL_TESTS['Building Cleaning'] || [];
  }

  // Construction
  if (lowerSub.includes('construction') || lowerSub.includes('建設')) {
    return SSW_SKILL_TESTS['Construction'] || [];
  }

  // Driver
  if (lowerSub.includes('driver') || lowerSub.includes('ドライバー') || lowerSub.includes('自動車運送')) {
    return SSW_SKILL_TESTS['Driver'] || [];
  }

  // Agriculture - General Livestock Farming
  if (lowerSub.includes('livestock') || lowerSub.includes('畜産')) {
    return SSW_SKILL_TESTS['General Livestock Farming'] || [];
  }

  // Agriculture - General Crop Farming (or generic Agriculture default)
  if (
    lowerSub.includes('crop') ||
    lowerSub.includes('耕種') ||
    lowerSub.includes('agriculture') ||
    lowerSub.includes('農業') ||
    lowerSub.includes('কৃষি')
  ) {
    return SSW_SKILL_TESTS['General Crop Farming'] || [];
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
