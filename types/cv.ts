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
  status: 'draft' | 'submitted' | 'under_review' | 'verified' | 'approved' | 'inactive';
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
    personality?: string;
    cooking?: string;
    group_living?: string;
    blood_type?: string;
    medical_history?: string;
    personal_income?: string;
    target_savings_5years?: string;
    motivation?: string;
    future_plan_after_japan?: string;
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
