/**
 * Helper utility to normalize any incoming AI extracted text/value
 * into the exact option strings required by the CV Maker form dropdowns.
 */

export function toBengaliNumber(num: number | string): string {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num)
    .split('')
    .map((d) => {
      const idx = parseInt(d, 10);
      return isNaN(idx) ? d : bnDigits[idx] ?? d;
    })
    .join('');
}

export function normalizeGender(val: any): string {
  if (!val) return '';
  const s = String(val).toLowerCase().trim();
  if (s.includes('女') || s.includes('female') || s.includes('মহিলা') || s === 'f') {
    return '女性 / মহিলা';
  }
  if (s.includes('男') || s.includes('male') || s.includes('পুরুষ') || s === 'm') {
    return '男性 / পুরুষ';
  }
  return '';
}

export function normalizeMaritalStatus(val: any): string {
  if (!val) return '';
  const s = String(val).toLowerCase().trim();
  if (s.includes('既婚') || s.includes('married') || s.includes('বিবাহিত')) {
    return '既婚 / বিবাহিত';
  }
  if (s.includes('独身') || s.includes('single') || s.includes('unmarried') || s.includes('অবিবাহিত')) {
    return '独身 / অবিবাহিত';
  }
  return '';
}

export function normalizeYesNo(val: any, defaultNo: boolean = true): string {
  if (val === null || val === undefined || val === '') {
    return defaultNo ? '無 / না' : '';
  }
  if (typeof val === 'boolean') {
    return val ? '有 / হ্যাঁ' : '無 / না';
  }
  const s = String(val).toLowerCase().trim();
  if (
    s.includes('有') ||
    s.includes('はい') ||
    s.includes('yes') ||
    s.includes('true') ||
    s.includes('হ্যাঁ') ||
    s.includes('আছে') ||
    s.includes('পারি') ||
    s.includes('吸う') ||
    s.includes('飲む') ||
    s.includes('able') ||
    s.includes('can')
  ) {
    return '有 / হ্যাঁ';
  }
  if (
    s.includes('無') ||
    s.includes('いいえ') ||
    s.includes('no') ||
    s.includes('false') ||
    s.includes('none') ||
    s.includes('না') ||
    s.includes('নেই') ||
    s.includes('吸わない') ||
    s.includes('飲まない') ||
    s.includes('cannot') ||
    s.includes('nil')
  ) {
    return '無 / না';
  }
  return defaultNo ? '無 / না' : '';
}

export function normalizeDominantHand(val: any): string {
  if (!val) return '右手 / ডান হাত';
  const s = String(val).toLowerCase().trim();
  if (s.includes('両') || s.includes('both') || s.includes('উভয়') || s.includes('উভয়') || s.includes('ambidextrous')) {
    return '両手 / উভয় হাত';
  }
  if (s.includes('左') || s.includes('left') || s.includes('বাম')) {
    return '左手 / বাম হাত';
  }
  if (s.includes('右') || s.includes('right') || s.includes('ডান')) {
    return '右手 / ডান হাত';
  }
  return '右手 / ডান হাত'; // Default dominant hand
}

export function normalizeBloodType(val: any): string {
  if (!val) return '';
  const s = String(val).toUpperCase().trim();
  if (s.includes('AB+') || s.includes('AB POSITIVE') || s.includes('AB＋') || s.includes('এবি+')) return 'AB+型 / এবি+ গ্রুপ';
  if (s.includes('AB-') || s.includes('AB NEGATIVE') || s.includes('AB－') || s.includes('এবি-')) return 'AB-型 / এবি- গ্রুপ';
  if (s.includes('A+') || s.includes('A POSITIVE') || s.includes('A＋') || s.includes('এ+')) return 'A+型 / এ+ গ্রুপ';
  if (s.includes('A-') || s.includes('A NEGATIVE') || s.includes('A－') || s.includes('এ-')) return 'A-型 / এ- গ্রুপ';
  if (s.includes('B+') || s.includes('B POSITIVE') || s.includes('B＋') || s.includes('বি+')) return 'B+型 / বি+ গ্রুপ';
  if (s.includes('B-') || s.includes('B NEGATIVE') || s.includes('B－') || s.includes('বি-')) return 'B-型 / বি- গ্রুপ';
  if (s.includes('O+') || s.includes('O POSITIVE') || s.includes('O＋') || s.includes('ও+')) return 'O+型 / ও+ গ্রুপ';
  if (s.includes('O-') || s.includes('O NEGATIVE') || s.includes('O－') || s.includes('ও-')) return 'O-型 / ও- গ্রুপ';
  if (s.includes('AB')) return 'AB+型 / এবি+ গ্রুপ';
  if (s.includes('A')) return 'A+型 / এ+ গ্রুপ';
  if (s.includes('B')) return 'B+型 / বি+ গ্রুপ';
  if (s.includes('O')) return 'O+型 / ও+ গ্রুপ';
  if (s.includes('不明') || s.includes('UNKNOWN') || s.includes('জানা নেই')) return '不明 / জানা নেই';
  return '';
}

