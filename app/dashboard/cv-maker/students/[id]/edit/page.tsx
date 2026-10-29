'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  Check,
  AlertCircle,
  CheckCircle2,
  Languages,
  Sparkles,
  Eye,
  Loader2,
  UserCheck,
  RotateCcw,
  Link2,
  Lock,
} from 'lucide-react';
import PhotoUploadField from '@/components/PhotoUploadField';
import ProgramCategorySection from '@/components/ProgramCategorySection';
import EducationHistorySection, { INITIAL_EDUCATION_ROWS } from '@/components/EducationHistorySection';
import WorkHistorySection, { INITIAL_WORK_ROWS } from '@/components/WorkHistorySection';
import FamilyInfoSection, { INITIAL_FAMILY_ROWS } from '@/components/FamilyInfoSection';
import { EducationEntry, WorkExperienceEntry, FamilyMemberEntry, EYESIGHT_OPTIONS, TARGET_SAVINGS_OPTIONS, PERSONAL_INCOME_OPTIONS } from '@/types/cv';
import EyesightField from '@/components/EyesightField';
import TranslatableTextarea from '@/components/TranslatableTextarea';
import styles from '../../../cv-maker.module.css';
import {
  formatJapaneseBirthDate,
  formatReadableBirthDate,
  normalizeCandidateDob,
  normalizeCandidateAge,
  calculateAgeFromDob,
  normalizeLanguageProficiency,
  normalizeGender,
  normalizeMaritalStatus,
  normalizeYesNo,
  normalizeDominantHand,
  normalizeBloodType,
  normalizeJapanVisaType,
} from '@/lib/cv-normalizer';
export { formatJapaneseBirthDate };

