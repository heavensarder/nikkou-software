import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { COOKIE_NAME, verifySessionToken } from '@/lib/auth';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import crypto from 'crypto';

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
      sql += ` AND s.status = ?`;
      params.push(status);
    }

    if (formId) {
      sql += ` AND s.form_id = ?`;
      params.push(Number(formId));
    }

    if (program) {
      sql += ` AND (
        LOWER(s.program) = LOWER(?)
        OR LOWER(s.details_json->>'$.program') = LOWER(?)
      )`;
      params.push(program, program);
    }

    if (subProgram) {
      sql += ` AND (
        LOWER(s.sub_program) = LOWER(?)
        OR LOWER(s.details_json->>'$.sub_program') = LOWER(?)
        OR LOWER(s.details_json->>'$.subProgram') = LOWER(?)
      )`;
      params.push(subProgram, subProgram, subProgram);
    }

    sql += ` ORDER BY s.created_at DESC`;

    const students = await query<RowDataPacket[]>(sql, params);

    const parsedStudents = students.map((s) => {
      let details = s.details_json;
      if (typeof details === 'string') {
        try {
          details = JSON.parse(details);
        } catch {
          details = {};
        }
      }
      if (details) {
        if (details.language_bengali && details.language_bengali.includes('出来る')) {
          details.language_bengali = '可 / পারি';
        }
        if (details.language_english && details.language_english.includes('出来る')) {
          details.language_english = '可 / পারি';
        }
      }
      let dobStr = s.date_of_birth;
      if (dobStr instanceof Date) {
        const d = dobStr;
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        dobStr = `${y}-${m}-${day}`;
      } else if (dobStr && String(dobStr).includes('T')) {
        const d = new Date(dobStr);
        if (!isNaN(d.getTime())) {
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          dobStr = `${y}-${m}-${day}`;
        }
      }
      if (!dobStr && details?.dob_japanese) {
        const jpMatch = String(details.dob_japanese).match(/^(\d{4})年\s*(\d{1,2})月\s*(\d{1,2})日?/);
        if (jpMatch) {
          dobStr = `${jpMatch[1]}-${jpMatch[2].padStart(2, '0')}-${jpMatch[3].padStart(2, '0')}`;
        }
      }

      return {
        ...s,
        date_of_birth: dobStr,
        program: s.program || details?.program || null,
        sub_program: s.sub_program || details?.sub_program || null,
        details_json: details || {},
      };
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
    const finalProgram = body.program || body.selectedProgram || details?.program || null;
    const finalSubProgram = body.sub_program || body.subProgram || details?.sub_program || details?.subProgram || null;

    const mergedDetails = {
      ...(details || {}),
      program: finalProgram,
      sub_program: finalSubProgram,
    };

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
            gender || null,
            date_of_birth || null,
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
        gender || null,
        date_of_birth || null,
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
