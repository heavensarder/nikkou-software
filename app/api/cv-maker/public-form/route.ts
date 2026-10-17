import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { ResultSetHeader } from 'mysql2';

function generateStudentCode(id: number): string {
  const year = new Date().getFullYear();
  return `NK-${year}-${String(id).padStart(4, '0')}`;
}

export async function POST(request: NextRequest) {
  try {
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

    const isDraft = body.status === 'draft';
    const finalFullName = (full_name && full_name.trim()) || (isDraft ? 'Draft Student' : 'Untitled Applicant');
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
    if (existingDraftCode) {
      const existing = await query<any[]>(
        'SELECT id FROM student_cvs WHERE student_code = ? LIMIT 1',
        [existingDraftCode]
      );
      if (existing.length > 0) {
        const studentId = existing[0].id;
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
            isDraft ? 'draft' : 'submitted',
            JSON.stringify(mergedDetails),
            studentId,
          ]
        );

        return NextResponse.json({
          success: true,
          isDraft,
          message: isDraft
            ? 'Draft updated successfully in the database!'
            : 'Your CV information has been submitted successfully!',
          student_code: existingDraftCode,
        });
      }
    }

    const tempCode = `TMP-${Date.now()}`;

    const insertResult = await query<ResultSetHeader>(
      `INSERT INTO student_cvs (
        form_id, student_code, source, full_name, email, phone, gender,
        date_of_birth, passport_number, jlpt_level, japanese_study_hours,
        target_intake, program, sub_program, status, details_json
      ) VALUES (?, ?, 'public_form', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        null,
        tempCode,
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
        isDraft ? 'draft' : 'submitted',
        JSON.stringify(mergedDetails),
      ]
    );

    const studentCode = generateStudentCode(insertResult.insertId);

    // Update actual student code
    await query('UPDATE student_cvs SET student_code = ? WHERE id = ?', [
      studentCode,
      insertResult.insertId,
    ]);

    return NextResponse.json({
      success: true,
      isDraft,
      message: isDraft
        ? 'Draft saved successfully in the database! Reference code: ' + studentCode
        : 'Your CV information has been submitted successfully!',
      student_code: studentCode,
    });
  } catch (error: any) {
    console.error('Error submitting student CV:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
