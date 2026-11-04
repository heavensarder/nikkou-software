import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { COOKIE_NAME, verifySessionToken } from '@/lib/auth';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import crypto from 'crypto';
import { sanitizeDbDate, mapGenderToDbEnum, formatJapaneseBirthDate } from '@/lib/cv-normalizer';

let cachedColumns: Set<string> | null = null;

async function getStudentCvColumns(): Promise<Set<string>> {
  if (cachedColumns) {
    return cachedColumns;
  }
  try {
    const cols = await query<RowDataPacket[]>('SHOW COLUMNS FROM student_cvs');
    cachedColumns = new Set(cols.map((c: any) => c.Field));
    return cachedColumns;
  } catch (e) {
    console.warn('Could not inspect student_cvs columns:', e);
    return new Set(['id', 'student_code', 'full_name', 'phone', 'details_json', 'created_at']);
  }
}

function generateStudentCode(id: number): string {
  const year = new Date().getFullYear();
  return `NK-${year}-${String(id).padStart(4, '0')}`;
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    const session = token ? await verifySessionToken(token) : null;
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get('q') || '';
    const status = searchParams.get('status') || '';
    const formId = searchParams.get('form_id') || '';
    const program = searchParams.get('program') || '';
    const subProgram = searchParams.get('sub_program') || searchParams.get('category') || '';

    const cols = await getStudentCvColumns();
    const hasProgramCol = cols.has('program');
    const hasSubProgCol = cols.has('sub_program');
    const hasIsReadCol = cols.has('is_read');

    let sql = `
      SELECT s.*, f.title as form_title, f.form_code 
      FROM student_cvs s 
      LEFT JOIN cv_forms f ON s.form_id = f.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (searchQuery.trim()) {
      const trimmed = searchQuery.trim();
      const term = `%${trimmed}%`;
      const digitsOnly = trimmed.replace(/\D/g, '');
      const phoneTerm = digitsOnly.length >= 3 ? `%${digitsOnly}%` : null;

      if (phoneTerm) {
        sql += ` AND (
          s.full_name LIKE ?
          OR s.student_code LIKE ?
          OR s.phone LIKE ?
          OR REPLACE(REPLACE(REPLACE(s.phone, '-', ''), ' ', ''), '+', '') LIKE ?
          OR s.email LIKE ?
          OR s.passport_number LIKE ?
          OR CAST(s.details_json AS CHAR) LIKE ?
        )`;
        params.push(term, term, term, phoneTerm, term, term, term);
      } else {
        sql += ` AND (
          s.full_name LIKE ?
          OR s.student_code LIKE ?
          OR s.phone LIKE ?
          OR s.email LIKE ?
          OR s.passport_number LIKE ?
          OR CAST(s.details_json AS CHAR) LIKE ?
        )`;
        params.push(term, term, term, term, term, term);
      }
    }

    if (status) {
      if (status === 'unread') {
        if (hasIsReadCol) { sql += ` AND s.is_read = 0`; }
      } else {
        sql += ` AND s.status = ?`;
        params.push(status);
      }
    }

    if (formId) {
      sql += ` AND s.form_id = ?`;
      params.push(Number(formId));
    }

    if (program) {
      const p = program.toLowerCase();
      if (p.includes('ssw') || p.includes('特定技能')) {
        sql += ` AND (
          LOWER(s.program) LIKE '%ssw%'
          OR s.program LIKE '%特定技能%'
          OR LOWER(CAST(s.details_json AS CHAR)) LIKE '%ssw%'
          OR LOWER(CAST(s.details_json AS CHAR)) LIKE '%ssw%'
          OR CAST(s.details_json AS CHAR) LIKE '%特定技能%'
        )`;
      } else if (p.includes('titp') || p.includes('esd') || p.includes('実習')) {
        sql += ` AND (
          LOWER(s.program) LIKE '%titp%'
          OR LOWER(s.program) LIKE '%esd%'
          OR s.program LIKE '%実習%'
          OR LOWER(CAST(s.details_json AS CHAR)) LIKE '%titp%'
          OR LOWER(CAST(s.details_json AS CHAR)) LIKE '%titp%'
        )`;
      } else if (p.includes('student') || p.includes('留学')) {
        sql += ` AND (
          LOWER(s.program) LIKE '%student%'
          OR s.program LIKE '%留学%'
          OR LOWER(CAST(s.details_json AS CHAR)) LIKE '%student%'
          OR LOWER(CAST(s.details_json AS CHAR)) LIKE '%student%'
        )`;
      } else {
        sql += ` AND (
          LOWER(s.program) = LOWER(?)
          OR LOWER(CAST(s.details_json AS CHAR)) = LOWER(?)
          OR LOWER(CAST(s.details_json AS CHAR)) = LOWER(?)
        )`;
        params.push(program, program, program);
      }
    }

    if (subProgram) {
      const sub = subProgram.toLowerCase();
      if (sub === 'agriculture' || sub.includes('agriculture') || sub.includes('all')) {
        sql += ` AND (
          LOWER(s.sub_program) LIKE '%agriculture%'
          OR LOWER(s.sub_program) LIKE '%crop%'
          OR LOWER(s.sub_program) LIKE '%livestock%'
          OR LOWER(s.sub_program) LIKE '%farming%'
          OR s.sub_program LIKE '%農業%'
          OR s.sub_program LIKE '%耕種%'
          OR s.sub_program LIKE '%畜産%'
          OR LOWER(CAST(s.details_json AS CHAR)) LIKE '%agriculture%'
          OR LOWER(CAST(s.details_json AS CHAR)) LIKE '%crop%'
          OR LOWER(CAST(s.details_json AS CHAR)) LIKE '%livestock%'
          OR LOWER(CAST(s.details_json AS CHAR)) LIKE '%farming%'
          OR LOWER(CAST(s.details_json AS CHAR)) LIKE '%agriculture%'
          OR LOWER(CAST(s.details_json AS CHAR)) LIKE '%crop%'
          OR LOWER(CAST(s.details_json AS CHAR)) LIKE '%livestock%'
          OR LOWER(CAST(s.details_json AS CHAR)) LIKE '%agriculture%'
          OR LOWER(CAST(s.details_json AS CHAR)) LIKE '%crop%'
          OR LOWER(CAST(s.details_json AS CHAR)) LIKE '%livestock%'
          OR CAST(s.details_json AS CHAR) LIKE '%農業%'
          OR CAST(s.details_json AS CHAR) LIKE '%耕種%'
          OR CAST(s.details_json AS CHAR) LIKE '%畜産%'
        )`;
      } else if (sub.includes('crop') || sub.includes('耕種')) {
        sql += ` AND (
          LOWER(s.sub_program) LIKE '%crop%'
          OR s.sub_program LIKE '%耕種%'
          OR LOWER(CAST(s.details_json AS CHAR)) LIKE '%crop%'
          OR LOWER(CAST(s.details_json AS CHAR)) LIKE '%crop%'
          OR LOWER(CAST(s.details_json AS CHAR)) LIKE '%crop%'
          OR LOWER(CAST(s.details_json AS CHAR)) LIKE '%crop%'
          OR CAST(s.details_json AS CHAR) LIKE '%耕種%'
        )`;
      } else if (sub.includes('livestock') || sub.includes('畜産')) {
        sql += ` AND (
          LOWER(s.sub_program) LIKE '%livestock%'
          OR s.sub_program LIKE '%畜産%'
          OR LOWER(CAST(s.details_json AS CHAR)) LIKE '%livestock%'
          OR LOWER(CAST(s.details_json AS CHAR)) LIKE '%livestock%'
          OR LOWER(CAST(s.details_json AS CHAR)) LIKE '%livestock%'
          OR LOWER(CAST(s.details_json AS CHAR)) LIKE '%livestock%'
          OR CAST(s.details_json AS CHAR) LIKE '%畜産%'
        )`;
      } else {
        sql += ` AND (
          LOWER(s.sub_program) = LOWER(?)
          OR LOWER(CAST(s.details_json AS CHAR)) = LOWER(?)
          OR LOWER(CAST(s.details_json AS CHAR)) = LOWER(?)
          OR LOWER(CAST(s.details_json AS CHAR)) = LOWER(?)
        )`;
        params.push(subProgram, subProgram, subProgram, subProgram);
      }
    }

    sql += ` ORDER BY s.created_at DESC LIMIT 250`;

    const students = await query<RowDataPacket[]>(sql, params);

    const parsedStudents = students.map((s) => {
      try {
        let details: any = s.details_json;
        if (typeof details === 'string') {
          try {
            details = JSON.parse(details);
          } catch {
            details = {};
          }
        }
        if (!details || typeof details !== 'object' || Array.isArray(details)) {
          details = {};
        }

        if (typeof details.language_bengali === 'string' && details.language_bengali.includes('出来る')) {
          details.language_bengali = '可 / পারি';
        }
        if (typeof details.language_english === 'string' && details.language_english.includes('出来る')) {
          details.language_english = '可 / পারি';
        }

        const dobStr = sanitizeDbDate(s.date_of_birth) || sanitizeDbDate(details?.dob_japanese) || null;

        // Lightweight summary details for list view (drastically reduces payload size by 95%+)
        const summaryDetails = {
          name_native: details.name_native,
          furigana: details.furigana,
          photo_data: details.photo_data,
          gender_label: details.gender_label,
          age_display: details.age_display,
          marital_status: details.marital_status,
          address: details.address,
          phone: details.phone,
          program: details.program,
          sub_program: details.sub_program,
          skill_tests: details.skill_tests,
        };

        return {
          ...s,
          is_read: Boolean(s.is_read),
          date_of_birth: dobStr,
          program: s.program || details?.program || details?.selectedProgram || null,
          sub_program: s.sub_program || details?.sub_program || details?.subProgram || details?.category || null,
          details_json: summaryDetails,
        };
      } catch (rowErr) {
        console.error(`Error parsing student row ${s.id}:`, rowErr);
        return {
          ...s,
          is_read: Boolean(s.is_read),
          date_of_birth: sanitizeDbDate(s.date_of_birth) || null,
          program: s.program || null,
          sub_program: s.sub_program || null,
          details_json: typeof s.details_json === 'object' && s.details_json ? s.details_json : {},
        };
      }
    });

    return NextResponse.json({ success: true, students: parsedStudents });
  } catch (error: any) {
    console.error('Error fetching students:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    const session = token ? await verifySessionToken(token) : null;
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      full_name,
      email,
      phone,
      gender,
      date_of_birth,
      passport_number,
      jlpt_level,
      japanese_study_hours,
      target_intake,
      status,
      details,
    } = body;

    const isDraft = status === 'draft';
    const finalFullName = (full_name && full_name.trim()) || (isDraft ? 'Untitled Draft' : 'Untitled Student');
    const finalPhone = (phone && phone.trim()) || '—';
    const finalProgram = body.program || body.selectedProgram || details?.program || details?.selectedProgram || null;
    const finalSubProgram = body.sub_program || body.subProgram || details?.sub_program || details?.subProgram || details?.category || null;

    // Sanitize date_of_birth and gender safely to prevent MySQL DATE / ENUM truncation errors
    const finalDob = sanitizeDbDate(date_of_birth || details?.dob || details?.dob_japanese);
    const finalGender = mapGenderToDbEnum(gender);

    const mergedDetails = {
      ...(details || {}),
      program: finalProgram,
      sub_program: finalSubProgram,
    };

    if (finalDob) {
      mergedDetails.dob = finalDob;
      mergedDetails.dob_japanese = formatJapaneseBirthDate(finalDob);
    } else {
      mergedDetails.dob = null;
      mergedDetails.dob_japanese = '—';
    }

    if (mergedDetails.language_bengali) {
      if (mergedDetails.language_bengali.includes('出来る')) mergedDetails.language_bengali = '可 / পারি';
      if (mergedDetails.language_bengali.includes('少し出来る')) mergedDetails.language_bengali = '少し可 / কিছুটা পারি';
    }
    if (mergedDetails.language_english) {
      if (mergedDetails.language_english.includes('出来る')) mergedDetails.language_english = '可 / পারি';
      if (mergedDetails.language_english.includes('少し出来る')) mergedDetails.language_english = '少し可 / কিছুটা পারি';
    }

    // Check if updating an existing draft
    const existingDraftCode = body.student_code;
    const existingDraftId = body.student_id;
    if (existingDraftCode || existingDraftId) {
      const existing = await query<any[]>(
        existingDraftId
          ? 'SELECT id, student_code, status FROM student_cvs WHERE id = ? LIMIT 1'
          : 'SELECT id, student_code, status FROM student_cvs WHERE student_code = ? LIMIT 1',
        [existingDraftId || existingDraftCode]
      );
      // SAFETY GUARD: Only update if the existing student record is in 'draft' status.
      // Already submitted students must NEVER be overwritten via this endpoint.
      if (existing.length > 0 && existing[0].status === 'draft') {
        const studentId = existing[0].id;
        const code = existing[0].student_code;
        await query(
          `UPDATE student_cvs SET
            full_name = ?,
            email = ?,
            phone = ?,
            gender = ?,
            date_of_birth = ?,
            passport_number = ?,
            jlpt_level = ?,
            japanese_study_hours = ?,
            target_intake = ?,
            program = ?,
            sub_program = ?,
            status = ?,
            details_json = ?
          WHERE id = ?`,
          [
            finalFullName,
            email?.trim() || null,
            finalPhone,
            finalGender,
            finalDob,
            passport_number?.trim() || null,
            jlpt_level || 'None',
            Number(japanese_study_hours) || 0,
            target_intake?.trim() || null,
            finalProgram,
            finalSubProgram,
            status || 'draft',
            JSON.stringify(mergedDetails),
            studentId,
          ]
        );

        return NextResponse.json({
          success: true,
          message: isDraft ? 'Draft updated successfully!' : 'Student CV updated successfully!',
          student: {
            id: studentId,
            student_code: code,
            full_name: finalFullName,
          },
        });
      }
    }

    // Temporary placeholder student_code that will be updated with actual insertId
    const tempCode = `TMP-${Date.now()}`;
    const newEditToken = crypto.randomUUID();

    const insertResult = await query<ResultSetHeader>(
      `INSERT INTO student_cvs (
        form_id, student_code, edit_token, source, full_name, email, phone, gender,
        date_of_birth, passport_number, jlpt_level, japanese_study_hours,
        target_intake, program, sub_program, status, details_json
      ) VALUES (?, ?, ?, 'admin_entry', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        null,
        tempCode,
        newEditToken,
        finalFullName,
        email?.trim() || null,
        finalPhone,
        finalGender,
        finalDob,
        passport_number?.trim() || null,
        jlpt_level || 'None',
        Number(japanese_study_hours) || 0,
        target_intake?.trim() || null,
        finalProgram,
        finalSubProgram,
        status || 'submitted',
        JSON.stringify(mergedDetails),
      ]
    );

    const actualCode = generateStudentCode(insertResult.insertId);
    await query('UPDATE student_cvs SET student_code = ? WHERE id = ?', [
      actualCode,
      insertResult.insertId,
    ]);

    return NextResponse.json({
      success: true,
      message: 'Student CV created successfully!',
      student: {
        id: insertResult.insertId,
        student_code: actualCode,
        edit_token: newEditToken,
        full_name: finalFullName,
      },
    });
  } catch (error: any) {
    console.error('Error creating student CV:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
