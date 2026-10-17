import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_NAME, verifySessionToken } from '@/lib/auth';
import { getSystemSetting, setSystemSetting } from '@/lib/settings';

export async function GET(request: NextRequest) {
  try {
    // Check if request is from logged in admin or from public form
    const token = request.cookies.get(COOKIE_NAME)?.value;
    const session = token ? await verifySessionToken(token) : null;

    const enabledRaw = await getSystemSetting('ai_autofill_enabled', 'false');
    const enabled = enabledRaw.toLowerCase() === 'true';

    // If not admin, only return whether AI is enabled
    if (!session) {
      return NextResponse.json({
        success: true,
        enabled,
      });
    }

    const apiKey = await getSystemSetting('ai_api_key', '');
    const model = await getSystemSetting('ai_model', 'gpt-4o-mini');

    // Create a masked version of the key for safe display (e.g. sk-proj...1234)
    let maskedKey = '';
    if (apiKey) {
      if (apiKey.length > 8) {
        maskedKey = `${apiKey.slice(0, 4)}...${apiKey.slice(-4)}`;
      } else {
        maskedKey = '••••••••';
      }
    }

    return NextResponse.json({
      success: true,
      enabled,
      hasApiKey: Boolean(apiKey && apiKey.trim().length > 0),
      maskedApiKey: maskedKey,
      model,
    });
  } catch (error: any) {
    console.error('Error fetching AI settings:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to fetch AI settings' },
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
    const { enabled, apiKey, model } = body;

    if (enabled !== undefined) {
      await setSystemSetting('ai_autofill_enabled', enabled ? 'true' : 'false', 'Enable or disable AI document autofill');
    }

    // Only update apiKey if provided and not just the masked placeholder
    if (apiKey !== undefined && typeof apiKey === 'string' && !apiKey.includes('...')) {
      await setSystemSetting('ai_api_key', apiKey.trim(), 'API Key for AI service');
    }

    if (model !== undefined && typeof model === 'string') {
      await setSystemSetting('ai_model', model.trim(), 'AI model used for document parsing');
    }

    return NextResponse.json({
      success: true,
      message: 'AI settings saved successfully',
    });
  } catch (error: any) {
    console.error('Error saving AI settings:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Failed to save AI settings' },
      { status: 500 }
    );
  }
}
