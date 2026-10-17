import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    if (!token || !token.trim()) {
      return NextResponse.json(
        { success: false, message: 'Invalid edit link token.' },
        { status: 400 }
      );
    }

    const rows = await query<RowDataPacket[]>(
      `SELECT s.*, f.title as form_title, f.form_code 
       FROM student_cvs s 
       LEFT JOIN cv_forms f ON s.form_id = f.id
       WHERE s.edit_token = ? LIMIT 1`,
      [token.trim()]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'This application edit link is invalid or does not exist.' },
        { status: 404 }
      );
    }

    const student = rows[0];

    // If verified, student can no longer edit
    if (student.status === 'verified') {
      return NextResponse.json(
        {
          success: false,
          locked: true,
          status: 'verified',
          student_code: student.student_code,
          full_name: student.full_name,
          date_of_birth: student.date_of_birth,
          program: student.program,
          sub_program: student.sub_program,
          message: 'This application has been verified and can no longer be edited.',
        },
        { status: 403 }
      );
    }

    let details = student.details_json;
    if (typeof details === 'string') {
      try {
        details = JSON.parse(details);
      } catch {
        details = {};
      }
    }
    student.details_json = details || {};

    student.program = student.program || student.details_json?.program || null;
    student.sub_program = student.sub_program || student.details_json?.sub_program || null;
    if (student.details_json) {
      student.details_json.program = student.program;
      student.details_json.sub_program = student.sub_program;
      if (student.details_json.language_bengali && student.details_json.language_bengali.includes('出来る')) {
        student.details_json.language_bengali = '可 / পারি';
      }
      if (student.details_json.language_english && student.details_json.language_english.includes('出来る')) {
        student.details_json.language_english = '可 / পারি';
      }
    }

    // Normalize date_of_birth to literal 'YYYY-MM-DD'
    if (student.date_of_birth) {
      if (student.date_of_birth instanceof Date) {
        const d = student.date_of_birth;
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        student.date_of_birth = `${y}-${m}-${day}`;
      } else {
        const s = String(student.date_of_birth).trim();
        if (s.includes('T')) {
          const d = new Date(s);
          if (!isNaN(d.getTime())) {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            student.date_of_birth = `${y}-${m}-${day}`;
          }
        }
      }
    }
    if (!student.date_of_birth && student.details_json?.dob_japanese) {
      const jpMatch = String(student.details_json.dob_japanese).match(/^(\d{4})年\s*(\d{1,2})月\s*(\d{1,2})日?/);
      if (jpMatch) {
        student.date_of_birth = `${jpMatch[1]}-${jpMatch[2].padStart(2, '0')}-${jpMatch[3].padStart(2, '0')}`;
      }
    }

    return NextResponse.json({ success: true, student });
  } catch (error: any) {
    console.error('Error fetching student by edit token:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    if (!token || !token.trim()) {
      return NextResponse.json(
        { success: false, message: 'Invalid edit link token.' },
        { status: 400 }
      );
    }

    const rows = await query<RowDataPacket[]>(
      'SELECT id, student_code, status FROM student_cvs WHERE edit_token = ? LIMIT 1',
      [token.trim()]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'This application edit link is invalid or does not exist.' },
        { status: 404 }
      );
    }

    const student = rows[0];

    // Check if verified - locked
    if (student.status === 'verified') {
      return NextResponse.json(
        {
          success: false,
          locked: true,
          message: 'This application has been verified and can no longer be edited.',
        },
        { status: 403 }
      );
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
      program,
      sub_program,
      details,
    } = body;

    const mergedDetails = details || {};
    const finalFullName =
      (full_name && full_name.trim()) ||
      (mergedDetails.name_native && mergedDetails.name_native.trim()) ||
      (mergedDetails.furigana && mergedDetails.furigana.trim()) ||
      'Untitled Applicant';
    const finalPhone = (phone && phone.trim()) || mergedDetails.phone || '—';
    const finalProgram = program || mergedDetails.program || null;
    const finalSubProgram = sub_program || mergedDetails.sub_program || null;

    if (mergedDetails.language_bengali) {
      if (mergedDetails.language_bengali.includes('出来る')) mergedDetails.language_bengali = '可 / পারি';
      if (mergedDetails.language_bengali.includes('少し出来る')) mergedDetails.language_bengali = '少し可 / কিছুটা পারি';
    }
    if (mergedDetails.language_english) {
      if (mergedDetails.language_english.includes('出来る')) mergedDetails.language_english = '可 / পারি';
      if (mergedDetails.language_english.includes('少し出来る')) mergedDetails.language_english = '少し可 / কিছুটা পারি';
    }

    await query<ResultSetHeader>(
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
        status = 'submitted',
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
        JSON.stringify(mergedDetails),
        student.id,
      ]
    );

    return NextResponse.json({
      success: true,
      message: 'Your CV application has been updated and resubmitted successfully!',
      student_code: student.student_code,
    });
  } catch (error: any) {
    console.error('Error updating student by edit token:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
