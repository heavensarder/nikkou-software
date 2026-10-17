'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useReactToPrint } from 'react-to-print';
import {
  Users,
  Search,
  Filter,
  Eye,
  Trash2,
  Calendar,
  Phone,
  Mail,
  BookOpen,
  FileText,
  X,
  Plus,
  CheckCircle2,
  Clock,
  UserCheck,
  Copy,
  Check,
  Printer,
  Edit3,
  Link2,
  Lock,
  RefreshCw,
} from 'lucide-react';
import { StudentCv } from '@/types/cv';
import { PROGRAM_OPTIONS, getSubPrograms, formatProgramBadge } from '@/lib/programs';
import styles from '../cv-maker.module.css';
import { formatJapaneseBirthDate, formatLanguageDisplay, normalizeCandidateAge } from '@/lib/cv-normalizer';
import {
  stripBengali,
  formatPureJapaneseAge,
  formatPureJapaneseSavings,
  formatPureJapaneseIncome,
  formatPureJapaneseLanguage,
  formatCvFieldValue,
  getExportPdfFileName,
} from '@/lib/cv-pure-japanese';
export { formatJapaneseBirthDate, formatLanguageDisplay };

export function getJapaneseTodayDate(): { year: string; month: string; day: string } {
  const d = new Date();
  return {
    year: String(d.getFullYear()),
    month: String(d.getMonth() + 1).padStart(2, '0'),
    day: String(d.getDate()).padStart(2, '0'),
  };
}

export function formatFamilyMemberAge(val: string | null | undefined): string {
  if (!val) return '—';
  const trimmed = String(val).trim();
  if (!trimmed) return '—';
  const bnDigits: { [k: string]: string } = {
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
  };
  const normalized = trimmed.replace(/[০-৯]/g, (d) => bnDigits[d] || d);
  const match = normalized.match(/(\d+)/);
  if (match) {
    const num = parseInt(match[1], 10);
    if (!isNaN(num) && num > 0 && num <= 120) {
      return `${num}歳 / ${num} বছর`;
    }
  }
  return trimmed;
}

function playNotificationChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now); // D5
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.3);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.14); // A5
    gain2.gain.setValueAtTime(0.12, now + 0.14);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.14);
    osc2.stop(now + 0.45);
  } catch {
    // Silently ignore if blocked by browser autoplay policy
  }
}

const STORAGE_NEW_IDS_KEY = 'nikkou_new_application_ids';

function loadStoredNewIds(): Set<number> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_NEW_IDS_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed.map(Number) : []);
  } catch {
    return new Set();
  }
}

function persistNewIds(ids: Set<number>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_NEW_IDS_KEY, JSON.stringify(Array.from(ids)));
  } catch {}
}

