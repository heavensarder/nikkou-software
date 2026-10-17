import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'nikkou-software',
};

async function run() {
  const conn = await mysql.createConnection(dbConfig);
  console.log('Connected to MySQL. Updating student_cvs language labels...');
  
  const [rows] = await conn.query('SELECT id, student_code, details_json FROM student_cvs');
  let updatedCount = 0;

  for (const row of rows) {
    let details = row.details_json;
    if (typeof details === 'string') {
      try {
        details = JSON.parse(details);
      } catch {
        continue;
      }
    }

    let modified = false;

    if (details.language_bengali && (details.language_bengali.includes('出来る') || details.language_bengali === '出来る / পারি')) {
      details.language_bengali = '可 / পারি';
      modified = true;
    }
    if (details.language_english && (details.language_english.includes('出来る') || details.language_english === '出来る / পারি')) {
      details.language_english = '可 / পারি';
      modified = true;
    }
    if (details.language_bengali && details.language_bengali.includes('少し出来る')) {
      details.language_bengali = '少し可 / কিছুটা পারি';
      modified = true;
    }
    if (details.language_english && details.language_english.includes('少し出来る')) {
      details.language_english = '少し可 / কিছুটা পারি';
      modified = true;
    }

    if (modified) {
      await conn.query('UPDATE student_cvs SET details_json = ? WHERE id = ?', [
        JSON.stringify(details),
        row.id,
      ]);
      console.log(`Updated Student #${row.id} (${row.student_code})`);
      updatedCount++;
    }
  }

  console.log(`Successfully migrated ${updatedCount} student records to use "可 / পারি"!`);
  await conn.end();
}

run().catch((err) => {
  console.error('Migration error:', err);
  process.exit(1);
});
