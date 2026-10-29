'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import PhotoUploadField from '@/components/PhotoUploadField';
import ProgramCategorySection from '@/components/ProgramCategorySection';
import EducationHistorySection, { INITIAL_EDUCATION_ROWS } from '@/components/EducationHistorySection';
import WorkHistorySection, { INITIAL_WORK_ROWS } from '@/components/WorkHistorySection';
import FamilyInfoSection, { INITIAL_FAMILY_ROWS } from '@/components/FamilyInfoSection';
import { EducationEntry, WorkExperienceEntry, FamilyMemberEntry, EYESIGHT_OPTIONS, TARGET_SAVINGS_OPTIONS, PERSONAL_INCOME_OPTIONS } from '@/types/cv';
import {
  Send,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Phone,
  User,
  MapPin,
  Heart,
  Sparkles,
  Languages,
  Save,
  RotateCcw,
  Check,
} from 'lucide-react';
import EyesightField from '@/components/EyesightField';
import TranslatableTextarea from '@/components/TranslatableTextarea';
import AiDocumentFillModal from '@/components/AiDocumentFillModal';
import {
  normalizeGender,
  normalizeMaritalStatus,
  normalizeYesNo,
  normalizeDominantHand,
  normalizeBloodType,
  normalizeLanguageProficiency,
  normalizeFamilySupport,
  normalizeJapanVisaType,
  normalizeEducationSubject,
  normalizeQualification,
  normalizeRelationship,
  normalizeOccupation,
  normalizeFamilyAge,
  normalizeCandidateAge,
  calculateAgeFromDob,
  normalizeCandidateDob,
  normalizeJapaneseYearMonth,
} from '@/lib/cv-normalizer';
import styles from './cv-form.module.css';

import {
  formatJapaneseBirthDate,
  normalizeTargetSavings,
  normalizePersonalIncome,
  formatReadableBirthDate,
} from '@/lib/cv-normalizer';
export { formatJapaneseBirthDate };

