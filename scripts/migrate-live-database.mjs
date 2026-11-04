import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

// Automatically load environment configuration if present (.env.production, .env.local, .env)
const envCandidates = ['.env.production', '.env.local', '.env'];
for (const cand of envCandidates) {
  try {
    const envPath = path.resolve(cand);
    if (fs.existsSync(envPath)) {
      console.log(`Loaded environment variables from ${cand}`);
      const envContent = fs.readFileSync(envPath, 'utf8');
      for (const line of envContent.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const idx = trimmed.indexOf('=');
        if (idx > 0) {
          const key = trimmed.slice(0, idx).trim();
          let val = trimmed.slice(idx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  } catch {
    // ignore
  }
}

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'nikkou-software',
};

function normalizeProgram(prog) {
  if (!prog) return '';
  const lower = prog.trim().toLowerCase();
  if (lower === 'ssw' || lower.includes('特定技能')) return 'SSW';
  if (lower.includes('titp') || lower.includes('esd') || lower.includes('技能実習')) return 'TITP/ESD';
  if (lower.includes('student') || lower.includes('留学')) return 'Student';
  return prog.trim();
}

async function runLiveMigration() {
  console.log('================================================================');
  console.log(' NIKKOU SOFTWARE - LIVE DATABASE MIGRATION SCRIPT');
  console.log('================================================================');
  console.log(`Connecting to database "${dbConfig.database}" at ${dbConfig.host}:${dbConfig.port}...`);

  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);
    console.log('Connected to MySQL successfully!\n');
  } catch (err) {
    console.error('ERROR: Could not connect to database with current credentials.');
    console.error(`Details: ${err.message}`);
    console.log('\nTIP: You can pass live credentials directly on the command line:');
    console.log('  DB_HOST=localhost DB_USER=my_user DB_PASSWORD="my_password" DB_NAME=my_db node scripts/migrate-live-database.mjs\n');
    process.exit(1);
  }

  // Step 1: Ensure columns exist
  console.log('Step 1: Checking student_cvs table schema...');
  let hasProgram = false;
  let hasSubProgram = false;
  try {
    const [cols] = await conn.query('SHOW COLUMNS FROM student_cvs');
    const colNames = cols.map((c) => c.Field);

    if (!colNames.includes('program')) {
      console.log('  Adding missing column: `program` VARCHAR(100) NULL...');
      try {
        await conn.query('ALTER TABLE student_cvs ADD COLUMN program VARCHAR(100) NULL AFTER target_intake');
      } catch {
        await conn.query('ALTER TABLE student_cvs ADD COLUMN program VARCHAR(100) NULL');
      }
      hasProgram = true;
    } else {
      hasProgram = true;
    }

    if (!colNames.includes('sub_program')) {
      console.log('  Adding missing column: `sub_program` VARCHAR(150) NULL...');
      try {
        await conn.query('ALTER TABLE student_cvs ADD COLUMN sub_program VARCHAR(150) NULL AFTER program');
      } catch {
        await conn.query('ALTER TABLE student_cvs ADD COLUMN sub_program VARCHAR(150) NULL');
      }
      hasSubProgram = true;
    } else {
      hasSubProgram = true;
    }

    if (!colNames.includes('edit_token')) {
      console.log('  Adding missing column: `edit_token` VARCHAR(64) NULL...');
      try {
        await conn.query('ALTER TABLE student_cvs ADD COLUMN edit_token VARCHAR(64) NULL AFTER status');
      } catch {
        await conn.query('ALTER TABLE student_cvs ADD COLUMN edit_token VARCHAR(64) NULL');
      }
    }

    if (!colNames.includes('is_read')) {
      console.log('  Adding missing column: `is_read` TINYINT(1) DEFAULT 1...');
      try {
        await conn.query('ALTER TABLE student_cvs ADD COLUMN is_read TINYINT(1) DEFAULT 1 AFTER status');
      } catch {
        await conn.query('ALTER TABLE student_cvs ADD COLUMN is_read TINYINT(1) DEFAULT 1');
      }
    }

    console.log('  Columns verified.\n');
  } catch (err) {
    console.warn('  Schema check note:', err.message);
  }

  // Step 2: Scan and update student records
  console.log('Step 2: Scanning student_cvs records to normalize programs, update SSW Agriculture, and initialize Skill Tests...');
  const selectQuery = hasProgram && hasSubProgram
    ? 'SELECT id, student_code, full_name, program, sub_program, details_json FROM student_cvs'
    : 'SELECT id, student_code, full_name, details_json FROM student_cvs';
  const [rows] = await conn.query(selectQuery);

  let agriUpdatedCount = 0;
  let nursingSkillTestCount = 0;
  let agriSkillTestCount = 0;
  let constructionSkillTestCount = 0;
  let cleaningSkillTestCount = 0;
  let driverSkillTestCount = 0;
  let progNormalizedCount = 0;

  for (const row of rows) {
    let details = {};
    try {
      details = typeof row.details_json === 'string' ? JSON.parse(row.details_json) : (row.details_json || {});
    } catch {
      details = {};
    }

    const rawProg = (row.program || details.program || details.selectedProgram || '').trim();
    const rawSubProg = (row.sub_program || details.sub_program || details.subProgram || details.category || '').trim();

    const normProg = normalizeProgram(rawProg);
    let newSubProg = rawSubProg;
    let detailsChanged = false;
    let rowChanged = false;

    // A) Normalize Program column
    if (normProg && (row.program !== normProg || details.program !== normProg)) {
      details.program = normProg;
      detailsChanged = true;
      rowChanged = true;
      progNormalizedCount++;
    }

    // B) SSW > Agriculture migration
    // If applicant selected SSW and generic "Agriculture" without a sub-type, map to "Agriculture - General Crop Farming"
    const isSsw = normProg === 'SSW';
    const isGenericAgri =
      rawSubProg.toLowerCase() === 'agriculture' ||
      rawSubProg === '農業' ||
      rawSubProg === 'কৃষি';

    if (isSsw && isGenericAgri) {
      newSubProg = 'Agriculture - General Crop Farming';
      details.sub_program = newSubProg;
      details.subProgram = newSubProg;
      details.agriculture_type = 'General Crop Farming';
      details.agriculture_type_jp = '耕種農業';
      details.agriculture_type_bn = 'সাধারণ ফসল চাষ';
      detailsChanged = true;
      rowChanged = true;
      agriUpdatedCount++;
      console.log(`  🌾 [ID ${row.id} - ${row.student_code}] "${row.full_name}": Updated Agriculture -> "Agriculture - General Crop Farming" (耕種農業)`);
    }

    // C) SSW > Nursing / Caregiver Skill Test initialization
    const isNursing =
      isSsw &&
      (newSubProg.toLowerCase().includes('nursing') ||
        newSubProg.toLowerCase().includes('caregiver') ||
        newSubProg.includes('介護'));

    if (isNursing) {
      if (!details.skill_tests || typeof details.skill_tests !== 'object') {
        details.skill_tests = {};
      }
      if (!details.skill_tests.nursing_care_japanese_eval) {
        details.skill_tests.nursing_care_japanese_eval = '準備中 / Preparing';
        detailsChanged = true;
        rowChanged = true;
        nursingSkillTestCount++;
        console.log(`  🏥 [ID ${row.id} - ${row.student_code}] "${row.full_name}": Initialized Skill Test "介護分野特定技能日本語評価試験" -> 準備中 / Preparing`);
      }
    }

    // D) SSW > Agriculture Skill Test initialization
    const isAgriCrop =
      isSsw &&
      (newSubProg.toLowerCase().includes('crop') ||
        newSubProg.includes('耕種') ||
        newSubProg.toLowerCase() === 'agriculture - general crop farming');
    const isAgriLivestock =
      isSsw &&
      (newSubProg.toLowerCase().includes('livestock') ||
        newSubProg.includes('畜産') ||
        newSubProg.toLowerCase() === 'agriculture - general livestock farming');

    if (isAgriCrop) {
      if (!details.skill_tests || typeof details.skill_tests !== 'object') {
        details.skill_tests = {};
      }
      if (!details.skill_tests.agri_crop_skill_assessment_1) {
        details.skill_tests.agri_crop_skill_assessment_1 = '準備中 / Preparing';
        detailsChanged = true;
        rowChanged = true;
        agriSkillTestCount++;
        console.log(`  🌾 [ID ${row.id} - ${row.student_code}] "${row.full_name}": Initialized Skill Test "農業技能測定試験1号（一般耕種農業）" -> 準備中 / Preparing`);
      }
    } else if (isAgriLivestock) {
      if (!details.skill_tests || typeof details.skill_tests !== 'object') {
        details.skill_tests = {};
      }
      if (!details.skill_tests.agri_livestock_skill_assessment_1) {
        details.skill_tests.agri_livestock_skill_assessment_1 = '準備中 / Preparing';
        detailsChanged = true;
        rowChanged = true;
        agriSkillTestCount++;
        console.log(`  🐄 [ID ${row.id} - ${row.student_code}] "${row.full_name}": Initialized Skill Test "農業技能測定試験1号（一般畜産農業）" -> 準備中 / Preparing`);
      }
    }

    // E) SSW > Construction Skill Test initialization
    const isConstruction =
      isSsw &&
      (newSubProg.toLowerCase().includes('construction') || newSubProg.includes('建設'));

    if (isConstruction) {
      if (!details.skill_tests || typeof details.skill_tests !== 'object') {
        details.skill_tests = {};
      }
      if (!details.skill_tests.construction_skill_eval_1_building) {
        details.skill_tests.construction_skill_eval_1_building = '準備中 / Preparing';
        detailsChanged = true;
        rowChanged = true;
        constructionSkillTestCount++;
        console.log(`  🏗️ [ID ${row.id} - ${row.student_code}] "${row.full_name}": Initialized Skill Test "建設分野特定技能1号評価試験（建築）" -> 準備中 / Preparing`);
      }
    }

    // F) SSW > Building Cleaning Skill Test initialization
    const isCleaning =
      isSsw &&
      (newSubProg.toLowerCase().includes('cleaning') || newSubProg.includes('ビルクリーニング'));

    if (isCleaning) {
      if (!details.skill_tests || typeof details.skill_tests !== 'object') {
        details.skill_tests = {};
      }
      if (!details.skill_tests.building_cleaning_skill_eval_1) {
        details.skill_tests.building_cleaning_skill_eval_1 = '準備中 / Preparing';
        detailsChanged = true;
        rowChanged = true;
        cleaningSkillTestCount++;
        console.log(`  🧹 [ID ${row.id} - ${row.student_code}] "${row.full_name}": Initialized Skill Test "ビルクリーニング分野特定技能1号評価試験" -> 準備中 / Preparing`);
      }
    }

    // G) SSW > Driver Skill Test initialization
    const isDriver =
      isSsw &&
      (newSubProg.toLowerCase().includes('driver') ||
        newSubProg.includes('ドライバー') ||
        newSubProg.includes('自動車運送'));

    if (isDriver) {
      if (!details.skill_tests || typeof details.skill_tests !== 'object') {
        details.skill_tests = {};
      }
      if (!details.skill_tests.driver_automobile_transport_eval) {
        details.skill_tests.driver_automobile_transport_eval = '準備中 / Preparing';
        detailsChanged = true;
        rowChanged = true;
        driverSkillTestCount++;
        console.log(`  🚚 [ID ${row.id} - ${row.student_code}] "${row.full_name}": Initialized Skill Test "自動車運送業分野特定技能評価試験" -> 準備中 / Preparing`);
      }
    }

    // Ensure details_json has sub_program synced
    if (newSubProg && details.sub_program !== newSubProg) {
      details.sub_program = newSubProg;
      detailsChanged = true;
      rowChanged = true;
    }

    if (rowChanged) {
      if (hasProgram && hasSubProgram) {
        await conn.query(
          'UPDATE student_cvs SET program = ?, sub_program = ?, details_json = ? WHERE id = ?',
          [normProg || row.program || null, newSubProg || row.sub_program || null, JSON.stringify(details), row.id]
        );
      } else {
        await conn.query(
          'UPDATE student_cvs SET details_json = ? WHERE id = ?',
          [JSON.stringify(details), row.id]
        );
      }
    }
  }

  console.log('\n================================================================');
  console.log(' LIVE MIGRATION COMPLETED SUCCESSFULLY!');
  console.log('================================================================');
  console.log(`Total students scanned: ${rows.length}`);
  console.log(`Programs normalized: ${progNormalizedCount}`);
  console.log(`SSW Agriculture records upgraded to General Crop Farming: ${agriUpdatedCount}`);
  console.log(`SSW Caregiver Skill Tests initialized: ${nursingSkillTestCount}`);
  console.log(`SSW Agriculture Skill Tests initialized: ${agriSkillTestCount}`);
  console.log(`SSW Construction Skill Tests initialized: ${constructionSkillTestCount}`);
  console.log(`SSW Building Cleaning Skill Tests initialized: ${cleaningSkillTestCount}`);
  console.log(`SSW Driver Skill Tests initialized: ${driverSkillTestCount}`);
  console.log('================================================================\n');

  await conn.end();
}

runLiveMigration().catch((err) => {
  console.error('\n Migration aborted with error:', err);
  process.exit(1);
});