export function normalizeLanguageProficiency(val: any, defaultNative: boolean = false): string {
  if (!val) return defaultNative ? '可 / পারি' : '';
  const s = String(val).toLowerCase().trim();
  if (
    s.includes('none') ||
    s.includes('no') ||
    s.includes('cannot') ||
    s.includes('出来ない') ||
    s.includes('পারি না') ||
    s.includes('না') ||
    s.includes('poor')
  ) {
    return '出来ない / পারি না';
  }
  if (
    s.includes('basic') ||
    s.includes('little') ||
    s.includes('some') ||
    s.includes('beginner') ||
    s.includes('intermediate') ||
    s.includes('medium') ||
    s.includes('fair') ||
    s.includes('少し') ||
    s.includes('কিছুটা')
  ) {
    return '少し可 / কিছুটা পারি';
  }
  if (
    s.includes('native') ||
    s.includes('fluent') ||
    s.includes('good') ||
    s.includes('mother') ||
    s.includes('母国語') ||
    s.includes('ネイティブ') ||
    s.includes('可') ||
    s.includes('出来る') ||
    s.includes('পারি') ||
    s.includes('advanced') ||
    s.includes('yes') ||
    s.includes('high') ||
    s.includes('well')
  ) {
    return '可 / পারি';
  }
  return defaultNative ? '可 / পারি' : '';
}

export function formatLanguageDisplay(val: string | null | undefined): string {
  if (!val) return '—';
  const trimmed = String(val).trim();
  if (trimmed.includes('出来ない') || trimmed.includes('না')) return '出来ない / পারি না';
  if (trimmed.includes('少し') || trimmed.includes('কিছুটা')) return '少し可 / কিছুটা পারি';
  if (trimmed.includes('出来る') || trimmed.includes('可') || trimmed.includes('পারি')) return '可 / পারি';
  return trimmed;
}

export function normalizeFamilySupport(val: any): string {
  if (!val) return '賛成 / রাজি';
  const s = String(val).toLowerCase().trim();
  if (
    s.includes('反対') ||
    s.includes('disagree') ||
    s.includes('oppose') ||
    s.includes('not agree') ||
    s.includes('না') ||
    s.includes('নয়') ||
    s.includes('দ্বিমত')
  ) {
    return '反対 / রাজি নয়';
  }
  if (
    s.includes('賛成') ||
    s.includes('agree') ||
    s.includes('consent') ||
    s.includes('yes') ||
    s.includes('support') ||
    s.includes('রাজি') ||
    s.includes('একমত')
  ) {
    return '賛成 / রাজি';
  }
  return '賛成 / রাজি'; // Default positive support
}

export function normalizeJapanVisaType(val: any): string {
  if (!val) return '無 / না';
  const s = String(val).toLowerCase().trim();
  if (s.includes('無') || s.includes('none') || s.includes('না') || s.includes('no') || s.includes('never') || s.includes('nil')) {
    return '無 / না';
  }
  if (s.includes('留学') || s.includes('student') || s.includes('স্টুডেন্ট')) return '留学 / স্টুডেন্ট ভিসা';
  if (s.includes('技能実習') || s.includes('trainee') || s.includes('intern') || s.includes('টেকনিক্যাল')) return '技能実習 / টেকনিক্যাল ইন্টার্ন';
  if (s.includes('特定技能') || s.includes('specified') || s.includes('ssw') || s.includes('স্পেসিফাইড')) return '特定技能 / স্পেসিফাইড স্কিল্ড';
  if (s.includes('家族') || s.includes('dependent') || s.includes('ডিপেন্ডেন্ট')) return '家族滞在 / ডিপেন্ডেন্ট';
  if (s.includes('短期') || s.includes('tourist') || s.includes('ট্যুরিস্ট') || s.includes('visitor')) return '短期滞在 / ট্যুরিস্ট';
  if (s.includes('その他') || s.includes('other') || s.includes('অন্যান্য')) return 'その他 / অন্যান্য';
  return 'その他 / অন্যান্য';
}

