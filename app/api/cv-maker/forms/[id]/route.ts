import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { COOKIE_NAME, verifySessionToken } from '@/lib/auth';
import { ResultSetHeader } from 'mysql2';

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
    const { is_active, title, description } = body;

    if (is_active !== undefined) {
      await query<ResultSetHeader>(
        'UPDATE cv_forms SET is_active = ? WHERE id = ?',
        [is_active ? 1 : 0, Number(id)]
      );
    }

    if (title) {
      await query<ResultSetHeader>(
        'UPDATE cv_forms SET title = ?, description = ? WHERE id = ?',
        [title.trim(), description || null, Number(id)]
      );
    }

    return NextResponse.json({ success: true, message: 'Form updated successfully' });
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
    await query<ResultSetHeader>('DELETE FROM cv_forms WHERE id = ?', [Number(id)]);

    return NextResponse.json({ success: true, message: 'Form deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
