import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { sanitizeDbDate, mapGenderToDbEnum, formatJapaneseBirthDate } from '@/lib/cv-normalizer';

function generateStudentCode(id: number): string {
  const year = new Date().getFullYear();
  return `NK-${year}-${String(id).padStart(4, '0')}`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ formCode: string }> }
) {
  try {
    const { formCode } = await params;

    const forms = await query<RowDataPacket[]>(
      'SELECT id, form_code, title, description, is_active, expires_at FROM cv_forms WHERE form_code = ? LIMIT 1',
      [formCode.trim()]
    );

    if (forms.length === 0) {
      return NextResponse.json(
        { success: false, message: 'This form link does not exist.' },
        { status: 404 }
      );
    }

    const form = forms[0];

    if (!form.is_active) {
      return NextResponse.json(
        { success: false, message: 'This form link is currently inactive or closed by administration.' },
        { status: 403 }
      );
    }

    if (form.expires_at && new Date(form.expires_at) < new Date()) {
      return NextResponse.json(
        { success: false, message: 'This form link has expired.' },
        { status: 410 }
      );
    }

    return NextResponse.json({
      success: true,
      form: {
        id: form.id,
        form_code: form.form_code,
        title: form.title,
        description: form.description,
      },
    });
  } catch (error: any) {
    console.error('Error fetching public form:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ formCode: string }> }
) {
  try {
    const { formCode } = await params;

    const forms = await query<RowDataPacket[]>(
      'SELECT id, is_active, expires_at FROM cv_forms WHERE form_code = ? LIMIT 1',
      [formCode.trim()]
    );

    if (forms.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Form link not found.' },
        { status: 404 }
      );
    }

    const form = forms[0];
    if (!form.is_active) {
      return NextResponse.json(
        { success: false, message: 'This application form is closed.' },
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
      details,
    } = body;

    const finalFullName = (full_name && full_name.trim()) || 'Untitled Applicant';
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

    const tempCode = `TMP-${Date.now()}`;

    const insertResult = await query<ResultSetHeader>(
      `INSERT INTO student_cvs (
        form_id, student_code, source, full_name, email, phone, gender,
        date_of_birth, passport_number, jlpt_level, japanese_study_hours,
        target_intake, program, sub_program, status, details_json
      ) VALUES (?, ?, 'public_form', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'submitted', ?)`,
      [
        form.id,
        tempCode,
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
        JSON.stringify(mergedDetails),
      ]
    );

    const studentCode = generateStudentCode(insertResult.insertId);

    // Update actual student code and increment form submission count
    await query('UPDATE student_cvs SET student_code = ? WHERE id = ?', [
      studentCode,
      insertResult.insertId,
    ]);
    await query('UPDATE cv_forms SET total_submissions = total_submissions + 1 WHERE id = ?', [
      form.id,
    ]);

    return NextResponse.json({
      success: true,
      message: 'Your CV information has been submitted successfully!',
      student_code: studentCode,
    });
  } catch (error: any) {
    console.error('Error submitting student CV:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