export function normalizeEducationSubject(val: any): string {
  if (!val) return '';
  const s = String(val).toLowerCase().trim();
  if (s.includes('科学') || s.includes('science') || s.includes('বিজ্ঞান') || s.includes('scince')) {
    return '科学系 / বিজ্ঞান বিভাগ';
  }
  if (s.includes('芸術') || s.includes('art') || s.includes('humanities') || s.includes('মানবিক') || s.includes('arts')) {
    return '芸術系 / মানবিক বিভাগ';
  }
  if (
    s.includes('商業') ||
    s.includes('commerce') ||
    s.includes('business') ||
    s.includes('ব্যবসায়') ||
    s.includes('ব্যবসা') ||
    s.includes('comerce') ||
    s.includes('bba')
  ) {
    return '商業系 / ব্যবসায় শিক্ষা বিভাগ';
  }
  if (s.includes('n5') || s.includes('jlpt n5')) return 'JLPT N5 / জাপানি N5';
  if (s.includes('n4') || s.includes('jlpt n4')) return 'JLPT N4 / জাপানি N4';
  if (s.includes('n3') || s.includes('jlpt n3')) return 'JLPT N3 / জাপানি N3';
  if (s.includes('jft') || s.includes('basic') || s.includes('জেএফটি')) return 'JFT-Basic / জেএফটি-বেসিক';
  return String(val).trim();
}

export function normalizeQualification(val: any): string {
  if (!val) return '';
  const s = String(val).toLowerCase().trim();
  if (
    s.includes('ssc') ||
    s.includes('secondary school certificate') ||
    s.includes('dakhil') ||
    s.includes('দাখিল') ||
    s.includes('মাধ্যমিক') ||
    s.includes('10th') ||
    s.includes('matric')
  ) {
    return '中学校卒業 / মাধ্যমিক পাস (SSC)';
  }
  if (
    s.includes('hsc') ||
    s.includes('higher secondary') ||
    s.includes('alim') ||
    s.includes('আলিম') ||
    s.includes('উচ্চ মাধ্যমিক') ||
    s.includes('12th') ||
    s.includes('intermediate')
  ) {
    return '高校卒業 / উচ্চ মাধ্যমিক পাস (HSC)';
  }
  if (
    s.includes('bachelor') ||
    s.includes('honours') ||
    s.includes('honors') ||
    s.includes('degree') ||
    s.includes('bsc') ||
    s.includes('b.sc') ||
    s.includes('ba') ||
    s.includes('b.a') ||
    s.includes('bba') ||
    s.includes('b.b.a') ||
    s.includes('bcom') ||
    s.includes('b.com') ||
    s.includes('undergrad') ||
    s.includes('স্নাতক') ||
    s.includes('大学卒業')
  ) {
    return '大学卒業 / স্নাতক (Honours / Bachelor)';
  }
  if (
    s.includes('master') ||
    s.includes('msc') ||
    s.includes('m.sc') ||
    s.includes('ma') ||
    s.includes('m.a') ||
    s.includes('mba') ||
    s.includes('m.b.a') ||
    s.includes('mcom') ||
    s.includes('postgrad') ||
    s.includes('স্নাতকোত্তর') ||
    s.includes('大学院')
  ) {
    return "大学院修了 / স্নাতকোত্তর (Master's)";
  }
  if (
    s.includes('jlpt') ||
    s.includes('nat') ||
    s.includes('jft') ||
    s.includes('japanese') ||
    s.includes('জাপানি') ||
    s.includes('日本語')
  ) {
    return '日本語 / জাপানি ভাষা (JLPT / NAT)';
  }
  return 'その他 / অন্যান্য';
}

