import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { COOKIE_NAME, verifySessionToken } from '@/lib/auth';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    const session = token ? await verifySessionToken(token) : null;
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const forms = await query<RowDataPacket[]>(
      `SELECT f.*, 
              (SELECT COUNT(*) FROM student_cvs s WHERE s.form_id = f.id) as live_submission_count
       FROM cv_forms f 
       ORDER BY f.created_at DESC`
    );

    return NextResponse.json({ success: true, forms });
  } catch (error: any) {
    console.error('Error fetching CV forms:', error);
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
    const { title, description, form_code, expires_at } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ success: false, message: 'Form title is required.' }, { status: 400 });
    }

    // Generate unique code if not provided
    const baseCode = form_code
      ? form_code.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '-')
      : `nfc-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    // Check code collision
    const existing = await query<RowDataPacket[]>(
      'SELECT id FROM cv_forms WHERE form_code = ? LIMIT 1',
      [baseCode]
    );

    const finalCode = existing.length > 0 ? `${baseCode}-${Math.floor(Math.random() * 900 + 100)}` : baseCode;

    const result = await query<ResultSetHeader>(
      `INSERT INTO cv_forms (form_code, title, description, is_active, expires_at, created_by)
       VALUES (?, ?, ?, 1, ?, ?)`,
      [finalCode, title.trim(), description?.trim() || null, expires_at || null, session.id]
    );

    return NextResponse.json({
      success: true,
      message: 'Shareable form link created successfully!',
      form: {
        id: result.insertId,
        form_code: finalCode,
        title: title.trim(),
      },
    });
  } catch (error: any) {
    console.error('Error creating CV form:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
