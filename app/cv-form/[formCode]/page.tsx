'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import ProgramCategorySection from '@/components/ProgramCategorySection';
import { normalizeCandidateDob } from '@/lib/cv-normalizer';
import styles from '../cv-form.module.css';
import {
  User,
  Phone,
  Mail,
  Calendar,
  BookOpen,
  GraduationCap,
  Send,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Building,
  Award,
} from 'lucide-react';

interface FormData {
  id: number;
  form_code: string;
  title: string;
  description: string | null;
}

function PublicStudentCvFormContent() {
  const params = useParams();
  const formCode = params?.formCode as string;

  const [formInfo, setFormInfo] = useState<FormData | null>(null);
  const [loadingForm, setLoadingForm] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Category & Program Selection (Top of form)
  const [program, setProgram] = useState('');
  const [subProgram, setSubProgram] = useState('');

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState('male');
  const [dob, setDob] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [passport, setPassport] = useState('');

  // Japanese language & education
  const [jlptLevel, setJlptLevel] = useState('None');
  const [studyHours, setStudyHours] = useState('0');
  const [targetIntake, setTargetIntake] = useState('April 2027');
  const [highestEdu, setHighestEdu] = useState('HSC / 12th Grade');
  const [instituteName, setInstituteName] = useState('');
  const [studyReason, setStudyReason] = useState('');

  // Submission State
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submittedCode, setSubmittedCode] = useState<string | null>(null);

  useEffect(() => {
    async function loadForm() {
      if (!formCode) return;
      try {
        setLoadingForm(true);
        const res = await fetch(`/api/cv-maker/public-form/${formCode}`);
        const data = await res.json();
        if (!res.ok || !data.success) {
          setLoadError(data.message || 'This application form link is not available.');
          return;
        }
        setFormInfo(data.form);
      } catch {
        setLoadError('Unable to connect to the server. Please check your connection.');
      } finally {
        setLoadingForm(false);
      }
    }
    loadForm();
  }, [formCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    setSubmitting(true);

    try {
      const res = await fetch(`/api/cv-maker/public-form/${formCode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name: fullName.trim() || 'Untitled Applicant',
          program: program || undefined,
          sub_program: subProgram || undefined,
          gender,
          date_of_birth: normalizeCandidateDob(dob) || null,
          phone: phone.trim() || '—',
          email: email.trim() || null,
          passport_number: passport.trim() || null,
          jlpt_level: jlptLevel,
          japanese_study_hours: Number(studyHours) || 0,
          target_intake: targetIntake.trim(),
          details: {
            program: program || null,
            sub_program: subProgram || null,
            highest_education: highestEdu,
            institution_name: instituteName.trim(),
            reason_for_japan: studyReason.trim(),
            submitted_at: new Date().toISOString(),
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setSubmitError(data.message || 'Failed to submit form. Please check your details.');
        setSubmitting(false);
        return;
      }

      setSubmittedCode(data.student_code);
    } catch {
      setSubmitError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingForm) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
          <div className="animate-spin" style={{ fontSize: '28px', marginBottom: '12px', display: 'inline-block' }}>⟳</div>
          <div>Loading student application form...</div>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '20px' }}>
        <div style={{ maxWidth: '480px', width: '100%', background: '#fff', borderRadius: '16px', padding: '36px', border: '1px solid #e2e8f0', textAlign: 'center', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
          <AlertCircle size={48} color="#e62b2b" style={{ margin: '0 auto 16px auto' }} />
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--nikkou-navy)', marginBottom: '8px' }}>
            Form Link Inactive
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
            {loadError}
          </p>
        </div>
      </div>
    );
  }

  if (submittedCode) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', padding: '20px' }}>
        <div style={{ maxWidth: '520px', width: '100%', background: '#fff', borderRadius: '20px', padding: '40px', border: '1px solid #e2e8f0', textAlign: 'center', boxShadow: '0 12px 30px rgba(0,0,0,0.06)' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#ecfdf5', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
            <CheckCircle2 size={36} />
          </div>

          <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--nikkou-navy)', marginBottom: '8px' }}>
            Application Submitted!
          </h2>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '24px' }}>
            Your CV particulars have been securely transmitted to Nikkou Centre International. Please save your application reference code:
          </p>

          <div style={{ background: '#f1f5f9', padding: '16px 20px', borderRadius: '12px', border: '1px dashed #cbd5e1', marginBottom: '28px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Student Reference Code
            </span>
            <span style={{ fontSize: '24px', fontWeight: 800, color: '#e62b2b', letterSpacing: '1px' }}>
              {submittedCode}
            </span>
          </div>

          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            Nikkou Centre advisors will contact you shortly via phone or email for the next steps.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container} style={{ maxWidth: '780px' }}>
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
            {formInfo?.title || 'Student CV Intake Form'}
          </h1>
          {formInfo?.description && (
            <p className={styles.brandSubtitle}>
              {formInfo.description}
            </p>
          )}
        </div>

        {/* Main Application Form Card */}
        <div className={styles.mainCard}>
          <div className={styles.cardHeaderAccent} />

          <form onSubmit={handleSubmit} className={styles.cardForm}>
            {submitError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', borderRadius: '8px', fontSize: '13.5px', marginBottom: '24px' }}>
                <AlertCircle size={18} />
                <span>{submitError}</span>
              </div>
            )}

            {/* CATEGORY & PROGRAM SELECTION (Top of Form) */}
            <ProgramCategorySection
              program={program}
              subProgram={subProgram}
              onChangeProgram={setProgram}
              onChangeSubProgram={setSubProgram}
            />

            {/* Section 1: Personal Particulars */}
            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1.5px solid #f1f5f9', paddingBottom: '10px', marginBottom: '20px' }}>
                <User size={18} color="#e62b2b" />
                <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--nikkou-navy)', textTransform: 'uppercase', letterSpacing: '0.4px', margin: 0 }}>
                  1. Personal Details
                </h2>
              </div>

              <div className={styles.grid2}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>
                    Full Name (as per Passport / NID)
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Full Name"
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formField}>
                  <label className={styles.formLabel}>
                    Gender
                  </label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className={styles.formSelect}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className={styles.formField}>
                  <label className={styles.formLabel}>
                    Contact Phone Number (WhatsApp)
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. +880 1711-234567"
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formField}>
                  <label className={styles.formLabel}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@gmail.com"
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formField}>
                  <label className={styles.formLabel}>
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formField}>
                  <label className={styles.formLabel}>
                    Passport Number (If available)
                  </label>
                  <input
                    type="text"
                    value={passport}
                    onChange={(e) => setPassport(e.target.value)}
                    placeholder="e.g. A01234567"
                    className={styles.formInput}
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Japanese Language & Academic Background */}
            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1.5px solid #f1f5f9', paddingBottom: '10px', marginBottom: '20px' }}>
                <BookOpen size={18} color="#1f3864" />
                <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--nikkou-navy)', textTransform: 'uppercase', letterSpacing: '0.4px', margin: 0 }}>
                  2. Japanese Language & Education Background
                </h2>
              </div>

              <div className={styles.grid2}>
                <div className={styles.formField}>
                  <label className={styles.formLabel}>
                    Current Japanese Proficiency
                  </label>
                  <select
                    value={jlptLevel}
                    onChange={(e) => setJlptLevel(e.target.value)}
                    className={styles.formSelect}
                  >
                    <option value="None">None / Absolute Beginner</option>
                    <option value="N5">JLPT N5 Passed</option>
                    <option value="N4">JLPT N4 Passed</option>
                    <option value="N3">JLPT N3 Passed</option>
                    <option value="N2">JLPT N2 Passed</option>
                    <option value="NAT-5">NAT-TEST Q5</option>
                    <option value="NAT-4">NAT-TEST Q4</option>
                    <option value="Currently Studying">Currently Enrolled in Course</option>
                  </select>
                </div>

                <div className={styles.formField}>
                  <label className={styles.formLabel}>
                    Approx. Japanese Study Hours
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={studyHours}
                    onChange={(e) => setStudyHours(e.target.value)}
                    placeholder="e.g. 150"
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formField}>
                  <label className={styles.formLabel}>
                    Highest Educational Qualification
                  </label>
                  <select
                    value={highestEdu}
                    onChange={(e) => setHighestEdu(e.target.value)}
                    className={styles.formSelect}
                  >
                    <option value="SSC / 10th Grade">SSC / 10th Grade</option>
                    <option value="HSC / 12th Grade">HSC / 12th Grade</option>
                    <option value="Diploma (4 Years)">Diploma (4 Years)</option>
                    <option value="Bachelor Degree (BSc/BBA/BA)">Bachelor Degree (BSc/BBA/BA)</option>
                    <option value="Master Degree">Master Degree</option>
                  </select>
                </div>

                <div className={styles.formField}>
                  <label className={styles.formLabel}>
                    School / College / University Name
                  </label>
                  <input
                    type="text"
                    value={instituteName}
                    onChange={(e) => setInstituteName(e.target.value)}
                    placeholder="Name of last educational institution"
                    className={styles.formInput}
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Study in Japan Goals */}
            <div style={{ marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1.5px solid #f1f5f9', paddingBottom: '10px', marginBottom: '20px' }}>
                <Award size={18} color="#059669" />
                <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--nikkou-navy)', textTransform: 'uppercase', letterSpacing: '0.4px', margin: 0 }}>
                  3. Study in Japan Intake Target
                </h2>
              </div>

              <div className={styles.formFieldFull}>
                <label className={styles.formLabel}>
                  Target Intake Session
                </label>
                <select
                  value={targetIntake}
                  onChange={(e) => setTargetIntake(e.target.value)}
                  className={styles.formSelect}
                >
                  <option value="April 2027">April 2027 Intake</option>
                  <option value="October 2026">October 2026 Intake</option>
                  <option value="July 2026">July 2026 Intake</option>
                  <option value="January 2027">January 2027 Intake</option>
                </select>
              </div>

              <div className={styles.formFieldFull}>
                <label className={styles.formLabel}>
                  Why do you want to study / work in Japan? (Optional brief statement)
                </label>
                <textarea
                  rows={3}
                  value={studyReason}
                  onChange={(e) => setStudyReason(e.target.value)}
                  placeholder="Tell us briefly about your future career aspirations in Japan..."
                  className={styles.formTextarea}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={styles.submitButton}
              style={{ width: '100%' }}
            >
              <Send size={18} />
              {submitting ? 'Submitting Application...' : 'Submit Application to Nikkou Centre'}
            </button>
          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: 'var(--text-muted)' }}>
          © 2026 Nikkou Centre International. Official Japanese Language School Portal.
        </div>
      </div>
    </div>
  );
}

export default function PublicStudentCvForm() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>Loading application form...</div>
        </div>
      }
    >
      <PublicStudentCvFormContent />
    </Suspense>
  );
}

