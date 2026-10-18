'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import PhotoUploadField from '@/components/PhotoUploadField';
import ProgramCategorySection from '@/components/ProgramCategorySection';
import EducationHistorySection, { INITIAL_EDUCATION_ROWS } from '@/components/EducationHistorySection';
import WorkHistorySection, { INITIAL_WORK_ROWS } from '@/components/WorkHistorySection';
import FamilyInfoSection, { INITIAL_FAMILY_ROWS } from '@/components/FamilyInfoSection';
import { EducationEntry, WorkExperienceEntry, FamilyMemberEntry } from '@/types/cv';
import {
  Send,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Lock,
  Loader2,
  Languages,
} from 'lucide-react';
import EyesightField from '@/components/EyesightField';
import TranslatableTextarea from '@/components/TranslatableTextarea';
import {
  normalizeGender,
  normalizeMaritalStatus,
  normalizeYesNo,
  normalizeDominantHand,
  normalizeBloodType,
  normalizeLanguageProficiency,
  normalizeFamilySupport,
  normalizeJapanVisaType,
  normalizeCandidateDob,
  normalizeCandidateAge,
  calculateAgeFromDob,
  formatJapaneseBirthDate,
  formatReadableBirthDate,
} from '@/lib/cv-normalizer';
import styles from '../../cv-form.module.css';

