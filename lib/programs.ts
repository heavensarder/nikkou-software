export interface SubProgramOption {
  id: string;
  label: string;
  labelJp: string;
  labelBn: string;
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

export function getSubPrograms(programId: string): SubProgramOption[] {
  const match = PROGRAM_OPTIONS.find((p) => p.id === programId);
  return match ? match.subPrograms : [];
}

export function formatProgramBadge(program?: string | null, subProgram?: string | null): string {
  if (!program && !subProgram) return '—';
  if (program && subProgram) return `${program} · ${subProgram}`;
  return (program || subProgram) as string;
}