export default function StudentListPage() {
  const [students, setStudents] = useState<StudentCv[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [newlyArrivedIds, setNewlyArrivedIds] = useState<Set<number>>(new Set());
  const [newStudentNotification, setNewStudentNotification] = useState<StudentCv | null>(null);
  const isFirstLoadRef = useRef(true);
  const knownStudentIdsRef = useRef<Set<number>>(new Set());

  // Load unread new applications from persistent storage on mount
  useEffect(() => {
    const stored = loadStoredNewIds();
    if (stored.size > 0) {
      setNewlyArrivedIds(stored);
    }
  }, []);

  const handleMarkAsRead = (studentId: number) => {
    setNewlyArrivedIds((prev) => {
      if (!prev.has(studentId)) return prev;
      const next = new Set(prev);
      next.delete(studentId);
      persistNewIds(next);
      return next;
    });
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [selectedProgram, setSelectedProgram] = useState('');
  const [selectedSubProgram, setSelectedSubProgram] = useState('');
  const [copied, setCopied] = useState(false);
  const [copiedEditToken, setCopiedEditToken] = useState<string | null>(null);

  // Selected student for drawer preview
  const [activeStudent, setActiveStudent] = useState<StudentCv | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // AI Settings Status (Controls whether AI translation and Pure Japanese CV mode are enabled)
  const [aiEnabled, setAiEnabled] = useState(false);

  // Print version mode selected by user: 'japanese' or 'student'
  const [selectedPrintVersion, setSelectedPrintVersion] = useState<'japanese' | 'student'>('japanese');

  useEffect(() => {
    async function checkAiStatus() {
      try {
        const res = await fetch('/api/settings/ai');
        if (res.ok) {
          const data = await res.json();
          const isEnabled = Boolean(data.enabled);
          setAiEnabled(isEnabled);
          if (!isEnabled) {
            setSelectedPrintVersion('student');
          }
        }
      } catch (err) {
        console.error('Failed to load AI settings status', err);
      }
    }
    checkAiStatus();
  }, []);

  // When AI is off, Japanese version must be hidden and strictly revert to student bilingual version
  const printVersion: 'japanese' | 'student' = aiEnabled ? selectedPrintVersion : 'student';
  const effectivePrintVersion = printVersion;
  const setPrintVersion = setSelectedPrintVersion;

  // Target element ref for clean, pixel-perfect A4 printing
  const cvPrintRef = useRef<HTMLDivElement>(null);

  const exportPdfFileName = getExportPdfFileName(
    activeStudent?.details_json?.name_native || activeStudent?.full_name,
    effectivePrintVersion
  );

  const handleReactToPrint = useReactToPrint({
    contentRef: cvPrintRef,
    documentTitle: exportPdfFileName,
    ignoreGlobalStyles: true,
    pageStyle: `
      @import url('https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Noto+Sans+Bengali:wght@400;500;600;700;800;900&family=Noto+Sans+JP:wght@400;500;600;700;800;900&display=swap');

      @page {
        size: A4 portrait;
        margin: 6mm 8mm;
      }
      *, *:before, *:after {
        box-sizing: border-box !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      table, tr, td, th, div, span, img {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      @media print {
        *, *:before, *:after {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
        table, tr, td, th, div, span, img {
          -webkit-print-color-adjust: exact !important;
          print-color-adjust: exact !important;
          color-adjust: exact !important;
        }
      }
      html, body {
        margin: 0 !important;
        padding: 0 !important;
        background: #ffffff !important;
        color: #000000 !important;
        font-family: 'Noto Sans JP', 'Noto Sans Bengali', 'Hind Siliguri', sans-serif !important;
        -webkit-font-smoothing: antialiased;
      }
      .cv-printable-page {
        width: 100% !important;
        max-width: 192mm !important;
        margin: 0 auto !important;
        padding: 0 !important;
        background: #ffffff !important;
        display: block !important;
        overflow: visible !important;
        border: none !important;
        box-shadow: none !important;
      }
      /* Multi-page Institute Watermark (Repeats centered on every printed page) */
      .cv-watermark-overlay {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        right: 0 !important;
        bottom: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        display: flex !important;
        align-items: center !important;
        justify-content: center !important;
        pointer-events: none !important;
        z-index: 9999 !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .cv-watermark-logo {
        position: static !important;
        width: 135mm !important;
        height: 135mm !important;
        max-width: 75% !important;
        max-height: 75% !important;
        object-fit: contain !important;
        opacity: 0.065 !important;
        filter: grayscale(10%) !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        pointer-events: none !important;
      }
      /* Strict Unbreakable Rule: Never divide any section across pages */
      .cv-section,
      [data-cv-section] {
        display: block !important;
        position: static !important;
        break-inside: avoid !important;
        page-break-inside: avoid !important;
        -webkit-column-break-inside: avoid !important;
        break-inside: avoid-page !important;
        break-after: auto !important;
        page-break-after: auto !important;
        overflow: visible !important;
        margin-bottom: 8px !important;
      }
      .cv-section > div {
        break-inside: avoid !important;
        page-break-inside: avoid !important;
        -webkit-column-break-inside: avoid !important;
        break-inside: avoid-page !important;
        overflow: visible !important;
      }
      /* Tables and table rows cannot be cut in the middle */
      table {
        border-collapse: collapse !important;
        width: 100% !important;
        break-inside: avoid !important;
        page-break-inside: avoid !important;
        -webkit-column-break-inside: avoid !important;
        break-inside: avoid-page !important;
      }
      tbody, thead, tfoot {
        break-inside: avoid !important;
        page-break-inside: avoid !important;
        -webkit-column-break-inside: avoid !important;
        break-inside: avoid-page !important;
      }
      tr {
        break-inside: avoid !important;
        page-break-inside: avoid !important;
        -webkit-column-break-inside: avoid !important;
        break-inside: avoid-page !important;
        break-after: auto !important;
        page-break-after: auto !important;
      }
      td, th {
        break-inside: avoid !important;
        page-break-inside: avoid !important;
        -webkit-column-break-inside: avoid !important;
        break-inside: avoid-page !important;
      }
      /* Keep section titles glued to their section content */
      .cv-section-title,
      [data-cv-section-title] {
        break-after: avoid !important;
        page-break-after: avoid !important;
        break-inside: avoid !important;
        page-break-inside: avoid !important;
      }
    `,
    onPrintError: (location, err) => {
      console.warn('react-to-print warning/error at', location, err);
      window.print();
    },
  });

  // Print Number (番号/no) prompt and preview state
  const [printNumber, setPrintNumber] = useState<string>(''); // Empty by default in preview as requested
  const [isAskingPrintNumber, setIsAskingPrintNumber] = useState<boolean>(false);
  const [tempPrintNumber, setTempPrintNumber] = useState<string>('1');
  const [printKeepEmpty, setPrintKeepEmpty] = useState<boolean>(false);

  const handleInitiatePrint = () => {
    setTempPrintNumber(printNumber || '1');
    setPrintKeepEmpty(!printNumber);
    setIsAskingPrintNumber(true);
  };

  const handleConfirmPrint = () => {
    const finalNumber = printKeepEmpty ? '' : (tempPrintNumber.trim() || '1');
    setPrintNumber(finalNumber);
    setIsAskingPrintNumber(false);

    const fileName = getExportPdfFileName(
      activeStudent?.details_json?.name_native || activeStudent?.full_name,
      effectivePrintVersion
    );
    const prevTitle = typeof document !== 'undefined' ? document.title : '';
    if (typeof document !== 'undefined') {
      document.title = fileName;
    }

    setTimeout(() => {
      try {
        if (typeof handleReactToPrint === 'function') {
          handleReactToPrint();
        } else {
          window.print();
        }
      } catch (err) {
        console.error('Trigger print error:', err);
        window.print();
      } finally {
        setTimeout(() => {
          if (typeof document !== 'undefined') {
            document.title = prevTitle;
          }
        }, 1500);
      }
    }, 120);
  };

  const handleCopyLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const formUrl = `${origin}/cv-form`;
    navigator.clipboard.writeText(formUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyStudentEditLink = (editToken?: string | null) => {
    if (!editToken) return;
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const editUrl = `${origin}/cv-form/edit/${editToken}`;
    navigator.clipboard.writeText(editUrl);
    setCopiedEditToken(editToken);
    setTimeout(() => setCopiedEditToken(null), 2500);
  };

  const fetchStudents = async (
    queryVal = searchQuery,
    statusVal = selectedStatus,
    progVal = selectedProgram,
    subVal = selectedSubProgram,
    isSilent = false
  ) => {
    try {
      if (!isSilent) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }
      const params = new URLSearchParams();
      if (queryVal.trim()) params.set('q', queryVal.trim());
      if (statusVal) params.set('status', statusVal);
      if (progVal) params.set('program', progVal);
      if (subVal) params.set('sub_program', subVal);

      const res = await fetch(`/api/cv-maker/students?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.students)) {
          const freshStudents: StudentCv[] = data.students;

          // Check if new students arrived in real-time
          if (!isFirstLoadRef.current && isSilent) {
            const newlyAdded = freshStudents.filter(
              (s) => !knownStudentIdsRef.current.has(s.id)
            );
            if (newlyAdded.length > 0) {
              const newIds = newlyAdded.map((s) => s.id);
              setNewlyArrivedIds((prev) => {
                const next = new Set([...prev, ...newIds]);
                persistNewIds(next);
                return next;
              });
              setNewStudentNotification(newlyAdded[0]);
              playNotificationChime();
            }
          }

          if (isFirstLoadRef.current) {
            isFirstLoadRef.current = false;
            // Validate stored unread IDs against fresh database records
            const stored = loadStoredNewIds();
            const freshIds = new Set(freshStudents.map((s) => s.id));
            const valid = new Set([...stored].filter((id) => freshIds.has(id)));
            if (valid.size !== stored.size) {
              persistNewIds(valid);
            }
            setNewlyArrivedIds(valid);
          }

          knownStudentIdsRef.current = new Set(freshStudents.map((s) => s.id));
          setStudents(freshStudents);

          // Keep activeStudent in preview drawer synced in realtime
          if (activeStudent) {
            const updatedActive = freshStudents.find((s) => s.id === activeStudent.id);
            if (updatedActive && updatedActive.updated_at !== activeStudent.updated_at) {
              setActiveStudent(updatedActive);
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Real-time search with debounce (250ms) and filter responsiveness
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudents(searchQuery, selectedStatus, selectedProgram, selectedSubProgram, false);
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedStatus, selectedProgram, selectedSubProgram]);

  // Real-time Background Auto-Polling (every 3 seconds when tab is active) & instant sync on window focus / online
  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchStudents(searchQuery, selectedStatus, selectedProgram, selectedSubProgram, true);
      }
    }, 3000);

    const handleFocusSync = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchStudents(searchQuery, selectedStatus, selectedProgram, selectedSubProgram, true);
      }
    };

    window.addEventListener('focus', handleFocusSync);
    window.addEventListener('online', handleFocusSync);
    document.addEventListener('visibilitychange', handleFocusSync);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocusSync);
      window.removeEventListener('online', handleFocusSync);
      document.removeEventListener('visibilitychange', handleFocusSync);
    };
  }, [searchQuery, selectedStatus, selectedProgram, selectedSubProgram, activeStudent]);

  const handleProgramChange = (prog: string) => {
    setSelectedProgram(prog);
    if (prog) {
      const validSubs = getSubPrograms(prog).map((s) => s.id);
      if (selectedSubProgram && !validSubs.includes(selectedSubProgram)) {
        setSelectedSubProgram('');
      }
    } else {
      setSelectedSubProgram('');
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedStatus('');
    setSelectedProgram('');
    setSelectedSubProgram('');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStudents(searchQuery, selectedStatus, selectedProgram, selectedSubProgram);
  };

  const handleOpenDrawer = async (student: StudentCv) => {
    handleMarkAsRead(student.id);
    setPrintNumber(''); // explicitly empty on preview!
    setTempPrintNumber('1');
    setPrintKeepEmpty(false);
    try {
      const res = await fetch(`/api/cv-maker/students/${student.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setActiveStudent(data.student);
          return;
        }
      }
      setActiveStudent(student);
    } catch {
      setActiveStudent(student);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!activeStudent) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch(`/api/cv-maker/students/${activeStudent.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setActiveStudent((prev) => (prev ? { ...prev, status: newStatus as any } : null));
        setStudents((prev) =>
          prev.map((s) => (s.id === activeStudent.id ? { ...s, status: newStatus as any } : s))
        );
      }
    } catch (err) {
      console.error('Failed to update student status:', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDeleteStudent = async (id: number) => {
    if (!confirm('Are you sure you want to delete this student record?')) return;
    try {
      const res = await fetch(`/api/cv-maker/students/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setStudents((prev) => prev.filter((s) => s.id !== id));
        if (activeStudent?.id === id) setActiveStudent(null);
      }
    } catch (err) {
      console.error('Failed to delete student:', err);
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <span className={`${styles.badge} ${styles.badgeDraft}`}>Draft</span>;
      case 'verified':
        return (
          <span
            className={`${styles.badge} ${styles.badgeVerified}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              background: '#ecfdf5',
              color: '#047857',
              borderColor: '#a7f3d0',
              fontWeight: 700,
            }}
          >
            <Check size={12} />
            Verified
          </span>
        );
      case 'submitted':
      default:
        return <span className={`${styles.badge} ${styles.badgeSubmitted}`}>Submitted</span>;
    }
  };

  return (
    <div className={styles.pageContainer} suppressHydrationWarning>
      {/* Top Banner */}
      <div className={styles.pageHeader} suppressHydrationWarning>
        <div className={styles.headerLeft} suppressHydrationWarning>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <h2>Student CV Intake List</h2>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#ecfdf5',
                border: '1px solid #a7f3d0',
                borderRadius: '20px',
                padding: '4px 10px',
                fontSize: '11.5px',
                fontWeight: 700,
                color: '#065f46',
              }}
              title="Realtime updates active — new applications update automatically without page refresh"
            >
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#10b981',
                  display: 'inline-block',
                  boxShadow: '0 0 0 0 rgba(16, 185, 129, 0.7)',
                  animation: 'pulseLive 2s infinite',
                }}
              />
              <span>Live Sync</span>
              {isRefreshing && (
                <RefreshCw size={11} className="animate-spin" style={{ color: '#059669', marginLeft: '2px' }} />
              )}
            </div>
          </div>
          <p>
            View and manage all student submissions received via shareable form links and direct admin intake in real-time.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }} suppressHydrationWarning>
          <button
            type="button"
            onClick={() => fetchStudents(searchQuery, selectedStatus, selectedProgram, selectedSubProgram, true)}
            className={styles.secondaryBtn}
            style={{ padding: '10px 14px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            title="Refresh list now"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            <span>Sync</span>
          </button>

          <button
            type="button"
            onClick={handleCopyLink}
            className={`${styles.secondaryBtn} ${copied ? styles.copyBtnSuccess : ''}`}
            style={{ padding: '10px 16px' }}
          >
            {copied ? (
              <>
                <Check size={16} />
                Link Copied!
              </>
            ) : (
              <>
                <Copy size={16} />
                Copy Student Form Link
              </>
            )}
          </button>

          <Link href="/dashboard/cv-maker/new?fresh=true" className={styles.primaryBtn}>
            <Plus size={16} />
            Create New CV
          </Link>
        </div>
      </div>

      {/* Realtime New Student Notification Toast */}
      {newStudentNotification && (
        <div
          style={{
            marginBottom: '16px',
            padding: '12px 18px',
            backgroundColor: '#f0fdf4',
            border: '1.5px solid #86efac',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 14px rgba(22, 101, 52, 0.08)',
            animation: 'slideDown 0.3s ease-out',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: '#dcfce7',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
              }}
            >
              ⚡
            </div>
            <div>
              <div style={{ fontWeight: 800, color: '#14532d', fontSize: '13.5px' }}>
                New Student Application Received Live!
              </div>
              <div style={{ color: '#166534', fontSize: '12.5px' }}>
                <span style={{ fontWeight: 700 }}>
                  {newStudentNotification.details_json?.name_native || newStudentNotification.full_name}
                </span>{' '}
                — Code:{' '}
                <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>
                  {newStudentNotification.student_code}
                </span>{' '}
                • {newStudentNotification.program || 'General Program'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={() => {
                handleOpenDrawer(newStudentNotification);
                setNewStudentNotification(null);
              }}
              style={{
                backgroundColor: '#16a34a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                padding: '6px 14px',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <Eye size={14} /> View
            </button>
            <button
              type="button"
              onClick={() => setNewStudentNotification(null)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#15803d',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
              }}
              title="Dismiss notification"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Main Table Card */}
      <div className={styles.card} suppressHydrationWarning>
        {/* Toolbar: Search & Status Filters */}
        <div className={styles.tableToolbar} suppressHydrationWarning>
          <form onSubmit={handleSearchSubmit} className={styles.searchBox} style={{ position: 'relative' }}>
            <Search size={16} className={styles.searchIcon} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, code, phone, address..."
              className={styles.searchInput}
              style={{ paddingRight: searchQuery ? '32px' : undefined }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '10px',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '2px',
                }}
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </form>

          <div className={styles.filterGroup} style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Filter by Program */}
            <select
              value={selectedProgram}
              onChange={(e) => handleProgramChange(e.target.value)}
              className={styles.filterSelect}
              style={{ fontWeight: 600, minWidth: '150px' }}
              title="Filter by Program"
            >
              <option value="">All Programs (সব প্রোগ্রাম)</option>
              {PROGRAM_OPTIONS.map((prog) => (
                <option key={prog.id} value={prog.id}>
                  {prog.label}
                </option>
              ))}
            </select>

            {/* Filter by Sub-program / Category */}
            <select
              value={selectedSubProgram}
              onChange={(e) => setSelectedSubProgram(e.target.value)}
              className={styles.filterSelect}
              style={{ fontWeight: 600, minWidth: '170px' }}
              title="Filter by Category / Sub-program"
            >
              <option value="">
                {selectedProgram ? `All ${selectedProgram} Categories` : 'All Categories (সব বিভাগ)'}
              </option>
              {selectedProgram ? (
                getSubPrograms(selectedProgram).map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.label}
                  </option>
                ))
              ) : (
                PROGRAM_OPTIONS.map((prog) => (
                  <optgroup key={prog.id} label={`${prog.label} (${prog.labelBn})`}>
                    {prog.subPrograms.map((sub) => (
                      <option key={`${prog.id}-${sub.id}`} value={sub.id}>
                        {sub.label}
                      </option>
                    ))}
                  </optgroup>
                ))
              )}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className={styles.filterSelect}
              style={{ fontWeight: 600 }}
              title="Filter by Status"
            >
              <option value="">All Statuses</option>
              <option value="draft">Draft</option>
              <option value="submitted">Submitted</option>
              <option value="verified">Verified</option>
            </select>

            {/* Reset Filters button if any filter is active */}
            {(selectedProgram || selectedSubProgram || selectedStatus || searchQuery) && (
              <button
                type="button"
                onClick={handleResetFilters}
                className={styles.secondaryBtn}
                style={{
                  height: '38px',
                  padding: '0 12px',
                  fontSize: '12.5px',
                  color: '#dc2626',
                  borderColor: '#fca5a5',
                  background: '#fef2f2',
                }}
                title="Reset all filters"
              >
                <X size={14} />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Table View */}
        <div className={styles.tableResponsive}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ width: '56px' }}>Photo</th>
                <th>Student Code</th>
                <th>Name</th>
                <th>Program / Category</th>
                <th>Gender</th>
                <th>DOB & Age</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '40px' }}>
                    Loading student records...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <div className={styles.emptyState}>
                      <div className={styles.emptyIcon}>
                        {searchQuery || selectedProgram || selectedSubProgram || selectedStatus ? (
                          <Search size={24} />
                        ) : (
                          <Users size={24} />
                        )}
                      </div>
                      <h3>
                        {searchQuery || selectedProgram || selectedSubProgram || selectedStatus
                          ? 'No matching student records found'
                          : 'No student records found'}
                      </h3>
                      <p style={{ marginTop: '4px', fontSize: '13px' }}>
                        {searchQuery || selectedProgram || selectedSubProgram || selectedStatus ? (
                          <>
                            No students match your active filters or search &ldquo;{searchQuery}&rdquo;.
                            <br />
                            <button
                              type="button"
                              onClick={handleResetFilters}
                              className={styles.secondaryBtn}
                              style={{ marginTop: '12px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            >
                              <X size={14} /> Reset all filters
                            </button>
                          </>
                        ) : (
                          'Share your form link with students or click “Create New CV” to add a student manually.'
                        )}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                students.map((student) => {
                  const isNewlyArrived = newlyArrivedIds.has(student.id);
                  const details = student.details_json || {};
                  const photoSrc = details.photo_data || null;
                  const furiganaVal = details.furigana || student.full_name;
                  const nameVal = details.name_native || '—';
                  const genderVal = details.gender_label || (student.gender === 'female' ? '女性 / মহিলা' : '男性 / পুরুষ');
                  const maritalVal = details.marital_status || '—';
                  const ageVal = details.age_display || '—';
                  const addressVal = details.address || '—';
                  const phoneVal = student.phone || details.phone || '—';

                  return (
                    <tr
                      key={student.id}
                      className={isNewlyArrived ? styles.newRow : undefined}
                    >
                      {/* Photo Thumbnail */}
                      <td>
                        <div
                          onClick={() => handleOpenDrawer(student)}
                          style={{
                            width: '36px',
                            height: '46px',
                            borderRadius: '4px',
                            background: '#f1f5f9',
                            border: '1px solid #cbd5e1',
                            overflow: 'hidden',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                          }}
                          title="Click to view student CV details"
                        >
                          {photoSrc ? (
                            <img
                              src={photoSrc}
                              alt={furiganaVal}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            <Users size={18} color="#94a3b8" />
                          )}
                        </div>
                      </td>

                      {/* Student Code */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span className={styles.codePill}>{student.student_code}</span>
                          {isNewlyArrived && (
                            <span className={styles.newBadge} title="New application">
                              <span className={styles.newBadgeDot} />
                              NEW
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Student Name / 氏名 */}
                      <td>
                        <div
                          onClick={() => handleOpenDrawer(student)}
                          style={{
                            fontWeight: 700,
                            color: 'var(--nikkou-navy)',
                            textTransform: 'uppercase',
                            fontSize: '13.5px',
                            cursor: 'pointer',
                          }}
                          title="Click to view student CV details"
                        >
                          {nameVal !== '—' ? nameVal : furiganaVal}
                        </div>
                        {furiganaVal && furiganaVal !== nameVal && (
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            {furiganaVal}
                          </div>
                        )}
                        <div style={{ fontSize: '10.5px', color: '#94a3b8', marginTop: '2px' }}>
                          {student.source === 'public_form' ? 'Public Form' : 'Admin Entry'}
                        </div>
                      </td>

                      {/* Program & Category */}
                      <td>
                        {student.program || details.program ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'flex-start' }}>
                            <span
                              style={{
                                display: 'inline-block',
                                fontSize: '11px',
                                fontWeight: 800,
                                padding: '2px 8px',
                                borderRadius: '4px',
                                letterSpacing: '0.3px',
                                background:
                                  (student.program || details.program) === 'TITP/ESD'
                                    ? '#eff6ff'
                                    : (student.program || details.program) === 'SSW'
                                      ? '#ecfdf5'
                                      : '#fffbeb',
                                color:
                                  (student.program || details.program) === 'TITP/ESD'
                                    ? '#1d4ed8'
                                    : (student.program || details.program) === 'SSW'
                                      ? '#047857'
                                      : '#b45309',
                                border: `1px solid ${(student.program || details.program) === 'TITP/ESD'
                                  ? '#bfdbfe'
                                  : (student.program || details.program) === 'SSW'
                                    ? '#a7f3d0'
                                    : '#fde68a'
                                  }`,
                              }}
                            >
                              {student.program || details.program}
                            </span>
                            {(student.sub_program || details.sub_program) && (
                              <span
                                style={{
                                  fontSize: '11.5px',
                                  color: '#334155',
                                  fontWeight: 600,
                                  lineHeight: 1.25,
                                }}
                              >
                                {student.sub_program || details.sub_program}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: '12px', color: '#94a3b8' }}>—</span>
                        )}
                      </td>

                      {/* Gender / 性別 */}
                      <td>
                        <span style={{ fontSize: '12.5px', color: '#1e293b' }}>
                          {genderVal}
                        </span>
                      </td>

                      {/* DOB & Age / 生年月日・年齢 */}
                      <td>
                        <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#1e293b' }}>
                          {formatJapaneseBirthDate(student.date_of_birth)}
                        </div>
                        <div style={{ fontSize: '11.5px', color: 'var(--nikkou-red)', fontWeight: 600 }}>
                          {ageVal}
                        </div>
                      </td>

                      {/* Status */}
                      <td>{renderStatusBadge(student.status)}</td>

                      {/* Actions */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                          {/* Student Edit Link Button */}
                          {student.status === 'verified' ? (
                            <button
                              type="button"
                              disabled
                              className={styles.secondaryBtn}
                              title="Application is verified — edit link is locked"
                              style={{
                                padding: '6px 10px',
                                opacity: 0.65,
                                cursor: 'not-allowed',
                                background: '#f8fafc',
                                color: '#64748b',
                                borderColor: '#e2e8f0',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '12px',
                              }}
                            >
                              <Lock size={13} color="#94a3b8" />
                              <span>Locked</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleCopyStudentEditLink(student.edit_token)}
                              className={`${styles.secondaryBtn} ${copiedEditToken === student.edit_token ? styles.copyBtnSuccess : ''}`}
                              title="Copy student form edit link"
                              style={{
                                padding: '6px 10px',
                                color: copiedEditToken === student.edit_token ? '#059669' : '#0284c7',
                                borderColor: copiedEditToken === student.edit_token ? '#a7f3d0' : '#bae6fd',
                                background: copiedEditToken === student.edit_token ? '#ecfdf5' : '#f0f9ff',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '12px',
                                fontWeight: 700,
                              }}
                            >
                              {copiedEditToken === student.edit_token ? (
                                <>
                                  <Check size={13} />
                                  <span>Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Link2 size={13} />
                                  <span>Edit Link</span>
                                </>
                              )}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenDrawer(student)}
                            className={styles.secondaryBtn}
                            title="View student CV details"
                            style={{ padding: '6px 12px' }}
                          >
                            <Eye size={14} />
                            View
                          </button>

                          <Link
                            href={`/dashboard/cv-maker/students/${student.id}/edit`}
                            onClick={() => handleMarkAsRead(student.id)}
                            className={styles.secondaryBtn}
                            title="Edit student CV details"
                            style={{ padding: '6px 12px', textDecoration: 'none', color: '#1d4ed8' }}
                          >
                            <Edit3 size={14} />
                            Edit
                          </Link>

                          <button
                            type="button"
                            onClick={() => handleDeleteStudent(student.id)}
                            className={styles.secondaryBtn}
                            title="Delete student record"
                            style={{ padding: '6px 10px', color: '#dc2626' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Side Drawer for Student CV Full Inspection */}
      {activeStudent && (
        <div className={styles.drawerBackdrop} onClick={() => setActiveStudent(null)}>
          <div className={styles.drawerContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--nikkou-navy)', margin: 0 }}>
                  {activeStudent.details_json?.furigana || activeStudent.full_name}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
                  <span className={styles.codePill}>{activeStudent.student_code}</span>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    {activeStudent.details_json?.name_native || ''}
                  </span>
                  {(activeStudent.program || activeStudent.details_json?.program) && (
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '4px',
                        background:
                          (activeStudent.program || activeStudent.details_json?.program) === 'TITP/ESD'
                            ? '#eff6ff'
                            : (activeStudent.program || activeStudent.details_json?.program) === 'SSW'
                              ? '#ecfdf5'
                              : '#fffbeb',
                        color:
                          (activeStudent.program || activeStudent.details_json?.program) === 'TITP/ESD'
                            ? '#1d4ed8'
                            : (activeStudent.program || activeStudent.details_json?.program) === 'SSW'
                              ? '#047857'
                              : '#b45309',
                        border: `1px solid ${(activeStudent.program || activeStudent.details_json?.program) === 'TITP/ESD'
                          ? '#bfdbfe'
                          : (activeStudent.program || activeStudent.details_json?.program) === 'SSW'
                            ? '#a7f3d0'
                            : '#fde68a'
                          }`,
                      }}
                    >
                      {activeStudent.program || activeStudent.details_json?.program}
                      {(activeStudent.sub_program || activeStudent.details_json?.sub_program) && (
                        <span> · {activeStudent.sub_program || activeStudent.details_json?.sub_program}</span>
                      )}
                    </span>
                  )}
                  <span
                    style={{
                      fontSize: '11.5px',
                      fontWeight: 700,
                      color: '#059669',
                      background: '#ecfdf5',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      border: '1px solid #a7f3d0',
                    }}
                  >
                    CV Preview
                  </span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {/* Student Edit Link in Drawer */}
                {activeStudent.status === 'verified' ? (
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
                    onClick={() => handleCopyStudentEditLink(activeStudent.edit_token)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 14px',
                      borderRadius: '8px',
                      border: `1.5px solid ${copiedEditToken === activeStudent.edit_token ? '#a7f3d0' : '#bae6fd'}`,
                      background: copiedEditToken === activeStudent.edit_token ? '#ecfdf5' : '#f0f9ff',
                      color: copiedEditToken === activeStudent.edit_token ? '#059669' : '#0284c7',
                      fontSize: '13px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                    title="Copy shareable edit link for the student"
                  >
                    {copiedEditToken === activeStudent.edit_token ? (
                      <>
                        <Check size={16} />
                        <span>Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <Link2 size={16} />
                        <span>Copy Student Edit Link</span>
                      </>
                    )}
                  </button>
                )}

                <Link
                  href={`/dashboard/cv-maker/students/${activeStudent.id}/edit`}
                  onClick={() => handleMarkAsRead(activeStudent.id)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1.5px solid #bfdbfe',
                    background: '#eff6ff',
                    color: '#1d4ed8',
                    fontSize: '13px',
                    fontWeight: 700,
                    textDecoration: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  title="Edit student CV information"
                >
                  <Edit3 size={16} />
                  <span>Edit CV</span>
                </Link>

                <button
                  type="button"
                  onClick={handleInitiatePrint}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1.5px solid var(--border-strong)',
                    background: '#ffffff',
                    color: 'var(--nikkou-navy)',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <Printer size={16} />
                  <span>Print CV</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveStudent(null)}
                  className={styles.closeBtn}
                  title="Close"
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '8px',
                    background: '#f1f5f9',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#334155',
                  }}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className={styles.drawerBody}>
              {/* Quick Status Bar (Hidden during Print) */}
              <div
                className={styles.noPrint}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  background: '#ffffff',
                  border: '1px solid var(--border-light)',
                  borderRadius: '10px',
                  gap: '12px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Program & Category:
                  </span>
                  <span
                    style={{
                      fontSize: '12.5px',
                      fontWeight: 700,
                      color: 'var(--nikkou-navy)',
                      background: '#f8fafc',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-light)',
                    }}
                  >
                    {formatProgramBadge(
                      activeStudent.program || activeStudent.details_json?.program,
                      activeStudent.sub_program || activeStudent.details_json?.sub_program
                    )}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    Application Status:
                  </span>
                  <select
                    value={activeStudent.status}
                    disabled={updatingStatus}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    style={{
                      height: '34px',
                      padding: '0 10px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-strong)',
                      fontSize: '12.5px',
                      fontWeight: 700,
                      outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="submitted">Submitted</option>
                    <option value="verified">Verified</option>
                    <option value="draft">Draft</option>
                  </select>
                </div>
              </div>

              {/* Dual-Version Print Format Switcher Tab (Hidden during Print and Hidden when AI is off) */}
              {aiEnabled && (
                <div
                  className={styles.noPrint}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 18px',
                    background: 'linear-gradient(135deg, #f8fafc 0%, #edf2f7 100%)',
                    border: '1.5px solid #cbd5e1',
                    borderRadius: '10px',
                    marginTop: '12px',
                    marginBottom: '16px',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--nikkou-navy)' }}>
                      印刷形式 / Print Version:
                    </span>
                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                      {effectivePrintVersion === 'japanese'
                        ? '（100%日本語・ベンガル語表記完全排除 / Pure Japanese for Japanese Companies）'
                        : '（日本語＋ベンガル語併記 / Bilingual Version for Student Reference）'}
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: '#e2e8f0',
                      padding: '3px',
                      borderRadius: '8px',
                      gap: '4px',
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => setPrintVersion('japanese')}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '7px 16px',
                        borderRadius: '6px',
                        border: 'none',
                        background: effectivePrintVersion === 'japanese' ? '#1f3864' : 'transparent',
                        color: effectivePrintVersion === 'japanese' ? '#ffffff' : '#334155',
                        fontSize: '13px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: effectivePrintVersion === 'japanese' ? '0 2px 6px rgba(31, 56, 100, 0.25)' : 'none',
                      }}
                    >
                      <span>🇯🇵</span>
                      <span>日本語版 (Pure Japanese)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPrintVersion('student')}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '7px 16px',
                        borderRadius: '6px',
                        border: 'none',
                        background: effectivePrintVersion === 'student' ? '#1f3864' : 'transparent',
                        color: effectivePrintVersion === 'student' ? '#ffffff' : '#334155',
                        fontSize: '13px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        boxShadow: effectivePrintVersion === 'student' ? '0 2px 6px rgba(31, 56, 100, 0.25)' : 'none',
                      }}
                    >
                      <span>🇧🇩</span>
                      <span>学生用 (Student Bilingual)</span>
                    </button>
                  </div>
                </div>
              )}

              {/* PRINTABLE A4 CV DOCUMENT - REACT-TO-PRINT TARGET */}
              <div
                ref={cvPrintRef}
                className="cv-printable-page"
                style={{
                  position: 'relative',
                  background: '#ffffff',
                  width: '100%',
                  maxWidth: '192mm',
                  margin: '0 auto',
                  padding: '16px 18px',
                  boxSizing: 'border-box',
                  fontFamily: printVersion === 'japanese'
                    ? '"Noto Sans JP", "Hiragino Kaku Gothic ProN", "Yu Gothic", Meiryo, sans-serif'
                    : 'var(--font-bilingual, "Noto Sans JP", "Noto Sans Bengali", "Hind Siliguri", sans-serif)',
                  color: '#000000',
                  lineHeight: 1.35,
                  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
                  borderRadius: '4px',
                }}
              >
                {/* Official Institute Watermark (Centered on preview, repeated on every printed page via position: fixed in print mode) */}
                <div
                  className="cv-watermark-overlay"
                  aria-hidden="true"
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    pointerEvents: 'none',
                    zIndex: 10,
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src="/images/watermark.png"
                    alt="Nikkou Centre Watermark"
                    className="cv-watermark-logo"
                    style={{
                      position: 'sticky',
                      top: '32vh',
                      width: '135mm',
                      height: '135mm',
                      maxWidth: '75%',
                      maxHeight: '75%',
                      objectFit: 'contain',
                      opacity: 0.065,
                      filter: 'grayscale(10%)',
                      pointerEvents: 'none',
                      userSelect: 'none',
                    }}
                  />
                </div>
                {/* SECTION 1: HEADER & BASIC INFO & APPLICANT PHOTO */}
                {(() => {
                  const today = getJapaneseTodayDate();
                  return (
                    <div
                      className="cv-section"
                      data-cv-section
                      style={{
                        marginBottom: '8px',
                        breakInside: 'avoid',
                        pageBreakInside: 'avoid',
                      }}
                    >
                      {/* Full-width Document Header: Title Centered, Date below, 番号/no box on the Right */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: '4px',
                          position: 'relative',
                        }}
                      >
                        {/* Left dummy spacer for perfect center symmetry */}
                        <div style={{ width: '80px' }} />

                        {/* Centered Title & Date */}
                        <div style={{ textAlign: 'center' }}>
                          <div
                            style={{
                              fontSize: '26px',
                              fontWeight: 900,
                              color: '#1f3864',
                              letterSpacing: '2px',
                              lineHeight: 1.15,
                              fontFamily: printVersion === 'japanese'
                                ? '"Noto Sans JP", "Hiragino Kaku Gothic ProN", "Yu Gothic", Meiryo, sans-serif'
                                : 'var(--font-bilingual, "Noto Sans JP", "Noto Sans Bengali", "Hind Siliguri", sans-serif)',
                            }}
                          >
                            {printVersion === 'japanese' ? '履歴書' : '履歴書 / জীবনবৃত্তান্ত'}
                          </div>
                          <div
                            style={{
                              fontSize: '11.5px',
                              fontWeight: 700,
                              color: '#1f3864',
                              marginTop: '3px',
                              letterSpacing: '0.2px',
                            }}
                          >
                            {printVersion === 'japanese' ? '作成日:' : '作成日 / তৈরির তারিখ:'}&nbsp;&nbsp;&nbsp;&nbsp;
                            <span>{today.year}年</span>&nbsp;&nbsp;&nbsp;&nbsp;
                            <span>{today.month}月</span>&nbsp;&nbsp;&nbsp;&nbsp;
                            <span>{today.day}日</span>
                          </div>
                        </div>

                        {/* 番号 / no Box (Right aligned) */}
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            width: '80px',
                            flexShrink: 0,
                          }}
                        >
                          <div
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: '#1f3864',
                              marginBottom: '2px',
                              letterSpacing: '0.2px',
                            }}
                          >
                            {printVersion === 'japanese' ? '番号' : '番号/no'}
                          </div>
                          <div
                            onClick={handleInitiatePrint}
                            title="クリックして印刷番号を設定 / ক্লিক করে প্রিন্ট নম্বর নির্ধারণ করুন"
                            style={{
                              width: '70px',
                              height: '44px',
                              border: '2.5px solid #00a0e9',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: '#ffffff',
                              cursor: 'pointer',
                            }}
                          >
                            {printNumber ? (
                              <span style={{ fontSize: '28px', fontWeight: 900, color: '#e60000', lineHeight: 1 }}>
                                {printNumber}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      {/* Section 1 Header */}
                      <div
                        className="cv-section-title"
                        data-cv-section-title
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '13.5px',
                          fontWeight: 800,
                          color: '#c00000',
                          marginBottom: '3px',
                          letterSpacing: '0.2px',
                          breakAfter: 'avoid',
                          pageBreakAfter: 'avoid',
                        }}
                      >
                        <span style={{ width: '4px', height: '14px', background: '#c00000', borderRadius: '2px', display: 'inline-block', flexShrink: 0 }} />
                        <span>{printVersion === 'japanese' ? '基本情報' : '基本情報 / প্রাথমিক তথ্য'}</span>
                      </div>

                      {/* Basic Info Table & Photo Side-by-Side with matched height */}
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
                        {/* Basic Info Table */}
                        <div
                          style={{
                            border: '1.5px solid #2b5585',
                            background: '#ffffff',
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          <table
                            style={{
                              width: '100%',
                              height: '100%',
                              borderCollapse: 'collapse',
                              tableLayout: 'fixed',
                              fontSize: '11.5px',
                            }}
                          >
                            <colgroup>
                              <col style={{ width: '22%' }} />
                              <col style={{ width: '42%' }} />
                              <col style={{ width: '18%' }} />
                              <col style={{ width: '18%' }} />
                            </colgroup>
                            <tbody>
                              {/* Row 1: Furigana and Gender */}
                              <tr style={{ borderBottom: '1px solid #2b5585' }}>
                                <td
                                  style={{
                                    background: '#e8f0fe',
                                    padding: '4px 6px',
                                    fontWeight: 700,
                                    color: '#1f3864',
                                    borderRight: '1px solid #2b5585',
                                    fontSize: '11px',
                                    lineHeight: 1.2,
                                  }}
                                >
                                  <div>フリガナ</div>
                                  {printVersion === 'student' && (
                                    <div style={{ fontSize: '9px', color: '#475569' }}>ফুরিগানা</div>
                                  )}
                                </td>
                                <td
                                  style={{
                                    padding: '4px 6px',
                                    fontWeight: 700,
                                    color: '#000000',
                                    borderRight: '1px solid #2b5585',
                                    textAlign: 'center',
                                    textTransform: 'uppercase',
                                    fontSize: '12px',
                                    wordBreak: 'break-word',
                                  }}
                                >
                                  {activeStudent.details_json?.furigana || activeStudent.full_name}
                                </td>
                                <td
                                  style={{
                                    background: '#e8f0fe',
                                    padding: '4px 6px',
                                    fontWeight: 700,
                                    color: '#1f3864',
                                    borderRight: '1px solid #2b5585',
                                    textAlign: 'center',
                                    fontSize: '11px',
                                    lineHeight: 1.2,
                                  }}
                                >
                                  <div>性別</div>
                                  {printVersion === 'student' && (
                                    <div style={{ fontSize: '9px', color: '#475569' }}>সেক্স</div>
                                  )}
                                </td>
                                <td
                                  style={{
                                    padding: '4px 6px',
                                    fontWeight: 600,
                                    color: '#000000',
                                    textAlign: 'center',
                                    fontSize: '11.5px',
                                  }}
                                >
                                  {printVersion === 'japanese'
                                    ? stripBengali(activeStudent.details_json?.gender_label || (activeStudent.gender === 'female' ? '女性' : '男性'))
                                    : (activeStudent.details_json?.gender_label || (activeStudent.gender === 'female' ? '女性' : '男性'))}
                                </td>
                              </tr>

                              {/* Row 2: Name and Marital Status */}
                              <tr style={{ borderBottom: '1px solid #2b5585' }}>
                                <td
                                  style={{
                                    background: '#e8f0fe',
                                    padding: '4px 6px',
                                    fontWeight: 700,
                                    color: '#1f3864',
                                    borderRight: '1px solid #2b5585',
                                    fontSize: '11px',
                                    lineHeight: 1.2,
                                  }}
                                >
                                  <div>氏名</div>
                                  {printVersion === 'student' && (
                                    <div style={{ fontSize: '9px', color: '#475569' }}>নাম</div>
                                  )}
                                </td>
                                <td
                                  style={{
                                    padding: '4px 6px',
                                    fontWeight: 700,
                                    color: '#000000',
                                    borderRight: '1px solid #2b5585',
                                    textAlign: 'center',
                                    fontSize: '13px',
                                    wordBreak: 'break-word',
                                  }}
                                >
                                  {activeStudent.details_json?.name_native || activeStudent.full_name}
                                </td>
                                <td
                                  style={{
                                    background: '#e8f0fe',
                                    padding: '4px 6px',
                                    fontWeight: 700,
                                    color: '#1f3864',
                                    borderRight: '1px solid #2b5585',
                                    textAlign: 'center',
                                    fontSize: '11px',
                                    lineHeight: 1.2,
                                  }}
                                >
                                  <div>婚姻</div>
                                  {printVersion === 'student' && (
                                    <div style={{ fontSize: '9px', color: '#475569' }}>বিবাহ</div>
                                  )}
                                </td>
                                <td
                                  style={{
                                    padding: '4px 6px',
                                    fontWeight: 600,
                                    color: '#000000',
                                    textAlign: 'center',
                                    fontSize: '11.5px',
                                  }}
                                >
                                  {printVersion === 'japanese'
                                    ? stripBengali(activeStudent.details_json?.marital_status || '独身')
                                    : (activeStudent.details_json?.marital_status || '独身')}
                                </td>
                              </tr>

                              {/* Row 3: Date of Birth and Age */}
                              <tr style={{ borderBottom: '1px solid #2b5585' }}>
                                <td
                                  style={{
                                    background: '#e8f0fe',
                                    padding: '4px 6px',
                                    fontWeight: 700,
                                    color: '#1f3864',
                                    borderRight: '1px solid #2b5585',
                                    fontSize: '11px',
                                    lineHeight: 1.2,
                                  }}
                                >
                                  <div>生年月日</div>
                                  {printVersion === 'student' && (
                                    <div style={{ fontSize: '9px', color: '#475569' }}>জন্ম তারিখ</div>
                                  )}
                                </td>
                                <td
                                  style={{
                                    padding: '4px 6px',
                                    fontWeight: 600,
                                    color: '#000000',
                                    borderRight: '1px solid #2b5585',
                                    textAlign: 'center',
                                    fontSize: '11.5px',
                                  }}
                                >
                                  {activeStudent.details_json?.dob_japanese || formatJapaneseBirthDate(activeStudent.date_of_birth)}
                                </td>
                                <td
                                  style={{
                                    background: '#e8f0fe',
                                    padding: '4px 6px',
                                    fontWeight: 700,
                                    color: '#1f3864',
                                    borderRight: '1px solid #2b5585',
                                    textAlign: 'center',
                                    fontSize: '11px',
                                    lineHeight: 1.2,
                                  }}
                                >
                                  <div>年齢</div>
                                  {printVersion === 'student' && (
                                    <div style={{ fontSize: '9px', color: '#475569' }}>বয়স</div>
                                  )}
                                </td>
                                <td
                                  style={{
                                    padding: '4px 6px',
                                    fontWeight: 700,
                                    color: '#000000',
                                    textAlign: 'center',
                                    fontSize: '12px',
                                  }}
                                >
                                  {printVersion === 'japanese'
                                    ? formatPureJapaneseAge(
                                        activeStudent.details_json?.age_display,
                                        activeStudent.details_json?.dob_japanese || activeStudent.date_of_birth
                                      )
                                    : (activeStudent.details_json?.age_display ||
                                        normalizeCandidateAge('', activeStudent.details_json?.dob_japanese || activeStudent.date_of_birth) ||
                                        '—')}
                                </td>
                              </tr>

                              {/* Row 4: Contact Address */}
                              <tr style={{ borderBottom: '1px solid #2b5585' }}>
                                <td
                                  style={{
                                    background: '#e8f0fe',
                                    padding: '4px 6px',
                                    fontWeight: 700,
                                    color: '#1f3864',
                                    borderRight: '1px solid #2b5585',
                                    fontSize: '11px',
                                    lineHeight: 1.2,
                                  }}
                                >
                                  <div>連絡先</div>
                                  {printVersion === 'student' && (
                                    <div style={{ fontSize: '9px', color: '#475569' }}>ঠিকানা</div>
                                  )}
                                </td>
                                <td
                                  colSpan={3}
                                  style={{
                                    padding: '4px 8px',
                                    color: '#000000',
                                    fontWeight: 600,
                                    lineHeight: 1.3,
                                    fontSize: '11.5px',
                                    wordBreak: 'break-word',
                                  }}
                                >
                                  {printVersion === 'japanese'
                                    ? stripBengali(activeStudent.details_json?.address) || '—'
                                    : (activeStudent.details_json?.address || '—')}
                                </td>
                              </tr>

                              {/* Row 5: Phone Number */}
                              <tr>
                                <td
                                  style={{
                                    background: '#e8f0fe',
                                    padding: '4px 6px',
                                    fontWeight: 700,
                                    color: '#1f3864',
                                    borderRight: '1px solid #2b5585',
                                    fontSize: '11px',
                                    lineHeight: 1.2,
                                  }}
                                >
                                  <div>電話</div>
                                  {printVersion === 'student' && (
                                    <div style={{ fontSize: '9px', color: '#475569' }}>ফোন</div>
                                  )}
                                </td>
                                <td
                                  colSpan={3}
                                  style={{
                                    padding: '4px 8px',
                                    color: '#000000',
                                    fontWeight: 700,
                                    fontSize: '12px',
                                  }}
                                >
                                  {activeStudent.details_json?.phone || activeStudent.phone || '—'}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>

                        {/* Right: Applicant Formal Photo in Blue Frame */}
                        <div
                          style={{
                            width: '136px',
                            flexShrink: 0,
                            border: '2px solid #2b5585',
                            background: '#ffffff',
                            boxSizing: 'border-box',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                          }}
                        >
                          {activeStudent.details_json?.photo_data ? (
                            <img
                              src={activeStudent.details_json.photo_data}
                              alt={activeStudent.full_name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                            />
                          ) : (
                            <div style={{ textAlign: 'center', color: '#94a3b8', fontSize: '11.5px' }}>
                              <Users size={32} style={{ margin: '0 auto 4px auto' }} />
                              <div>{printVersion === 'japanese' ? '写真' : '写真 / ছবি'}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* SECTION 2: 個人情報 / ব্যক্তিগত তথ্য (Fixed Table Layout to prevent column squishing) */}
                <div
                  className="cv-section"
                  data-cv-section
                  style={{
                    marginBottom: '8px',
                    breakInside: 'avoid',
                    pageBreakInside: 'avoid',
                  }}
                >
                  <div
                    className="cv-section-title"
                    data-cv-section-title
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '13.5px',
                      fontWeight: 800,
                      color: '#c00000',
                      marginBottom: '3px',
                      letterSpacing: '0.2px',
                      breakAfter: 'avoid',
                      pageBreakAfter: 'avoid',
                    }}
                  >
                    <span style={{ width: '4px', height: '14px', background: '#c00000', borderRadius: '2px', display: 'inline-block', flexShrink: 0 }} />
                    <span>{printVersion === 'japanese' ? '個人情報' : '個人情報 / ব্যক্তিগত তথ্য'}</span>
                  </div>

                  <div style={{ border: '1.5px solid #2b5585', background: '#ffffff', width: '100%', boxSizing: 'border-box' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: '11px' }}>
                      <colgroup>
                        <col style={{ width: '16.5%' }} />
                        <col style={{ width: '16.5%' }} />
                        <col style={{ width: '16.5%' }} />
                        <col style={{ width: '16.5%' }} />
                        <col style={{ width: '16.5%' }} />
                        <col style={{ width: '17.5%' }} />
                      </colgroup>
                      <tbody>
                        {/* Row 1: Eyesight, Color Blindness, Dominant Hand */}
                        <tr style={{ borderBottom: '1px solid #2b5585' }}>
                          <td style={{ background: '#e8f0fe', padding: '4px 6px', borderRight: '1px solid #2b5585', lineHeight: 1.2 }}>
                            <div style={{ fontWeight: 700, fontSize: '11px', color: '#1f3864' }}>視力</div>
                            {printVersion === 'student' && <div style={{ fontSize: '9.5px', color: '#475569' }}>দৃষ্টিশক্তি</div>}
                          </td>
                          <td style={{ padding: '3px 4px', fontWeight: 600, color: '#000000', borderRight: '1px solid #2b5585', textAlign: 'center', fontSize: '11px', letterSpacing: '-0.2px', whiteSpace: 'nowrap' }}>
                            {(() => {
                              const raw = activeStudent.details_json?.eyesight;
                              if (!raw) return '—';
                              const clean = raw.replace(/\s*\([^)]*\)/g, '').trim();
                              return printVersion === 'japanese' ? stripBengali(clean) || '—' : (clean || '—');
                            })()}
                          </td>
                          <td style={{ background: '#e8f0fe', padding: '4px 6px', borderRight: '1px solid #2b5585', lineHeight: 1.2 }}>
                            <div style={{ fontWeight: 700, fontSize: '11px', color: '#1f3864' }}>色覚異常</div>
                            {printVersion === 'student' && <div style={{ fontSize: '9.5px', color: '#475569' }}>বর্ণান্ধতা</div>}
                          </td>
                          <td style={{ padding: '4px 6px', fontWeight: 600, color: '#000000', borderRight: '1px solid #2b5585', textAlign: 'center', fontSize: '11.5px' }}>
                            {printVersion === 'japanese'
                              ? stripBengali(activeStudent.details_json?.color_blindness) || '—'
                              : (activeStudent.details_json?.color_blindness || '—')}
                          </td>
                          <td style={{ background: '#e8f0fe', padding: '4px 6px', borderRight: '1px solid #2b5585', lineHeight: 1.2 }}>
                            <div style={{ fontWeight: 700, fontSize: '11px', color: '#1f3864' }}>利き手</div>
                            {printVersion === 'student' && <div style={{ fontSize: '9.5px', color: '#475569' }}>প্রভাবশালী হাত</div>}
                          </td>
                          <td style={{ padding: '3px 4px', textAlign: 'center', wordBreak: 'break-word' }}>
                            {(() => {
                              const val = activeStudent.details_json?.dominant_hand;
                              if (!val) return '—';
                              if (printVersion === 'japanese') {
                                return <span style={{ fontWeight: 600, fontSize: '11px' }}>{stripBengali(val)}</span>;
                              }
                              if (val.includes(' / ')) {
                                const [jp, bn] = val.split(' / ');
                                return (
                                  <div style={{ lineHeight: 1.2 }}>
                                    <div style={{ fontWeight: 700, fontSize: '11px', color: '#000000' }}>{jp}</div>
                                    <div style={{ fontSize: '9.5px', color: '#475569' }}>{bn}</div>
                                  </div>
                                );
                              }
                              return <span style={{ fontWeight: 600, fontSize: '11px' }}>{val}</span>;
                            })()}
                          </td>
                        </tr>

                        {/* Row 2: Weight, Height, Tattoo/Surgery */}
                        <tr style={{ borderBottom: '1px solid #2b5585' }}>
                          <td style={{ background: '#e8f0fe', padding: '4px 6px', borderRight: '1px solid #2b5585', lineHeight: 1.2 }}>
                            <div style={{ fontWeight: 700, fontSize: '11px', color: '#1f3864' }}>体重</div>
                            {printVersion === 'student' && <div style={{ fontSize: '9.5px', color: '#475569' }}>শরীরের ওজন</div>}
                          </td>
                          <td style={{ padding: '4px 6px', fontWeight: 600, color: '#000000', borderRight: '1px solid #2b5585', textAlign: 'center', fontSize: '11.5px' }}>
                            {activeStudent.details_json?.body_weight || '—'}
                          </td>
                          <td style={{ background: '#e8f0fe', padding: '4px 6px', borderRight: '1px solid #2b5585', lineHeight: 1.2 }}>
                            <div style={{ fontWeight: 700, fontSize: '11px', color: '#1f3864' }}>身長</div>
                            {printVersion === 'student' && <div style={{ fontSize: '9.5px', color: '#475569' }}>উচ্চতা</div>}
                          </td>
                          <td style={{ padding: '4px 6px', fontWeight: 600, color: '#000000', borderRight: '1px solid #2b5585', textAlign: 'center', fontSize: '11.5px' }}>
                            {activeStudent.details_json?.height || '—'}
                          </td>
                          <td style={{ background: '#e8f0fe', padding: '4px 6px', borderRight: '1px solid #2b5585', lineHeight: 1.2 }}>
                            <div style={{ fontWeight: 700, fontSize: '11px', color: '#1f3864' }}>入れ墨・手術</div>
                            {printVersion === 'student' && <div style={{ fontSize: '9.5px', color: '#475569' }}>ট্যাটু / সার্জারি</div>}
                          </td>
                          <td style={{ padding: '4px 6px', fontWeight: 600, color: '#000000', textAlign: 'center', fontSize: '11.5px' }}>
                            {printVersion === 'japanese'
                              ? stripBengali(activeStudent.details_json?.tattoo_surgery) || '—'
                              : (activeStudent.details_json?.tattoo_surgery || '—')}
                          </td>
                        </tr>

                        {/* Row 3: Smoking, Alcohol, Blood Type */}
                        <tr style={{ borderBottom: '1px solid #2b5585' }}>
                          <td style={{ background: '#e8f0fe', padding: '4px 6px', borderRight: '1px solid #2b5585', lineHeight: 1.2 }}>
                            <div style={{ fontWeight: 700, fontSize: '11px', color: '#1f3864' }}>タバコ</div>
                            {printVersion === 'student' && <div style={{ fontSize: '9.5px', color: '#475569' }}>ধূমপান?</div>}
                          </td>
                          <td style={{ padding: '4px 6px', fontWeight: 600, color: '#000000', borderRight: '1px solid #2b5585', textAlign: 'center', fontSize: '11.5px' }}>
                            {printVersion === 'japanese'
                              ? stripBengali(activeStudent.details_json?.smoking) || '—'
                              : (activeStudent.details_json?.smoking || '—')}
                          </td>
                          <td style={{ background: '#e8f0fe', padding: '4px 6px', borderRight: '1px solid #2b5585', lineHeight: 1.2 }}>
                            <div style={{ fontWeight: 700, fontSize: '11px', color: '#1f3864' }}>お酒</div>
                            {printVersion === 'student' && <div style={{ fontSize: '9.5px', color: '#475569' }}>মদ পান?</div>}
                          </td>
                          <td style={{ padding: '4px 6px', fontWeight: 600, color: '#000000', borderRight: '1px solid #2b5585', textAlign: 'center', fontSize: '11.5px' }}>
                            {printVersion === 'japanese'
                              ? stripBengali(activeStudent.details_json?.alcohol) || '—'
                              : (activeStudent.details_json?.alcohol || '—')}
                          </td>
                          <td style={{ background: '#e8f0fe', padding: '4px 6px', borderRight: '1px solid #2b5585', lineHeight: 1.2 }}>
                            <div style={{ fontWeight: 700, fontSize: '11px', color: '#1f3864' }}>血液型</div>
                            {printVersion === 'student' && <div style={{ fontSize: '9.5px', color: '#475569' }}>রক্তের ধরন</div>}
                          </td>
                          <td style={{ padding: '3px 4px', textAlign: 'center', wordBreak: 'break-word' }}>
                            {(() => {
                              const val = activeStudent.details_json?.blood_type;
                              if (!val) return '—';
                              if (printVersion === 'japanese') {
                                return <span style={{ fontWeight: 700, fontSize: '11px' }}>{stripBengali(val)}</span>;
                              }
                              if (val.includes(' / ')) {
                                const [jp, bn] = val.split(' / ');
                                return (
                                  <div style={{ lineHeight: 1.2 }}>
                                    <div style={{ fontWeight: 700, fontSize: '11px', color: '#000000' }}>{jp}</div>
                                    <div style={{ fontSize: '9.5px', color: '#475569' }}>{bn}</div>
                                  </div>
                                );
                              }
                              return <span style={{ fontWeight: 700, fontSize: '11px' }}>{val}</span>;
                            })()}
                          </td>
                        </tr>

                        {/* Row 4: Hobby and Personality */}
                        <tr style={{ borderBottom: '1px solid #2b5585' }}>
                          <td style={{ background: '#e8f0fe', padding: '4px 6px', borderRight: '1px solid #2b5585', lineHeight: 1.2 }}>
                            <div style={{ fontWeight: 700, fontSize: '11px', color: '#1f3864' }}>趣味</div>
                            {printVersion === 'student' && <div style={{ fontSize: '9.5px', color: '#475569' }}>শখ</div>}
                          </td>
                          <td colSpan={2} style={{ padding: '4px 8px', color: '#000000', borderRight: '1px solid #2b5585', lineHeight: 1.35, fontSize: '11px', wordBreak: 'break-word' }}>
                            {formatCvFieldValue(
                              activeStudent.details_json?.hobbies,
                              activeStudent.details_json?.hobbies_original_bn || (activeStudent.details_json as any)?.hobbiesOriginalBn,
                              printVersion
                            )}
                          </td>
                          <td style={{ background: '#e8f0fe', padding: '4px 6px', borderRight: '1px solid #2b5585', lineHeight: 1.2 }}>
                            <div style={{ fontWeight: 700, fontSize: '11px', color: '#1f3864' }}>性格</div>
                            {printVersion === 'student' && <div style={{ fontSize: '9.5px', color: '#475569' }}>ব্যক্তিত্ব</div>}
                          </td>
                          <td colSpan={2} style={{ padding: '4px 8px', color: '#000000', lineHeight: 1.35, fontSize: '11px', wordBreak: 'break-word' }}>
                            {formatCvFieldValue(
                              activeStudent.details_json?.personality,
                              activeStudent.details_json?.personality_original_bn || (activeStudent.details_json as any)?.personalityOriginalBn,
                              printVersion
                            )}
                          </td>
                        </tr>

                        {/* Row 5: Cooking, Medical history, Group living */}
                        <tr style={{ borderBottom: '1px solid #2b5585' }}>
                          <td style={{ background: '#e8f0fe', padding: '4px 6px', borderRight: '1px solid #2b5585', lineHeight: 1.2 }}>
                            <div style={{ fontWeight: 700, fontSize: '11px', color: '#1f3864' }}>料理経験</div>
                            {printVersion === 'student' && <div style={{ fontSize: '9.5px', color: '#475569' }}>রান্না</div>}
                          </td>
                          <td style={{ padding: '4px 6px', fontWeight: 600, color: '#000000', borderRight: '1px solid #2b5585', textAlign: 'center', fontSize: '11.5px' }}>
                            {printVersion === 'japanese'
                              ? stripBengali(activeStudent.details_json?.cooking) || '—'
                              : (activeStudent.details_json?.cooking || '—')}
                          </td>
                          <td style={{ background: '#e8f0fe', padding: '4px 6px', borderRight: '1px solid #2b5585', lineHeight: 1.2 }}>
                            <div style={{ fontWeight: 700, fontSize: '11px', color: '#1f3864' }}>病歴</div>
                            {printVersion === 'student' && <div style={{ fontSize: '9.5px', color: '#475569' }}>চিকিৎসা ইতিহাস</div>}
                          </td>
                          <td style={{ padding: '4px 6px', fontWeight: 600, color: '#000000', borderRight: '1px solid #2b5585', textAlign: 'center', fontSize: '11.5px' }}>
                            {printVersion === 'japanese'
                              ? stripBengali(activeStudent.details_json?.medical_history) || '—'
                              : (activeStudent.details_json?.medical_history || '—')}
                          </td>
                          <td style={{ background: '#e8f0fe', padding: '4px 6px', borderRight: '1px solid #2b5585', lineHeight: 1.2 }}>
                            <div style={{ fontWeight: 700, fontSize: '11px', color: '#1f3864' }}>集団生活</div>
                            {printVersion === 'student' && <div style={{ fontSize: '9.5px', color: '#475569' }}>গ্রুপ লিভিং</div>}
                          </td>
                          <td style={{ padding: '4px 6px', fontWeight: 600, color: '#000000', textAlign: 'center', fontSize: '11.5px' }}>
                            {printVersion === 'japanese'
                              ? stripBengali(activeStudent.details_json?.group_living) || '—'
                              : (activeStudent.details_json?.group_living || '—')}
                          </td>
                        </tr>

                        {/* Row 6: Personal Income, 5-Year Target Savings */}
                        <tr style={{ borderBottom: '1px solid #2b5585' }}>
                          <td style={{ background: '#e8f0fe', padding: '4px 6px', borderRight: '1px solid #2b5585', lineHeight: 1.2 }}>
                            <div style={{ fontWeight: 700, fontSize: '11px', color: '#1f3864' }}>個人収入</div>
                            {printVersion === 'student' && <div style={{ fontSize: '9.5px', color: '#475569' }}>ব্যক্তিগত আয়</div>}
                          </td>
                          <td colSpan={2} style={{ padding: '3px 4px', borderRight: '1px solid #2b5585', textAlign: 'center', wordBreak: 'break-word' }}>
                            {(() => {
                              const val = activeStudent.details_json?.personal_income;
                              if (!val) return '—';
                              if (printVersion === 'japanese') {
                                return <span style={{ fontWeight: 600, fontSize: '11px' }}>{formatPureJapaneseIncome(val)}</span>;
                              }
                              if (val.includes(' / ')) {
                                const [jp, bn] = val.split(' / ');
                                return (
                                  <div style={{ lineHeight: 1.2 }}>
                                    <div style={{ fontWeight: 700, fontSize: '11px', color: '#000000' }}>{jp}</div>
                                    <div style={{ fontSize: '9.5px', color: '#475569' }}>{bn}</div>
                                  </div>
                                );
                              }
                              return <span style={{ fontWeight: 600, fontSize: '11px' }}>{val}</span>;
                            })()}
                          </td>
                          <td style={{ background: '#e8f0fe', padding: '4px 6px', borderRight: '1px solid #2b5585', lineHeight: 1.2 }}>
                            <div style={{ fontWeight: 700, fontSize: '11px', color: '#1f3864' }}>5年貯金目標</div>
                            {printVersion === 'student' && <div style={{ fontSize: '9.5px', color: '#475569' }}>৫বছরে সঞ্চয়</div>}
                          </td>
                          <td colSpan={2} style={{ padding: '3px 4px', textAlign: 'center', wordBreak: 'break-word' }}>
                            {(() => {
                              const val = activeStudent.details_json?.target_savings_5years;
                              if (!val) return '—';
                              if (printVersion === 'japanese') {
                                return <span style={{ fontWeight: 800, color: '#047857', fontSize: '11.5px' }}>{formatPureJapaneseSavings(val)}</span>;
                              }
                              if (val.includes(' / ')) {
                                const [jp, bn] = val.split(' / ');
                                return (
                                  <div style={{ lineHeight: 1.25 }}>
                                    <div style={{ fontWeight: 800, fontSize: '11.5px', color: '#047857' }}>{jp}</div>
                                    <div style={{ fontWeight: 700, fontSize: '9.5px', color: '#047857' }}>{bn}</div>
                                  </div>
                                );
                              }
                              return <span style={{ fontWeight: 800, color: '#047857', fontSize: '11.5px' }}>{val}</span>;
                            })()}
                          </td>
                        </tr>

                        {/* Row 7: Motivation / 志望動機 */}
                        <tr style={{ borderBottom: '1px solid #2b5585' }}>
                          <td style={{ background: '#e8f0fe', padding: '5px 6px', borderRight: '1px solid #2b5585', lineHeight: 1.2 }}>
                            <div style={{ fontWeight: 700, fontSize: '11px', color: '#1f3864' }}>志望動機</div>
                            {printVersion === 'student' && <div style={{ fontSize: '9.5px', color: '#475569' }}>অনুপ্রেরণা</div>}
                          </td>
                          <td colSpan={5} style={{ padding: '5px 8px', color: '#000000', lineHeight: 1.4, fontSize: '11px', wordBreak: 'break-word' }}>
                            {formatCvFieldValue(
                              activeStudent.details_json?.motivation,
                              activeStudent.details_json?.motivation_original_bn || (activeStudent.details_json as any)?.motivationOriginalBn,
                              printVersion
                            )}
                          </td>
                        </tr>

                        {/* Row 8: Future Plan / 将来の目標 */}
                        <tr style={{ borderBottom: '1px solid #2b5585' }}>
                          <td style={{ background: '#e8f0fe', padding: '5px 6px', borderRight: '1px solid #2b5585', lineHeight: 1.2 }}>
                            <div style={{ fontWeight: 700, fontSize: '11px', color: '#1f3864' }}>帰国後計画</div>
                            {printVersion === 'student' && <div style={{ fontSize: '9.5px', color: '#475569' }}>ভবিষ্যৎ পরিকল্পনা</div>}
                          </td>
                          <td colSpan={5} style={{ padding: '5px 8px', color: '#000000', lineHeight: 1.4, fontSize: '11px', wordBreak: 'break-word' }}>
                            {formatCvFieldValue(
                              activeStudent.details_json?.future_plan_after_japan || (activeStudent.details_json as any)?.futurePlanAfterJapan,
                              activeStudent.details_json?.future_plan_original_bn || (activeStudent.details_json as any)?.futurePlanOriginalBn,
                              printVersion
                            )}
                          </td>
                        </tr>

                        {/* Row 9: Visa History & Type Applied */}
                        <tr>
                          <td style={{ background: '#e8f0fe', padding: '5px 6px', borderRight: '1px solid #2b5585', lineHeight: 1.2 }}>
                            <div style={{ fontWeight: 700, fontSize: '11px', color: '#1f3864' }}>在留資格申請歴</div>
                            {printVersion === 'student' && <div style={{ fontSize: '9.5px', color: '#475569' }}>ভিসা আবেদন</div>}
                          </td>
                          <td colSpan={2} style={{ padding: '5px 8px', fontWeight: 600, color: '#000000', borderRight: '1px solid #2b5585', fontSize: '11.5px' }}>
                            {printVersion === 'japanese'
                              ? stripBengali(activeStudent.details_json?.japan_visa_applied_before) || '—'
                              : (activeStudent.details_json?.japan_visa_applied_before || '—')}
                          </td>
                          <td style={{ background: '#e8f0fe', padding: '5px 6px', borderRight: '1px solid #2b5585', lineHeight: 1.2 }}>
                            <div style={{ fontWeight: 700, fontSize: '11px', color: '#1f3864' }}>申請資格</div>
                            {printVersion === 'student' && <div style={{ fontSize: '9.5px', color: '#475569' }}>ভিসার ধরন</div>}
                          </td>
                          <td colSpan={2} style={{ padding: '5px 8px', fontWeight: 600, color: '#000000', fontSize: '11.5px' }}>
                            {printVersion === 'japanese'
                              ? stripBengali(activeStudent.details_json?.japan_visa_type_applied) || '—'
                              : (activeStudent.details_json?.japan_visa_type_applied || '—')}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* SECTION 3: 学歴 / শিক্ষাগত যোগ্যতা (Natural Flow on Page 1, Unbreakable) */}
                <div
                  className="cv-section"
                  data-cv-section
                  style={{
                    marginBottom: '8px',
                    breakInside: 'avoid',
                    pageBreakInside: 'avoid',
                  }}
                >
                  <div
                    className="cv-section-title"
                    data-cv-section-title
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '13.5px',
                      fontWeight: 800,
                      color: '#c00000',
                      marginBottom: '3px',
                      letterSpacing: '0.2px',
                      breakAfter: 'avoid',
                      pageBreakAfter: 'avoid',
                    }}
                  >
                    <span style={{ width: '4px', height: '14px', background: '#c00000', borderRadius: '2px', display: 'inline-block', flexShrink: 0 }} />
                    <span>{printVersion === 'japanese' ? '学歴' : '学歴 / শিক্ষাগত যোগ্যতা'}</span>
                  </div>

                  <div style={{ border: '1.5px solid #2b5585', background: '#ffffff', width: '100%', boxSizing: 'border-box' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: '11.5px' }}>
                      <colgroup>
                        <col style={{ width: '15%' }} />
                        <col style={{ width: '15%' }} />
                        <col style={{ width: '34%' }} />
                        <col style={{ width: '18%' }} />
                        <col style={{ width: '18%' }} />
                      </colgroup>
                      <thead>
                        <tr style={{ background: '#e8f0fe', borderBottom: '1px solid #2b5585' }}>
                          <th style={{ padding: '5px 6px', fontWeight: 700, color: '#1f3864', borderRight: '1px solid #2b5585', textAlign: 'center', fontSize: '11px', lineHeight: 1.2 }}>
                            <div>開始年</div>
                            {printVersion === 'student' && <div style={{ fontSize: '9.5px', color: '#475569' }}>শুরুর বছর</div>}
                          </th>
                          <th style={{ padding: '5px 6px', fontWeight: 700, color: '#1f3864', borderRight: '1px solid #2b5585', textAlign: 'center', fontSize: '11px', lineHeight: 1.2 }}>
                            <div>終了年</div>
                            {printVersion === 'student' && <div style={{ fontSize: '9.5px', color: '#475569' }}>সমাপ্তি বছর</div>}
                          </th>
                          <th style={{ padding: '5px 6px', fontWeight: 700, color: '#1f3864', borderRight: '1px solid #2b5585', textAlign: 'center', fontSize: '11px', lineHeight: 1.2 }}>
                            <div>学校名</div>
                            {printVersion === 'student' && <div style={{ fontSize: '9.5px', color: '#475569' }}>স্কুলের নাম</div>}
                          </th>
                          <th style={{ padding: '5px 6px', fontWeight: 700, color: '#1f3864', borderRight: '1px solid #2b5585', textAlign: 'center', fontSize: '11px', lineHeight: 1.2 }}>
                            <div>専攻</div>
                            {printVersion === 'student' && <div style={{ fontSize: '9.5px', color: '#475569' }}>সাবজেক্ট</div>}
                          </th>
                          <th style={{ padding: '5px 6px', fontWeight: 700, color: '#1f3864', textAlign: 'center', fontSize: '11px', lineHeight: 1.2 }}>
                            <div>学位</div>
                            {printVersion === 'student' && <div style={{ fontSize: '9.5px', color: '#475569' }}>যোগ্যতা</div>}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeStudent.details_json?.education_history && activeStudent.details_json.education_history.length > 0 ? (
                          activeStudent.details_json.education_history.map((edu: any, eIdx: number, arr: any[]) => (
                            <tr
                              key={eIdx}
                              style={{
                                borderBottom: eIdx === arr.length - 1 ? 'none' : '1px solid #2b5585',
                              }}
                            >
                              <td style={{ padding: '4px 6px', textAlign: 'center', fontWeight: 600, color: '#000000', borderRight: '1px solid #2b5585', fontSize: '11.5px' }}>
                                {edu.start_year_month || '—'}
                              </td>
                              <td style={{ padding: '4px 6px', textAlign: 'center', fontWeight: 600, color: edu.end_year_month === '現在も' ? '#047857' : '#000000', borderRight: '1px solid #2b5585', fontSize: '11.5px' }}>
                                {edu.end_year_month || '—'}
                              </td>
                              <td style={{ padding: '4px 6px', textAlign: 'center', fontWeight: 700, color: '#000000', borderRight: '1px solid #2b5585', fontSize: '12px', wordBreak: 'break-word' }}>
                                {edu.school_name || '—'}
                              </td>
                              <td style={{ padding: '4px 6px', textAlign: 'center', fontWeight: 600, color: '#000000', borderRight: '1px solid #2b5585', fontSize: '11.5px', wordBreak: 'break-word' }}>
                                {printVersion === 'japanese' ? stripBengali(edu.major_subject) || '—' : (edu.major_subject || '—')}
                              </td>
                              <td style={{ padding: '4px 6px', textAlign: 'center', fontWeight: 600, color: '#000000', fontSize: '11.5px', wordBreak: 'break-word' }}>
                                {printVersion === 'japanese' ? stripBengali(edu.qualification) || '—' : (edu.qualification || '—')}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={5} style={{ padding: '6px', textAlign: 'center', color: '#64748b', fontSize: '11.5px' }}>
                              {printVersion === 'japanese' ? 'なし' : 'なし / কোনো তথ্য নেই'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* SECTION 4: その他言語 / অন্যান্য ভাষা (Natural Flow on Page 1, Unbreakable) */}
                <div
                  className="cv-section"
                  data-cv-section
                  style={{
                    marginBottom: '8px',
                    breakInside: 'avoid',
                    pageBreakInside: 'avoid',
                  }}
                >
                  <div
                    className="cv-section-title"
                    data-cv-section-title
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '13.5px',
                      fontWeight: 800,
                      color: '#c00000',
                      marginBottom: '3px',
                      letterSpacing: '0.2px',
                      breakAfter: 'avoid',
                      pageBreakAfter: 'avoid',
                    }}
                  >
                    <span style={{ width: '4px', height: '14px', background: '#c00000', borderRadius: '2px', display: 'inline-block', flexShrink: 0 }} />
                    <span>{printVersion === 'japanese' ? 'その他言語' : 'その他言語 / অন্যান্য ভাষা'}</span>
                  </div>

                  <div style={{ border: '1.5px solid #2b5585', background: '#ffffff', width: '100%', boxSizing: 'border-box' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: '11.5px' }}>
                      <colgroup>
                        <col style={{ width: '32%' }} />
                        <col style={{ width: '18%' }} />
                        <col style={{ width: '32%' }} />
                        <col style={{ width: '18%' }} />
                      </colgroup>
                      <tbody>
                        <tr>
                          {/* Mother tongue (Bengali) Label */}
                          <td style={{ padding: '4px 8px', background: '#e8f0fe', borderRight: '1px solid #2b5585', color: '#1f3864', lineHeight: 1.25, fontSize: '11px' }}>
                            <div style={{ fontWeight: 700 }}>母国語（ベンガル語）【読み書き】</div>
                            {printVersion === 'student' && <div style={{ fontSize: '9.5px', color: '#475569' }}>মাতৃভাষা (বাংলা)</div>}
                          </td>
                          <td style={{ padding: '4px 6px', textAlign: 'center', borderRight: '1px solid #2b5585', fontWeight: 700, color: '#000000', fontSize: '12.5px' }}>
                            {printVersion === 'japanese'
                              ? formatPureJapaneseLanguage(activeStudent.details_json?.language_bengali)
                              : formatLanguageDisplay(activeStudent.details_json?.language_bengali)}
                          </td>

                          {/* English Label */}
                          <td style={{ padding: '4px 8px', background: '#e8f0fe', borderRight: '1px solid #2b5585', color: '#1f3864', lineHeight: 1.25, fontSize: '11px' }}>
                            <div style={{ fontWeight: 700 }}>英語【読み書き】</div>
                            {printVersion === 'student' && <div style={{ fontSize: '9.5px', color: '#475569' }}>ইংরেজি</div>}
                          </td>
                          <td style={{ padding: '4px 6px', textAlign: 'center', fontWeight: 700, color: '#000000', fontSize: '12.5px' }}>
                            {printVersion === 'japanese'
                              ? formatPureJapaneseLanguage(activeStudent.details_json?.language_english)
                              : formatLanguageDisplay(activeStudent.details_json?.language_english)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* SECTION 5: 職歴 / কাজের ইতিহাস (Unbreakable: will move to Page 2 if insufficient room on Page 1) */}
                <div
                  className="cv-section"
                  data-cv-section
                  style={{
                    marginBottom: '8px',
                    breakInside: 'avoid',
                    pageBreakInside: 'avoid',
                  }}
                >
                  <div
                    className="cv-section-title"
                    data-cv-section-title
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '13.5px',
                      fontWeight: 800,
                      color: '#c00000',
                      marginBottom: '3px',
                      letterSpacing: '0.2px',
                      breakAfter: 'avoid',
                      pageBreakAfter: 'avoid',
                    }}
                  >
                    <span style={{ width: '4px', height: '14px', background: '#c00000', borderRadius: '2px', display: 'inline-block', flexShrink: 0 }} />
                    <span>{printVersion === 'japanese' ? '職歴' : '職歴 / কাজের ইতিহাস'}</span>
                  </div>

                  <div style={{ border: '1.5px solid #2b5585', background: '#ffffff', width: '100%', boxSizing: 'border-box' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: '11.5px' }}>
                      <colgroup>
                        <col style={{ width: '15%' }} />
                        <col style={{ width: '15%' }} />
                        <col style={{ width: '32%' }} />
                        <col style={{ width: '38%' }} />
                      </colgroup>
                      <thead>
                        <tr style={{ background: '#e8f0fe', borderBottom: '1px solid #2b5585' }}>
                          <th style={{ padding: '5px 6px', fontWeight: 700, color: '#1f3864', borderRight: '1px solid #2b5585', textAlign: 'center', fontSize: '11px', lineHeight: 1.2 }}>
                            <div>開始年</div>
                            {printVersion === 'student' && <div style={{ fontSize: '9.5px', color: '#475569' }}>শুরুর বছর</div>}
                          </th>
                          <th style={{ padding: '5px 6px', fontWeight: 700, color: '#1f3864', borderRight: '1px solid #2b5585', textAlign: 'center', fontSize: '11px', lineHeight: 1.2 }}>
                            <div>終了年</div>
                            {printVersion === 'student' && <div style={{ fontSize: '9.5px', color: '#475569' }}>সমাপ্তি বছর</div>}
                          </th>
                          <th style={{ padding: '5px 6px', fontWeight: 700, color: '#1f3864', borderRight: '1px solid #2b5585', textAlign: 'center', fontSize: '11px', lineHeight: 1.2 }}>
                            <div>会社名</div>
                            {printVersion === 'student' && <div style={{ fontSize: '9.5px', color: '#475569' }}>কোম্পানির নাম</div>}
                          </th>
                          <th style={{ padding: '5px 6px', fontWeight: 700, color: '#1f3864', textAlign: 'center', fontSize: '11px', lineHeight: 1.2 }}>
                            <div>業務内容</div>
                            {printVersion === 'student' && <div style={{ fontSize: '9.5px', color: '#475569' }}>কাজের বিবরণ</div>}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeStudent.details_json?.work_history && activeStudent.details_json.work_history.length > 0 ? (
                          activeStudent.details_json.work_history.map((work: any, wIdx: number, arr: any[]) => (
                            <tr
                              key={wIdx}
                              style={{
                                borderBottom: wIdx === arr.length - 1 ? 'none' : '1px solid #2b5585',
                              }}
                            >
                              <td style={{ padding: '4px 6px', textAlign: 'center', fontWeight: 600, color: '#000000', borderRight: '1px solid #2b5585', fontSize: '11.5px' }}>
                                {work.start_year_month || '—'}
                              </td>
                              <td style={{ padding: '4px 6px', textAlign: 'center', fontWeight: 600, color: work.end_year_month === '現在も' ? '#047857' : '#000000', borderRight: '1px solid #2b5585', fontSize: '11.5px' }}>
                                {work.end_year_month || '—'}
                              </td>
                              <td style={{ padding: '4px 6px', textAlign: 'center', fontWeight: 700, color: '#000000', borderRight: '1px solid #2b5585', fontSize: '12px', wordBreak: 'break-word' }}>
                                {work.company_name || '—'}
                              </td>
                              <td style={{ padding: '4px 6px', textAlign: 'left', color: '#000000', lineHeight: 1.35, fontSize: '11px', wordBreak: 'break-word' }}>
                                {formatCvFieldValue(
                                  work.job_description,
                                  work.job_description_original_bn || work.jobDescriptionOriginalBn,
                                  printVersion
                                )}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} style={{ padding: '6px', textAlign: 'center', color: '#64748b', fontSize: '11.5px' }}>
                              {printVersion === 'japanese' ? 'なし' : 'なし / নেই'}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* SECTION 6: 家族 / পরিবার (Unbreakable) */}
                <div
                  className="cv-section"
                  data-cv-section
                  style={{
                    marginBottom: '8px',
                    breakInside: 'avoid',
                    pageBreakInside: 'avoid',
                  }}
                >
                  <div
                    className="cv-section-title"
                    data-cv-section-title
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '13.5px',
                      fontWeight: 800,
                      color: '#c00000',
                      marginBottom: '3px',
                      letterSpacing: '0.2px',
                      breakAfter: 'avoid',
                      pageBreakAfter: 'avoid',
                    }}
                  >
                    <span style={{ width: '4px', height: '14px', background: '#c00000', borderRadius: '2px', display: 'inline-block', flexShrink: 0 }} />
                    <span>{printVersion === 'japanese' ? '家族' : '家族 / পরিবার'}</span>
                  </div>

                  <div style={{ border: '1.5px solid #2b5585', background: '#ffffff', width: '100%', boxSizing: 'border-box' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: '11.5px' }}>
                      <colgroup>
                        <col style={{ width: '22%' }} />
                        <col style={{ width: '14%' }} />
                        <col style={{ width: '12%' }} />
                        <col style={{ width: '20%' }} />
                        <col style={{ width: '32%' }} />
                      </colgroup>
                      <thead>
                        <tr style={{ background: '#e8f0fe', borderBottom: '1px solid #2b5585' }}>
                          <th style={{ padding: '5px 6px', fontWeight: 700, color: '#1f3864', borderRight: '1px solid #2b5585', textAlign: 'center', fontSize: '11px', lineHeight: 1.2 }}>
                            <div>氏名</div>
                            {printVersion === 'student' && <div style={{ fontSize: '9.5px', color: '#475569' }}>নাম</div>}
                          </th>
                          <th style={{ padding: '5px 6px', fontWeight: 700, color: '#1f3864', borderRight: '1px solid #2b5585', textAlign: 'center', fontSize: '11px', lineHeight: 1.2 }}>
                            <div>続柄</div>
                            {printVersion === 'student' && <div style={{ fontSize: '9.5px', color: '#475569' }}>সম্পর্ক</div>}
                          </th>
                          <th style={{ padding: '5px 6px', fontWeight: 700, color: '#1f3864', borderRight: '1px solid #2b5585', textAlign: 'center', fontSize: '11px', lineHeight: 1.2 }}>
                            <div>年齢</div>
                            {printVersion === 'student' && <div style={{ fontSize: '9.5px', color: '#475569' }}>বয়স</div>}
                          </th>
                          <th style={{ padding: '5px 6px', fontWeight: 700, color: '#1f3864', borderRight: '1px solid #2b5585', textAlign: 'center', fontSize: '11px', lineHeight: 1.2 }}>
                            <div>職業</div>
                            {printVersion === 'student' && <div style={{ fontSize: '9.5px', color: '#475569' }}>পেশা</div>}
                          </th>
                          <th style={{ padding: '5px 6px', fontWeight: 700, color: '#1f3864', textAlign: 'center', fontSize: '11px', lineHeight: 1.2 }}>
                            <div>在日親族 & 家族の賛成</div>
                            {printVersion === 'student' && <div style={{ fontSize: '9.5px', color: '#475569' }}>জাপানে আত্মীয় ও পরিবারের সম্মতি</div>}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {(() => {
                          const members =
                            activeStudent.details_json?.family_members &&
                              activeStudent.details_json.family_members.length > 0
                              ? activeStudent.details_json.family_members
                              : [];
                          const totalRows = Math.max(2, members.length);

                          return Array.from({ length: totalRows }).map((_, rIdx) => {
                            const m = members[rIdx];
                            const isLastRow = rIdx === totalRows - 1;

                            return (
                              <tr
                                key={`fam-row-${rIdx}`}
                                style={{
                                  borderBottom: isLastRow ? 'none' : '1px solid #2b5585',
                                }}
                              >
                                <td style={{ padding: '4px 6px', textAlign: 'center', fontWeight: 700, color: '#000000', borderRight: '1px solid #2b5585', fontSize: '12px', wordBreak: 'break-word' }}>
                                  {m?.name || (rIdx === 0 && members.length === 0 ? (printVersion === 'japanese' ? 'なし' : 'なし / নেই') : '—')}
                                </td>
                                <td style={{ padding: '4px 6px', textAlign: 'center', fontWeight: 600, color: '#000000', borderRight: '1px solid #2b5585', fontSize: '11.5px' }}>
                                  {printVersion === 'japanese' ? stripBengali(m?.relationship) || '—' : (m?.relationship || '—')}
                                </td>
                                <td style={{ padding: '4px 6px', textAlign: 'center', fontWeight: 600, color: '#000000', borderRight: '1px solid #2b5585', fontSize: '11.5px', whiteSpace: 'nowrap' }}>
                                  {printVersion === 'japanese' ? formatPureJapaneseAge(m?.age) : formatFamilyMemberAge(m?.age)}
                                </td>
                                <td style={{ padding: '4px 6px', textAlign: 'center', fontWeight: 600, color: '#000000', borderRight: '1px solid #2b5585', fontSize: '11.5px', wordBreak: 'break-word' }}>
                                  {printVersion === 'japanese' ? stripBengali(m?.occupation) || '—' : (m?.occupation || '—')}
                                </td>

                                {/* Right Combined Column: Relatives in Japan & Family Support */}
                                {rIdx === 0 && (
                                  <td
                                    style={{
                                      padding: '4px 8px',
                                      textAlign: 'left',
                                      fontSize: '11px',
                                      color: '#000000',
                                      borderBottom: totalRows > 1 ? '1px solid #2b5585' : 'none',
                                      lineHeight: 1.35,
                                      wordBreak: 'break-word',
                                    }}
                                  >
                                    <span style={{ fontWeight: 700, color: '#1f3864' }}>
                                      {printVersion === 'japanese' ? '在日親族:' : '在日親族 / জাপানে আত্মীয়:'}
                                    </span>{' '}
                                    {printVersion === 'japanese'
                                      ? stripBengali(activeStudent.details_json?.relatives_in_japan) || '—'
                                      : (activeStudent.details_json?.relatives_in_japan || '—')}
                                  </td>
                                )}

                                {rIdx === 1 && (
                                  <td
                                    rowSpan={Math.max(1, totalRows - 1)}
                                    style={{
                                      padding: '4px 8px',
                                      textAlign: 'left',
                                      fontSize: '11px',
                                      color: '#000000',
                                      lineHeight: 1.35,
                                      wordBreak: 'break-word',
                                    }}
                                  >
                                    <span style={{ fontWeight: 700, color: '#1f3864' }}>
                                      {printVersion === 'japanese' ? '家族の賛成:' : '家族の賛成 / পরিবারের সম্মতি:'}
                                    </span>{' '}
                                    {printVersion === 'japanese'
                                      ? stripBengali(activeStudent.details_json?.family_support_japan) || '—'
                                      : (activeStudent.details_json?.family_support_japan || '—')}
                                  </td>
                                )}
                              </tr>
                            );
                          });
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* SECTION 7: 評価 / মূল্যায়ন (Unbreakable) */}
                <div
                  className="cv-section"
                  data-cv-section
                  style={{
                    breakInside: 'avoid',
                    pageBreakInside: 'avoid',
                  }}
                >
                  <div
                    className="cv-section-title"
                    data-cv-section-title
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '13.5px',
                      fontWeight: 800,
                      color: '#c00000',
                      marginBottom: '3px',
                      letterSpacing: '0.2px',
                      breakAfter: 'avoid',
                      pageBreakAfter: 'avoid',
                    }}
                  >
                    <span style={{ width: '4px', height: '14px', background: '#c00000', borderRadius: '2px', display: 'inline-block', flexShrink: 0 }} />
                    <span>{printVersion === 'japanese' ? '評価' : '評価 / মূল্যায়ন'}</span>
                  </div>

                  <div style={{ border: '1.5px solid #2b5585', background: '#ffffff', width: '100%', boxSizing: 'border-box' }}>
                    <div
                      style={{
                        padding: '6px 10px',
                        minHeight: '60px',
                        color: activeStudent.details_json?.evaluation ? '#000000' : '#64748b',
                        lineHeight: 1.45,
                        fontSize: '11.5px',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                      }}
                    >
                      {activeStudent.details_json?.evaluation || '—'}
                    </div>
                  </div>
                </div>
              </div>
              {/* END OF PRINTABLE A4 CV DOCUMENT */}

              {/* Submission Information (Hidden on Print) */}
              <div className={`${styles.detailSection} ${styles.noPrint}`}>
                <div className={styles.detailSectionTitle}>
                  <Clock size={16} color="#1f3864" />
                  Registration Details
                </div>

                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Target Program:</span>
                  <span className={styles.detailValue} style={{ fontWeight: 700, color: 'var(--nikkou-navy)' }}>
                    {activeStudent.program || activeStudent.details_json?.program || '—'}
                  </span>
                </div>

                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Applied Category:</span>
                  <span className={styles.detailValue} style={{ fontWeight: 700, color: 'var(--nikkou-navy)' }}>
                    {activeStudent.sub_program || activeStudent.details_json?.sub_program || '—'}
                  </span>
                </div>

                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Intake Source:</span>
                  <span className={styles.detailValue}>
                    {activeStudent.source === 'public_form' ? 'Public Form' : 'Direct Admin Entry'}
                  </span>
                </div>

                <div className={styles.detailRow}>
                  <span className={styles.detailLabel}>Submitted At:</span>
                  <span className={styles.detailValue}>
                    {new Date(activeStudent.created_at).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Prompt for Print Number (番号/no) with 'Keep Empty' Checkbox */}
      {isAskingPrintNumber && (
        <div
          className={styles.noPrint}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setIsAskingPrintNumber(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '460px',
              padding: '26px 28px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1.5px solid #e2e8f0',
              animation: 'fadeIn 0.2s ease',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: '#eff6ff',
                  border: '1.5px solid #bfdbfe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#1d4ed8',
                  flexShrink: 0,
                }}
              >
                <Printer size={22} />
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#0f172a' }}>
                  Print Options & Number (印刷設定)
                </h4>
                <p style={{ margin: '3px 0 0 0', fontSize: '12.5px', color: '#64748b' }}>
                  Select the print version and set the number inside the &ldquo;番号&rdquo; box.
                </p>
              </div>
            </div>

            {/* Print Format / Version Selection inside Modal */}
            {/* Print Format / Version Selection inside Modal (Only shown if AI is enabled) */}
            {aiEnabled && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 800, color: '#1e293b', marginBottom: '6px' }}>
                  印刷バージョン / Select Print Format:
                </label>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '8px',
                    background: '#f1f5f9',
                    padding: '4px',
                    borderRadius: '10px',
                    border: '1.5px solid #cbd5e1',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setPrintVersion('japanese')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      background: effectivePrintVersion === 'japanese' ? '#1f3864' : 'transparent',
                      color: effectivePrintVersion === 'japanese' ? '#ffffff' : '#475569',
                      fontSize: '12.5px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: effectivePrintVersion === 'japanese' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                    }}
                  >
                    <span>🇯🇵</span>
                    <span>日本語版 (Pure Japanese)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrintVersion('student')}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '8px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      background: effectivePrintVersion === 'student' ? '#1f3864' : 'transparent',
                      color: effectivePrintVersion === 'student' ? '#ffffff' : '#475569',
                      fontSize: '12.5px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      boxShadow: effectivePrintVersion === 'student' ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                    }}
                  >
                    <span>🇧🇩</span>
                    <span>学生用 (Bilingual)</span>
                  </button>
                </div>
              </div>
            )}

            {/* Export PDF Filename Display */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '12px',
              }}
            >
              <FileText size={16} color="#1f3864" />
              <span style={{ fontWeight: 700, color: '#334155' }}>
                出力PDF名 / Export PDF:
              </span>
              <span
                style={{
                  fontWeight: 800,
                  color: '#1d4ed8',
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  background: '#eff6ff',
                  padding: '2px 8px',
                  borderRadius: '4px',
                  border: '1px solid #bfdbfe',
                }}
              >
                {getExportPdfFileName(
                  activeStudent?.details_json?.name_native || activeStudent?.full_name,
                  effectivePrintVersion
                )}
                .pdf
              </span>
            </div>

            {/* Live Preview Box & Input */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                padding: '18px',
                background: '#f8fafc',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                marginBottom: '16px',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '4px' }}>
                  {printVersion === 'japanese' ? '番号' : '番号 / no'}
                </span>
                <div
                  style={{
                    width: '74px',
                    height: '52px',
                    border: '2.5px solid #00a0e9',
                    background: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span style={{ fontSize: '30px', fontWeight: 900, color: '#e60000', lineHeight: 1 }}>
                    {printKeepEmpty ? '' : (tempPrintNumber || '1')}
                  </span>
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
                  Enter Print Number:
                </label>
                <input
                  type="text"
                  disabled={printKeepEmpty}
                  value={printKeepEmpty ? '' : tempPrintNumber}
                  onChange={(e) => setTempPrintNumber(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleConfirmPrint();
                    }
                  }}
                  autoFocus={!printKeepEmpty}
                  placeholder="e.g. 1"
                  style={{
                    width: '100%',
                    height: '42px',
                    padding: '0 12px',
                    fontSize: '16px',
                    fontWeight: 700,
                    borderRadius: '8px',
                    border: printKeepEmpty ? '1.5px solid #cbd5e1' : '2px solid #00a0e9',
                    background: printKeepEmpty ? '#f1f5f9' : '#ffffff',
                    color: printKeepEmpty ? '#94a3b8' : '#0f172a',
                    outline: 'none',
                    boxSizing: 'border-box',
                    cursor: printKeepEmpty ? 'not-allowed' : 'text',
                  }}
                />
              </div>
            </div>

            {/* Checkbox to keep empty */}
            <div
              style={{
                marginBottom: '22px',
                padding: '10px 14px',
                background: printKeepEmpty ? '#eff6ff' : '#ffffff',
                border: printKeepEmpty ? '1.5px solid #93c5fd' : '1px solid #e2e8f0',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onClick={() => setPrintKeepEmpty((prev) => !prev)}
            >
              <input
                type="checkbox"
                id="keepEmptyCheckbox"
                checked={printKeepEmpty}
                onChange={(e) => setPrintKeepEmpty(e.target.checked)}
                style={{
                  width: '18px',
                  height: '18px',
                  accentColor: '#1d4ed8',
                  cursor: 'pointer',
                }}
                onClick={(e) => e.stopPropagation()}
              />
              <label
                htmlFor="keepEmptyCheckbox"
                style={{
                  fontSize: '13px',
                  fontWeight: 700,
                  color: printKeepEmpty ? '#1d4ed8' : '#334155',
                  cursor: 'pointer',
                  userSelect: 'none',
                }}
              >
                Print with empty box (leave blank)
              </label>
            </div>

            {/* Colorful Print Guidance Banner */}
            <div
              style={{
                marginBottom: '20px',
                padding: '10px 14px',
                background: '#f0fdf4',
                border: '1.5px solid #86efac',
                borderRadius: '8px',
                display: 'flex',
                gap: '10px',
                alignItems: 'flex-start',
                fontSize: '12px',
                lineHeight: 1.45,
                color: '#166534',
              }}
            >
              <span style={{ fontSize: '17px', flexShrink: 0 }}>🎨</span>
              <div>
                <div style={{ fontWeight: 800, marginBottom: '2px' }}>
                  カラー印刷のヒント / রঙিন প্রিন্টের টিপস:
                </div>
                <div>
                  印刷画面で青い背景や枠線が出ない場合、ブラウザ設定の「詳細設定」で<strong>「背景のグラフィック (Background graphics)」</strong>にチェックを入れ、<strong>「カラー (Color)」</strong>を選択してください。
                </div>
                <div style={{ fontSize: '11px', color: '#15803d', marginTop: '3px' }}>
                  প্রিন্ট ডায়ালগে <strong>More settings</strong> &rarr; <strong>Background graphics</strong> এ টিক দিন এবং <strong>Color</strong> নিশ্চিত করুন।
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setIsAskingPrintNumber(false)}
                style={{
                  padding: '9px 18px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#475569',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => handleConfirmPrint()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '9px 20px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%)',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(29, 78, 216, 0.28)',
                }}
              >
                <Printer size={16} />
                <span>Confirm & Print</span>
              </button>
            </div>
          </div>
        </div>
      )}
      <style jsx>{`
        @keyframes pulseLive {
          0% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
          }
          70% {
            box-shadow: 0 0 0 6px rgba(16, 185, 129, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
          }
        }
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