function StudentCvEditFormContent() {
  const params = useParams();
  const token = (params?.token as string) || '';

  // Loading & Access States
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [lockedData, setLockedData] = useState<{
    student_code?: string;
    full_name?: string;
    program?: string;
    sub_program?: string;
  } | null>(null);

  // Form State
  const [studentCode, setStudentCode] = useState('');
  const [program, setProgram] = useState('');
  const [subProgram, setSubProgram] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);

  // Section 1: 基本情報 / প্রাথমিক তথ্য
  const [furigana, setFurigana] = useState('');
  const [gender, setGender] = useState('');
  const [fullName, setFullName] = useState('');
  const [maritalStatus, setMaritalStatus] = useState('');
  const [dob, setDob] = useState('');
  const [age, setAge] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');

  // Section 2: 個人情報 / ব্যক্তিগত তথ্য
  const [eyesight, setEyesight] = useState('');
  const [colorBlindness, setColorBlindness] = useState('');
  const [dominantHand, setDominantHand] = useState('');
  const [bodyWeight, setBodyWeight] = useState('');
  const [height, setHeight] = useState('');
  const [tattooSurgery, setTattooSurgery] = useState('');
  const [smoking, setSmoking] = useState('');
  const [alcohol, setAlcohol] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [hobbies, setHobbies] = useState('');
  const [hobbiesOriginalBn, setHobbiesOriginalBn] = useState('');
  const [personality, setPersonality] = useState('');
  const [personalityOriginalBn, setPersonalityOriginalBn] = useState('');
  const [cooking, setCooking] = useState('');
  const [groupLiving, setGroupLiving] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [personalIncome, setPersonalIncome] = useState('');
  const [targetSavings5Years, setTargetSavings5Years] = useState('');
  const [motivation, setMotivation] = useState('');
  const [motivationOriginalBn, setMotivationOriginalBn] = useState('');
  const [futurePlanAfterJapan, setFuturePlanAfterJapan] = useState('');
  const [futurePlanOriginalBn, setFuturePlanOriginalBn] = useState('');
  const [japanVisaAppliedBefore, setJapanVisaAppliedBefore] = useState('');
  const [japanVisaTypeApplied, setJapanVisaTypeApplied] = useState('');

  // Section 3: 学歴 / শিক্ষাগত যোগ্যতা
  const [educationHistory, setEducationHistory] = useState<EducationEntry[]>(INITIAL_EDUCATION_ROWS);

  // Section 4: その他言語 / অন্যান্য ভাষা
  const [languageBengali, setLanguageBengali] = useState('');
  const [languageEnglish, setLanguageEnglish] = useState('');

  // Section 5: 職歴 / কাজের অভিজ্ঞতা
  const [workHistory, setWorkHistory] = useState<WorkExperienceEntry[]>(INITIAL_WORK_ROWS);

  // Section 6: 家族構成 / পরিবারের তথ্য
  const [familyMembers, setFamilyMembers] = useState<FamilyMemberEntry[]>(INITIAL_FAMILY_ROWS);
  const [relativesInJapan, setRelativesInJapan] = useState('');
  const [familySupportJapan, setFamilySupportJapan] = useState('');

  // Section 7: 評価 / মূল্যায়ন
  const [evaluation, setEvaluation] = useState('');

  // Submission States
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Public Edit Form: AI features & translate buttons are strictly disabled (admin only)
  const aiEnabled = false;

  useEffect(() => {
    async function fetchStudentForEdit() {
      if (!token) return;
      try {
        setLoading(true);
        setLoadError('');
        setIsLocked(false);

        const res = await fetch(`/api/cv-maker/public-form/edit/${encodeURIComponent(token)}`);
        const data = await res.json();

        if (res.status === 403 || data.locked) {
          setIsLocked(true);
          setLockedData({
            student_code: data.student_code,
            full_name: data.full_name,
            program: data.program,
            sub_program: data.sub_program,
          });
          return;
        }

        if (!res.ok || !data.success || !data.student) {
          setLoadError(data.message || 'Unable to open application edit link. It may be invalid or expired.');
          return;
        }

        const s = data.student;
        const d = s.details_json || {};

        setStudentCode(s.student_code || '');
        setProgram(s.program || d.program || '');
        setSubProgram(s.sub_program || d.sub_program || '');
        setPhoto(d.photo_data || null);

        setFurigana(d.furigana || s.full_name || '');
        setFullName(d.name_native || s.full_name || '');
        const rawGender = d.gender_label || s.gender || '';
        setGender(normalizeGender(rawGender) || (rawGender === 'female' ? '女性 / মহিলা' : rawGender === 'male' ? '男性 / পুরুষ' : ''));

        const rawMarital = d.marital_status || '';
        setMaritalStatus(normalizeMaritalStatus(rawMarital) || rawMarital || '独身 / অবিবাহিত');

        // DOB & Age Normalization
        let candidateDob = '';
        if (d.dob_japanese) {
          candidateDob = normalizeCandidateDob(d.dob_japanese);
        }
        if (!candidateDob && s.date_of_birth) {
          candidateDob = normalizeCandidateDob(s.date_of_birth);
        }
        setDob(candidateDob);

        // Auto-calculate or normalize Age
        const calculatedAge = candidateDob ? calculateAgeFromDob(candidateDob) : null;
        if (calculatedAge !== null) {
          setAge(`${calculatedAge}歳 / ${calculatedAge} বছর`);
        } else if (d.age_display) {
          setAge(normalizeCandidateAge(d.age_display, candidateDob));
        }

        setAddress(d.address || '');
        setPhone(s.phone || d.phone || '');

        setEyesight(d.eyesight || '');
        setColorBlindness(d.color_blindness ? normalizeYesNo(d.color_blindness, true) : '');
        setDominantHand(d.dominant_hand ? normalizeDominantHand(d.dominant_hand) : '');
        setBodyWeight(d.body_weight || '');
        setHeight(d.height || '');
        setTattooSurgery(d.tattoo_surgery ? normalizeYesNo(d.tattoo_surgery, true) : '');
        setSmoking(d.smoking ? normalizeYesNo(d.smoking, true) : '');
        setAlcohol(d.alcohol ? normalizeYesNo(d.alcohol, true) : '');
        setBloodType(d.blood_type ? normalizeBloodType(d.blood_type) : '');
        setHobbies(d.hobbies || '');
        setHobbiesOriginalBn(d.hobbies_original_bn || d.hobbiesOriginalBn || '');
        setPersonality(d.personality || '');
        setPersonalityOriginalBn(d.personality_original_bn || d.personalityOriginalBn || '');
        setCooking(d.cooking ? normalizeYesNo(d.cooking, false) : '');
        setGroupLiving(d.group_living ? normalizeYesNo(d.group_living, false) : '');
        setMedicalHistory(d.medical_history ? normalizeYesNo(d.medical_history, true) : '');
        setPersonalIncome(d.personal_income || '');
        setTargetSavings5Years(d.target_savings_5years || '');
        setMotivation(d.motivation || '');
        setMotivationOriginalBn(d.motivation_original_bn || d.motivationOriginalBn || '');
        setFuturePlanAfterJapan(d.future_plan_after_japan || '');
        setFuturePlanOriginalBn(d.future_plan_original_bn || d.futurePlanOriginalBn || '');
        setJapanVisaAppliedBefore(d.japan_visa_applied_before ? normalizeYesNo(d.japan_visa_applied_before, true) : '');
        setJapanVisaTypeApplied(d.japan_visa_type_applied ? normalizeJapanVisaType(d.japan_visa_type_applied) : '');

        if (Array.isArray(d.education_history) && d.education_history.length > 0) {
          setEducationHistory(d.education_history);
        }

        if (d.language_bengali) {
          setLanguageBengali(normalizeLanguageProficiency(d.language_bengali, true));
        }
        if (d.language_english) {
          setLanguageEnglish(normalizeLanguageProficiency(d.language_english, false));
        }

        if (Array.isArray(d.work_history) && d.work_history.length > 0) {
          setWorkHistory(d.work_history);
        }

        if (Array.isArray(d.family_members) && d.family_members.length > 0) {
          setFamilyMembers(d.family_members);
        }
        setRelativesInJapan(
          d.relatives_in_japan || d.family_in_japan
            ? normalizeYesNo(d.relatives_in_japan || d.family_in_japan, true)
            : ''
        );
        if (d.family_support_japan) {
          setFamilySupportJapan(normalizeFamilySupport(d.family_support_japan));
        }
        setEvaluation(d.teacher_evaluation || d.evaluation || '');
      } catch (err: any) {
        console.error('Failed to load application:', err);
        setLoadError('Failed to connect to the server. Please check your internet connection and try again.');
      } finally {
        setLoading(false);
      }
    }

    fetchStudentForEdit();
  }, [token]);

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
    setSubmitError('');

    setSubmitting(true);

    try {
      const payload = {
        full_name: (fullName.trim() || furigana.trim() || lockedData?.full_name || 'UNTITLED APPLICANT').toUpperCase(),
        program: program || undefined,
        sub_program: subProgram || undefined,
        gender: gender.includes('女性') || gender === 'female' ? 'female' : 'male',
        date_of_birth: normalizeCandidateDob(dob) || null,
        phone: phone.trim() || '—',
        details: {
          program: program || null,
          sub_program: subProgram || null,
          photo_data: photo,
          furigana: furigana.trim(),
          name_native: fullName.trim().toUpperCase(),
          gender_label: gender,
          marital_status: maritalStatus,
          dob_japanese: formatJapaneseBirthDate(normalizeCandidateDob(dob)),
          age_display: normalizeCandidateAge(age, dob),
          address: address.trim(),
          phone: phone.trim(),
          eyesight: eyesight.trim(),
          color_blindness: colorBlindness,
          dominant_hand: dominantHand,
          body_weight: bodyWeight.trim(),
          height: height.trim(),
          tattoo_surgery: tattooSurgery,
          smoking,
          alcohol,
          blood_type: bloodType,
          hobbies: hobbies.trim(),
          hobbies_original_bn: hobbiesOriginalBn.trim(),
          personality: personality.trim(),
          personality_original_bn: personalityOriginalBn.trim(),
          cooking,
          group_living: groupLiving,
          medical_history: medicalHistory,
          personal_income: personalIncome.trim(),
          target_savings_5years: targetSavings5Years.trim(),
          motivation: motivation.trim(),
          motivation_original_bn: motivationOriginalBn.trim(),
          future_plan_after_japan: futurePlanAfterJapan.trim(),
          future_plan_original_bn: futurePlanOriginalBn.trim(),
          japan_visa_applied_before: japanVisaAppliedBefore,
          japan_visa_type_applied: japanVisaTypeApplied,
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
          family_in_japan: relativesInJapan,
          family_support_japan: familySupportJapan,
          evaluation: evaluation.trim(),
          teacher_evaluation: evaluation.trim(),
          resubmitted_at: new Date().toISOString(),
        },
      };

      const res = await fetch(`/api/cv-maker/public-form/edit/${encodeURIComponent(token)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.status === 403 || data.locked) {
        setIsLocked(true);
        setSubmitting(false);
        return;
      }

      if (!res.ok || !data.success) {
        setSubmitError(data.message || 'Failed to update application. Please try again.');
        setSubmitting(false);
        return;
      }

      setSubmitSuccess(true);
    } catch (err: any) {
      console.error('Update error:', err);
      setSubmitError('Failed to connect to the server. Please check your internet connection.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.pageWrapper} suppressHydrationWarning>
      <div className={styles.container}>
        {/* Brand Header */}
        <div className={styles.brandHeader}>
          <Image
            src="/images/nikkou-logo.png"
            alt="Nikkou Centre Logo"
            width={240}
            height={75}
            priority
            className={styles.brandLogo}
          />
          <h1 className={styles.brandTitle}>
            履歴書作成フォーム / সিভি সম্পাদনা ফর্ম
          </h1>
          <p className={styles.brandSubtitle}>
            Nikkou Centre International • Student Application Portal (সম্পাদনা পোর্টাল)
          </p>
        </div>

        {/* Main Application Form Card - Full Width */}
        <div className={styles.mainCard} suppressHydrationWarning>
          <div className={styles.cardHeaderAccent} />

          {loading ? (
            <div style={{ textAlign: 'center', padding: '100px 20px' }}>
              <Loader2 size={42} className={styles.spinner} style={{ animation: 'spin 1s linear infinite', color: 'var(--nikkou-red)', margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--nikkou-navy)' }}>
                Loading Application Data...
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>
                আপনার আবেদনের তথ্য লোড করা হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...
              </p>
            </div>
          ) : isLocked ? (
            /* LOCKED / VERIFIED STATE */
            <div
              style={{
                textAlign: 'center',
                padding: '60px 24px',
                maxWidth: '680px',
                margin: '20px auto',
              }}
            >
              <div
                style={{
                  width: '76px',
                  height: '76px',
                  borderRadius: '50%',
                  background: '#ecfdf5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  border: '2px solid #a7f3d0',
                }}
              >
                <ShieldCheck size={42} color="#059669" />
              </div>

              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 16px', borderRadius: '9999px', background: '#ecfdf5', color: '#047857', fontSize: '13px', fontWeight: 800, border: '1px solid #a7f3d0', marginBottom: '16px' }}>
                <CheckCircle2 size={16} /> Verified / যাচাই সম্পন্ন
              </div>

              <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--nikkou-navy)', marginBottom: '10px' }}>
                আবেদনটি যাচাই সম্পন্ন হয়েছে
              </h2>
              <p style={{ fontSize: '14.5px', color: '#475569', lineHeight: 1.6, maxWidth: '520px', margin: '0 auto 24px' }}>
                আপনার এই আবেদনটি নিক্কো জাপানিজ ল্যাঙ্গুয়েজ স্কুল অ্যাডমিন দ্বারা যাচাই ও নিশ্চিত করা হয়েছে। যাচাইকৃত আবেদন লিংক থেকে আর কোনো তথ্য পরিবর্তন বা পুনরায় জমা দেওয়া যাবে না।
              </p>

              {lockedData && (
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1.5px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '18px 24px',
                    textAlign: 'left',
                    maxWidth: '460px',
                    margin: '0 auto 24px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13.5px' }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>Student Code / শিক্ষার্থী কোড:</span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 800, color: 'var(--nikkou-navy)' }}>
                      {lockedData.student_code || '—'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13.5px' }}>
                    <span style={{ color: '#64748b', fontWeight: 600 }}>Applicant Name / প্রার্থীর নাম:</span>
                    <span style={{ fontWeight: 700, color: 'var(--nikkou-navy)' }}>
                      {lockedData.full_name || '—'}
                    </span>
                  </div>
                  {lockedData.program && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13.5px' }}>
                      <span style={{ color: '#64748b', fontWeight: 600 }}>Program / প্রোগ্রাম:</span>
                      <span style={{ fontWeight: 700, color: '#047857' }}>
                        {lockedData.program} {lockedData.sub_program ? `· ${lockedData.sub_program}` : ''}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div
                style={{
                  padding: '14px 18px',
                  background: '#f1f5f9',
                  borderRadius: '10px',
                  fontSize: '13px',
                  color: '#475569',
                  lineHeight: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  textAlign: 'left',
                }}
              >
                <Lock size={20} color="#64748b" style={{ flexShrink: 0 }} />
                <span>
                  কোনো তথ্যে সংশোধনের প্রয়োজন হলে অনুগ্রহ করে সরাসরি অফিস বা আপনার শিক্ষকের সাথে যোগাযোগ করুন।
                </span>
              </div>
            </div>
          ) : loadError ? (
            /* ERROR STATE */
            <div
              style={{
                textAlign: 'center',
                padding: '60px 24px',
                maxWidth: '600px',
                margin: '20px auto',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  background: '#fef2f2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  color: '#dc2626',
                }}
              >
                <AlertCircle size={36} />
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#dc2626', marginBottom: '8px' }}>
                Unable to Access Edit Form
              </h2>
              <p style={{ fontSize: '14.5px', color: '#475569', lineHeight: 1.6, maxWidth: '440px', margin: '0 auto' }}>
                {loadError}
              </p>
            </div>
          ) : submitSuccess ? (
            /* RESUBMIT SUCCESS STATE */
            <div
              style={{
                textAlign: 'center',
                padding: '60px 28px',
                maxWidth: '640px',
                margin: '20px auto',
              }}
            >
              <div
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: '50%',
                  background: '#ecfdf5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                  border: '2px solid #a7f3d0',
                }}
              >
                <CheckCircle2 size={40} color="#059669" />
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--nikkou-navy)', marginBottom: '8px' }}>
                আবেদন সফলভাবে আপডেট হয়েছে!
              </h2>
              <p style={{ fontSize: '15px', color: '#475569', lineHeight: 1.6, maxWidth: '480px', margin: '0 auto 20px' }}>
                Your updated application has been resubmitted successfully to Nikkou Japanese Language School.
              </p>
              <div
                style={{
                  display: 'inline-block',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '10px 20px',
                  fontFamily: 'monospace',
                  fontSize: '15px',
                  fontWeight: 800,
                  color: 'var(--nikkou-navy)',
                  marginBottom: '20px',
                }}
              >
                Student Code: {studentCode || '—'}
              </div>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                আমাদের অ্যাডমিন ও শিক্ষক দল আপনার আপডেটেড তথ্য পর্যালোচনা করবেন।
              </p>
            </div>
          ) : (
            /* ACTIVE EDIT FORM */
            <form
              onSubmit={handleSubmit}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') {
                  e.preventDefault();
                }
              }}
              className={styles.cardForm}
            >
              {/* Form Info Banner */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #eff6ff 0%, #e0f2fe 100%)',
                  border: '1.5px solid #bfdbfe',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  marginBottom: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        padding: '3px 10px',
                        background: '#1d4ed8',
                        color: '#ffffff',
                        fontSize: '12px',
                        fontWeight: 800,
                        borderRadius: '4px',
                        letterSpacing: '0.4px',
                      }}
                    >
                      EDIT APPLICATION
                    </span>
                    <span style={{ fontSize: '14.5px', fontWeight: 700, color: '#1e3a8a' }}>
                      আবেদন সম্পাদনা
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#3b82f6', marginTop: '4px', margin: 0 }}>
                    Applicant: <strong>{fullName || furigana || 'Applicant'}</strong> · Reference Code:{' '}
                    <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{studentCode}</span>
                  </p>
                </div>

                <div
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#1e40af',
                    background: '#ffffff',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    border: '1px solid #bfdbfe',
                  }}
                >
                  Status: Resubmission Mode
                </div>
              </div>

              {submitError && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 16px',
                    background: '#fef2f2',
                    border: '1px solid #fecaca',
                    color: '#b91c1c',
                    borderRadius: '8px',
                    fontSize: '13.5px',
                    marginBottom: '24px',
                  }}
                >
                  <AlertCircle size={18} />
                  <span>{submitError}</span>
                </div>
              )}

              {/* CATEGORY & PROGRAM SELECTION */}
              <ProgramCategorySection
                program={program}
                subProgram={subProgram}
                onChangeProgram={setProgram}
                onChangeSubProgram={setSubProgram}
              />

              {/* Field 1: Formal Photo Upload */}
              <PhotoUploadField
                value={photo}
                onChange={setPhoto}
                disabled={submitting}
              />

              {/* SECTION 1: 基本情報 / প্রাথমিক তথ্য */}
              <div style={{ marginTop: '28px', marginBottom: '28px' }}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionHeaderBar} />
                  <h2 className={styles.sectionTitle}>
                    基本情報 / প্রাথমিক তথ্য
                  </h2>
                </div>

                {/* Grid 1: Furigana and Gender */}
                <div className={styles.grid2}>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>
                      フリガナ / ফুরিগানা
                    </label>
                    <input
                      type="text"
                      value={furigana}
                      onChange={(e) => setFurigana(e.target.value.toUpperCase())}
                      placeholder="Full Name"
                      className={styles.formInput}
                      style={{ textTransform: 'uppercase' }}
                    />
                    <span className={styles.formHelpText}>
                      পাসপোর্ট অনুযায়ী নাম (ফুরিগানা)
                    </span>
                  </div>

                  <div className={styles.formField}>
                    <label className={styles.formLabel}>
                      性別 / সেক্স
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className={styles.formSelect}
                      style={{ color: gender ? 'var(--text-primary)' : '#94a3b8' }}
                    >
                      <option value="">選択してください / নির্বাচন করুন</option>
                      <option value="男性 / পুরুষ">男性 / পুরুষ</option>
                      <option value="女性 / মহিলা">女性 / মহিলা</option>
                      {gender && !['男性 / পুরুষ', '女性 / মহিলা'].includes(gender) && (
                        <option value={gender}>{gender}</option>
                      )}
                    </select>
                  </div>
                </div>

                {/* Grid 2: Full Name and Marital Status */}
                <div className={styles.grid2}>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>
                      氏名 / নাম
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value.toUpperCase())}
                      placeholder="Full Name"
                      className={styles.formInput}
                      style={{ textTransform: 'uppercase' }}
                    />
                    <span className={styles.formHelpText}>
                      カタカナ・氏名 / কাতাকানা বা পূর্ণ নাম
                    </span>
                  </div>

                  <div className={styles.formField}>
                    <label className={styles.formLabel}>
                      婚姻 / বিবাহ
                    </label>
                    <select
                      value={maritalStatus}
                      onChange={(e) => setMaritalStatus(e.target.value)}
                      className={styles.formSelect}
                      style={{ color: maritalStatus ? 'var(--text-primary)' : '#94a3b8' }}
                    >
                      <option value="">選択してください / নির্বাচন করুন</option>
                      <option value="独身 / অবিবাহিত">独身 / অবিবাহিত</option>
                      <option value="既婚 / বিবাহিত">既婚 / বিবাহিত</option>
                      {maritalStatus && !['独身 / অবিবাহিত', '既婚 / বিবাহিত'].includes(maritalStatus) && (
                        <option value={maritalStatus}>{maritalStatus}</option>
                      )}
                    </select>
                  </div>
                </div>

                {/* Grid 3: Date of Birth and Age */}
                <div className={styles.grid2}>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>
                      生年月日 / জন্ম তারিখ
                    </label>
                    <input
                      type="date"
                      value={dob}
                      onChange={handleDobChange}
                      className={styles.formInput}
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

                  <div className={styles.formField}>
                    <label className={styles.formLabel}>
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
                      className={styles.formInput}
                    />
                  </div>
                </div>

                {/* Grid 4: Contact Address */}
                <div className={styles.formFieldFull}>
                  <label className={styles.formLabel}>
                    連絡先 / ঠিকানা
                  </label>
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="VILL: PAIKPARA, P.O: JEWPARA, P.S: NATORE SADAR, NATORE"
                    className={styles.formTextarea}
                  />
                </div>

                {/* Grid 5: Phone Number */}
                <div className={styles.formFieldFull}>
                  <label className={styles.formLabel}>
                    電話 / ফোন
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+8801612-017273"
                    className={styles.formInput}
                  />
                </div>
              </div>

              {/* SECTION 2: 個人情報 / ব্যক্তিগত তথ্য */}
              <div style={{ marginTop: '36px', marginBottom: '28px' }}>
                <div className={styles.sectionHeader}>
                  <div className={styles.sectionHeaderBar} />
                  <h2 className={styles.sectionTitle}>
                    個人情報 / ব্যক্তিগত তথ্য
                  </h2>
                </div>

                {/* Grid 1: Eyesight, Color Blindness, Dominant Hand */}
                <div className={styles.grid3}>
                  <EyesightField value={eyesight} onChange={setEyesight} />

                  <div className={styles.formField}>
                    <label className={styles.formLabel}>
                      色盲・色弱 / বর্ণান্ধতা
                    </label>
                    <select
                      value={colorBlindness}
                      onChange={(e) => setColorBlindness(e.target.value)}
                      className={styles.formSelect}
                      style={{ color: colorBlindness ? 'var(--text-primary)' : '#94a3b8' }}
                    >
                      <option value="">選択してください / নির্বাচন করুন</option>
                      <option value="無 / না">無 / না</option>
                      <option value="有 / হ্যাঁ">有 / হ্যাঁ</option>
                      {colorBlindness && !['無 / না', '有 / হ্যাঁ'].includes(colorBlindness) && (
                        <option value={colorBlindness}>{colorBlindness}</option>
                      )}
                    </select>
                  </div>

                  <div className={styles.formField}>
                    <label className={styles.formLabel}>
                      利き手 / প্রভাবশালী হাত
                    </label>
                    <select
                      value={dominantHand}
                      onChange={(e) => setDominantHand(e.target.value)}
                      className={styles.formSelect}
                      style={{ color: dominantHand ? 'var(--text-primary)' : '#94a3b8' }}
                    >
                      <option value="">選択してください / নির্বাচন করুন</option>
                      <option value="右手 / ডান হাত">右手 / ডান হাত</option>
                      <option value="左手 / বাম হাত">左手 / বাম হাত</option>
                      <option value="両手 / উভয় হাত">両手 / উভয় হাত</option>
                      {dominantHand && !['右手 / ডান হাত', '左手 / বাম হাত', '両手 / উভয় হাত'].includes(dominantHand) && (
                        <option value={dominantHand}>{dominantHand}</option>
                      )}
                    </select>
                  </div>
                </div>

                {/* Grid 2: Body Weight, Height, Tattoo/Surgery */}
                <div className={styles.grid3}>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>
                      体重 / ওজন (kg)
                    </label>
                    <input
                      type="text"
                      value={bodyWeight}
                      onChange={(e) => setBodyWeight(e.target.value)}
                      placeholder="例: 60"
                      className={styles.formInput}
                    />
                  </div>

                  <div className={styles.formField}>
                    <label className={styles.formLabel}>
                      身長 / উচ্চতা (cm)
                    </label>
                    <input
                      type="text"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      placeholder="例: 172"
                      className={styles.formInput}
                    />
                  </div>

                  <div className={styles.formField}>
                    <label className={styles.formLabel}>
                      入れ墨（タトゥー）・手術歴 / ট্যাটু বা সার্জারির ইতিহাস
                    </label>
                    <select
                      value={tattooSurgery}
                      onChange={(e) => setTattooSurgery(e.target.value)}
                      className={styles.formSelect}
                      style={{ color: tattooSurgery ? 'var(--text-primary)' : '#94a3b8' }}
                    >
                      <option value="">選択してください / নির্বাচন করুন</option>
                      <option value="無 / না">無 / না</option>
                      <option value="有 / হ্যাঁ">有 / হ্যাঁ</option>
                      {tattooSurgery && !['無 / না', '有 / হ্যাঁ'].includes(tattooSurgery) && (
                        <option value={tattooSurgery}>{tattooSurgery}</option>
                      )}
                    </select>
                  </div>
                </div>

                {/* Grid 3: Smoking, Alcohol, Blood Type */}
                <div className={styles.grid3}>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>
                      喫煙習慣 / ধূমপান
                    </label>
                    <select
                      value={smoking}
                      onChange={(e) => setSmoking(e.target.value)}
                      className={styles.formSelect}
                      style={{ color: smoking ? 'var(--text-primary)' : '#94a3b8' }}
                    >
                      <option value="">選択してください / নির্বাচন করুন</option>
                      <option value="無 / না">無 / না</option>
                      <option value="有 / হ্যাঁ">有 / হ্যাঁ</option>
                      {smoking && !['無 / না', '有 / হ্যাঁ'].includes(smoking) && (
                        <option value={smoking}>{smoking}</option>
                      )}
                    </select>
                  </div>

                  <div className={styles.formField}>
                    <label className={styles.formLabel}>
                      飲酒習慣 / মদ পান?
                    </label>
                    <select
                      value={alcohol}
                      onChange={(e) => setAlcohol(e.target.value)}
                      className={styles.formSelect}
                      style={{ color: alcohol ? 'var(--text-primary)' : '#94a3b8' }}
                    >
                      <option value="">選択してください / নির্বাচন করুন</option>
                      <option value="無 / না">無 / না</option>
                      <option value="有 / হ্যাঁ">有 / হ্যাঁ</option>
                      {alcohol && !['無 / না', '有 / হ্যাঁ'].includes(alcohol) && (
                        <option value={alcohol}>{alcohol}</option>
                      )}
                    </select>
                  </div>

                  <div className={styles.formField}>
                    <label className={styles.formLabel}>
                      血液型 / রক্তের গ্রুপ
                    </label>
                    <select
                      value={bloodType}
                      onChange={(e) => setBloodType(e.target.value)}
                      className={styles.formSelect}
                      style={{ color: bloodType ? 'var(--text-primary)' : '#94a3b8' }}
                    >
                      <option value="">選択してください / নির্বাচন করুন</option>
                      <option value="A+型 / এ+ গ্রুপ">A+型 / এ+ গ্রুপ</option>
                      <option value="B+型 / বি+ গ্রুপ">B+型 / বি+ গ্রুপ</option>
                      <option value="O+型 / ও+ গ্রুপ">O+型 / ও+ গ্রুপ</option>
                      <option value="AB+型 / এবি+ গ্রুপ">AB+型 / এবি+ গ্রুপ</option>
                      <option value="A-型 / এ- গ্রুপ">A-型 / এ- গ্রুপ</option>
                      <option value="B-型 / বি- গ্রুপ">B-型 / বি- গ্রুপ</option>
                      <option value="O-型 / ও- গ্রুপ">O-型 / ও- গ্রুপ</option>
                      <option value="AB-型 / এবি- গ্রুপ">AB-型 / এবি- গ্রুপ</option>
                      {bloodType && !['A+型 / এ+ গ্রুপ', 'B+型 / বি+ গ্রুপ', 'O+型 / ও+ গ্রুপ', 'AB+型 / এবি+ গ্রুপ', 'A-型 / এ- গ্রুপ', 'B-型 / বি- গ্রুপ', 'O-型 / ও- গ্রুপ', 'AB-型 / এবি- গ্রুপ'].includes(bloodType) && (
                        <option value={bloodType}>{bloodType}</option>
                      )}
                    </select>
                  </div>
                </div>

                {/* Grid 4: Hobby & Personality */}
                <div className={styles.grid2}>
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

                {/* Grid 5: Cooking, Group living, Medical history */}
                <div className={styles.grid3}>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>
                      料理経験 / রান্না
                    </label>
                    <select
                      value={cooking}
                      onChange={(e) => setCooking(e.target.value)}
                      className={styles.formSelect}
                      style={{ color: cooking ? 'var(--text-primary)' : '#94a3b8' }}
                    >
                      <option value="">選択してください / নির্বাচন করুন</option>
                      <option value="有 / হ্যাঁ">有 / হ্যাঁ</option>
                      <option value="無 / না">無 / না</option>
                      {cooking && !['有 / হ্যাঁ', '無 / না'].includes(cooking) && (
                        <option value={cooking}>{cooking}</option>
                      )}
                    </select>
                  </div>

                  <div className={styles.formField}>
                    <label className={styles.formLabel}>
                      集団生活経験 / গ্রুপ লিভিং অভিজ্ঞতা
                    </label>
                    <select
                      value={groupLiving}
                      onChange={(e) => setGroupLiving(e.target.value)}
                      className={styles.formSelect}
                      style={{ color: groupLiving ? 'var(--text-primary)' : '#94a3b8' }}
                    >
                      <option value="">選択してください / নির্বাচন করুন</option>
                      <option value="有 / হ্যাঁ">有 / হ্যাঁ</option>
                      <option value="無 / না">無 / না</option>
                      {groupLiving && !['有 / হ্যাঁ', '無 / না'].includes(groupLiving) && (
                        <option value={groupLiving}>{groupLiving}</option>
                      )}
                    </select>
                  </div>

                  <div className={styles.formField}>
                    <label className={styles.formLabel}>
                      病歴 / চিকিৎসা ইতিহাস
                    </label>
                    <select
                      value={medicalHistory}
                      onChange={(e) => setMedicalHistory(e.target.value)}
                      className={styles.formSelect}
                      style={{ color: medicalHistory ? 'var(--text-primary)' : '#94a3b8' }}
                    >
                      <option value="">選択してください / নির্বাচন করুন</option>
                      <option value="無 / না">無 / না</option>
                      <option value="有 / হ্যাঁ">有 / হ্যাঁ</option>
                      {medicalHistory && !['無 / না', '有 / হ্যাঁ'].includes(medicalHistory) && (
                        <option value={medicalHistory}>{medicalHistory}</option>
                      )}
                    </select>
                  </div>
                </div>

                {/* Grid 6: Personal Income & 5 Years Target Savings */}
                <div className={styles.grid2}>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>
                      個人収入 / ব্যক্তিগত আয়
                    </label>
                    <input
                      type="text"
                      value={personalIncome}
                      onChange={(e) => setPersonalIncome(e.target.value)}
                      placeholder="例: 0 万円 / ইয়েন"
                      className={styles.formInput}
                    />
                  </div>

                  <div className={styles.formField}>
                    <label className={styles.formLabel}>
                      5年後の貯蓄目標 / ৫ বছরের সঞ্চয় লক্ষ্য
                    </label>
                    <input
                      type="text"
                      value={targetSavings5Years}
                      onChange={(e) => setTargetSavings5Years(e.target.value)}
                      placeholder="例: 600 万円 / ৬০ লক্ষ টাকা"
                      className={styles.formInput}
                    />
                  </div>
                </div>

                {/* Motivation: Big Text Area */}
                <div style={{ marginBottom: '18px' }}>
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

                {/* Future Plan: Big Text Area */}
                <div style={{ marginBottom: '18px' }}>
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

                {/* Grid 7: Visa History */}
                <div className={styles.grid2}>
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>
                      日本の在留資格申請経験 / আপনি কি কখনো জাপানের ভিসা জন্য আবেদন করেছেন?
                    </label>
                    <select
                      value={japanVisaAppliedBefore}
                      onChange={(e) => setJapanVisaAppliedBefore(e.target.value)}
                      className={styles.formSelect}
                      style={{ color: japanVisaAppliedBefore ? 'var(--text-primary)' : '#94a3b8' }}
                    >
                      <option value="">選択してください / নির্বাচন করুন</option>
                      <option value="無 / না">無 / না</option>
                      <option value="有 / হ্যাঁ">有 / হ্যাঁ</option>
                      {japanVisaAppliedBefore && !['無 / না', '有 / হ্যাঁ'].includes(japanVisaAppliedBefore) && (
                        <option value={japanVisaAppliedBefore}>{japanVisaAppliedBefore}</option>
                      )}
                    </select>
                  </div>

                  <div className={styles.formField}>
                    <label className={styles.formLabel}>
                      申請したことがある場合、どの資格に申請したか / যদি তাই হয়, আপনি কি ভিসার জন্য আবেদন করেছেন?
                    </label>
                    <select
                      value={japanVisaTypeApplied}
                      onChange={(e) => setJapanVisaTypeApplied(e.target.value)}
                      className={styles.formSelect}
                      style={{ color: japanVisaTypeApplied ? 'var(--text-primary)' : '#94a3b8' }}
                    >
                      <option value="">選択してください / নির্বাচন করুন</option>
                      <option value="無 / না">無 / না</option>
                      <option value="留学 / স্টুডেন্ট ভিসা">留学 / স্টুডেন্ট ভিসা</option>
                      <option value="技能実習 / টেকনিক্যাল ইন্টার্ন">技能実習 / টেকনিক্যাল ইন্টার্ন</option>
                      <option value="特定技能 / স্পেসিফাইড স্কিল্ড">特定技能 / স্পেসিফাইড স্কিল্ড</option>
                      <option value="家族滞在 / ডিপেন্ডেন্ট">家族滞在 / ডিপেন্ডেন্ট</option>
                      <option value="短期滞在 / ট্যুরিস্ট">短期滞在 / ট্যুরিস্ট</option>
                      <option value="その他 / অন্যান্য">その他 / অন্যান্য</option>
                      {japanVisaTypeApplied && !['無 / না', '留学 / স্টুডেন্ট ভিসা', '技能実習 / টেকনিক্যাল ইন্টার্ন', '特定技能 / স্পেসিফাইড স্কিল্ড', '家族滞在 / ডিপেন্ডেন্ট', '短期滞在 / ট্যুরিস্ট', 'その他 / অন্যান্য'].includes(japanVisaTypeApplied) && (
                        <option value={japanVisaTypeApplied}>{japanVisaTypeApplied}</option>
                      )}
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 3: 学歴 / শিক্ষাগত যোগ্যতা */}
              <EducationHistorySection
                entries={educationHistory}
                onChange={setEducationHistory}
                disabled={submitting}
              />

              {/* SECTION 4: その他言語 / অন্যান্য ভাষা */}
              <div className={styles.sectionCard}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '20px',
                    paddingBottom: '12px',
                    borderBottom: '2px solid #fee2e2',
                  }}
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: '#fef2f2',
                      color: 'var(--nikkou-red)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Languages size={18} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#dc2626', margin: 0 }}>
                      その他言語 / অন্যান্য ভাষা
                    </h3>
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      言語能力（読み・書き） / ভাষার দক্ষতা (পড়া ও লেখা)
                    </span>
                  </div>
                </div>

                <div className={styles.grid2}>
                  {/* Field 1: 母国語（ベンガル語）【書き、読み】 */}
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>
                      母国語（ベンガル語）【書き、読み】 / মাতৃভাষা (বাংলা) [লেখা এবং পড়া]
                    </label>
                    <select
                      value={languageBengali}
                      onChange={(e) => setLanguageBengali(e.target.value)}
                      className={styles.formSelect}
                      style={{ color: languageBengali ? 'var(--text-primary)' : '#94a3b8' }}
                    >
                      <option value="">選択してください / নির্বাচন করুন</option>
                      <option value="可 / পারি">可 / পারি</option>
                      <option value="少し可 / কিছুটা পারি">少し可 / কিছুটা পারি</option>
                      <option value="出来ない / পারি না">出来ない / পারি না</option>
                      {languageBengali && !['可 / পারি', '少し可 / কিছুটা পারি', '出来ない / পারি না'].includes(languageBengali) && (
                        <option value={languageBengali}>{languageBengali}</option>
                      )}
                    </select>
                  </div>

                  {/* Field 2: 英語【書き、読み】 */}
                  <div className={styles.formField}>
                    <label className={styles.formLabel}>
                      英語【書き、読み】 / ইংরেজি [লেখা, পড়া]
                    </label>
                    <select
                      value={languageEnglish}
                      onChange={(e) => setLanguageEnglish(e.target.value)}
                      className={styles.formSelect}
                      style={{ color: languageEnglish ? 'var(--text-primary)' : '#94a3b8' }}
                    >
                      <option value="">選択してください / নির্বাচন করুন</option>
                      <option value="可 / পারি">可 / পারি</option>
                      <option value="少し可 / কিছুটা পারি">少し可 / কিছুটা পারি</option>
                      <option value="出来ない / পারি না">出来ない / পারি না</option>
                      {languageEnglish && !['可 / পারি', '少し可 / কিছুটা পারি', '出来ない / পারি না'].includes(languageEnglish) && (
                        <option value={languageEnglish}>{languageEnglish}</option>
                      )}
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 5: 職歴 / কাজের ইতিহাস */}
              <WorkHistorySection
                entries={workHistory}
                onChange={setWorkHistory}
                disabled={submitting}
                aiEnabled={aiEnabled}
              />

              {/* SECTION 6: 家族 / পরিবার */}
              <FamilyInfoSection
                entries={familyMembers}
                onChangeEntries={setFamilyMembers}
                relativesInJapan={relativesInJapan}
                onChangeRelativesInJapan={setRelativesInJapan}
                familySupportJapan={familySupportJapan}
                onChangeFamilySupportJapan={setFamilySupportJapan}
                disabled={submitting}
              />

              {/* SECTION 7: 評価 / মূল্যায়ন (Optional) */}
              <div className={styles.sectionCard}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '16px',
                    paddingBottom: '10px',
                    borderBottom: '2px solid #fee2e2',
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
                        flexShrink: 0,
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

                <div className={styles.formFieldFull}>
                  <label className={styles.formLabel}>
                    評価・コメント / শিক্ষকের মূল্যায়ন
                  </label>
                  <textarea
                    rows={3}
                    value={evaluation}
                    onChange={(e) => setEvaluation(e.target.value)}
                    placeholder="শিক্ষক বা ম্যানেজমেন্ট মূল্যায়নের জন্য সংরক্ষিত ক্ষেত্র..."
                    className={styles.formTextarea}
                  />
                </div>
              </div>

              {/* Form Actions: Update & Resubmit */}
              <div
                className={styles.bottomActionGroup}
                style={{
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginTop: '36px',
                  paddingTop: '24px',
                  borderTop: '1.5px solid var(--border-light, #e2e8f0)',
                  width: '100%',
                }}
              >
                <button
                  type="submit"
                  disabled={submitting}
                  className={styles.submitButton}
                  style={{
                    maxWidth: '560px',
                    width: '100%',
                    minHeight: '52px',
                    padding: '14px 28px',
                    fontSize: '15px',
                    fontWeight: 700,
                    cursor: submitting ? 'not-allowed' : 'pointer',
                  }}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={18} style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
                      <span>Updating & Resubmitting... / আবেদন আপডেট হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <Send size={18} style={{ flexShrink: 0 }} />
                      <span>Update & Resubmit Application</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer Note */}
        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: 'var(--text-muted)' }}>
          © 2026 Nikkou Centre International. Official Japanese Language School Portal.
        </div>
      </div>
    </div>
  );
}

export default function StudentCvEditFormPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ textAlign: 'center', color: 'var(--nikkou-navy)' }}>
            <Loader2 size={36} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
            <div style={{ fontSize: '15px', fontWeight: 700 }}>Loading edit form...</div>
          </div>
        </div>
      }
    >
      <StudentCvEditFormContent />
    </Suspense>
  );
}