export default function FixedStudentCvForm() {
  // Category & Program Selection (Top of form, before photo)
  const [program, setProgram] = useState('');
  const [subProgram, setSubProgram] = useState('');

  // Field 1: Photo
  const [photo, setPhoto] = useState<string | null>(null);

  // Section: 基本情報 / প্রাথমিক তথ্য (Basic Information)
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

  // Submission & Draft State
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submittedCode, setSubmittedCode] = useState<string | null>(null);

  // Draft Caching & Database Drafting States
  const [draftStudentCode, setDraftStudentCode] = useState<string | null>(null);
  const [draftRestored, setDraftRestored] = useState(false);
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [savingDraft, setSavingDraft] = useState(false);
  const [draftSaveSuccess, setDraftSaveSuccess] = useState<string | null>(null);
  const isLoadedFromStorageRef = useRef(false);

  // Public form: AI features and translation buttons are strictly hidden (admin only)
  const aiEnabled = false;
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [aiSuccessToast, setAiSuccessToast] = useState<string | null>(null);

  // Handler to populate form state when AI finishes document parsing
  const handleDataExtractedFromAi = (data: any, count: number) => {
    if (!data || typeof data !== 'object') return;

    // Basic Information
    if (data.full_name) setFullName(String(data.full_name).toUpperCase());
    if (data.furigana) setFurigana(data.furigana);
    if (data.gender) setGender(normalizeGender(data.gender));
    if (data.marital_status) setMaritalStatus(normalizeMaritalStatus(data.marital_status));

    // DOB & Age
    const normalizedDob = normalizeCandidateDob(data.dob);
    if (normalizedDob) setDob(normalizedDob);
    const normalizedAge = normalizeCandidateAge(data.age, normalizedDob || dob);
    if (normalizedAge) setAge(normalizedAge);

    if (data.address) setAddress(data.address);
    if (data.phone) setPhone(data.phone);

    // Personal Information
    if (data.eyesight) setEyesight(data.eyesight);
    if (data.color_blindness !== undefined && data.color_blindness !== null && data.color_blindness !== '') {
      setColorBlindness(normalizeYesNo(data.color_blindness, true));
    }
    if (data.dominant_hand) setDominantHand(normalizeDominantHand(data.dominant_hand));
    if (data.body_weight) setBodyWeight(data.body_weight);
    if (data.height) setHeight(data.height);
    if (data.tattoo_surgery !== undefined && data.tattoo_surgery !== null && data.tattoo_surgery !== '') {
      setTattooSurgery(normalizeYesNo(data.tattoo_surgery, true));
    }
    if (data.smoking !== undefined && data.smoking !== null && data.smoking !== '') {
      setSmoking(normalizeYesNo(data.smoking, true));
    }
    if (data.alcohol !== undefined && data.alcohol !== null && data.alcohol !== '') {
      setAlcohol(normalizeYesNo(data.alcohol, true));
    }
    if (data.blood_type) setBloodType(normalizeBloodType(data.blood_type));
    if (data.hobbies) setHobbies(data.hobbies);
    if (data.hobbies_original_bn) setHobbiesOriginalBn(data.hobbies_original_bn);
    if (data.personality) setPersonality(data.personality);
    if (data.personality_original_bn) setPersonalityOriginalBn(data.personality_original_bn);
    if (data.cooking !== undefined && data.cooking !== null && data.cooking !== '') {
      setCooking(normalizeYesNo(data.cooking, true));
    }
    if (data.medical_history !== undefined && data.medical_history !== null && data.medical_history !== '') {
      setMedicalHistory(normalizeYesNo(data.medical_history, true));
    }
    if (data.group_living !== undefined && data.group_living !== null && data.group_living !== '') {
      setGroupLiving(normalizeYesNo(data.group_living, true));
    }
    if (data.personal_income) setPersonalIncome(normalizePersonalIncome(data.personal_income));
    if (data.target_savings_5years) setTargetSavings5Years(normalizeTargetSavings(data.target_savings_5years));
    if (data.motivation) setMotivation(data.motivation);
    if (data.motivation_original_bn) setMotivationOriginalBn(data.motivation_original_bn);
    if (data.future_plan_after_japan) setFuturePlanAfterJapan(data.future_plan_after_japan);
    if (data.future_plan_original_bn) setFuturePlanOriginalBn(data.future_plan_original_bn);
    if (data.japan_visa_applied_before !== undefined && data.japan_visa_applied_before !== null && data.japan_visa_applied_before !== '') {
      setJapanVisaAppliedBefore(normalizeYesNo(data.japan_visa_applied_before, true));
    }
    if (data.japan_visa_type_applied) setJapanVisaTypeApplied(normalizeJapanVisaType(data.japan_visa_type_applied));

    // Languages
    if (data.language_bengali) {
      setLanguageBengali(normalizeLanguageProficiency(data.language_bengali, true));
    } else {
      setLanguageBengali('可 / পারি');
    }
    if (data.language_english) {
      setLanguageEnglish(normalizeLanguageProficiency(data.language_english, false));
    }

    // Education History
    if (Array.isArray(data.education_history) && data.education_history.length > 0) {
      const mappedEdu = data.education_history.map((e: any, idx: number) => ({
        id: `edu-ai-${idx}-${Date.now()}`,
        start_year_month: normalizeJapaneseYearMonth(e.start_year_month),
        end_year_month: normalizeJapaneseYearMonth(e.end_year_month),
        school_name: e.school_name ? String(e.school_name).toUpperCase() : '',
        major_subject: normalizeEducationSubject(e.major_subject),
        qualification: normalizeQualification(e.qualification),
      }));
      while (mappedEdu.length < 3) {
        mappedEdu.push({ id: `edu-ai-${mappedEdu.length}`, start_year_month: '', end_year_month: '', school_name: '', major_subject: '', qualification: '' });
      }
      setEducationHistory(mappedEdu);
    }

    // Work History
    if (Array.isArray(data.work_history) && data.work_history.length > 0) {
      const mappedWork = data.work_history.map((w: any, idx: number) => ({
        id: `work-ai-${idx}-${Date.now()}`,
        start_year_month: normalizeJapaneseYearMonth(w.start_year_month),
        end_year_month: normalizeJapaneseYearMonth(w.end_year_month),
        company_name: w.company_name ? String(w.company_name).toUpperCase() : '',
        job_description: w.job_description || '',
      }));
      while (mappedWork.length < 3) {
        mappedWork.push({ id: `work-ai-${mappedWork.length}`, start_year_month: '', end_year_month: '', company_name: '', job_description: '' });
      }
      setWorkHistory(mappedWork);
    }

    // Family Members
    if (Array.isArray(data.family_members) && data.family_members.length > 0) {
      const mappedFam = data.family_members.map((f: any, idx: number) => {
        const normAge = normalizeFamilyAge(f.age);
        const isDeceased = normAge.includes('死亡') || normAge.includes('মৃত');
        return {
          id: `fam-ai-${idx}-${Date.now()}`,
          name: f.name ? String(f.name).toUpperCase() : '',
          relationship: normalizeRelationship(f.relationship),
          age: normAge,
          occupation: isDeceased ? '-' : normalizeOccupation(f.occupation),
        };
      });
      while (mappedFam.length < 3) {
        mappedFam.push({ id: `fam-ai-${mappedFam.length}`, name: '', relationship: '', age: '', occupation: '' });
      }
      setFamilyMembers(mappedFam);
    }

    // Relatives in Japan & Family Support
    if (data.relatives_in_japan !== undefined && data.relatives_in_japan !== null && data.relatives_in_japan !== '') {
      setRelativesInJapan(normalizeYesNo(data.relatives_in_japan, true));
    }
    if (data.family_support_japan) {
      setFamilySupportJapan(normalizeFamilySupport(data.family_support_japan));
    } else {
      setFamilySupportJapan('賛成 / রাজি');
    }

    // Evaluation
    if (data.evaluation) setEvaluation(data.evaluation);

    setAiSuccessToast(`✨ AI successfully populated ${count} fields from your document!`);
    setTimeout(() => setAiSuccessToast(null), 6000);
  };

  // Restore draft from localStorage on initial mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem('nikkou_student_cv_draft');
      if (cached) {
        const data = JSON.parse(cached);
        if (data && typeof data === 'object') {
          if (data.program !== undefined) setProgram(data.program);
          if (data.subProgram !== undefined) setSubProgram(data.subProgram);
          if (data.photo !== undefined) setPhoto(data.photo);
          if (data.furigana !== undefined) setFurigana(data.furigana);
          if (data.fullName !== undefined) setFullName(data.fullName);
          if (data.gender !== undefined) setGender(data.gender);
          if (data.maritalStatus !== undefined) setMaritalStatus(data.maritalStatus);
          if (data.dob !== undefined) setDob(data.dob);
          if (data.age !== undefined) setAge(data.age);
          if (data.address !== undefined) setAddress(data.address);
          if (data.phone !== undefined) setPhone(data.phone);

          if (data.eyesight !== undefined) setEyesight(data.eyesight);
          if (data.colorBlindness !== undefined) setColorBlindness(data.colorBlindness);
          if (data.dominantHand !== undefined) setDominantHand(data.dominantHand);
          if (data.bodyWeight !== undefined) setBodyWeight(data.bodyWeight);
          if (data.height !== undefined) setHeight(data.height);
          if (data.tattooSurgery !== undefined) setTattooSurgery(data.tattooSurgery);
          if (data.smoking !== undefined) setSmoking(data.smoking);
          if (data.alcohol !== undefined) setAlcohol(data.alcohol);
          if (data.hobbies !== undefined) setHobbies(data.hobbies);
          if (data.hobbiesOriginalBn !== undefined) setHobbiesOriginalBn(data.hobbiesOriginalBn);
          if (data.personality !== undefined) setPersonality(data.personality);
          if (data.personalityOriginalBn !== undefined) setPersonalityOriginalBn(data.personalityOriginalBn);
          if (data.cooking !== undefined) setCooking(data.cooking);
          if (data.groupLiving !== undefined) setGroupLiving(data.groupLiving);
          if (data.bloodType !== undefined) setBloodType(data.bloodType);
          if (data.medicalHistory !== undefined) setMedicalHistory(data.medicalHistory);
          if (data.personalIncome !== undefined) setPersonalIncome(data.personalIncome);
          if (data.targetSavings5Years !== undefined) setTargetSavings5Years(data.targetSavings5Years);
          if (data.motivation !== undefined) setMotivation(data.motivation);
          if (data.motivationOriginalBn !== undefined) setMotivationOriginalBn(data.motivationOriginalBn);
          if (data.futurePlanAfterJapan !== undefined) setFuturePlanAfterJapan(data.futurePlanAfterJapan);
          if (data.futurePlanOriginalBn !== undefined) setFuturePlanOriginalBn(data.futurePlanOriginalBn);
          if (data.japanVisaAppliedBefore !== undefined) setJapanVisaAppliedBefore(data.japanVisaAppliedBefore);
          if (data.japanVisaTypeApplied !== undefined) setJapanVisaTypeApplied(data.japanVisaTypeApplied);

          if (Array.isArray(data.educationHistory) && data.educationHistory.length > 0) {
            setEducationHistory(data.educationHistory);
          }
          if (data.languageBengali !== undefined) setLanguageBengali(normalizeLanguageProficiency(data.languageBengali, true));
          if (data.languageEnglish !== undefined) setLanguageEnglish(normalizeLanguageProficiency(data.languageEnglish, false));

          if (Array.isArray(data.workHistory) && data.workHistory.length > 0) {
            setWorkHistory(data.workHistory);
          }
          if (Array.isArray(data.familyMembers) && data.familyMembers.length > 0) {
            setFamilyMembers(data.familyMembers);
          }
          if (data.relativesInJapan !== undefined) setRelativesInJapan(data.relativesInJapan);
          if (data.familySupportJapan !== undefined) setFamilySupportJapan(data.familySupportJapan);
          if (data.evaluation !== undefined) setEvaluation(data.evaluation);
          if (data.draftStudentCode) setDraftStudentCode(data.draftStudentCode);

          if (data.savedAt) {
            setLastSavedTime(new Date(data.savedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
          }

          const hasData = Boolean(
            data.fullName || data.phone || data.photo || data.address || data.dob ||
            (data.educationHistory && data.educationHistory.some((e: any) => e.school_name))
          );
          if (hasData) {
            setDraftRestored(true);
          }
        }
      }
    } catch (e) {
      console.error('Failed to load draft from localStorage:', e);
    } finally {
      isLoadedFromStorageRef.current = true;
    }
  }, []);


  // Accidental navigation & refresh protection
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (submittedCode) return;
      const hasAnyContent = Boolean(
        program || subProgram || photo || furigana || fullName || phone || address || dob ||
        educationHistory.some((e) => e.school_name.trim()) ||
        workHistory.some((w) => w.company_name.trim())
      );
      if (hasAnyContent) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [program, subProgram, photo, furigana, fullName, phone, address, dob, educationHistory, workHistory, submittedCode]);

  const handleClearDraft = () => {
    if (window.confirm('আপনি কি নিশ্চিত যে সংরক্ষিত খসড়া মুছে নতুন করে ফর্ম শুরু করতে চান? / 下書きデータを削除して初期化しますか？')) {
      try {
        localStorage.removeItem('nikkou_student_cv_draft');
      } catch {
        // ignore
      }
      setProgram('');
      setSubProgram('');
      setPhoto(null);
      setFurigana('');
      setFullName('');
      setGender('');
      setMaritalStatus('');
      setDob('');
      setAge('');
      setAddress('');
      setPhone('');
      setEyesight('');
      setColorBlindness('');
      setDominantHand('');
      setBodyWeight('');
      setHeight('');
      setTattooSurgery('');
      setSmoking('');
      setAlcohol('');
      setHobbies('');
      setHobbiesOriginalBn('');
      setPersonality('');
      setPersonalityOriginalBn('');
      setCooking('');
      setGroupLiving('');
      setBloodType('');
      setMedicalHistory('');
      setPersonalIncome('');
      setTargetSavings5Years('');
      setMotivation('');
      setMotivationOriginalBn('');
      setFuturePlanAfterJapan('');
      setFuturePlanOriginalBn('');
      setJapanVisaAppliedBefore('');
      setJapanVisaTypeApplied('');
      setEducationHistory(INITIAL_EDUCATION_ROWS);
      setLanguageBengali('');
      setLanguageEnglish('');
      setWorkHistory(INITIAL_WORK_ROWS);
      setFamilyMembers(INITIAL_FAMILY_ROWS);
      setRelativesInJapan('');
      setFamilySupportJapan('');
      setEvaluation('');
      setDraftStudentCode(null);
      setDraftRestored(false);
      setLastSavedTime(null);
      setDraftSaveSuccess(null);
    }
  };

  const handleSaveAsDraft = async () => {
    setErrorMsg('');
    setDraftSaveSuccess(null);
    setSavingDraft(true);

    try {
      const mappedGender = gender.includes('女性') ? 'female' : (gender.includes('男性') ? 'male' : null);

      const res = await fetch('/api/cv-maker/public-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'draft',
          student_code: draftStudentCode || undefined,
          program: program || undefined,
          sub_program: subProgram || undefined,
          full_name: furigana.trim() || fullName.trim() || 'Draft Student',
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
            draft_saved_at: new Date().toISOString(),
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.message || 'Draft saving failed. Please try again.');
        setSavingDraft(false);
        return;
      }

      const assignedCode = data.student_code;
      if (assignedCode) {
        setDraftStudentCode(assignedCode);
      }
      setDraftSaveSuccess(`খসড়া সফলভাবে ডাটাবেজে সংরক্ষণ করা হয়েছে! রেফারেন্স কোড: ${assignedCode}`);

      // Persist draft in localStorage on manual save
      try {
        const payload = {
          program,
          subProgram,
          photo,
          furigana,
          fullName,
          gender,
          maritalStatus,
          dob,
          age,
          address,
          phone,
          eyesight,
          colorBlindness,
          dominantHand,
          bodyWeight,
          height,
          tattooSurgery,
          smoking,
          alcohol,
          hobbies,
          hobbiesOriginalBn,
          personality,
          personalityOriginalBn,
          cooking,
          groupLiving,
          bloodType,
          medicalHistory,
          personalIncome,
          targetSavings5Years,
          motivation,
          motivationOriginalBn,
          futurePlanAfterJapan,
          futurePlanOriginalBn,
          japanVisaAppliedBefore,
          japanVisaTypeApplied,
          educationHistory,
          languageBengali,
          languageEnglish,
          workHistory,
          familyMembers,
          relativesInJapan,
          familySupportJapan,
          evaluation,
          draftStudentCode: assignedCode,
          savedAt: new Date().toISOString(),
        };
        localStorage.setItem('nikkou_student_cv_draft', JSON.stringify(payload));
        setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      } catch {
        // ignore
      }
    } catch {
      setErrorMsg('খসড়া সংরক্ষণে নেটওয়ার্ক সমস্যা হয়েছে। আবার চেষ্টা করুন। / Network error while saving draft.');
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

  const handleFillDemoData = async () => {
    try {
      const response = await fetch('/images/demo_student.jpg');
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
      };
      reader.readAsDataURL(blob);
    } catch {
      // ignore
    }

    setProgram('SSW');
    setSubProgram('Nursing / Caregiver');

    setFurigana('MD TARIQUL ISLAM');
    setFullName('MD TARIQUL ISLAM');
    setGender('男性 / পুরুষ');
    setMaritalStatus('独身 / অবিবাহিত');
    setDob('2001-08-15');
    setAge('25歳 / 25 বছর');
    setAddress('VILL: PAIKPARA, P.O: JEWPARA, P.S: NATORE SADAR, NATORE');
    setPhone('+8801712-345678');

    setEyesight('右: 1.0 左: 1.0');
    setColorBlindness('無 / না');
    setDominantHand('右手 / ডান হাত');
    setBodyWeight('62kg');
    setHeight('172cm');
    setTattooSurgery('無 / না');
    setSmoking('無 / না');
    setAlcohol('無 / না');
    setBloodType('B+型 / বি+ গ্রুপ');
    setHobbies('サッカーをすること、日本語の勉強 / ফুটবল খেলা এবং জাপানি ভাষা অধ্যয়ন');
    setPersonality('真面目で責任感があり、協調性があります / দায়িত্বশীল, পরিশ্রমী এবং দলগত কাজে মনোযোগী');
    setCooking('有 / হ্যাঁ');
    setGroupLiving('有 / হ্যাঁ');
    setMedicalHistory('無 / না');
    setPersonalIncome('2 万円 / ইয়েন');
    setTargetSavings5Years('350万円 / ৩৫লক্ষ ইয়েন');
    setMotivation('日本の先進的な技術と高い労働倫理を学び、将来のキャリアを発展させたいと考えております。 / জাপানের উন্নত প্রযুক্তি ও কাজের নীতি শিখে নিজের ক্যারিয়ার উন্নত করতে চাই।');
    setFuturePlanAfterJapan('日本で培った技術とマネジメント経験を活かし、バングラデシュで技術指導や独立起業を目指します。 / জাপানে অর্জিত কারিগরি দক্ষতা ও কাজের অভিজ্ঞতা দিয়ে দেশে এসে ব্যবসা ও নেতৃত্ব দিতে চাই।');
    setJapanVisaAppliedBefore('無 / না');
    setJapanVisaTypeApplied('無 / না');

    setEducationHistory([
      {
        id: 'edu-demo-1',
        start_year_month: '2013年01月',
        end_year_month: '2018年02月',
        school_name: 'NATORE GOVERNMENT BOYS HIGH SCHOOL',
        major_subject: '科学系 / বিজ্ঞান বিভাগ',
        qualification: '中学校卒業 / মাধ্যমিক পাস (SSC)',
      },
      {
        id: 'edu-demo-2',
        start_year_month: '2018年07月',
        end_year_month: '2020年09月',
        school_name: 'NATORE CITY COLLEGE',
        major_subject: '科学系 / বিজ্ঞান বিভাগ',
        qualification: '高校卒業 / উচ্চ মাধ্যমিক পাস (HSC)',
      },
      {
        id: 'edu-demo-3',
        start_year_month: '2024年03月',
        end_year_month: '現在も',
        school_name: 'NIKKOU CENTRE',
        major_subject: '芸術系 / মানবিক বিভাগ',
        qualification: '日本語 / জাপানি ভাষা (JLPT / NAT)',
      },
    ]);

    setLanguageBengali('可 / পারি');
    setLanguageEnglish('可 / পারি');

    setWorkHistory([
      {
        id: 'work-demo-1',
        start_year_month: '2021年01月',
        end_year_month: '2023年12月',
        company_name: 'DHAKA AUTOMOBILE ENGINEERING WORKS',
        job_description: '自動車整備、点検業務およびカスタマー対応 / অটোমোবাইল রক্ষণাবেক্ষণ ও গ্রাহক সেবা',
      },
    ]);

    setFamilyMembers([
      {
        id: 'fam-demo-1',
        name: 'MD ABDUR RAHMAN',
        relationship: '父 / পিতা',
        age: '56歳 / ৫৬ বছর',
        occupation: '農業 / কৃষক',
      },
      {
        id: 'fam-demo-2',
        name: 'FATEMA BEGUM',
        relationship: '母 / মা',
        age: '48歳 / ৪৮ বছর',
        occupation: '専業主婦 / গৃহিণী',
      },
      {
        id: 'fam-demo-3',
        name: 'MD TANVIR ISLAM',
        relationship: '弟 / ছোট ভাই',
        age: '19歳 / ১৯ বছর',
        occupation: '学生 / শিক্ষার্থী',
      },
    ]);
    setRelativesInJapan('無 / না');
    setFamilySupportJapan('賛成 / রাজি');

    setEvaluation('学習意欲が非常に高く、礼儀正しい人物です。日本語の会話力も着実に向上しており、日本での就業や進学に向けて高い適性と規律を持っています。面接官の推薦に値します。 / শেখার আগ্রহ অত্যন্ত প্রবল এবং অত্যন্ত ভদ্র স্বভাবের। জাপানি ভাষায় কথোপকথন ভালো এবং জাপান যাওয়ার জন্য পূর্ণ যোগ্য।');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    setSubmitting(true);

    try {
      // Map gender enum
      const mappedGender = gender ? (gender.includes('女性') ? 'female' : (gender.includes('男性') ? 'male' : 'other')) : null;

      const res = await fetch('/api/cv-maker/public-form', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_code: draftStudentCode || undefined,
          status: 'submitted',
          program: program || undefined,
          sub_program: subProgram || undefined,
          full_name: furigana.trim() || fullName.trim() || 'Untitled Applicant',
          phone: phone.trim() || '—',
          gender: mappedGender,
          date_of_birth: normalizeCandidateDob(dob) || null,
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
            submitted_at: new Date().toISOString(),
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMsg(data.message || 'Submission failed. Please check your inputs.');
        setSubmitting(false);
        return;
      }

      setSubmittedCode(data.student_code);
      try {
        localStorage.removeItem('nikkou_student_cv_draft');
      } catch {
        // ignore
      }
    } catch {
      setErrorMsg('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedCode) {
    return (
      <div className={styles.pageWrapper} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ maxWidth: '520px', width: '100%', background: '#fff', borderRadius: '20px', padding: '36px 20px', border: '1px solid #e2e8f0', textAlign: 'center', boxShadow: '0 12px 30px rgba(0,0,0,0.06)', boxSizing: 'border-box' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
            <CheckCircle2 size={36} />
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--nikkou-navy)', marginBottom: '8px' }}>
            送信完了 / আবেদন সফল হয়েছে
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '24px' }}>
            Your CV particulars have been securely received. Please save your reference ID:
          </p>

          <div style={{ background: '#f1f5f9', padding: '16px 20px', borderRadius: '12px', border: '1px dashed #cbd5e1', marginBottom: '24px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Student Reference ID (学生番号)
            </span>
            <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--nikkou-red)', letterSpacing: '1px' }}>
              {submittedCode}
            </span>
          </div>

          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Nikkou Centre advisors will review your submission shortly.
          </p>
        </div>
      </div>
    );
  }

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
            履歴書作成フォーム / সিভি তৈরির ফর্ম
          </h1>
          <p className={styles.brandSubtitle}>
            Nikkou Centre International • Japanese Language & Visa Application CV
          </p>
        </div>

        {/* Main Application Form Card - Full Width */}
        <div className={styles.mainCard} suppressHydrationWarning>
          <div className={styles.cardHeaderAccent} />

          <form
            onSubmit={handleSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT') {
                e.preventDefault();
              }
            }}
            className={styles.cardForm}
          >
            {/* Unsaved Draft Restoration Alert */}
            {draftRestored && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  padding: '14px 18px',
                  backgroundColor: '#eff6ff',
                  border: '1.5px solid #93c5fd',
                  borderRadius: '12px',
                  marginBottom: '20px',
                  fontSize: '13.5px',
                  color: '#1e40af',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <CheckCircle2 size={20} color="#2563eb" style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 700 }}>
                      📋 পূর্ববর্তী খসড়া ক্যাশ থেকে পুনরুদ্ধার করা হয়েছে / 前回の入力データが復元されました
                    </div>
                    <div style={{ fontSize: '12px', color: '#3b82f6', marginTop: '2px' }}>
                      {lastSavedTime ? `সর্বশেষ সংরক্ষিত: ${lastSavedTime}` : 'আপনার পূরণকৃত তথ্য সুরক্ষিত আছে।'}
                      {draftStudentCode && ` • খসড়া কোড: ${draftStudentCode}`}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => setDraftRestored(false)}
                    style={{
                      padding: '6px 14px',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      background: '#dbeafe',
                      color: '#1e40af',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    ঠিক আছে / 閉じる
                  </button>
                  <button
                    type="button"
                    onClick={handleClearDraft}
                    style={{
                      padding: '6px 14px',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      background: '#fee2e2',
                      color: '#991b1b',
                      border: '1px solid #fca5a5',
                      borderRadius: '6px',
                      cursor: 'pointer',
                    }}
                  >
                    খসড়া মুছুন / 下書き削除
                  </button>
                </div>
              </div>
            )}

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
                <span>{errorMsg}</span>
              </div>
            )}

            {/* CATEGORY & PROGRAM SELECTION (Top of Form, before photo) */}
            <ProgramCategorySection
              program={program}
              subProgram={subProgram}
              onChangeProgram={setProgram}
              onChangeSubProgram={setSubProgram}
            />

            {/* Field 1: Formal Photo Upload with 45mm x 35mm instruction & Drag & Drop */}
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
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Full Name"
                    className={styles.formInput}
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
                <EyesightField
                  value={eyesight}
                  onChange={setEyesight}
                  className={styles.formField}
                  selectClassName={styles.formSelect}
                />

                <div className={styles.formField}>
                  <label className={styles.formLabel}>
                    色覚異常 / বর্ণান্ধতা
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
                  </select>
                </div>
              </div>

              {/* Grid 2: Body Weight, Height, Tattoo/Surgery */}
              <div className={styles.grid3}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>
                    体重 / শরীরের ওজন
                  </label>
                  <input
                    type="text"
                    value={bodyWeight}
                    onChange={(e) => setBodyWeight(e.target.value)}
                    placeholder="例: 55kg"
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formField}>
                  <label className={styles.formLabel}>
                    身長 / উচ্চতা
                  </label>
                  <input
                    type="text"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    placeholder="例: 168cm"
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formField}>
                  <label className={styles.formLabel}>
                    入れ墨、手術痕 / অন-স্কিন ট্যাটু/সার্জারি
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
                  </select>
                </div>
              </div>

              {/* Grid 3: Smoking, Alcohol, Blood Type */}
              <div className={styles.grid3}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>
                    喫煙習慣 / ধূমপান করেন?
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
                  </select>
                </div>

                <div className={styles.formField}>
                  <label className={styles.formLabel}>
                    飲酒習慣 / মদ পান করেন?
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
                  </select>
                </div>

                <div className={styles.formField}>
                  <label className={styles.formLabel}>
                    血液型 / রক্তের ধরন
                  </label>
                  <select
                    value={bloodType}
                    onChange={(e) => setBloodType(e.target.value)}
                    className={styles.formSelect}
                    style={{ color: bloodType ? 'var(--text-primary)' : '#94a3b8' }}
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
                    <option value="不明 / জানা নেই">不明 / জানা নেই</option>
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
                  </select>
                </div>
              </div>

              {/* Grid 6: Personal Income & 5 Years Target Savings */}
              <div className={styles.grid2}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>
                    個人収入 / ব্যক্তিগত আয়
                  </label>
                  <select
                    value={personalIncome}
                    onChange={(e) => setPersonalIncome(e.target.value)}
                    className={styles.formSelect}
                    style={{ color: personalIncome ? 'var(--text-primary)' : '#94a3b8' }}
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

                <div className={styles.formField}>
                  <label className={styles.formLabel}>
                    5年貯金目標 / 5বছরে সঞ্চয় ইচ্ছা
                  </label>
                  <select
                    value={targetSavings5Years}
                    onChange={(e) => setTargetSavings5Years(e.target.value)}
                    className={styles.formSelect}
                    style={{ color: targetSavings5Years ? 'var(--text-primary)' : '#94a3b8' }}
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
                  </select>
                </div>

                <div className={styles.formField}>
                  <label className={styles.formLabel}>
                    申請したことがある場合、どの資格に申請したか / যদি তাই হয়, আপনি কি ভিসার জন্য আবেদন করেছেন?
                  </label>
                  <select
                    value={
                      ['', '無 / না', '留学 / স্টুডেন্ট ভিসা', '技能実習 / টেকনিক্যাল ইন্টার্ন', '特定技能 / স্পেসিফাইড স্কিল্ড', '家族滞在 / ডিপেন্ডেন্ট', '短期滞在 / ট্যুরিস্ট', 'その他 / অন্যান্য'].includes(japanVisaTypeApplied)
                        ? japanVisaTypeApplied
                        : (japanVisaTypeApplied ? 'その他 / অন্যান্য' : '')
                    }
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
                  </select>
                  {(japanVisaTypeApplied === 'その他 / অন্যান্য' || (!['', '無 / না', '留学 / স্টুডেন্ট ভিসা', '技能実習 / টেকনিক্যাল ইন্টার্ন', '特定技能 / স্পেসিফাইড স্কিল্ড', '家族滞在 / ডিপেন্ডেন্ট', '短期滞在 / ট্যুরিস্ট'].includes(japanVisaTypeApplied) && japanVisaTypeApplied)) && (
                    <input
                      type="text"
                      value={japanVisaTypeApplied === 'その他 / অন্যান্য' ? '' : japanVisaTypeApplied}
                      onChange={(e) => setJapanVisaTypeApplied(e.target.value || 'その他 / অন্যান্য')}
                      placeholder="具体的なビザの種類を入力 / ভিসার ধরন বিস্তারিত লিখুন"
                      className={styles.formInput}
                      style={{ marginTop: '8px' }}
                    />
                  )}
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
                  評価・所見 / মূল্যায়ন বা মন্তব্য
                </label>
                <textarea
                  value={evaluation}
                  onChange={(e) => setEvaluation(e.target.value)}
                  rows={5}
                  placeholder="評価・所見を入力してください（任意） / মূল্যায়ন বা মন্তব্য লিখুন (ঐচ্ছিক)"
                  className={styles.formTextarea}
                />
              </div>
            </div>

            {/* Form Actions: Submit */}
            <div className={styles.bottomActionGroup} style={{ justifyContent: 'center' }}>
              <button
                type="submit"
                disabled={submitting}
                className={styles.submitButton}
                style={{ maxWidth: '420px', width: '100%' }}
              >
                <Send size={18} />
                {submitting ? '送信中... / জমা দেওয়া হচ্ছে...' : '送信する / চূড়ান্ত আবেদনপত্র জমা দিন'}
              </button>
            </div>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '12px', color: 'var(--text-muted)' }}>
          © 2026 Nikkou Centre International. Official Japanese Language School Portal.
        </div>
      </div>

      {/* AI Document Fill Modal */}
      <AiDocumentFillModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        onDataExtracted={handleDataExtractedFromAi}
      />

      {/* AI Success Toast Notification */}
      {aiSuccessToast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%)',
            color: '#ffffff',
            padding: '16px 22px',
            borderRadius: '12px',
            boxShadow: '0 10px 25px -5px rgba(30, 58, 138, 0.4), 0 8px 10px -6px rgba(30, 58, 138, 0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontSize: '14px',
            fontWeight: 600,
            border: '1px solid rgba(255, 255, 255, 0.15)',
          }}
        >
          <Sparkles size={20} color="#facc15" />
          <span>{aiSuccessToast}</span>
          <button
            type="button"
            onClick={() => setAiSuccessToast(null)}
            style={{
              marginLeft: '8px',
              background: 'transparent',
              border: 'none',
              color: 'rgba(255,255,255,0.7)',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
