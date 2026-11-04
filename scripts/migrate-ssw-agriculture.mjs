import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';

// Automatically load .env configuration if present
try {
  const envPath = path.resolve('.env');
  if (fs.existsSync(envPath)) {
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
} catch (e) {
  // ignore
}

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'nikkou-software',
};

async function migrateSswAgriculture() {
  console.log(`Connecting to MySQL database "${dbConfig.database}" at ${dbConfig.host}:${dbConfig.port}...`);
  const conn = await mysql.createConnection(dbConfig);
  console.log('Connected successfully!');

  console.log('\nScanning for existing SSW applicants with sub_program "Agriculture"...');

  const [rows] = await conn.query(
    'SELECT id, student_code, full_name, program, sub_program, details_json FROM student_cvs'
  );

  let updatedCount = 0;

  for (const row of rows) {
    let details = {};
    try {
      details = typeof row.details_json === 'string' ? JSON.parse(row.details_json) : (row.details_json || {});
    } catch {
      details = {};
    }

    const currentProgram = (row.program || details.program || '').trim();
    const currentSubProgram = (row.sub_program || details.sub_program || details.subProgram || '').trim();

    // Check if applicant is SSW and currently set to generic "Agriculture"
    const isSsw = currentProgram.toLowerCase() === 'ssw';
    const isAgri = currentSubProgram.toLowerCase() === 'agriculture';

    if (isSsw && isAgri) {
      console.log(`- Updating Applicant ID ${row.id} [${row.student_code}]: "${row.full_name}"`);
      console.log(`  Old Category: "${currentSubProgram}" -> New Category: "General crop farming" (耕種農業)`);

      // Update both top-level and details_json
      details.sub_program = 'General crop farming';
      if (details.subProgram) {
        details.subProgram = 'General crop farming';
      }

      await conn.query(
        'UPDATE student_cvs SET sub_program = ?, details_json = ? WHERE id = ?',
        ['General crop farming', JSON.stringify(details), row.id]
      );

      updatedCount++;
    }
  }

  console.log(`\n======================================================`);
  if (updatedCount > 0) {
    console.log(`SUCCESS: Updated ${updatedCount} applicant(s) to "General crop farming" (耕種農業).`);
  } else {
    console.log('No applicants with SSW > Agriculture found. All records are up to date!');
  }
  console.log(`======================================================\n`);

  await conn.end();
}

migrateSswAgriculture().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});

