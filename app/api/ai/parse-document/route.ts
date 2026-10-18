import { NextRequest, NextResponse } from 'next/server';
import zlib from 'zlib';
import { COOKIE_NAME, verifySessionToken } from '@/lib/auth';
import { getSystemSetting } from '@/lib/settings';

export const maxDuration = 60; // Allow sufficient time for AI document vision analysis

// Helper to extract plain text from .docx OpenXML files without external packages
function extractTextFromDocx(buffer: Buffer): string {
  try {
    let offset = 0;
    while (offset < buffer.length - 4) {
      if (buffer.readUInt32LE(offset) === 0x04034b50) {
        const compMethod = buffer.readUInt16LE(offset + 8);
        const compSize = buffer.readUInt32LE(offset + 18);
        const fnLen = buffer.readUInt16LE(offset + 26);
        const extraLen = buffer.readUInt16LE(offset + 28);
        const filename = buffer.toString('utf8', offset + 30, offset + 30 + fnLen);
        const dataOffset = offset + 30 + fnLen + extraLen;
        if (filename === 'word/document.xml') {
          const compressedData = buffer.slice(dataOffset, dataOffset + compSize);
          const xml = compMethod === 8 ? zlib.inflateRawSync(compressedData).toString('utf8') : compressedData.toString('utf8');
          return xml.replace(/<w:p[^>]*>/g, '\n').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        }
        offset = dataOffset + compSize;
      } else {
        offset++;
      }
    }
  } catch (err) {
    console.warn('DOCX text extraction notice:', err);
  }
  return '';
}

