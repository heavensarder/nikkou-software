/**
 * Utility to convert bilingual (Japanese / Bengali) CV field values
 * into 100% Pure Japanese strings for the official Japanese Rirekisho (履歴書).
 */

export function stripBengali(val: string | null | undefined): string {
  if (!val) return '';
  const trimmed = String(val).trim();
  if (!trimmed) return '';

  // 1. If split by " / "
  if (trimmed.includes(' / ')) {
    const parts = trimmed.split(' / ');
    const jpPart = parts[0]?.trim();
    if (jpPart) return jpPart;
  }

  // 2. If split by "/"
  if (trimmed.includes('/')) {
    const parts = trimmed.split('/');
    const jpPart = parts[0]?.trim();
    // If the left part contains Japanese characters or ASCII
    if (jpPart && !/[\u0980-\u09FF]/.test(jpPart)) {
      return jpPart;
    }
  }

  // 3. Remove any remaining Bengali Unicode block: \u0980-\u09FF
  const withoutBengali = trimmed.replace(/[\u0980-\u09FF]+/g, '').trim();
  // Clean up any trailing / or parentheses
  const cleaned = withoutBengali.replace(/\s*[/()（）]+\s*$/, '').trim();
  return cleaned || trimmed;
}

/**
 * Extracts pure Japanese age e.g. "19歳 / 19 বছর" -> "19歳"
 */
export function formatPureJapaneseAge(val: string | null | undefined, dob?: any): string {
  if (val) {
    const str = String(val).trim();
    if (str && str !== '—') {
      const bnDigits: { [k: string]: string } = {
        '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
        '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
      };
      const normalized = str.replace(/[০-৯]/g, (d) => bnDigits[d] || d);
      const match = normalized.match(/(\d+)/);
      if (match) {
        return `${match[1]}歳`;
      }
      const stripped = stripBengali(str);
      if (stripped) return stripped;
    }
  }

  if (dob) {
    const s = String(dob).trim();
    const ymd = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/) ||
                s.match(/(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/);
    if (ymd) {
      const year = parseInt(ymd[1], 10);
      const month = parseInt(ymd[2], 10);
      const day = parseInt(ymd[3], 10);
      const today = new Date();
      let age = today.getFullYear() - year;
      const curMonth = today.getMonth() + 1;
      const curDay = today.getDate();
      if (curMonth < month || (curMonth === month && curDay < day)) {
        age--;
      }
      if (age >= 0 && age <= 120) return `${age}歳`;
    }
  }

  return '—';
}

/**
 * Formats pure Japanese savings e.g. "350万円 / ৩৫লক্ষ ইয়েন" -> "350万円"
 */
export function formatPureJapaneseSavings(val: string | null | undefined): string {
  if (!val) return '—';
  const str = String(val).trim();
  if (!str) return '—';

  if (str.includes(' / ')) {
    return str.split(' / ')[0].trim();
  }
  const clean = str.replace(/[\u0980-\u09FF]+/g, '').trim();
  return clean || str;
}

/**
 * Formats pure Japanese income e.g. "2 万円 / ইয়েন" -> "2万円"
 */
export function formatPureJapaneseIncome(val: string | null | undefined): string {
  if (!val) return '—';
  const str = String(val).trim();
  if (!str) return '—';

  if (str.includes(' / ')) {
    return str.split(' / ')[0].trim();
  }
  const clean = str.replace(/[\u0980-\u09FF]+/g, '').trim();
  return clean || str;
}

/**
 * Formats pure Japanese language proficiency: "可 / পারি" -> "可"
 */
export function formatPureJapaneseLanguage(val: string | null | undefined): string {
  if (!val) return '—';
  const str = String(val).trim();
  if (!str) return '—';

  if (str.includes('少し可') || str.includes('少し')) return '少し可';
  if (str.includes('出来ない') || str.includes('不可')) return '不可';
  if (str.includes('可') || str.includes('出来る')) return '可';

  return stripBengali(str) || '—';
}

/**
 * Resolves the appropriate text for translatable fields (Hobbies, Personality, Motivation, Future Plan, Job Description)
 * - In 'student' (Bilingual) version: Prioritizes the original Bengali text written by the student.
 * - In 'japanese' (Pure Japanese) version: Prioritizes the translated Japanese text.
 */
export function formatCvFieldValue(
  translatedVal: string | null | undefined,
  originalBnVal: string | null | undefined,
  version: 'japanese' | 'student'
): string {
  if (version === 'japanese') {
    const val = translatedVal ? String(translatedVal).trim() : '';
    if (!val) return '—';
    if (val.includes(' / ')) {
      return val.split(' / ')[0].trim() || '—';
    }
    return stripBengali(val) || val || '—';
  } else {
    // version === 'student' (Bilingual mode: Show student's Bengali text)
    const origBn = originalBnVal ? String(originalBnVal).trim() : '';
    if (origBn) {
      return origBn;
    }
    const val = translatedVal ? String(translatedVal).trim() : '';
    if (!val) return '—';
    if (val.includes(' / ')) {
      const parts = val.split(' / ');
      if (parts[1] && parts[1].trim()) {
        return parts[1].trim();
      }
    }
    return val || '—';
  }
}

/**
 * Generates the exported PDF file name based on the candidate's 氏名 (Full Name):
 * - Japanese version: strictly the 氏名 answer e.g. "MOHAMMAD RAHMAN"
 * - Student version: the 氏名 answer with "_sv" appended e.g. "MOHAMMAD RAHMAN_sv"
 */
export function getExportPdfFileName(
  name: string | null | undefined,
  version: 'japanese' | 'student'
): string {
  const rawName = (name || '').trim();
  const cleanName = rawName.replace(/[/\\?%*:|"<>]/g, '').trim() || 'CV';
  return version === 'student' ? `${cleanName}_sv` : cleanName;
}

