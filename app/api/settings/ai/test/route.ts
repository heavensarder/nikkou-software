import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_NAME, verifySessionToken } from '@/lib/auth';
import { getSystemSetting } from '@/lib/settings';

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(COOKIE_NAME)?.value;
    const session = token ? await verifySessionToken(token) : null;
    if (!session) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    let apiKey = body.apiKey;

    // If apiKey is empty or masked, fetch the stored one from DB
    if (!apiKey || apiKey.includes('...')) {
      apiKey = await getSystemSetting('ai_api_key', '');
    }

    if (!apiKey || apiKey.trim().length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No API Key provided or stored to test.',
      }, { status: 400 });
    }

    // Ping OpenAI models endpoint to verify key validity
    const res = await fetch('https://api.openai.com/v1/models', {
      headers: {
        Authorization: `Bearer ${apiKey.trim()}`,
      },
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      const errMsg = errData?.error?.message || `OpenAI returned status ${res.status}`;
      return NextResponse.json({
        success: false,
        message: `API Key test failed: ${errMsg}`,
      }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Connection successful! AI API Key is valid and active.',
    });
  } catch (error: any) {
    console.error('Error testing AI key:', error);
    return NextResponse.json({
      success: false,
      message: error?.message || 'Network error while contacting AI service.',
    }, { status: 500 });
  }
}