export function normalizeRelationship(val: any): string {
  if (!val) return '';
  const s = String(val).toLowerCase().trim();
  if (s.includes('父') || s.includes('father') || s.includes('dad') || s.includes('পিতা') || s.includes('বাবা') || s.includes('father\'s')) {
    return '父 / পিতা';
  }
  if (s.includes('母') || s.includes('mother') || s.includes('mom') || s.includes('মা') || s.includes('mother\'s')) {
    return '母 / মা';
  }
  if (s.includes('兄') || s.includes('elder brother') || s.includes('বড় ভাই') || s.includes('বড় ভাই')) {
    return '兄 / বড় ভাই';
  }
  if (s.includes('弟') || s.includes('younger brother') || s.includes('ছোট ভাই')) {
    return '弟 / ছোট ভাই';
  }
  if (s.includes('brother') || s.includes('ভাই')) {
    return '弟 / ছোট ভাই';
  }
  if (s.includes('姉') || s.includes('elder sister') || s.includes('বড় বোন') || s.includes('বড় বোন')) {
    return '姉 / বড় বোন';
  }
  if (s.includes('妹') || s.includes('younger sister') || s.includes('ছোট বোন')) {
    return '妹 / ছোট বোন';
  }
  if (s.includes('sister') || s.includes('বোন')) {
    return '妹 / ছোট বোন';
  }
  if (s.includes('夫') || s.includes('husband') || s.includes('স্বামী')) {
    return '夫 / স্বামী';
  }
  if (s.includes('妻') || s.includes('wife') || s.includes('স্ত্রী')) {
    return '妻 / স্ত্রী';
  }
  if (s.includes('spouse') || s.includes('配偶者')) {
    return '配偶者 / স্বামী/স্ত্রী';
  }
  if (s.includes('son') || s.includes('長男') || s.includes('ছেলে')) {
    return '長男 / বড় ছেলে';
  }
  if (s.includes('daughter') || s.includes('長女') || s.includes('মেয়ে') || s.includes('মেয়ে')) {
    return '長女 / বড় মেয়ে';
  }
  if (s.includes('child') || s.includes('子') || s.includes('সন্তান')) {
    return '子 / সন্তান';
  }
  if (s.includes('祖父') || s.includes('grandfather') || s.includes('grandpa') || s.includes('দাদা') || s.includes('নানা')) {
    return '祖父 / দাদা/নানা';
  }
  if (s.includes('祖母') || s.includes('grandmother') || s.includes('grandma') || s.includes('দাদী') || s.includes('নানী')) {
    return '祖母 / দাদী/নানী';
  }
  return 'その他 / অন্যান্য';
}

export function normalizeOccupation(val: any): string {
  if (!val) return '';
  const s = String(val).toLowerCase().trim();
  if (s.includes('主婦') || s.includes('housewife') || s.includes('homemaker') || s.includes('গৃহিণী') || s.includes('house wife')) {
    return '専業主婦 / গৃহিণী';
  }
  if (s.includes('建設') || s.includes('construction') || s.includes('builder') || s.includes('কনস্ট্রাকশন') || s.includes('mason') || s.includes('labor')) {
    return '建設業 / কনস্ট্রাকশনের কাজ করেন';
  }
  if (s.includes('学生') || s.includes('student') || s.includes('শিক্ষার্থী') || s.includes('study') || s.includes('pupil')) {
    return '学生 / শিক্ষার্থী';
  }
  if (s.includes('農業') || s.includes('farmer') || s.includes('agriculture') || s.includes('কৃষক') || s.includes('farming') || s.includes('cultivator')) {
    return '農業 / কৃষক';
  }
  if (
    s.includes('会社員') ||
    s.includes('employee') ||
    s.includes('private') ||
    s.includes('service') ||
    s.includes('job') ||
    s.includes('চাকরিজীবী') ||
    s.includes('office') ||
    s.includes('executive') ||
    s.includes('staff')
  ) {
    return '会社員 / চাকরিজীবী';
  }
  if (s.includes('公務員') || s.includes('government') || s.includes('govt') || s.includes('সরকারি')) {
    return '公務員 / সরকারি চাকরি';
  }
  if (
    s.includes('自営業') ||
    s.includes('business') ||
    s.includes('businessman') ||
    s.includes('merchant') ||
    s.includes('ব্যবসায়ী') ||
    s.includes('ব্যবসা') ||
    s.includes('shop') ||
    s.includes('store') ||
    s.includes('trader')
  ) {
    return '自営業 / ব্যবসায়ী';
  }
  if (s.includes('教員') || s.includes('teacher') || s.includes('professor') || s.includes('lecturer') || s.includes('শিক্ষক')) {
    return '教員 / শিক্ষক';
  }
  if (s.includes('医師') || s.includes('doctor') || s.includes('medical') || s.includes('nurse') || s.includes('ডাক্তার') || s.includes('physician')) {
    return '医師・医療従事者 / ডাক্তার/স্বাস্থ্যকর্মী';
  }
  if (s.includes('退職') || s.includes('retired') || s.includes('অবসরপ্রাপ্ত') || s.includes('pensioner')) {
    return '定年退職 / অবসরপ্রাপ্ত';
  }
  if (s.includes('無職') || s.includes('unemployed') || s.includes('বেকার') || s.includes('jobless') || s.includes('none')) {
    return '無職 / বেকার';
  }
  return 'その他 / অন্যান্য';
}

