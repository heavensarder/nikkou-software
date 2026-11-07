import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_NAME, verifySessionToken } from '@/lib/auth';
import { getSystemSettings, setSystemSetting } from '@/lib/settings';

export async function GET() {
  try {
    const settings = await getSystemSettings([
      'public_form_lock_enabled',
      'public_form_fixed_program',
      'public_form_fixed_sub_program',
    ]);

    const lockEnabled = (settings.public_form_lock_enabled || 'false').toLowerCase() === 'true';
    const fixedProgram = settings.public_form_fixed_program || '';
    const fixedSubProgram = settings.public_form_fixed_sub_program || '';

    return NextResponse.json({
      success: true,
      lockEnabled,
      fixedProgram,
      fixedSubProgram,
    });
  } catch (error: any) {
    console.error('Error fetching public form settings:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to fetch public form settings' },
      { status: 500 }
    );
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
    const lockEnabled = Boolean(body.lockEnabled);
    const fixedProgram = typeof body.fixedProgram === 'string' ? body.fixedProgram.trim() : '';
    const fixedSubProgram = typeof body.fixedSubProgram === 'string' ? body.fixedSubProgram.trim() : '';

    if (lockEnabled && !fixedProgram) {
      return NextResponse.json(
        {
          success: false,
          message: 'Please select a Program (e.g. SSW, TITP/ESD, or Student) to lock the public form.',
        },
        { status: 400 }
      );
    }

    await setSystemSetting(
      'public_form_lock_enabled',
      lockEnabled ? 'true' : 'false',
      'Whether the public CV form (/cv-form) has a fixed/locked program & category'
    );
    await setSystemSetting(
      'public_form_fixed_program',
      fixedProgram,
      'Fixed program ID for the public CV form (e.g. SSW, TITP/ESD, Student)'
    );
    await setSystemSetting(
      'public_form_fixed_sub_program',
      fixedSubProgram,
      'Fixed sub-program / category ID for the public CV form (e.g. Agriculture - General Livestock Farming)'
    );

    return NextResponse.json({
      success: true,
      message: lockEnabled
        ? 'Public CV form category lock saved and activated!'
        : 'Public CV form category lock disabled (all categories open).',
      lockEnabled,
      fixedProgram,
      fixedSubProgram,
    });
  } catch (error: any) {
    console.error('Error saving public form settings:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to save public form settings' },
      { status: 500 }
    );
  }
}

