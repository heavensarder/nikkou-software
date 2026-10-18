import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_NAME, verifySessionToken } from '@/lib/auth';
import { getSystemSetting } from '@/lib/settings';

export const maxDuration = 30;

const FIELD_INSTRUCTIONS: Record<string, string> = {
  hobbies: `The user input describes personal hobbies/interests (趣味). 
Translate into natural, healthy, positive Japanese resume style.
Examples:
- "বই পড়া এবং ফুটবল খেলা" -> "読書、サッカーをすること"
- "জাপানি ভাষা চর্চা করা এবং ভ্রমণ" -> "日本語の学習、旅行"
Use standard noun phrases or 〜こと.`,

  personality: `The user input describes personal character/personality strengths (長所・性格).
Translate into courteous, professional Japanese resume style emphasizing diligence, teamwork, and responsibility.
Examples:
- "আমি পরিশ্রমী এবং শান্ত" -> "真面目で忍耐強く、何事にも誠実に取り組む性格です。"
- "দলগত কাজে মনোযোগী ও মিশুক" -> "協調性があり、周囲と円滑にコミュニケーションをとることができます。"
Use natural, humble, and positive phrasing (〜です、〜性格です).`,

  motivation: `The user input describes motivation/reason for applying to Japan (志望動機).
Translate into formal, respectful Japanese business/immigration Keigo (敬語・丁寧語) standard for Japanese Rirekisho (履歴書).
It must express genuine enthusiasm, deep respect for Japanese culture/technology, and readiness to work hard.
Phrasing style:
- End sentences with polite structures like 「〜と考えております」「〜に貢献したいと存じます」「〜強い意欲を持っております」.
- Do NOT sound robotic or like a direct word-for-word dictionary translation. Use natural Japanese sentence conjunctions.`,

  future_plan: `The user input describes career goals after completing the program in Japan (将来の目標).
Translate into formal, constructive Japanese resume phrasing.
It should convey a clear, positive vision of utilizing skills learned in Japan to build a career or contribute to industry back home or globally.
Phrasing style:
- Use structures like 「日本で培った技術と実務経験を活かし、将来は〜を目指しております」「〜に貢献したいと考えております」.`,

  job_description: `The user input describes work responsibilities/job duties (業務内容・職務経歴).
Translate into concise, professional Japanese resume format suitable for the 職歴 section of a Rirekisho.
Phrasing style:
- Use standard Japanese business terminology (e.g. 担当、保守・点検、施工管理補助、接客、品質管理).
- Keep it concise, punchy, and clear.`,

  general: `Translate the input text from Bengali or English into natural, polite Japanese (丁寧語・です・ます調) suitable for official Japanese documents.`
};

export async function POST(request: NextRequest) {
  try {
    // 1. Verify AI is enabled
    const enabledRaw = await getSystemSetting('ai_autofill_enabled', 'false');
    const token = request.cookies.get(COOKIE_NAME)?.value;
    const session = token ? await verifySessionToken(token) : null;

    if (enabledRaw.toLowerCase() !== 'true') {
      return NextResponse.json(
        { success: false, message: 'AI translation is currently disabled in system settings.' },
        { status: 403 }
      );
    }

    // 2. Verify API key
    const apiKey = await getSystemSetting('ai_api_key', '');
    if (!apiKey || apiKey.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: 'AI API Key is missing. Please configure it in Dashboard Settings.' },
        { status: 400 }
      );
    }

    // 3. Get Model
    const rawModel = await getSystemSetting('ai_model', 'gpt-4o-mini');
    const model = rawModel && rawModel.trim().length > 0 ? rawModel.trim() : 'gpt-4o-mini';

    const body = await request.json();
    const { text, fieldType } = body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: 'No text provided to translate.' },
        { status: 400 }
      );
    }

    const fieldKey = (fieldType && FIELD_INSTRUCTIONS[fieldType]) ? fieldType : 'general';
    const specificGuidance = FIELD_INSTRUCTIONS[fieldKey];

    const systemPrompt = `You are a native Japanese professional editor and Japanese immigration/employment resume (履歴書・申請書) expert.
Your mission is to translate candidate input (written in Bengali, English, or imperfect Japanese) into elegant, native, high-grade Japanese appropriate for an official Japanese Rirekisho (履歴書).

SPECIFIC FIELD GUIDANCE:
${specificGuidance}

CRITICAL RULES:
1. NATIVE & POLITE: Do NOT produce robotic or unnatural literal translations. Rephrase gracefully into how a native Japanese professional writes a resume or interview application.
2. PRESERVE ACCURACY: Keep the core facts, numbers, dates, and intent from the candidate's original text.
3. OUTPUT FORMAT: Respond STRICTLY with a valid JSON object matching this schema:
{
  "translatedText": "Japanese translated text here"
}
4. NO extraneous commentary, no markdown wrappers outside JSON, no Bengali text inside the translatedText.`;

    const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey.trim()}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Candidate Text to translate:\n${text.trim()}` },
        ],
        temperature: 0.2,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      }),
    });

    if (!openAiResponse.ok) {
      const errJson = await openAiResponse.json().catch(() => ({}));
      const errMessage = errJson?.error?.message || `AI service returned HTTP ${openAiResponse.status}`;
      return NextResponse.json(
        { success: false, message: `Translation failed: ${errMessage}` },
        { status: 400 }
      );
    }

    const aiData = await openAiResponse.json();
    const rawContent = aiData?.choices?.[0]?.message?.content;

    if (!rawContent) {
      return NextResponse.json(
        { success: false, message: 'No translation returned from AI.' },
        { status: 500 }
      );
    }

    let parsedResult: any = {};
    try {
      parsedResult = JSON.parse(rawContent);
    } catch {
      return NextResponse.json(
        { success: false, message: 'Failed to parse AI response.' },
        { status: 500 }
      );
    }

    const translatedText = parsedResult.translatedText || parsedResult.translation || parsedResult.japaneseText || '';

    return NextResponse.json({
      success: true,
      translatedText: translatedText.trim(),
    });
  } catch (error: any) {
    console.error('AI translation error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Server error during translation.' },
      { status: 500 }
    );
  }
}
