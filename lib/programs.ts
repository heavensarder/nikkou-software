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
  if (
    lower === 'ssw' ||
    lower.includes('ssw') ||
    lower.includes('特定技能') ||
    lower.includes('specified skilled') ||
    lower.includes('এসএসডব্লিউ')
  ) {
    return 'SSW';
  }
  if (
    lower.includes('titp') ||
    lower.includes('esd') ||
    lower.includes('技能実習') ||
    lower.includes('実習') ||
    lower.includes('technical intern') ||
    lower.includes('টিআইটিপি') ||
    lower.includes('ইএসডি')
  ) {
    return 'TITP/ESD';
  }
  if (
    lower.includes('student') ||
    lower.includes('留学') ||
    lower.includes('study') ||
    lower.includes('স্টুডেন্ট')
  ) {
    return 'Student';
  }
  const direct = PROGRAM_OPTIONS.find(
    (p) => p.id.toLowerCase() === lower || p.label.toLowerCase() === lower
  );
  if (direct) return direct.id;
  return trimmed;
}

export function isProgramMatching(
  candidate: string | null | undefined,
  targetProgram: string | null | undefined
): boolean {
  if (!targetProgram || !targetProgram.trim()) return true;
  if (!candidate || !candidate.trim()) return false;
  const normCandidate = normalizeProgramId(candidate);
  const normTarget = normalizeProgramId(targetProgram);
  if (!normCandidate || !normTarget) return false;
  return normCandidate.toLowerCase() === normTarget.toLowerCase();
}

export function isSubProgramMatching(
  candidate: string | null | undefined,
  targetId: string | null | undefined
): boolean {
  if (!targetId || !targetId.trim()) return true;
  if (!candidate || !candidate.trim()) return false;
  const c = candidate.trim().toLowerCase();
  const t = targetId.trim().toLowerCase();

  // 1. Specific SSW Agriculture Sub-Options MUST be checked FIRST
  // because their IDs ('Agriculture - General Crop Farming', 'Agriculture - General Livestock Farming')
  // also contain the word 'agriculture'.
  if (t.includes('crop') || t.includes('耕種') || t.includes('ফসল')) {
    return (
      (c.includes('crop') || c.includes('耕種') || c.includes('ফসল')) &&
      !c.includes('livestock') &&
      !c.includes('畜産')
    );
  }

  if (t.includes('livestock') || t.includes('畜産') || t.includes('গবাদিপশু')) {
    return (
      (c.includes('livestock') || c.includes('畜産') || c.includes('গবাদিপশু')) &&
      !c.includes('crop') &&
      !c.includes('耕種')
    );
  }

  // 2. Umbrella Agriculture option ('Agriculture' / 'Agriculture (All)')
  // Matches generic 'Agriculture' as well as both General Crop Farming and General Livestock Farming
  if (
    t === 'agriculture' ||
    t.includes('agriculture') ||
    t.includes('農業') ||
    t.includes('কৃষি')
  ) {
    return (
      c === 'agriculture' ||
      c.includes('agriculture') ||
      c.includes('crop') ||
      c.includes('livestock') ||
      c.includes('farming') ||
      c.includes('農業') ||
      c.includes('耕種') ||
      c.includes('畜産') ||
      c.includes('কৃষি') ||
      c.includes('ফসল') ||
      c.includes('গবাদিপশু')
    );
  }

  if (c === t) return true;

  // 3. Other SSW & TITP/ESD sub-programs
  if (t.includes('nursing') || t.includes('caregiver') || t.includes('介護')) {
    return (
      c.includes('nursing') ||
      c.includes('caregiver') ||
      c.includes('介護') ||
      c.includes('নার্সিং') ||
      c.includes('কেয়ারগিভার')
    );
  }
  if (t.includes('construction') || t.includes('建設')) {
    return (
      c.includes('construction') ||
      c.includes('建設') ||
      c.includes('নির্মাণ')
    );
  }
  if (t.includes('cleaning') || t.includes('ビルクリーニング')) {
    return (
      c.includes('cleaning') ||
      c.includes('ビルクリーニング') ||
      c.includes('ক্লিনিং')
    );
  }
  if (t.includes('driver') || t.includes('ドライバー') || t.includes('自動車運送')) {
    return (
      c.includes('driver') ||
      c.includes('ドライバー') ||
      c.includes('自動車運送') ||
      c.includes('ড্রাইভার')
    );
  }
  if (
    t.includes('restaurant') ||
    t.includes('food') ||
    t.includes('外食') ||
    t.includes('食品製造')
  ) {
    return (
      c.includes('restaurant') ||
      c.includes('food') ||
      c.includes('外食') ||
      c.includes('食品製造') ||
      c.includes('রেস্টুরেন্ট') ||
      c.includes('খাদ্য')
    );
  }

  // 4. Student sub-programs
  if (t.includes('language school') || t.includes('日本語学校')) {
    return (
      c.includes('language school') ||
      c.includes('日本語学校') ||
      c.includes('ভাষা স্কুল')
    );
  }
  if (t.includes('under university') || t.includes('大学別科')) {
    return (
      c.includes('under university') ||
      c.includes('大学別科') ||
      c.includes('বিশ্ববিদ্যালয়ের অধীনে')
    );
  }
  if (
    t.includes('honours') ||
    t.includes('master') ||
    t.includes('学士') ||
    t.includes('修士')
  ) {
    return (
      c.includes('honours') ||
      c.includes('master') ||
      c.includes('学士') ||
      c.includes('修士') ||
      c.includes('অনার্স') ||
      c.includes('মাস্টার্স')
    );
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
