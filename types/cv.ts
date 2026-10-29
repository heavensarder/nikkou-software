export interface CvForm {
  id: number;
  form_code: string;
  title: string;
  description: string | null;
  is_active: number;
  allow_multiple_submissions: number;
  expires_at: string | null;
  total_submissions: number;
  created_by?: number | null;
  created_at: string;
  updated_at: string;
}

export interface EducationEntry {
  id?: string;
  start_year_month: string;
  end_year_month: string;
  school_name: string;
  major_subject: string;
  qualification: string;
}

export interface WorkExperienceEntry {
  id?: string;
  start_year_month: string;
  end_year_month: string;
  company_name: string;
  job_description: string;
  job_description_original_bn?: string;
}

export interface FamilyMemberEntry {
  id?: string;
  name: string;
  relationship: string;
  age: string;
  occupation: string;
}

export interface StudentCv {
  id: number;
  form_id: number | null;
  student_code: string;
  edit_token?: string | null;
  source: 'public_form' | 'admin_entry';
  full_name: string;
  email: string | null;
  phone: string;
  gender: 'male' | 'female' | 'other' | null;
  date_of_birth: string | null;
  passport_number: string | null;
  photo_url: string | null;
  jlpt_level: string | null;
  japanese_study_hours: number;
  target_intake: string | null;
  program?: string | null;
  sub_program?: string | null;
  status: 'draft' | 'submitted' | 'verified' | 'inactive';
  is_read?: boolean;
  details_json: {
    program?: string | null;
    sub_program?: string | null;
    photo_data?: string | null;
    furigana?: string;
    name_native?: string;
    gender_label?: string;
    marital_status?: string;
    age_display?: string;
    dob_japanese?: string;
    address?: string;
    phone?: string;
    submitted_at?: string;
    // Section 2: 個人情報 / ব্যক্তিগত তথ্য
    eyesight?: string;
    color_blindness?: string;
    dominant_hand?: string;
    body_weight?: string;
    height?: string;
    tattoo_surgery?: string;
    smoking?: string;
    alcohol?: string;
    hobbies?: string;
    hobbies_original_bn?: string;
    personality?: string;
    personality_original_bn?: string;
    cooking?: string;
    group_living?: string;
    blood_type?: string;
    medical_history?: string;
    personal_income?: string;
    target_savings_5years?: string;
    motivation?: string;
    motivation_original_bn?: string;
    future_plan_after_japan?: string;
    future_plan_original_bn?: string;
    japan_visa_applied_before?: string;
    japan_visa_type_applied?: string;
    // Section 3: 学歴 / শিক্ষাগত যোগ্যতা
    education_history?: EducationEntry[];
    // Section 4: その他言語 / অন্যান্য ভাষা
    language_bengali?: string;
    language_english?: string;
    // Section 5: 職歴 / কাজের ইতিহাস
    work_history?: WorkExperienceEntry[];
    // Section 6: 家族 / পরিবার
    family_members?: FamilyMemberEntry[];
    relatives_in_japan?: string;
    family_support_japan?: string;
    // Section 7: 評価 / মূল্যায়ন
    evaluation?: string;
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
}

export const EYE_POWER_OPTIONS = [
  '2.0',
  '1.5',
  '1.2',
  '1.0',
  '0.9',
  '0.8',
  '0.7',
  '0.6',
  '0.5',
  '0.4',
  '0.3',
  '0.2',
  '0.1',
] as const;

export type EyePowerOption = (typeof EYE_POWER_OPTIONS)[number];

export const EYESIGHT_OPTIONS = [
  '右: 2.0 左: 2.0',
  '右: 1.5 左: 1.5',
  '右: 1.2 左: 1.2',
  '右: 1.0 左: 1.0',
  '右: 0.9 左: 0.9',
  '右: 0.8 左: 0.8',
  '右: 0.7 左: 0.7',
  '右: 0.6 左: 0.6',
  '右: 0.5 左: 0.5',
  '右: 0.4 左: 0.4',
  '右: 0.3 左: 0.3',
  '右: 0.2 左: 0.2',
  '右: 0.1 左: 0.1',
] as const;

export type EyesightOption = (typeof EYESIGHT_OPTIONS)[number];

export function parseEyesight(val: string | null | undefined): { right: string; left: string } {
  if (!val) return { right: '', left: '' };
  // Strip any parenthetical annotations like "(Normal Vision)"
  const str = String(val).replace(/\s*\([^)]*\)/g, '').trim();
  if (!str) return { right: '', left: '' };

  const matchJp = str.match(/右[:：]?\s*([+\-]?\d+(?:\.\d+)?)\s*左[:：]?\s*([+\-]?\d+(?:\.\d+)?)/);
  if (matchJp) {
    return { right: matchJp[1], left: matchJp[2] };
  }

  const matchOld = str.match(/右\s*([+\-]?\d+(?:\.\d+)?)\s*[-/]\s*左\s*([+\-]?\d+(?:\.\d+)?)/);
  if (matchOld) {
    return { right: matchOld[1], left: matchOld[2] };
  }

  const matchNums = str.match(/([+\-]?\d+(?:\.\d+)?)\s*[,/|\s-]\s*([+\-]?\d+(?:\.\d+)?)/);
  if (matchNums) {
    return { right: matchNums[1], left: matchNums[2] };
  }

  return { right: str, left: str };
}

export function formatEyesight(right: string, left: string): string {
  // Strip any parenthetical annotations like "(Normal Vision)"
  const r = (right || '').replace(/\s*\([^)]*\)/g, '').trim();
  const l = (left || '').replace(/\s*\([^)]*\)/g, '').trim();
  if (!r && !l) return '';
  if (r && !l) return `右: ${r} 左: ${r}`;
  if (!r && l) return `右: ${l} 左: ${l}`;
  return `右: ${r} 左: ${l}`;
}

export const TARGET_SAVINGS_OPTIONS = [
  '100万円 / 10লক্ষ ইয়েন',
  '150万円 / 15লক্ষ ইয়েন',
  '200万円 / 20লক্ষ ইয়েন',
  '250万円 / 25লক্ষ ইয়েন',
  '300万円 / 30লক্ষ ইয়েন',
  '350万円 / 35লক্ষ ইয়েন',
  '400万円 / 40লক্ষ ইয়েন',
  '450万円 / 45লক্ষ ইয়েন',
  '500万円 / 50লক্ষ ইয়েন',
] as const;

export type TargetSavingsOption = (typeof TARGET_SAVINGS_OPTIONS)[number];

export const PERSONAL_INCOME_OPTIONS = [
  '0万円 / 0 লক্ষ ইয়েন',
  '10万円 / 1লক্ষ ইয়েন',
  '20万円 / 2লক্ষ ইয়েন',
  '30万円 / 3লক্ষ ইয়েন',
  '40万円 / 4লক্ষ ইয়েন',
  '50万円 / 5লক্ষ ইয়েন',
  '60万円 / 6লক্ষ ইয়েন',
  '70万円 / 7লক্ষ ইয়েন',
  '80万円 / 8লক্ষ ইয়েন',
  '90万円 / 9লক্ষ ইয়েন',
  '100万円 / 10লক্ষ ইয়েন',
] as const;

export type PersonalIncomeOption = (typeof PERSONAL_INCOME_OPTIONS)[number];