export async function POST(request: NextRequest) {
  try {
    // Check if AI autofill is enabled in settings
    const enabledRaw = await getSystemSetting('ai_autofill_enabled', 'false');
    if (enabledRaw.toLowerCase() !== 'true') {
      return NextResponse.json({
        success: false,
        message: 'AI Document Auto-Fill is currently disabled in Settings.',
      }, { status: 403 });
    }

    // Verify session or verify AI toggle is active
    const token = request.cookies.get(COOKIE_NAME)?.value;
    const session = token ? await verifySessionToken(token) : null;
    // If not authenticated and AI is not explicitly enabled, disallow
    if (!session && enabledRaw.toLowerCase() !== 'true') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    // Get API Key
    const apiKey = await getSystemSetting('ai_api_key', '');
    if (!apiKey || apiKey.trim().length === 0) {
      return NextResponse.json({
        success: false,
        message: 'AI API Key is missing. Please configure it in Dashboard Settings.',
      }, { status: 400 });
    }

    // Prefer gpt-4o for document OCR & multimodal quality
    const rawModel = await getSystemSetting('ai_model', 'gpt-4o');
    const model = rawModel && rawModel.trim().length > 0 ? rawModel.trim() : 'gpt-4o';

    // Parse body: fileData (base64 or text), images (array of rendered page images), fileType, fileName, userPrompt
    const body = await request.json();
    const { fileData, images, fileType, fileName, userPrompt } = body;

    if (!fileData && (!Array.isArray(images) || images.length === 0)) {
      return NextResponse.json({
        success: false,
        message: 'No document data or images provided.',
      }, { status: 400 });
    }

    // Define comprehensive System Prompt with exact CV form dropdown schema
    const systemPrompt = `You are a world-class document comprehension and biographical data extraction AI for a Japanese-Bengali recruitment company (Nikkou Software).
Your mission is to perform an exhaustive, 100% complete analysis of the attached candidate document (CV, resume, biodata, certificates, or profile) and extract all available information matching the target Japanese CV (Rirekisho) form schema.

IMPORTANT EXTRACTION PRINCIPLES:
1. EXHAUSTIVE EXTRACTION: Read every single line, table, column, header, and footnote. Do not skip any section.
2. ACCURATE VALUE MAPPING: The form uses specific dropdown option strings. Map extracted facts strictly to these exact option values:
   - gender:
     "男性 / পুরুষ" (Male)
     "女性 / মহিলা" (Female)
   - marital_status:
     "独身 / অবিবাহিত" (Single / Unmarried)
     "既婚 / বিবাহিত" (Married)
   - dominant_hand:
     "右手 / ডান হাত" (Right hand)
     "左手 / বাম হাত" (Left hand)
     "両手 / উভয় হাত" (Both hands)
   - color_blindness:
     "無 / না" (No / Normal)
     "有 / হ্যাঁ" (Yes)
   - tattoo_surgery:
     "無 / না" (None / No tattoo or major surgery)
     "有 / হ্যাঁ" (Has tattoo or surgery)
   - smoking:
     "無 / না" (No / Non-smoker)
     "有 / হ্যাঁ" (Yes / Smoker)
   - alcohol:
     "無 / না" (No / Non-drinker)
     "有 / হ্যাঁ" (Yes / Drinks)
   - blood_type:
     "A+型 / এ+ গ্রুপ" | "A-型 / এ- গ্রুপ" | "B+型 / বি+ গ্রুপ" | "B-型 / বি- গ্রুপ" |
     "O+型 / ও+ গ্রুপ" | "O-型 / ও- গ্রুপ" | "AB+型 / এবি+ গ্রুপ" | "AB-型 / এবি- গ্রুপ" |
     "不明 / জানা নেই" (Unknown)
   - cooking:
     "有 / হ্যাঁ" (Yes / Can cook)
     "無 / না" (No / Cannot cook)
   - group_living:
     "有 / হ্যাঁ" (Yes / Has experience or can live in group dormitories)
     "無 / না" (No)
   - medical_history:
     "無 / না" (No past major illness)
     "有 / হ্যাঁ" (Has medical history)
   - relatives_in_japan:
     "無 / না" (None / No relatives in Japan)
     "有 / হ্যাঁ" (Yes / Has relatives)
   - family_support_japan:
     "賛成 / রাজি" (Family supports / agrees with candidate going to Japan)
     "反対 / রাজি নয়" (Family opposes)
   - japan_visa_applied_before:
     "無 / না" (No / Never applied before)
     "有 / হ্যাঁ" (Yes / Applied before)
   - japan_visa_type_applied:
     "無 / না" | "留学 / স্টুডেন্ট ভিসা" | "技能実習 / টেকনিক্যাল ইন্টার্ন" | "特定技能 / স্পেসিফাইড স্কিল্ড" | "家族滞在 / ডিপেন্ডেন্ট" | "短期滞在 / ট্যুরিস্ট" | "その他 / অন্যান্য"
   - language_bengali:
     "可 / পারি" (Default for Bangladeshi candidates as native language)
     "少し可 / কিছুটা পারি"
     "出来ない / পারি না"
   - language_english:
     "可 / পারি" (Fluent / Good)
     "少し可 / কিছুটা পারি" (Medium / Basic / Studied at school)
     "出来ない / পারি না" (None)
   - education_history.major_subject:
     "科学系 / বিজ্ঞান বিভাগ" (Science)
     "芸術系 / মানবিক বিভাগ" (Humanities / Arts)
     "商業系 / ব্যবসায় শিক্ষা বিভাগ" (Commerce / Business Studies)
     "JLPT N5 / জাপানি N5"
     "JLPT N4 / জাপানি N4"
     "JLPT N3 / জাপানি N3"
     "JFT-Basic / জেএফটি-বেসিক"
     (Or specific major/field name if technical/vocational)
   - education_history.qualification:
     "中学校卒業 / মাধ্যমিক পাস (SSC)" (SSC / Secondary / Dakhil)
     "高校卒業 / উচ্চ মাধ্যমিক পাস (HSC)" (HSC / Higher Secondary / Alim)
     "大学卒業 / স্নাতক (Honours / Bachelor)" (Degree / Honours / B.Sc / B.A / B.Com / BBA)
     "大学院修了 / স্নাতকোত্তর (Master's)" (Master's / M.Sc / M.A / MBA)
     "日本語 / জাপানি ভাষা (JLPT / NAT)" (Japanese Language Course)
     "その他 / অন্যান্য" (Other)
   - family_members.relationship:
     "父 / পিতা" (Father)
     "母 / মা" (Mother)
     "兄 / বড় ভাই" (Elder Brother)
     "弟 / ছোট ভাই" (Younger Brother)
     "姉 / বড় বোন" (Elder Sister)
     "妹 / ছোট বোন" (Younger Sister)
     "夫 / স্বামী" (Husband)
     "妻 / স্ত্রী" (Wife)
     "配偶者 / স্বামী/স্ত্রী" (Spouse)
     "長男 / বড় ছেলে" (Son / Eldest Son)
     "長女 / বড় মেয়ে" (Daughter / Eldest Daughter)
     "子 / সন্তান" (Child)
     "祖父 / দাদা/নানা" (Grandfather)
     "祖母 / দাদী/নানী" (Grandmother)
     "その他 / অন্যান্য" (Other)
   - family_members.occupation:
     "建設業 / কনস্ট্রাকশনের কাজ করেন"
     "専業主婦 / গৃহিণী" (Housewife / Homemaker)
     "学生 / শিক্ষার্থী" (Student)
     "農業 / কৃষক" (Farmer / Agriculture)
     "会社員 / চাকরিজীবী" (Private employee / Service)
     "公務員 / সরকারি চাকরি" (Government service)
     "自営業 / ব্যবসায়ী" (Business / Merchant / Shopkeeper)
     "教員 / শিক্ষক" (Teacher / Professor)
     "医師・医療従事者 / ডাক্তার/স্বাস্থ্যকর্মী" (Doctor / Healthcare)
     "定年退職 / অবসরপ্রাপ্ত" (Retired)
     "無職 / বেকার" (Unemployed / None)
     "その他 / অন্যান্য" (Other)
   - family_members.age:
     Format as e.g. "54歳 / ৫৪ বছর", numeric string, or if deceased/late format strictly as "死亡 / মৃত".
     When age is "死亡 / মৃত", set occupation to "-".

3. SPECIAL HINTS FOR RESUMES:
   - Extract Father's Name and Mother's Name into family_members as "父 / পিতা" and "母 / মা".
   - Extract every educational degree (SSC, HSC, Bachelor, Japanese language courses) in chronological order with start_year_month and end_year_month in Japanese format "YYYY年MM月" (e.g. "2013年01月" to "2015年02月", or "現在も" for ongoing).
   - If candidate's birth date is given (e.g. 15-08-1999 or 15 August 1999), set dob to "1999-08-15" (YYYY-MM-DD) and calculate age as "26歳 / ২৬ বছর".
   - If personal details do not mention alcohol, smoking, or tattoo issues, assume standard healthy defaults ("無 / না").
   - Extract full address (Village, Post Office, Police Station / Upazila, District).

TARGET JSON SCHEMA:
{
  "full_name": string | null,
  "furigana": string | null,
  "name_native": string | null,
  "gender": "男性 / পুরুষ" | "女性 / মহিলা" | null,
  "marital_status": "独身 / অবিবাহিত" | "既婚 / বিবাহিত" | null,
  "dob": "YYYY-MM-DD" | null,
  "age": string | null,
  "address": string | null,
  "phone": string | null,
  "eyesight": "右: 1.0 左: 1.0" | "右: +0.25 左: +0.25" | "右: -0.5 左: -0.5" | string | null,
  "color_blindness": "無 / না" | "有 / হ্যাঁ" | null,
  "dominant_hand": "右手 / ডান হাত" | "左手 / বাম হাত" | "両手 / উভয় হাত" | null,
  "body_weight": string | null,
  "height": string | null,
  "tattoo_surgery": "無 / না" | "有 / হ্যাঁ" | null,
  "smoking": "無 / না" | "有 / হ্যাঁ" | null,
  "alcohol": "無 / না" | "有 / হ্যাঁ" | null,
  "blood_type": string | null,
  "hobbies": string | null,
  "personality": string | null,
  "cooking": "有 / হ্যাঁ" | "無 / না" | null,
  "medical_history": "無 / না" | "有 / হ্যাঁ" | null,
  "group_living": "有 / হ্যাঁ" | "無 / না" | null,
  "personal_income": string | null,
  "target_savings_5years": string | null,
  "motivation": string | null,
  "future_plan_after_japan": string | null,
  "japan_visa_applied_before": "無 / না" | "有 / হ্যাঁ" | null,
  "japan_visa_type_applied": string | null,
  "language_bengali": "可 / পারি" | "少し可 / কিছুটা পারি" | "出来ない / পারি না" | null,
  "language_english": "可 / পারি" | "少し可 / কিছুটা পারি" | "出来ない / পারি না" | null,
  "education_history": [
    {
      "start_year_month": string,
      "end_year_month": string,
      "school_name": string,
      "major_subject": string,
      "qualification": string
    }
  ],
  "work_history": [
    {
      "start_year_month": string,
      "end_year_month": string,
      "company_name": string,
      "job_description": string
    }
  ],
  "family_members": [
    {
      "name": string,
      "relationship": string,
      "age": string,
      "occupation": string
    }
  ],
  "relatives_in_japan": "無 / না" | "有 / হ্যাঁ" | null,
  "family_support_japan": "賛成 / রাজি" | "反対 / রাজি নয়" | null,
  "evaluation": string | null
}

RETURN ONLY PURE JSON matching the schema. No markdown wrapping or conversational reply.`;

    // Construct user content based on file type
    const userContent: any[] = [];

    let instructionText = `Please parse the attached document (File Name: ${fileName || 'document'}) and extract all available CV form data according to the schema. Make sure all sections (Education, Work History, Family Details, Address, Contact, Language, Personal) are fully populated without skipping any rows or facts.`;
    if (userPrompt && typeof userPrompt === 'string' && userPrompt.trim().length > 0) {
      instructionText += `\n\nUSER'S SPECIAL INSTRUCTIONS / PROMPT:\n${userPrompt.trim()}`;
    }

    userContent.push({
      type: 'text',
      text: instructionText,
    });

    // 1. If images are provided (e.g. from canvas rendering or photo upload), attach them for Vision OCR
    if (Array.isArray(images) && images.length > 0) {
      for (const imgUrl of images) {
        if (typeof imgUrl === 'string' && (imgUrl.startsWith('data:image/') || imgUrl.startsWith('http'))) {
          userContent.push({
            type: 'image_url',
            image_url: {
              url: imgUrl,
              detail: 'high',
            },
          });
        }
      }
    }

    // 2. ALSO attempt direct text extraction from the underlying file (Dual-pass)
    // This gives OpenAI both high-resolution layout images AND raw exact text!
    if (fileData) {
      let base64Pure = fileData;
      if (typeof fileData === 'string' && fileData.includes(',')) {
        base64Pure = fileData.split(',')[1];
      }
      const buffer = Buffer.from(base64Pure, 'base64');
      const isPdf = fileType?.includes('pdf') || fileName?.toLowerCase().endsWith('.pdf');
      const isDocx =
        fileType?.includes('word') ||
        fileType?.includes('officedocument') ||
        fileName?.toLowerCase().endsWith('.docx');
      const isImage =
        fileType?.startsWith('image/') ||
        (typeof fileData === 'string' && fileData.startsWith('data:image/'));

      if (isPdf) {
        try {
          const pdfParseModule: any = await import('pdf-parse');
          const PDFParser = pdfParseModule.PDFParse || pdfParseModule.default || pdfParseModule;
          let extractedPdfText = '';

          if (PDFParser.prototype && typeof PDFParser.prototype.getText === 'function') {
            const parser = new PDFParser({ data: buffer });
            if (typeof parser.load === 'function') await parser.load();
            const textResult = await parser.getText();
            extractedPdfText = typeof textResult === 'string' ? textResult : (textResult?.text || '');
            if (typeof parser.destroy === 'function') await parser.destroy();
          } else if (typeof PDFParser === 'function') {
            const textResult = await PDFParser(buffer);
            extractedPdfText = textResult?.text || '';
          }

          if (extractedPdfText && extractedPdfText.trim().length > 0) {
            userContent.push({
              type: 'text',
              text: `PDF Digital Text Layer (extracted directly from document):\n\n${extractedPdfText.slice(0, 20000)}`,
            });
          }
        } catch (pdfErr) {
          console.warn('PDFParse notice (continuing with visual images):', pdfErr);
        }
      } else if (isDocx) {
        const docxText = extractTextFromDocx(buffer);
        if (docxText && docxText.length > 0) {
          userContent.push({
            type: 'text',
            text: `Word Document Content (DOCX Text):\n\n${docxText.slice(0, 20000)}`,
          });
        }
      } else if (isImage && (!Array.isArray(images) || images.length === 0)) {
        // Direct image upload without client canvas
        userContent.push({
          type: 'image_url',
          image_url: {
            url: fileData.startsWith('data:') ? fileData : `data:${fileType || 'image/jpeg'};base64,${fileData}`,
            detail: 'high',
          },
        });
      } else if (!isImage && !isPdf && !isDocx) {
        // Plain text / CSV
        const textContent = buffer.toString('utf-8');
        userContent.push({
          type: 'text',
          text: `Document Content:\n\n${textContent.slice(0, 20000)}`,
        });
      }
    }

    // Call OpenAI API
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
          { role: 'user', content: userContent },
        ],
        temperature: 0.1,
        max_tokens: 4096,
        response_format: { type: 'json_object' },
      }),
    });

    if (!openAiResponse.ok) {
      const errJson = await openAiResponse.json().catch(() => ({}));
      const errMessage = errJson?.error?.message || `AI service returned error HTTP ${openAiResponse.status}`;
      return NextResponse.json({
        success: false,
        message: `AI Processing Failed: ${errMessage}`,
      }, { status: 400 });
    }

    const aiData = await openAiResponse.json();
    const rawContent = aiData?.choices?.[0]?.message?.content;

    if (!rawContent) {
      return NextResponse.json({
        success: false,
        message: 'AI did not return any content from the document.',
      }, { status: 500 });
    }

    let parsedResult: any = {};
    try {
      parsedResult = JSON.parse(rawContent);
    } catch {
      // Fallback: strip markdown formatting if any
      const cleaned = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedResult = JSON.parse(cleaned);
    }

    // Count how many fields were successfully identified
    let extractedCount = 0;
    for (const [, val] of Object.entries(parsedResult)) {
      if (val !== null && val !== undefined && val !== '') {
        if (Array.isArray(val)) {
          if (val.length > 0) extractedCount += val.length;
        } else {
          extractedCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: parsedResult,
      extractedCount,
      message: `AI successfully analyzed document and extracted ${extractedCount} fields.`,
    });
  } catch (error: any) {
    console.error('Error in AI parse-document API:', error);
    return NextResponse.json({
      success: false,
      message: error?.message || 'Internal server error during AI document parsing.',
    }, { status: 500 });
  }
}
