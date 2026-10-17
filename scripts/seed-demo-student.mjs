import fs from 'fs';
import path from 'path';

async function seedDemoStudent() {
  const imagePath = path.resolve('public/images/demo_student.jpg');
  const imageBuffer = fs.readFileSync(imagePath);
  const photoBase64 = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;

  const demoData = {
    full_name: 'MD TARIQUL ISLAM',
    email: 'tariqul.nikkou@example.com',
    phone: '+8801712-345678',
    gender: 'male',
    date_of_birth: '2001-08-15',
    passport_number: 'A08945231',
    jlpt_level: 'N4',
    japanese_study_hours: 320,
    target_intake: '2026年10月期',
    details: {
      photo_data: photoBase64,
      // Section 1: 基本情報 / প্রাথমিক তথ্য
      furigana: 'MD TARIQUL ISLAM',
      name_native: 'MD TARIQUL ISLAM',
      gender_label: '男性 / পুরুষ',
      marital_status: '独身 / অবিবাহিত',
      dob_japanese: '2001年  08月  15日',
      age_display: '25歳 / ২৫ বছর',
      address: 'VILL: PAIKPARA, P.O: JEWPARA, P.S: NATORE SADAR, NATORE',
      phone: '+8801712-345678',

      // Section 2: 個人情報 / ব্যক্তিগত তথ্য
      eyesight: '右1.2 - 左1.2',
      color_blindness: '無 / না',
      dominant_hand: '右手 / ডান হাত',
      body_weight: '62kg',
      height: '172cm',
      tattoo_surgery: '無 / না',
      smoking: '無 / না',
      alcohol: '無 / না',
      blood_type: 'B+型 / বি+ গ্রুপ',
      hobbies: 'サッカーをすること、日本語の勉強 / ফুটবল খেলা এবং জাপানি ভাষা অধ্যয়ন',
      personality: '真面目で責任感があり、協調性があります / দায়িত্বশীল, পরিশ্রমী এবং দলগত কাজে মনোযোগী',
      cooking: '有 / হ্যাঁ',
      group_living: '有 / হ্যাঁ',
      medical_history: '無 / না',
      personal_income: '2 万円 / ইয়েন',
      target_savings_5years: '350万円 / ৩৫লক্ষ ইয়েন',
      motivation: '日本の先進的な技術と高い労働倫理を学び、将来のキャリアを発展させたいと考えております。 / জাপানের উন্নত প্রযুক্তি ও কাজের নীতি শিখে নিজের ক্যারিয়ার উন্নত করতে চাই।',
      future_plan_after_japan: '日本で培った技術とマネジメント経験を活かし、バングラデシュで技術指導や独立起業を目指します。 / জাপানে অর্জিত কারিগরি দক্ষতা ও কাজের অভিজ্ঞতা দিয়ে দেশে এসে ব্যবসা ও নেতৃত্ব দিতে চাই।',
      japan_visa_applied_before: '無 / না',
      japan_visa_type_applied: '無 / না',

      // Section 3: 学歴 / শিক্ষাগত যোগ্যতা
      education_history: [
        {
          id: 'edu-demo-1',
          start_year_month: '2013年01月',
          end_year_month: '2018年02月',
          school_name: 'NATORE GOVERNMENT BOYS HIGH SCHOOL',
          major_subject: '科学系 / বিজ্ঞান বিভাগ',
          qualification: '中学校卒業',
        },
        {
          id: 'edu-demo-2',
          start_year_month: '2018年07月',
          end_year_month: '2020年09月',
          school_name: 'NATORE CITY COLLEGE',
          major_subject: '科学系 / বিজ্ঞান বিভাগ',
          qualification: '高校卒業',
        },
        {
          id: 'edu-demo-3',
          start_year_month: '2024年03月',
          end_year_month: '現在も',
          school_name: 'NIKKOU CENTRE',
          major_subject: 'JLPT N4 / জাপানি N4',
          qualification: '日本語/জাপানিজ',
        },
      ],

      // Section 4: その他言語 / অন্যান্য ভাষা
      language_bengali: '可 / পারি',
      language_english: '可 / পারি',

      // Section 5: 職歴 / কাজের ইতিহাস
      work_history: [
        {
          id: 'work-demo-1',
          start_year_month: '2021年01月',
          end_year_month: '2023年12月',
          company_name: 'DHAKA AUTOMOBILE ENGINEERING WORKS',
          job_description: '自動車整備、点検業務およびカスタマー対応 / অটোমোবাইল রক্ষণাবেক্ষণ ও গ্রাহক সেবা',
        },
      ],

      // Section 6: 家族 / পরিবার
      family_members: [
        {
          id: 'fam-demo-1',
          name: 'MD ABDUR RAHMAN',
          relationship: '父 / পিতা',
          age: '56歳 / ৫৬ বছর',
          occupation: '農業 / কৃষক',
        },
        {
          id: 'fam-demo-2',
          name: 'FATEMA BEGUM',
          relationship: '母 / মা',
          age: '48歳 / ৪৮ বছর',
          occupation: '専業主婦 / গৃহিণী',
        },
        {
          id: 'fam-demo-3',
          name: 'MD TANVIR ISLAM',
          relationship: '弟 / ছোট ভাই',
          age: '19歳 / ১৯ বছর',
          occupation: '学生 / শিক্ষার্থী',
        },
      ],
      relatives_in_japan: '無 / না',
      family_support_japan: '賛成 / রাজি',

      // Section 7: 評価 / মূল্যায়ন (Optional)
      evaluation: '学習意欲が非常に高く、礼儀正しい人物です。日本語の会話力も着実に向上しており、日本での就業や進学に向けて高い適性と規律を持っています。面接官の推薦に値します。 / শেখার আগ্রহ অত্যন্ত প্রবল এবং অত্যন্ত ভদ্র স্বভাবের। জাপানি ভাষায় কথোপকথন ভালো এবং জাপান যাওয়ার জন্য পূর্ণ যোগ্য।',
    },
  };

  const response = await fetch('http://localhost:3000/api/cv-maker/public-form', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(demoData),
  });

  const result = await response.json();
  console.log('SEED RESULT:', JSON.stringify(result, null, 2));
}

seedDemoStudent().catch(console.error);