function EditStudentCvContent() {
  const router = useRouter();
  const params = useParams();
  const studentId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [studentCode, setStudentCode] = useState('');
  const [studentSource, setStudentSource] = useState('');
  const [editToken, setEditToken] = useState('');
  const [copiedEditLink, setCopiedEditLink] = useState(false);

  // Status
  const [status, setStatus] = useState('submitted');

  // Category & Program Selection (Top of form, before photo)
  const [program, setProgram] = useState('');
  const [subProgram, setSubProgram] = useState('');

  // Field 1: Photo
  const [photo, setPhoto] = useState<string | null>(null);

  // Section 1: 基本情報 / প্রাথমিক তথ্য (Basic Information)
  const [furigana, setFurigana] = useState('');
  const [gender, setGender] = useState('');
  const [fullName, setFullName] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('');
  const [dob, setDob] = useState('');
  const [age, setAge] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');

  // Section 2: 個人情報 / ব্যক্তিগত তথ্য (Personal Information)
  const [eyesight, setEyesight] = useState('');
  const [colorBlindness, setColorBlindness] = useState('');
  const [dominantHand, setDominantHand] = useState('');
  const [bodyWeight, setBodyWeight] = useState('');
  const [height, setHeight] = useState('');
  const [tattooSurgery, setTattooSurgery] = useState('');
  const [smoking, setSmoking] = useState('');
  const [alcohol, setAlcohol] = useState('');
  const [hobbies, setHobbies] = useState('');
  const [hobbiesOriginalBn, setHobbiesOriginalBn] = useState('');
  const [personality, setPersonality] = useState('');
  const [personalityOriginalBn, setPersonalityOriginalBn] = useState('');
  const [cooking, setCooking] = useState('');
  const [groupLiving, setGroupLiving] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [personalIncome, setPersonalIncome] = useState('');
  const [targetSavings5Years, setTargetSavings5Years] = useState('');
  const [motivation, setMotivation] = useState('');
  const [motivationOriginalBn, setMotivationOriginalBn] = useState('');
  const [futurePlanAfterJapan, setFuturePlanAfterJapan] = useState('');
  const [futurePlanOriginalBn, setFuturePlanOriginalBn] = useState('');
  const [japanVisaAppliedBefore, setJapanVisaAppliedBefore] = useState('');
  const [japanVisaTypeApplied, setJapanVisaTypeApplied] = useState('');

  // Section 3: 学歴 / শিক্ষাগত যোগ্যতা (Educational Background)
  const [educationHistory, setEducationHistory] = useState<EducationEntry[]>(INITIAL_EDUCATION_ROWS);

  // Section 4: その他言語 / অন্যান্য ভাষা (Other Languages)
  const [languageBengali, setLanguageBengali] = useState('');
  const [languageEnglish, setLanguageEnglish] = useState('');

  // Section 5: 職歴 / কাজের ইতিহাস (Work History)
  const [workHistory, setWorkHistory] = useState<WorkExperienceEntry[]>(INITIAL_WORK_ROWS);

  // Section 6: 家族 / পরিবার (Family Information)
  const [familyMembers, setFamilyMembers] = useState<FamilyMemberEntry[]>(INITIAL_FAMILY_ROWS);
  const [relativesInJapan, setRelativesInJapan] = useState('');
  const [familySupportJapan, setFamilySupportJapan] = useState('');

  // Section 7: 評価 / মূল্যায়ন (Evaluation - Optional)
  const [evaluation, setEvaluation] = useState('');

  // Saving state
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Saving & Database Drafting States
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftSaveSuccess, setDraftSaveSuccess] = useState<string | null>(null);
  const serverDataRef = useRef<any>(null);

  // AI status from system settings
  const [aiEnabled, setAiEnabled] = useState(false);

  useEffect(() => {
    async function checkAiStatus() {
      try {
        const res = await fetch('/api/settings/ai');
        if (res.ok) {
          const data = await res.json();
          setAiEnabled(Boolean(data.enabled));
        }
      } catch (err) {
        console.error('Failed to load AI settings status', err);
      }
    }
    checkAiStatus();
  }, []);

  // Fetch initial student data
  useEffect(() => {
    async function loadStudent() {
      if (!studentId) return;
      try {
        setLoading(true);
        setErrorMsg('');
        const res = await fetch(`/api/cv-maker/students/${studentId}`);
        if (!res.ok) {
          throw new Error('Failed to fetch student record');
        }
        const data = await res.json();
        if (!data.success || !data.student) {
          throw new Error(data.message || 'Student not found');
        }

        const s = data.student;
        const d = s.details_json || {};

        serverDataRef.current = { student: s, details: d };
        setStudentCode(s.student_code || '');
        setStudentSource(s.source || '');
        setEditToken(s.edit_token || '');

        // Clear any old local cache for this student to avoid stale overrides
        try {
          localStorage.removeItem(`nikkou_admin_cv_edit_draft_${studentId}`);
          const rawNewIds = localStorage.getItem('nikkou_new_application_ids');
          if (rawNewIds) {
            const arr = JSON.parse(rawNewIds);
            if (Array.isArray(arr) && arr.includes(Number(studentId))) {
              const updated = arr.filter((x: any) => Number(x) !== Number(studentId));
              localStorage.setItem('nikkou_new_application_ids', JSON.stringify(updated));
            }
          }
        } catch {
          // ignore
        }

        setStatus(s.status || 'submitted');
        setProgram(s.program || d.program || '');
        setSubProgram(s.sub_program || d.sub_program || '');
        setPhoto(d.photo_data || null);
        setFurigana(d.furigana || s.full_name || '');
        setFullName(d.name_native || s.full_name || '');
        const rawGender = d.gender_label || s.gender || '';
        setGender(normalizeGender(rawGender) || (rawGender === 'female' ? '女性 / মহিলা' : '男性 / পুরুষ'));
        const rawMarital = d.marital_status || '';
        setMaritalStatus(normalizeMaritalStatus(rawMarital) || rawMarital || '独身 / অবিবাহিত');
        let candidateDob = '';
        if (d.dob_japanese) {
          candidateDob = normalizeCandidateDob(d.dob_japanese);
        }
        if (!candidateDob && s.date_of_birth) {
          candidateDob = normalizeCandidateDob(s.date_of_birth);
        }
        setDob(candidateDob);
        const calculatedAge = candidateDob ? calculateAgeFromDob(candidateDob) : null;
        if (calculatedAge !== null) {
          setAge(`${calculatedAge}歳 / ${calculatedAge} বছর`);
        } else {
          setAge(normalizeCandidateAge(d.age_display, candidateDob));
        }
        setAddress(d.address || '');
        setPhone(s.phone || d.phone || '');

        setEyesight(d.eyesight || '');
        setColorBlindness(d.color_blindness ? normalizeYesNo(d.color_blindness, true) : '無 / না');
        setDominantHand(d.dominant_hand ? normalizeDominantHand(d.dominant_hand) : '右手 / ডান হাত');
        setBodyWeight(d.body_weight || '');
        setHeight(d.height || '');
        setTattooSurgery(d.tattoo_surgery ? normalizeYesNo(d.tattoo_surgery, true) : '無 / না');
        setSmoking(d.smoking ? normalizeYesNo(d.smoking, true) : '無 / না');
        setAlcohol(d.alcohol ? normalizeYesNo(d.alcohol, true) : '無 / না');
        setBloodType(d.blood_type ? normalizeBloodType(d.blood_type) : '');
        setHobbies(d.hobbies || '');
        setHobbiesOriginalBn(d.hobbies_original_bn || d.hobbiesOriginalBn || '');
        setPersonality(d.personality || '');
        setPersonalityOriginalBn(d.personality_original_bn || d.personalityOriginalBn || '');
        setCooking(d.cooking ? normalizeYesNo(d.cooking, false) : '有 / হ্যাঁ');
        setGroupLiving(d.group_living ? normalizeYesNo(d.group_living, false) : '有 / হ্যাঁ');
        setMedicalHistory(d.medical_history ? normalizeYesNo(d.medical_history, true) : '無 / না');
        setPersonalIncome(d.personal_income || '');
        setTargetSavings5Years(d.target_savings_5years || '');
        setMotivation(d.motivation || '');
        setMotivationOriginalBn(d.motivation_original_bn || d.motivationOriginalBn || '');
        setFuturePlanAfterJapan(d.future_plan_after_japan || '');
        setFuturePlanOriginalBn(d.future_plan_original_bn || d.futurePlanOriginalBn || '');
        setJapanVisaAppliedBefore(d.japan_visa_applied_before ? normalizeYesNo(d.japan_visa_applied_before, true) : '無 / না');
        setJapanVisaTypeApplied(d.japan_visa_type_applied ? normalizeJapanVisaType(d.japan_visa_type_applied) : '無 / না');

        if (Array.isArray(d.education_history) && d.education_history.length > 0) {
          setEducationHistory(d.education_history);
        } else {
          setEducationHistory(INITIAL_EDUCATION_ROWS);
        }

        setLanguageBengali(normalizeLanguageProficiency(d.language_bengali, true));
        setLanguageEnglish(normalizeLanguageProficiency(d.language_english, false));

        if (Array.isArray(d.work_history) && d.work_history.length > 0) {
          setWorkHistory(d.work_history);
        } else {
          setWorkHistory(INITIAL_WORK_ROWS);
        }

        if (Array.isArray(d.family_members) && d.family_members.length > 0) {
          setFamilyMembers(d.family_members);
        } else {
          setFamilyMembers(INITIAL_FAMILY_ROWS);
        }
        setRelativesInJapan(d.relatives_in_japan || '無 / না');
        setFamilySupportJapan(d.family_support_japan || '賛成 / রাজি');
        setEvaluation(d.evaluation || '');
      } catch (err: any) {
        console.error('Error loading student:', err);
        setErrorMsg(err.message || 'Failed to load student data');
      } finally {
        setLoading(false);
      }
    }

    loadStudent();
  }, [studentId]);

  // Accidental navigation & refresh protection
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (successMsg) return;
      e.preventDefault();
      e.returnValue = '';
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [successMsg]);


  const handleSaveAsDraft = async () => {
    setErrorMsg('');
    setDraftSaveSuccess(null);
    setSavingDraft(true);

    try {
      const mappedGender = gender.includes('女性') ? 'female' : (gender.includes('男性') ? 'male' : null);

      const res = await fetch(`/api/cv-maker/students/${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'draft',
          program: program || undefined,
          sub_program: subProgram || undefined,
          full_name: furigana.trim() || fullName.trim() || 'Untitled Draft',
          phone: phone.trim() || '—',
          gender: mappedGender,
          date_of_birth: normalizeCandidateDob(dob) || null,
          details: {
            program: program || null,
            sub_program: subProgram || null,
            photo_data: photo,
            furigana: furigana.trim(),
            name_native: fullName.trim(),
            gender_label: gender,
            marital_status: maritalStatus,
            age_display: normalizeCandidateAge(age, dob),
            dob_japanese: formatJapaneseBirthDate(normalizeCandidateDob(dob)),
            address: address.trim(),
            phone: phone.trim(),
            eyesight: eyesight.trim(),
            color_blindness: colorBlindness,
            dominant_hand: dominantHand,
            body_weight: bodyWeight.trim(),
            height: height.trim(),
            tattoo_surgery: tattooSurgery,
            smoking: smoking,
            alcohol: alcohol,
            hobbies: hobbies.trim(),
            personality: personality.trim(),
            cooking: cooking,
            group_living: groupLiving,
            blood_type: bloodType,
            medical_history: medicalHistory,
            personal_income: personalIncome.trim(),
            target_savings_5years: targetSavings5Years.trim(),
            motivation: motivation.trim(),
            future_plan_after_japan: futurePlanAfterJapan.trim(),
            japan_visa_applied_before: japanVisaAppliedBefore,
            japan_visa_type_applied: japanVisaTypeApplied.trim(),
            education_history: educationHistory.filter(
              (item) => item.school_name.trim() || item.start_year_month || item.end_year_month || item.major_subject || item.qualification
            ),
            language_bengali: languageBengali,
            language_english: languageEnglish,
            work_history: workHistory.filter(
              (item) => item.company_name.trim() || item.start_year_month || item.end_year_month || item.job_description.trim()
            ),
            family_members: familyMembers.filter(
              (item) => item.name.trim() || item.relationship || item.age.trim() || item.occupation.trim()
            ),
            relatives_in_japan: relativesInJapan,
            family_support_japan: familySupportJapan,
            evaluation: evaluation.trim(),
            admin_edited: true,
            draft_saved_at: new Date().toISOString(),
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.message || 'Failed to save draft.');
        setSavingDraft(false);
        return;
      }

      setStatus('draft');
      setDraftSaveSuccess('Student CV successfully saved as Draft in database!');
      try {
        localStorage.removeItem(`nikkou_admin_cv_edit_draft_${studentId}`);
      } catch {
        // ignore
      }
    } catch {
      setErrorMsg('Network error while saving draft. Please try again.');
    } finally {
      setSavingDraft(false);
    }
  };

  // Auto-calculate Age when Date of Birth is selected
  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedDate = e.target.value;
    setDob(selectedDate);

    if (selectedDate) {
      const calculatedAge = calculateAgeFromDob(selectedDate);
      if (calculatedAge !== null) {
        setAge(`${calculatedAge}歳 / ${calculatedAge} বছর`);
      }
    } else {
      setAge('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    setSaving(true);

    try {
      const mappedGender = gender ? (gender.includes('女性') ? 'female' : (gender.includes('男性') ? 'male' : 'other')) : null;

      const res = await fetch(`/api/cv-maker/students/${studentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: furigana.trim() || fullName.trim() || 'Untitled Student',
          phone: phone.trim() || '—',
          program: program || undefined,
          sub_program: subProgram || undefined,
          gender: mappedGender,
          date_of_birth: normalizeCandidateDob(dob) || null,
          status,
          details: {
            program: program || null,
            sub_program: subProgram || null,
            photo_data: photo,
            // Section 1: 基本情報
            furigana: furigana.trim(),
            name_native: fullName.trim(),
            gender_label: gender,
            marital_status: maritalStatus,
            age_display: normalizeCandidateAge(age, dob),
            dob_japanese: formatJapaneseBirthDate(normalizeCandidateDob(dob)),
            address: address.trim(),
            phone: phone.trim(),
            // Section 2: 個人情報
            eyesight: eyesight.trim(),
            color_blindness: colorBlindness,
            dominant_hand: dominantHand,
            body_weight: bodyWeight.trim(),
            height: height.trim(),
            tattoo_surgery: tattooSurgery,
            smoking: smoking,
            alcohol: alcohol,
            hobbies: hobbies.trim(),
            hobbies_original_bn: hobbiesOriginalBn.trim(),
            personality: personality.trim(),
            personality_original_bn: personalityOriginalBn.trim(),
            cooking: cooking,
            group_living: groupLiving,
            blood_type: bloodType,
            medical_history: medicalHistory,
            personal_income: personalIncome.trim(),
            target_savings_5years: targetSavings5Years.trim(),
            motivation: motivation.trim(),
            motivation_original_bn: motivationOriginalBn.trim(),
            future_plan_after_japan: futurePlanAfterJapan.trim(),
            future_plan_original_bn: futurePlanOriginalBn.trim(),
            japan_visa_applied_before: japanVisaAppliedBefore,
            japan_visa_type_applied: japanVisaTypeApplied.trim(),
            // Section 3: 学歴 / শিক্ষাগত যোগ্যতা
            education_history: educationHistory.filter(
              (item) => item.school_name.trim() || item.start_year_month || item.end_year_month || item.major_subject || item.qualification
            ),
            // Section 4: その他言語 / অন্যান্য ভাষা
            language_bengali: languageBengali,
            language_english: languageEnglish,
            // Section 5: 職歴 / কাজের ইতিহাস
            work_history: workHistory.filter(
              (item) => item.company_name.trim() || item.start_year_month || item.end_year_month || item.job_description.trim()
            ),
            // Section 6: 家族 / পরিবার
            family_members: familyMembers.filter(
              (item) => item.name.trim() || item.relationship || item.age.trim() || item.occupation.trim()
            ),
            relatives_in_japan: relativesInJapan,
            family_support_japan: familySupportJapan,
            // Section 7: 評価 / মূল্যায়ন (Optional)
            evaluation: evaluation.trim(),
            admin_edited: true,
            updated_at: new Date().toISOString(),
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.message || 'Failed to update student record.');
        setSaving(false);
        return;
      }

      try {
        localStorage.removeItem(`nikkou_admin_cv_edit_draft_${studentId}`);
      } catch {
        // ignore
      }

      setSuccessMsg('Student CV updated successfully!');
      setTimeout(() => {
        router.push('/dashboard/cv-maker/students');
      }, 1200);
    } catch {
      setErrorMsg('An unexpected network error occurred.');
    } finally {
      setSaving(false);
    }
  };

  const handleCopyStudentEditLink = () => {
    if (!editToken) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const editUrl = `${origin}/cv-form/edit/${editToken}`;
    navigator.clipboard.writeText(editUrl);
    setCopiedEditLink(true);
    setTimeout(() => setCopiedEditLink(false), 2500);
  };

  if (loading) {
    return (
      <div className={styles.pageContainer} style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--nikkou-navy)' }}>
          <Loader2 size={36} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
          <div style={{ fontSize: '15px', fontWeight: 700 }}>Loading student data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer} suppressHydrationWarning>
      {/* Header */}
      <div className={styles.pageHeader} suppressHydrationWarning>
        <div className={styles.headerLeft} suppressHydrationWarning>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <Link href="/dashboard/cv-maker/students" className={styles.secondaryBtn} style={{ padding: '6px 10px' }} title="Back">
              <ArrowLeft size={16} />
            </Link>
            <h2>Edit Student CV</h2>
          </div>
          <p>
            Update and manage submitted student CV particulars and resume information.
          </p>
        </div>

        {/* Header Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {studentCode && (
            <span className={styles.codePill} style={{ fontSize: '13px', padding: '6px 12px' }}>
              {studentCode}
            </span>
          )}

          {/* Student Public Edit Link */}
          {status === 'verified' ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                border: '1.5px solid #a7f3d0',
                background: '#ecfdf5',
                color: '#047857',
                fontSize: '12.5px',
                fontWeight: 700,
              }}
              title="This application is verified and locked from editing."
            >
              <Lock size={14} />
              <span>Edit Link Locked</span>
            </span>
          ) : (
            <button
              type="button"
              onClick={handleCopyStudentEditLink}
              disabled={!editToken}
              className={`${styles.secondaryBtn} ${copiedEditLink ? styles.copyBtnSuccess : ''}`}
              style={{
                padding: '8px 14px',
                fontSize: '13px',
                fontWeight: 700,
                color: copiedEditLink ? '#059669' : '#0284c7',
                borderColor: copiedEditLink ? '#a7f3d0' : '#bae6fd',
                background: copiedEditLink ? '#ecfdf5' : '#f0f9ff',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
              title="Copy shareable public edit link for student to edit and resubmit"
            >
              {copiedEditLink ? (
                <>
                  <Check size={15} />
                  <span>Link Copied!</span>
                </>
              ) : (
                <>
                  <Link2 size={15} />
                  <span>Copy Student Edit Link</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={handleSaveAsDraft}
            disabled={savingDraft || saving}
            className={styles.secondaryBtn}
            style={{ padding: '8px 14px', fontSize: '13px' }}
          >
            <Save size={14} />
            {savingDraft ? 'Saving Draft...' : 'Save as Draft'}
          </button>

          <Link href="/dashboard/cv-maker/students" className={styles.secondaryBtn}>
            Cancel
          </Link>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving || savingDraft}
            className={styles.primaryBtn}
            style={{ minWidth: '160px', justifyContent: 'center' }}
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Saving Changes...
              </>
            ) : (
              <>
                <Save size={16} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      {/* Student Meta Status & Intake Info Card */}
      <div
        suppressHydrationWarning
        style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderRadius: '14px',
          border: '1.5px solid #e2e8f0',
          padding: '16px 24px',
          boxShadow: '0 4px 15px rgba(31,56,100,0.04)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              border: '1px solid #bfdbfe',
            }}
          >
            <UserCheck size={22} />
          </div>

          <div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--nikkou-navy)' }}>
              {fullName || furigana || '学生'}
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginLeft: '10px' }}>
                ({furigana})
              </span>
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span>
                Intake Source:{' '}
                <strong style={{ color: 'var(--nikkou-navy)' }}>
                  {studentSource === 'public_form' ? 'Public Form' : 'Direct Admin Entry'}
                </strong>
              </span>
              <span>•</span>
              <span>Student Form Link:</span>
              {status === 'verified' ? (
                <span style={{ color: '#047857', fontWeight: 700, fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Lock size={12} /> Locked (Verified)
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleCopyStudentEditLink}
                  disabled={!editToken}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: '#0284c7',
                    fontWeight: 700,
                    fontSize: '12.5px',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    textDecoration: 'underline',
                  }}
                  title="Copy student public edit link"
                >
                  {copiedEditLink ? '✓ Link Copied!' : 'Copy Student Edit Link'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Status Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--nikkou-navy)' }}>
            Status:
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1.5px solid var(--border-strong)',
              fontSize: '13px',
              fontWeight: 700,
              color: 'var(--nikkou-navy)',
              background: '#ffffff',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="draft">Draft</option>
            <option value="submitted">Submitted</option>
            <option value="verified">Verified</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Form Fields Section - Full Width */}
      <div className={styles.card} style={{ width: '100%' }} suppressHydrationWarning>
        <div style={{ padding: '20px 28px', borderBottom: '1px solid var(--border-light)', background: '#fafbfc' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--nikkou-navy)' }}>
            Student Information Form
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
            Edit student particulars below. Fields correspond directly to the official Japanese CV (JIS standard).
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') {
              e.preventDefault();
            }
          }}
          style={{ padding: '28px' }}
        >

          {/* Database Draft Save Success Alert */}
          {draftSaveSuccess && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 18px',
                backgroundColor: '#ecfdf5',
                border: '1.5px solid #a7f3d0',
                color: '#065f46',
                borderRadius: '12px',
                fontSize: '13.5px',
                fontWeight: 600,
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <CheckCircle2 size={18} color="#059669" />
                <span>{draftSaveSuccess}</span>
              </div>
              <button
                type="button"
                onClick={() => setDraftSaveSuccess(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#065f46',
                  fontSize: '16px',
                  fontWeight: 700,
                }}
              >
                ✕
              </button>
            </div>
          )}
          {errorMsg && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '14px 18px',
                background: '#fef2f2',
                border: '1.5px solid #fecaca',
                borderRadius: '8px',
                color: '#dc2626',
                fontSize: '13.5px',
                fontWeight: 600,
                marginBottom: '24px',
              }}
            >
              <AlertCircle size={20} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '14px 18px',
                background: '#ecfdf5',
                border: '1.5px solid #a7f3d0',
                borderRadius: '8px',
                color: '#059669',
                fontSize: '13.5px',
                fontWeight: 600,
                marginBottom: '24px',
              }}
            >
              <CheckCircle2 size={20} style={{ flexShrink: 0 }} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* CATEGORY & PROGRAM SELECTION (Top of Form Before Photo) */}
          <ProgramCategorySection
            program={program}
            subProgram={subProgram}
            onChangeProgram={setProgram}
            onChangeSubProgram={setSubProgram}
          />

          {/* FIELD 1: 写真 / ছবি (PHOTO UPLOAD) */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid var(--border-light)',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '28px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
                paddingBottom: '12px',
                borderBottom: '1px solid var(--border-light)',
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
                  写真 / ছবি
                </h2>
              </div>

              <span
                style={{
                  fontSize: '11.5px',
                  fontWeight: 700,
                  color: '#64748b',
                  backgroundColor: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                }}
              >
                任意 / ঐচ্ছিক
              </span>
            </div>

            <PhotoUploadField value={photo} onChange={setPhoto} />
          </div>

          {/* SECTION 1: 基本情報 / প্রাথমিক তথ্য */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid var(--border-light)',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '28px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px',
                paddingBottom: '12px',
                borderBottom: '1px solid var(--border-light)',
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
                  基本情報 / প্রাথমিক তথ্য
                </h2>
              </div>

              <span
                style={{
                  fontSize: '11.5px',
                  fontWeight: 700,
                  color: '#64748b',
                  backgroundColor: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                }}
              >
                任意 / ঐচ্ছিক
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '20px',
              }}
            >
              {/* Furigana */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    color: 'var(--nikkou-navy)',
                    marginBottom: '8px',
                  }}
                >
                  フリガナ / ফুরিগানা (নামের ইংরেজি ক্যাপিটাল)
                </label>
                <input
                  type="text"
                  value={furigana}
                  onChange={(e) => setFurigana(e.target.value.toUpperCase())}
                  placeholder="MD TARIQUL ISLAM"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--border-light)',
                    fontSize: '14px',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    fontWeight: 600,
                  }}
                />
              </div>

              {/* Native Name */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    color: 'var(--nikkou-navy)',
                    marginBottom: '8px',
                  }}
                >
                  氏名 / নাম (পূর্ণ নাম)
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="MD TARIQUL ISLAM / তারিকুল ইসলাম"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--border-light)',
                    fontSize: '14px',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    fontWeight: 600,
                  }}
                />
              </div>

              {/* Gender */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    color: 'var(--nikkou-navy)',
                    marginBottom: '8px',
                  }}
                >
                  性別 / সেক্স (লিঙ্গ)
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--border-light)',
                    fontSize: '14px',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    fontWeight: 600,
                    background: '#ffffff',
                  }}
                >
                  <option value="">選択してください / নির্বাচন করুন</option>
                  <option value="男性 / পুরুষ">男性 / পুরুষ (Male)</option>
                  <option value="女性 / মহিলা">女性 / মহিলা (Female)</option>
                </select>
              </div>

              {/* Marital Status */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    color: 'var(--nikkou-navy)',
                    marginBottom: '8px',
                  }}
                >
                  婚姻 / বিবাহ (বৈবাহিক অবস্থা)
                </label>
                <select
                  value={maritalStatus}
                  onChange={(e) => setMaritalStatus(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--border-light)',
                    fontSize: '14px',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    fontWeight: 600,
                    background: '#ffffff',
                  }}
                >
                  <option value="">選択してください / নির্বাচন করুন</option>
                  <option value="独身 / অবিবাহিত">独身 / অবিবাহিত (Single)</option>
                  <option value="既婚 / বিবাহিত">既婚 / বিবাহিত (Married)</option>
                  {maritalStatus && !['独身 / অবিবাহিত', '既婚 / বিবাহিত'].includes(maritalStatus) && (
                    <option value={maritalStatus}>{maritalStatus}</option>
                  )}
                </select>
              </div>

              {/* Date of Birth */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    color: 'var(--nikkou-navy)',
                    marginBottom: '8px',
                  }}
                >
                  生年月日 / জন্ম তারিখ
                </label>
                <input
                  type="date"
                  value={dob}
                  onChange={handleDobChange}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--border-light)',
                    fontSize: '14px',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    fontWeight: 600,
                  }}
                />
                {dob && (
                  <div
                    style={{
                      fontSize: '12px',
                      color: 'var(--nikkou-navy)',
                      fontWeight: 700,
                      marginTop: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '6px',
                      background: '#f0fdf4',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      border: '1px solid #bbf7d0',
                    }}
                  >
                    <span style={{ color: '#047857' }}>🇯🇵 形式: {formatJapaneseBirthDate(dob)}</span>
                    {formatReadableBirthDate(dob) && (
                      <span style={{ color: '#4b5563', fontWeight: 600 }}>
                        • {formatReadableBirthDate(dob)}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Age (Auto calculated or editable) */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    color: 'var(--nikkou-navy)',
                    marginBottom: '8px',
                  }}
                >
                  年齢 / বয়স
                </label>
                <input
                  type="text"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  onBlur={() => {
                    if (age || dob) setAge(normalizeCandidateAge(age, dob));
                  }}
                  placeholder="自動計算 (例: 19歳 / 19 বছর)"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--border-light)',
                    fontSize: '14px',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    fontWeight: 600,
                    background: '#ffffff',
                  }}
                />
              </div>

              {/* Phone */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    color: 'var(--nikkou-navy)',
                    marginBottom: '8px',
                  }}
                >
                  電話 / ফোন নম্বর
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+880 1712-345678"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--border-light)',
                    fontSize: '14px',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    fontWeight: 600,
                  }}
                />
              </div>

              {/* Address (Span full width) */}
              <div style={{ gridColumn: '1 / -1' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    color: 'var(--nikkou-navy)',
                    marginBottom: '8px',
                  }}
                >
                  連絡先 / ঠিকানা (পূর্ণ ঠিকানা)
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value.toUpperCase())}
                  placeholder="VILL: ..., P.O: ..., P.S: ..., DIST: ..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--border-light)',
                    fontSize: '14px',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    fontWeight: 600,
                  }}
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: 個人情報 / ব্যক্তিগত তথ্য */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid var(--border-light)',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '28px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px',
                paddingBottom: '12px',
                borderBottom: '1px solid var(--border-light)',
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
                  個人情報 / ব্যক্তিগত তথ্য
                </h2>
              </div>

              <span
                style={{
                  fontSize: '11.5px',
                  fontWeight: 700,
                  color: '#64748b',
                  backgroundColor: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                }}
              >
                任意 / ঐচ্ছিক
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '20px',
              }}
            >
              {/* Eyesight */}
              <EyesightField value={eyesight} onChange={setEyesight} />

              {/* Color Blindness */}
              <div>
                <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 700, color: 'var(--nikkou-navy)', marginBottom: '8px' }}>
                  色覚異常 / বর্ণান্ধতা
                </label>
                <select
                  value={colorBlindness}
                  onChange={(e) => setColorBlindness(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-light)', fontSize: '14px', fontWeight: 600, background: '#ffffff' }}
                >
                  <option value="無 / না">無 / না (None)</option>
                  <option value="有 / হ্যাঁ">有 / হ্যাঁ (Yes)</option>
                </select>
              </div>

              {/* Dominant Hand */}
              <div>
                <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 700, color: 'var(--nikkou-navy)', marginBottom: '8px' }}>
                  利き手 / প্রভাবশালী হাত
                </label>
                <select
                  value={dominantHand}
                  onChange={(e) => setDominantHand(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-light)', fontSize: '14px', fontWeight: 600, background: '#ffffff' }}
                >
                  <option value="右手 / ডান হাত">右手 / ডান হাত (Right)</option>
                  <option value="左手 / বাম হাত">左手 / বাম হাত (Left)</option>
                </select>
              </div>

              {/* Body Weight */}
              <div>
                <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 700, color: 'var(--nikkou-navy)', marginBottom: '8px' }}>
                  体重 / শরীরের ওজন
                </label>
                <input
                  type="text"
                  value={bodyWeight}
                  onChange={(e) => setBodyWeight(e.target.value)}
                  placeholder="65kg"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-light)', fontSize: '14px', fontWeight: 600 }}
                />
              </div>

              {/* Height */}
              <div>
                <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 700, color: 'var(--nikkou-navy)', marginBottom: '8px' }}>
                  身長 / উচ্চতা
                </label>
                <input
                  type="text"
                  value={height}
                  onChange={(e) => setHeight(e.target.value)}
                  placeholder="170cm"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-light)', fontSize: '14px', fontWeight: 600 }}
                />
              </div>

              {/* Tattoo / Surgery */}
              <div>
                <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 700, color: 'var(--nikkou-navy)', marginBottom: '8px' }}>
                  入れ墨、手術痕 / ট্যাটু/সার্জারি
                </label>
                <select
                  value={tattooSurgery}
                  onChange={(e) => setTattooSurgery(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-light)', fontSize: '14px', fontWeight: 600, background: '#ffffff' }}
                >
                  <option value="無 / না">無 / না (None)</option>
                  <option value="有 / হ্যাঁ">有 / হ্যাঁ (Yes)</option>
                </select>
              </div>

              {/* Smoking */}
              <div>
                <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 700, color: 'var(--nikkou-navy)', marginBottom: '8px' }}>
                  喫煙習慣 / ধূমপান?
                </label>
                <select
                  value={smoking}
                  onChange={(e) => setSmoking(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-light)', fontSize: '14px', fontWeight: 600, background: '#ffffff' }}
                >
                  <option value="無 / না">無 / না (No)</option>
                  <option value="有 / হ্যাঁ">有 / হ্যাঁ (Yes)</option>
                </select>
              </div>

              {/* Alcohol */}
              <div>
                <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 700, color: 'var(--nikkou-navy)', marginBottom: '8px' }}>
                  飲酒習慣 / মদ পান?
                </label>
                <select
                  value={alcohol}
                  onChange={(e) => setAlcohol(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-light)', fontSize: '14px', fontWeight: 600, background: '#ffffff' }}
                >
                  <option value="無 / না">無 / না (No)</option>
                  <option value="有 / হ্যাঁ">有 / হ্যাঁ (Yes)</option>
                </select>
              </div>

              {/* Blood Type */}
              <div>
                <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 700, color: 'var(--nikkou-navy)', marginBottom: '8px' }}>
                  血液型 / রক্তের ধরন
                </label>
                <select
                  value={bloodType}
                  onChange={(e) => setBloodType(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-light)', fontSize: '14px', fontWeight: 600, background: '#ffffff' }}
                >
                  <option value="">選択してください / নির্বাচন করুন</option>
                  <option value="A+型 / এ+ গ্রুপ">A+型 / এ+ গ্রুপ</option>
                  <option value="A-型 / এ- গ্রুপ">A-型 / এ- গ্রুপ</option>
                  <option value="B+型 / বি+ গ্রুপ">B+型 / বি+ গ্রুপ</option>
                  <option value="B-型 / বি- গ্রুপ">B-型 / বি- গ্রুপ</option>
                  <option value="O+型 / ও+ গ্রুপ">O+型 / ও+ গ্রুপ</option>
                  <option value="O-型 / ও- গ্রুপ">O-型 / ও- গ্রুপ</option>
                  <option value="AB+型 / এবি+ গ্রুপ">AB+型 / এবি+ গ্রুপ</option>
                  <option value="AB-型 / এবি- গ্রুপ">AB-型 / এবি- গ্রুপ</option>
                </select>
              </div>

              {/* Cooking */}
              <div>
                <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 700, color: 'var(--nikkou-navy)', marginBottom: '8px' }}>
                  料理経験 / রান্না
                </label>
                <select
                  value={cooking}
                  onChange={(e) => setCooking(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-light)', fontSize: '14px', fontWeight: 600, background: '#ffffff' }}
                >
                  <option value="有 / হ্যাঁ">有 / হ্যাঁ (Yes)</option>
                  <option value="無 / না">無 / না (No)</option>
                </select>
              </div>

              {/* Group Living */}
              <div>
                <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 700, color: 'var(--nikkou-navy)', marginBottom: '8px' }}>
                  集団生活 / গ্রুপ লিভিং
                </label>
                <select
                  value={groupLiving}
                  onChange={(e) => setGroupLiving(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-light)', fontSize: '14px', fontWeight: 600, background: '#ffffff' }}
                >
                  <option value="有 / হ্যাঁ">有 / হ্যাঁ (Yes)</option>
                  <option value="無 / না">無 / না (No)</option>
                </select>
              </div>

              {/* Medical History */}
              <div>
                <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 700, color: 'var(--nikkou-navy)', marginBottom: '8px' }}>
                  病歴 / চিকিৎসা ইতিহাস
                </label>
                <select
                  value={medicalHistory}
                  onChange={(e) => setMedicalHistory(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-light)', fontSize: '14px', fontWeight: 600, background: '#ffffff' }}
                >
                  <option value="無 / না">無 / না (None)</option>
                  <option value="有 / হ্যাঁ">有 / হ্যাঁ (Yes)</option>
                </select>
              </div>

              {/* Personal Income */}
              <div>
                <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 700, color: 'var(--nikkou-navy)', marginBottom: '8px' }}>
                  個人収入 / ব্যক্তিগত আয়
                </label>
                <select
                  value={personalIncome}
                  onChange={(e) => setPersonalIncome(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-light)', fontSize: '14px', fontWeight: 600, background: '#fff' }}
                >
                  <option value="">選択してください / নির্বাচন করুন</option>
                  {personalIncome && !PERSONAL_INCOME_OPTIONS.includes(personalIncome as any) && (
                    <option value={personalIncome}>{personalIncome}</option>
                  )}
                  {PERSONAL_INCOME_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              {/* 5-Year Savings Target */}
              <div>
                <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 700, color: 'var(--nikkou-navy)', marginBottom: '8px' }}>
                  5年貯金目標 / 5বছরে সঞ্চয় ইচ্ছা
                </label>
                <select
                  value={targetSavings5Years}
                  onChange={(e) => setTargetSavings5Years(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-light)', fontSize: '14px', fontWeight: 600, background: '#fff' }}
                >
                  <option value="">選択してください / নির্বাচন করুন</option>
                  {targetSavings5Years && !TARGET_SAVINGS_OPTIONS.includes(targetSavings5Years as any) && (
                    <option value={targetSavings5Years}>{targetSavings5Years}</option>
                  )}
                  {TARGET_SAVINGS_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>

              {/* Japan Visa Applied Before */}
              <div>
                <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 700, color: 'var(--nikkou-navy)', marginBottom: '8px' }}>
                  日本の在留資格申請経験 / আপনি কি কখনো জাপানের ভিসা জন্য আবেদন করেছেন?
                </label>
                <select
                  value={japanVisaAppliedBefore}
                  onChange={(e) => setJapanVisaAppliedBefore(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-light)', fontSize: '14px', fontWeight: 600, background: '#ffffff' }}
                >
                  <option value="無 / না">無 / না (Never)</option>
                  <option value="有 / হ্যাঁ">有 / হ্যাঁ (Applied)</option>
                </select>
              </div>

              {/* Japan Visa Type Applied */}
              <div>
                <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 700, color: 'var(--nikkou-navy)', marginBottom: '8px' }}>
                  申請したことがある場合、どの資格に申請したか / যদি তাই হয়, আপনি কি ভিসার জন্য আবেদন করেছেন?
                </label>
                <input
                  type="text"
                  value={japanVisaTypeApplied}
                  onChange={(e) => setJapanVisaTypeApplied(e.target.value)}
                  placeholder="無 / না"
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-light)', fontSize: '14px', fontWeight: 600 }}
                />
              </div>

              {/* Hobbies (Span full width) */}
              <div style={{ gridColumn: '1 / -1' }}>
                <TranslatableTextarea
                  labelJp="趣味"
                  labelBn="শখ"
                  value={hobbies}
                  onChange={setHobbies}
                  originalBn={hobbiesOriginalBn}
                  onChangeOriginalBn={setHobbiesOriginalBn}
                  fieldType="hobbies"
                  placeholder="আমি ফুটবল খেলতে পছন্দ করি"
                  rows={2}
                  aiEnabled={aiEnabled}
                />
              </div>

              {/* Personality (Span full width) */}
              <div style={{ gridColumn: '1 / -1' }}>
                <TranslatableTextarea
                  labelJp="性格"
                  labelBn="নিজের ব্যক্তিত্ব"
                  value={personality}
                  onChange={setPersonality}
                  originalBn={personalityOriginalBn}
                  onChangeOriginalBn={setPersonalityOriginalBn}
                  fieldType="personality"
                  placeholder="পরিশ্রমী এবং বন্ধুত্বপূর্ণ ব্যক্তিত্ব"
                  rows={2}
                  aiEnabled={aiEnabled}
                />
              </div>

              {/* Motivation (Span full width) */}
              <div style={{ gridColumn: '1 / -1' }}>
                <TranslatableTextarea
                  labelJp="志望動機"
                  labelBn="আবেদন করার অনুপ্রেরণা"
                  value={motivation}
                  onChange={setMotivation}
                  originalBn={motivationOriginalBn}
                  onChangeOriginalBn={setMotivationOriginalBn}
                  fieldType="motivation"
                  placeholder="জাপানের কর্মক্ষেত্রে টিমওয়ার্কের গুরুত্ব শিখতে চাই।"
                  rows={3}
                  aiEnabled={aiEnabled}
                />
              </div>

              {/* Future Plan (Span full width) */}
              <div style={{ gridColumn: '1 / -1' }}>
                <TranslatableTextarea
                  labelJp="将来の目標"
                  labelBn="ভবিষ্যতের লক্ষ্য"
                  value={futurePlanAfterJapan}
                  onChange={setFuturePlanAfterJapan}
                  originalBn={futurePlanOriginalBn}
                  onChangeOriginalBn={setFuturePlanOriginalBn}
                  fieldType="future_plan"
                  placeholder="আমি জাপানে কনস্ট্রাকশনের কাজ ভালোভাবে শিখে প্রযুক্তিগত দক্ষতা ও অভিজ্ঞতা অর্জন করতে চাই। এরপর ভবিষ্যতে দেশে ফিরে নিজের একটি কনস্ট্রাকশন কোম্পানি করতে চাই।"
                  rows={4}
                  aiEnabled={aiEnabled}
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: 学歴 / শিক্ষাগত যোগ্যতা */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid var(--border-light)',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '28px',
            }}
          >
            <EducationHistorySection entries={educationHistory} onChange={setEducationHistory} />
          </div>

          {/* SECTION 4: その他言語 / অন্যান্য ভাষা */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid var(--border-light)',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '28px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px',
                paddingBottom: '12px',
                borderBottom: '1px solid var(--border-light)',
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
                  その他言語 / অন্যান্য ভাষা
                </h2>
              </div>

              <span
                style={{
                  fontSize: '11.5px',
                  fontWeight: 700,
                  color: '#64748b',
                  backgroundColor: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                }}
              >
                任意 / ঐচ্ছিক
              </span>
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '20px',
              }}
            >
              {/* Mother tongue (Bengali) */}
              <div>
                <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 700, color: 'var(--nikkou-navy)', marginBottom: '8px' }}>
                  母国語（ベンガル語）【書き、読み】 / মাতৃভাষা (বাংলা)
                </label>
                <select
                  value={languageBengali}
                  onChange={(e) => setLanguageBengali(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-light)', fontSize: '14px', fontWeight: 600, background: '#ffffff' }}
                >
                  <option value="可 / পারি">可 / পারি (Fluent)</option>
                  <option value="少し可 / কিছুটা পারি">少し可 / কিছুটা পারি (Basic)</option>
                  <option value="出来ない / পারি না">出来ない / পারি না (No)</option>
                </select>
              </div>

              {/* English */}
              <div>
                <label style={{ display: 'block', fontSize: '13.5px', fontWeight: 700, color: 'var(--nikkou-navy)', marginBottom: '8px' }}>
                  英語【書き、読み】 / ইংরেজি
                </label>
                <select
                  value={languageEnglish}
                  onChange={(e) => setLanguageEnglish(e.target.value)}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1.5px solid var(--border-light)', fontSize: '14px', fontWeight: 600, background: '#ffffff' }}
                >
                  <option value="可 / পারি">可 / পারি (Fluent/Good)</option>
                  <option value="少し可 / কিছুটা পারি">少し可 / কিছুটা পারি (Basic)</option>
                  <option value="出来ない / পারি না">出来ない / পারি না (No)</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 5: 職歴 / কাজের ইতিহাস */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid var(--border-light)',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '28px',
            }}
          >
            <WorkHistorySection entries={workHistory} onChange={setWorkHistory} aiEnabled={aiEnabled} />
          </div>

          {/* SECTION 6: 家族 / পরিবার */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid var(--border-light)',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '28px',
            }}
          >
            <FamilyInfoSection
              entries={familyMembers}
              relativesInJapan={relativesInJapan}
              familySupportJapan={familySupportJapan}
              onChangeEntries={setFamilyMembers}
              onChangeRelativesInJapan={setRelativesInJapan}
              onChangeFamilySupportJapan={setFamilySupportJapan}
            />
          </div>

          {/* SECTION 7: 評価 / মূল্যায়ন (Admin Evaluation) */}
          <div
            style={{
              background: '#ffffff',
              border: '1px solid var(--border-light)',
              borderRadius: '12px',
              padding: '24px',
              marginBottom: '28px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '16px',
                paddingBottom: '12px',
                borderBottom: '1px solid var(--border-light)',
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
                  評価 / মূল্যায়ন (For Teachers)
                </h2>
              </div>

              <span
                style={{
                  fontSize: '11.5px',
                  fontWeight: 700,
                  color: '#64748b',
                  backgroundColor: '#f1f5f9',
                  border: '1px solid #cbd5e1',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                }}
              >
                任意 / ঐচ্ছিক
              </span>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '13.5px',
                  fontWeight: 700,
                  color: 'var(--nikkou-navy)',
                  marginBottom: '8px',
                }}
              >
                評価・所見 / মূল্যায়ন বা মন্তব্য
              </label>
              <textarea
                value={evaluation}
                onChange={(e) => setEvaluation(e.target.value)}
                rows={5}
                placeholder="評価・所見を入力してください（任意） / মূল্যায়ন বা মন্তব্য লিখুন (ঐচ্ছিক)"
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: '1.5px solid var(--border-light)',
                  fontSize: '14px',
                  color: 'var(--text-primary)',
                  outline: 'none',
                  lineHeight: '1.6',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
            </div>
          </div>

          {/* Form Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '32px', flexWrap: 'wrap' }}>
            <Link href="/dashboard/cv-maker/students" className={styles.secondaryBtn}>
              Cancel
            </Link>

            <button
              type="button"
              onClick={handleSaveAsDraft}
              disabled={savingDraft || saving}
              className={styles.secondaryBtn}
              style={{ minWidth: '140px', justifyContent: 'center' }}
            >
              <Save size={16} />
              {savingDraft ? 'Saving Draft...' : 'Save as Draft'}
            </button>

            <button
              type="submit"
              disabled={saving || savingDraft}
              className={styles.primaryBtn}
              style={{ minWidth: '160px', justifyContent: 'center' }}
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving Changes...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function EditStudentCvPage() {
  return (
    <Suspense
      fallback={
        <div className={styles.pageContainer} style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: 'var(--nikkou-navy)' }}>
            <Loader2 size={36} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
            <div style={{ fontSize: '15px', fontWeight: 700 }}>Loading student editor...</div>
          </div>
        </div>
      }
    >
      <EditStudentCvContent />
    </Suspense>
  );
}

