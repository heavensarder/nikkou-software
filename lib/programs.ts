export interface SubSubProgramOption {
  id: string;
  label: string;
  labelJp: string;
  labelBn: string;
}

export interface SubProgramOption {
  id: string;
  label: string;
  labelJp: string;
  labelBn: string;
  subOptions?: SubSubProgramOption[];
}

export interface ProgramOption {
  id: string;
  label: string;
  labelJp: string;
  labelBn: string;
  subPrograms: SubProgramOption[];
}

export const PROGRAM_OPTIONS: ProgramOption[] = [
  {
    id: 'TITP/ESD',
    label: 'TITP / ESD',
    labelJp: '技能実習・ESD',
    labelBn: 'টিআইটিপি / ইএসডি',
    subPrograms: [
      {
        id: 'Agriculture',
        label: 'Agriculture',
        labelJp: '農業',
        labelBn: 'কৃষি',
      },
      {
        id: 'Construction',
        label: 'Construction',
        labelJp: '建設',
        labelBn: 'নির্মাণ',
      },
      {
        id: 'Restaurant / Food Processing',
        label: 'Restaurant / Food Processing',
        labelJp: '外食・食品製造',
        labelBn: 'রেস্টুরেন্ট / খাদ্য প্রক্রিয়াকরণ',
      },
    ],
  },
  {
    id: 'SSW',
    label: 'SSW',
    labelJp: '特定技能',
    labelBn: 'এসএসডব্লিউ (নির্দিষ্ট দক্ষ কর্মী)',
    subPrograms: [
      {
        id: 'Nursing / Caregiver',
        label: 'Nursing / Caregiver',
        labelJp: '介護',
        labelBn: 'নার্সিং / কেয়ারগিভার',
      },
      {
        id: 'Agriculture',
        label: 'Agriculture',
        labelJp: '農業',
        labelBn: 'কৃষি',
        subOptions: [
          {
            id: 'Agriculture - General Crop Farming',
            label: 'General Crop Farming',
            labelJp: '耕種農業',
            labelBn: 'সাধারণ ফসল চাষ',
          },
          {
            id: 'Agriculture - General Livestock Farming',
            label: 'General Livestock Farming',
            labelJp: '畜産農業',
            labelBn: 'সাধারণ গবাদিপশু পালন',
          },
        ],
      },
      {
        id: 'Construction',
        label: 'Construction',
        labelJp: '建設',
        labelBn: 'নির্মাণ',
      },
      {
        id: 'Building Cleaning',
        label: 'Building Cleaning',
        labelJp: 'ビルクリーニング',
        labelBn: 'বিল্ডিং ক্লিনিং',
      },
      {
        id: 'Driver',
        label: 'Driver',
        labelJp: '自動車運送・ドライバー',
        labelBn: 'ড্রাইভার',
      },
    ],
  },
  {
    id: 'Student',
    label: 'Student',
    labelJp: '留学',
    labelBn: 'স্টুডেন্ট (উচ্চশিক্ষা)',
    subPrograms: [
      {
        id: 'Japanese Language School',
        label: 'Japanese Language School',
        labelJp: '日本語学校',
        labelBn: 'জাপানি ভাষা স্কুল',
      },
      {
        id: 'Japanese Language Course Under University',
        label: 'Japanese Language Course Under University',
        labelJp: '大学別科・日本語コース',
        labelBn: 'বিশ্ববিদ্যালয়ের অধীনে জাপানি ভাষা কোর্স',
      },
      {
        id: "Honours / Master's",
        label: "Honours / Master's",
        labelJp: '学士・修士課程',
        labelBn: "অনার্স / মাস্টার্স",
      },
    ],
  },
];

export function normalizeProgramId(prog?: string | null): string {
  if (!prog) return '';
  const trimmed = prog.trim();
  const lower = trimmed.toLowerCase();
  if (lower === 'ssw' || lower.includes('特定技能') || lower.includes('specified skilled')) return 'SSW';
  if (lower.includes('titp') || lower.includes('esd') || lower.includes('技能実習') || lower.includes('technical intern')) return 'TITP/ESD';
  if (lower.includes('student') || lower.includes('留学') || lower.includes('study')) return 'Student';
  const direct = PROGRAM_OPTIONS.find((p) => p.id.toLowerCase() === lower || p.label.toLowerCase() === lower);
  if (direct) return direct.id;
  return trimmed;
}

export function isSubProgramMatching(candidate: string | null | undefined, targetId: string): boolean {
  if (!candidate || !targetId) return false;
  const c = candidate.trim().toLowerCase();
  const t = targetId.trim().toLowerCase();
  if (c === t) return true;

  // General Crop Farming matching
  if (t.includes('crop') || t.includes('耕種')) {
    return c.includes('crop') || c.includes('耕種');
  }

  // General Livestock Farming matching
  if (t.includes('livestock') || t.includes('畜産')) {
    return c.includes('livestock') || c.includes('畜産');
  }

  // SSW Agriculture umbrella matching
  if (t === 'agriculture') {
    return (
      c === 'agriculture' ||
      c.includes('crop') ||
      c.includes('livestock') ||
      c.includes('farming') ||
      c.includes('農業') ||
      c.includes('耕種') ||
      c.includes('畜産')
    );
  }

  // Other subprograms
  if (t.includes('nursing') || t.includes('caregiver')) {
    return c.includes('nursing') || c.includes('caregiver') || c.includes('介護');
  }
  if (t.includes('construction')) {
    return c.includes('construction') || c.includes('建設');
  }
  if (t.includes('cleaning')) {
    return c.includes('cleaning') || c.includes('ビルクリーニング');
  }
  if (t.includes('driver')) {
    return c.includes('driver') || c.includes('ドライバー');
  }
  if (t.includes('restaurant') || t.includes('food')) {
    return c.includes('restaurant') || c.includes('food') || c.includes('外食');
  }

  return false;
}

export function getSubPrograms(programId: string): SubProgramOption[] {
  const normalized = normalizeProgramId(programId);
  const match = PROGRAM_OPTIONS.find(
    (p) => p.id === normalized || p.id.toLowerCase() === programId?.trim().toLowerCase()
  );
  return match ? match.subPrograms : [];
}

export function formatProgramBadge(program?: string | null, subProgram?: string | null): string {
  if (!program && !subProgram) return '—';
  const normProg = normalizeProgramId(program) || program;
  let cleanSub = subProgram || '';
  if (cleanSub.startsWith('Agriculture - ')) {
    cleanSub = cleanSub.replace('Agriculture - ', '');
  }
  if (normProg && cleanSub) return `${normProg} · ${cleanSub}`;
  return (normProg || cleanSub) as string;
}
