import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'nikkou-software',
};

function normalizeCandidateDob(val) {
  if (!val) return '';
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return '';
    const year = val.getFullYear();
    const month = String(val.getMonth() + 1).padStart(2, '0');
    const day = String(val.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const s = String(val).trim();
  if (!s || s === '—' || s === '-' || s === '–' || s === 'null' || s === 'undefined' || s === 'None' || s === 'NaN-NaN-NaN') {
    return '';
  }

  const jpMatch = s.match(/^(\d{4})年\s*(\d{1,2})月\s*(\d{1,2})日?/);
  if (jpMatch) {
    const year = jpMatch[1];
    const month = jpMatch[2].padStart(2, '0');
    const day = jpMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  if (s.includes('T')) {
    const parsed = new Date(s);
    if (!isNaN(parsed.getTime())) {
      const year = parsed.getFullYear();
      const month = String(parsed.getMonth() + 1).padStart(2, '0');
      const day = String(parsed.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  const dmy = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmy) {
    const day = dmy[1].padStart(2, '0');
    const month = dmy[2].padStart(2, '0');
    const year = dmy[3];
    return `${year}-${month}-${day}`;
  }

  const ymd = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (ymd) {
    const year = ymd[1];
    const month = ymd[2].padStart(2, '0');
    const day = ymd[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const parsed = new Date(s);
  if (!isNaN(parsed.getTime())) {
    const year = parsed.getFullYear();
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const day = String(parsed.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  return '';
}

function calculateAgeFromDob(dob) {
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

function normalizeFamilyAge(val) {
  if (!val) return '';
  const s = String(val).trim();
  const bnDigits = {
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

async function run() {
  const conn = await mysql.createConnection(dbConfig);
  console.log('Connected to MySQL. Updating existing students age...');

  const [rows] = await conn.query('SELECT id, student_code, full_name, date_of_birth, details_json FROM student_cvs');
  console.log(`Found ${rows.length} students to check/update.`);

  let updatedCount = 0;

  for (const row of rows) {
    const details = typeof row.details_json === 'string'
      ? JSON.parse(row.details_json)
      : (row.details_json || {});

    const rawDob = row.date_of_birth || details.dob_japanese;
    const normalizedDob = normalizeCandidateDob(rawDob);
    const calculatedAge = calculateAgeFromDob(rawDob);

    const oldAgeDisplay = details.age_display;
    let newAgeDisplay = oldAgeDisplay;

    if (calculatedAge !== null) {
      newAgeDisplay = `${calculatedAge}歳 / ${calculatedAge} বছর`;
    } else if (oldAgeDisplay) {
      const bnDigits = {
        '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
        '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9',
      };
      const normalized = String(oldAgeDisplay).replace(/[০-৯]/g, (d) => bnDigits[d] || d);
      const m = normalized.match(/(\d+)/);
      if (m) {
        newAgeDisplay = `${m[1]}歳 / ${m[1]} বছর`;
      }
    }

    // Normalize family member ages if present
    if (Array.isArray(details.family_members)) {
      details.family_members = details.family_members.map((fm) => ({
        ...fm,
        age: normalizeFamilyAge(fm.age),
      }));
    }

    details.age_display = newAgeDisplay;

    const dobToSave = normalizedDob || null;

    await conn.query(
      'UPDATE student_cvs SET details_json = ?, date_of_birth = COALESCE(date_of_birth, ?) WHERE id = ?',
      [JSON.stringify(details), dobToSave, row.id]
    );

    console.log(`[Student ${row.id} - ${row.student_code}] ${row.full_name}:`);
    console.log(`  DOB: ${rawDob} -> Normalized: ${normalizedDob}`);
    console.log(`  Age: "${oldAgeDisplay}" -> "${newAgeDisplay}" (Japanese: "${calculatedAge ? calculatedAge + '歳' : '—'}")`);
    updatedCount++;
  }

  console.log(`\nSuccessfully updated ${updatedCount} students.`);
  await conn.end();
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