export function normalizeFamilyAge(val: any): string {
  if (!val) return '';
  const s = String(val).trim();
  const bnDigits: { [k: string]: string } = {
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
  };
  const normalized = s.replace(/[০-৯]/g, (d) => bnDigits[d] || d);
  const match = normalized.match(/(\d+)/);
  if (match) {
    const ageNum = parseInt(match[1], 10);
    if (ageNum >= 1 && ageNum <= 120) {
      return `${ageNum}歳 / ${ageNum} বছর`;
    }
  }
  return s;
}

export function calculateAgeFromDob(dob: any): number | null {
  if (!dob) return null;
  const isoStr = normalizeCandidateDob(dob);
  if (!isoStr) return null;
  const parts = isoStr.split('-');
  if (parts.length !== 3) return null;

  const birthYear = parseInt(parts[0], 10);
  const birthMonth = parseInt(parts[1], 10);
  const birthDay = parseInt(parts[2], 10);

  if (isNaN(birthYear) || isNaN(birthMonth) || isNaN(birthDay)) return null;

  const today = new Date();
  let age = today.getFullYear() - birthYear;
  const currentMonth = today.getMonth() + 1;
  const currentDay = today.getDate();

  if (currentMonth < birthMonth || (currentMonth === birthMonth && currentDay < birthDay)) {
    age--;
  }

  if (age >= 0 && age <= 120) {
    return age;
  }
  return null;
}

export function normalizeCandidateAge(val: any, dob?: any): string {
  if (dob) {
    const calculated = calculateAgeFromDob(dob);
    if (calculated !== null) {
      return `${calculated}歳 / ${calculated} বছর`;
    }
  }

  if (val) {
    const s = String(val).trim();
    const bnDigits: { [k: string]: string } = {
      '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
      '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
    };
    const normalized = s.replace(/[০-৯]/g, (d) => bnDigits[d] || d);
    const match = normalized.match(/(\d+)/);
    if (match) {
      const ageNum = parseInt(match[1], 10);
      if (ageNum >= 1 && ageNum <= 120) {
        return `${ageNum}歳 / ${ageNum} বছর`;
      }
    }
  }

  return String(val || '');
}

