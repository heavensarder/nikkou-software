import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { COOKIE_NAME, verifySessionToken } from '@/lib/auth';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { sanitizeDbDate, mapGenderToDbEnum, formatJapaneseBirthDate } from '@/lib/cv-normalizer';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    const session = token ? await verifySessionToken(token) : null;
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const rows = await query<RowDataPacket[]>(
      `SELECT s.*, f.title as form_title, f.form_code 
       FROM student_cvs s 
       LEFT JOIN cv_forms f ON s.form_id = f.id
       WHERE s.id = ? LIMIT 1`,
      [Number(id)]
    );

    if (rows.length === 0) {
      return NextResponse.json({ success: false, message: 'Student record not found.' }, { status: 404 });
    }

    const student = rows[0];
    if (typeof student.details_json === 'string') {
      try {
        student.details_json = JSON.parse(student.details_json);
      } catch {
        student.details_json = {};
      }
    }

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

    // Normalize date_of_birth to literal 'YYYY-MM-DD' string or null (never placeholder like '—')
    student.date_of_birth = sanitizeDbDate(student.date_of_birth) || sanitizeDbDate(student.details_json?.dob_japanese) || null;
    student.is_read = Boolean(student.is_read);

    return NextResponse.json({ success: true, student });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    const session = token ? await verifySessionToken(token) : null;
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
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
        status = COALESCE(?, status),
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
        status || null,
        JSON.stringify(mergedDetails),
        Number(id),
      ]
    );

    return NextResponse.json({
      success: true,
      message: isDraft ? 'Draft saved successfully!' : 'Student CV updated successfully!',
    });
  } catch (error: any) {
    console.error('Error updating student CV:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    const session = token ? await verifySessionToken(token) : null;
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { status, is_read } = body;

    if (status) {
      const allowed = ['draft', 'submitted', 'verified', 'inactive'];
      if (!allowed.includes(status)) {
        return NextResponse.json({ success: false, message: 'Invalid status' }, { status: 400 });
      }
      await query<ResultSetHeader>(
        'UPDATE student_cvs SET status = ? WHERE id = ?',
        [status, Number(id)]
      );
    }

    if (typeof is_read === 'boolean') {
      await query<ResultSetHeader>(
        'UPDATE student_cvs SET is_read = ? WHERE id = ?',
        [is_read ? 1 : 0, Number(id)]
      );
    }

    return NextResponse.json({ success: true, message: 'Updated successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    const session = token ? await verifySessionToken(token) : null;
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await query<ResultSetHeader>('DELETE FROM student_cvs WHERE id = ?', [Number(id)]);

    return NextResponse.json({ success: true, message: 'Student record deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
