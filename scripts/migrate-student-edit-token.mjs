import mysql from 'mysql2/promise';
import crypto from 'crypto';

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'nikkou-software',
};

async function run() {
  const conn = await mysql.createConnection(dbConfig);
  console.log('Connected to MySQL. Running student edit token and status migration...');

  // 1. Check if edit_token column already exists
  const [cols] = await conn.query('DESCRIBE student_cvs');
  const hasEditToken = cols.some((c) => c.Field === 'edit_token');

  if (!hasEditToken) {
    console.log('Adding "edit_token" column to student_cvs...');
    await conn.query(`
      ALTER TABLE student_cvs
      ADD COLUMN edit_token VARCHAR(64) NULL UNIQUE AFTER student_code
    `);
    console.log('Column "edit_token" added successfully.');
  } else {
    console.log('Column "edit_token" already exists.');
  }

  // 2. Normalize any legacy statuses before altering ENUM
  await conn.query(`UPDATE student_cvs SET status = 'verified' WHERE status = 'approved'`);
  await conn.query(`UPDATE student_cvs SET status = 'submitted' WHERE status = 'under_review'`);

  // 3. Update status ENUM to remove approved and under_review
  console.log('Updating status ENUM to remove approved and under_review...');
  await conn.query(`
    ALTER TABLE student_cvs
    MODIFY COLUMN status ENUM('draft', 'submitted', 'verified', 'inactive') DEFAULT 'submitted'
  `);
  console.log('Status ENUM updated successfully.');

  // 4. Backfill edit_token for any existing students missing one
  const [students] = await conn.query('SELECT id, student_code, edit_token FROM student_cvs');
  console.log(`Checking ${students.length} students for edit_token backfill...`);

  let updatedCount = 0;
  for (const s of students) {
    if (!s.edit_token) {
      const token = crypto.randomUUID();
      await conn.query('UPDATE student_cvs SET edit_token = ? WHERE id = ?', [token, s.id]);
      updatedCount++;
    }
  }

  console.log(`Backfilled edit_token for ${updatedCount} students.`);
  console.log('Migration completed successfully!');

  await conn.end();
}

run().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