export function normalizeCandidateDob(val: any): string {
  if (!val) return '';
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return '';
    const year = val.getFullYear();
    const month = String(val.getMonth() + 1).padStart(2, '0');
    const day = String(val.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const s = String(val).trim();
  if (!s) return '';

  // 1. If Japanese format: "2003年 12月 31日" or "2003年12月31日"
  const jpMatch = s.match(/^(\d{4})年\s*(\d{1,2})月\s*(\d{1,2})日?/);
  if (jpMatch) {
    const year = jpMatch[1];
    const month = jpMatch[2].padStart(2, '0');
    const day = jpMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // 2. If ISO timestamp with time component (e.g. "2003-12-30T18:00:00.000Z"):
  // MUST parse as local Date FIRST before substring matching to avoid slicing UTC date!
  if (s.includes('T')) {
    const parsed = new Date(s);
    if (!isNaN(parsed.getTime())) {
      const year = parsed.getFullYear();
      const month = String(parsed.getMonth() + 1).padStart(2, '0');
      const day = String(parsed.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }

  // 3. Exact YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // 4. DD/MM/YYYY or DD-MM-YYYY (exact end anchored)
  const dmy = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmy) {
    const day = dmy[1].padStart(2, '0');
    const month = dmy[2].padStart(2, '0');
    const year = dmy[3];
    return `${year}-${month}-${day}`;
  }

  // 5. YYYY/MM/DD or YYYY.MM.DD (exact end anchored)
  const ymd = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (ymd) {
    const year = ymd[1];
    const month = ymd[2].padStart(2, '0');
    const day = ymd[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // 6. Standard date parse fallback (e.g. "12 Oct 1998", "October 12, 1998")
  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) {
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return s;
}

export function normalizeJapaneseYearMonth(val: any): string {
  if (!val) return '';
  const s = String(val).trim();
  if (s === '現在も' || s.toLowerCase() === 'present' || s.toLowerCase() === 'current' || s.includes('চলমান')) {
    return '現在も';
  }
  // If already in YYYY年MM月 format
  const jpMatch = s.match(/^(\d{4})年\s*(\d{1,2})月/);
  if (jpMatch) {
    return `${jpMatch[1]}年${jpMatch[2].padStart(2, '0')}月`;
  }
  // YYYY-MM or YYYY/MM or YYYY.MM
  const ymMatch = s.match(/^(\d{4})[-/.](\d{1,2})/);
  if (ymMatch) {
    return `${ymMatch[1]}年${ymMatch[2].padStart(2, '0')}月`;
  }
  // Only YYYY
  const yOnly = s.match(/^(\d{4})$/);
  if (yOnly) {
    return `${yOnly[1]}年01月`;
  }
  // Month Name YYYY (e.g., "Jan 2018", "January 2018")
  const months: { [k: string]: string } = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
  };
  const mNameMatch = s.match(/([a-zA-Z]+)[\s,/-]+(\d{4})/);
  if (mNameMatch) {
    const mPrefix = mNameMatch[1].toLowerCase().slice(0, 3);
    const mm = months[mPrefix] || '01';
    return `${mNameMatch[2]}年${mm}月`;
  }
  return s;
}

export function formatJapaneseBirthDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const str = String(dateStr).trim();
  if (!str) return '—';

  // 1. If already Japanese format (e.g. 2002年 06月 10日 or 2002年06月10日)
  const jp = str.match(/^(\d{4})年\s*(\d{1,2})月\s*(\d{1,2})日?/);
  if (jp) {
    return `${jp[1]}年  ${jp[2].padStart(2, '0')}月  ${jp[3].padStart(2, '0')}日`;
  }

  // 2. If ISO timestamp with time component (e.g. 2002-06-09T18:00:00.000Z)
  if (str.includes('T')) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}年  ${month}月  ${day}日`;
    }
  }

  // 3. YYYY-MM-DD or YYYY/MM/DD or YYYY.MM.DD
  const ymd = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (ymd) {
    const year = ymd[1];
    const month = ymd[2].padStart(2, '0');
    const day = ymd[3].padStart(2, '0');
    return `${year}年  ${month}月  ${day}日`;
  }

  // 4. DD-MM-YYYY or DD/MM/YYYY or DD.MM.YYYY
  const dmy = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  if (dmy) {
    const day = dmy[1].padStart(2, '0');
    const month = dmy[2].padStart(2, '0');
    const year = dmy[3];
    return `${year}年  ${month}月  ${day}日`;
  }

  // 5. General fallback
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}年  ${month}月  ${day}日`;
  }

  return str;
}

export function formatReadableBirthDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  const str = String(dateStr).trim();
  if (!str) return '';

  let year = '';
  let month = '';
  let day = '';

  const jp = str.match(/^(\d{4})年\s*(\d{1,2})月\s*(\d{1,2})日?/);
  if (jp) {
    year = jp[1];
    month = jp[2].padStart(2, '0');
    day = jp[3].padStart(2, '0');
  } else if (str.includes('T')) {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      year = String(d.getFullYear());
      month = String(d.getMonth() + 1).padStart(2, '0');
      day = String(d.getDate()).padStart(2, '0');
    }
  } else {
    const ymd = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
    if (ymd) {
      year = ymd[1];
      month = ymd[2].padStart(2, '0');
      day = ymd[3].padStart(2, '0');
    } else {
      const dmy = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
      if (dmy) {
        day = dmy[1].padStart(2, '0');
        month = dmy[2].padStart(2, '0');
        year = dmy[3];
      }
    }
  }

  if (!year || !month || !day) return '';

  const monthIdx = parseInt(month, 10) - 1;
  const enMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const bnMonths = ['জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন', 'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'];
  const enM = enMonths[monthIdx] || month;
  const bnM = bnMonths[monthIdx] || month;
  const dayNum = parseInt(day, 10);

  return `${dayNum} ${enM} ${year} (${toBengaliNumber(dayNum)} ${bnM} ${toBengaliNumber(year)})`;
}
