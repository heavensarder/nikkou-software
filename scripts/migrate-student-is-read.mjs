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
  console.log('Connected to MySQL. Running student is_read column migration...');

  // 1. Check if is_read column already exists
  const [cols] = await conn.query('DESCRIBE student_cvs');
  const hasIsRead = cols.some((c) => c.Field === 'is_read');

  if (!hasIsRead) {
    console.log('Adding "is_read" column to student_cvs...');
    await conn.query(`
      ALTER TABLE student_cvs
      ADD COLUMN is_read BOOLEAN NOT NULL DEFAULT FALSE AFTER status
    `);
    console.log('Column "is_read" added successfully.');
  } else {
    console.log('Column "is_read" already exists.');
  }

  // 2. Mark older students as read, but leave the latest application (id: 33) as unread (is_read = 0)
  // so the user immediately sees the "NEW" badge and highlight for their latest application!
  const [students] = await conn.query('SELECT id, student_code FROM student_cvs ORDER BY id DESC');
  if (students.length > 0) {
    const latestId = students[0].id;
    console.log(`Latest student ID is ${latestId} (${students[0].student_code}). Leaving as unread (is_read = 0)...`);
    
    // Mark older students as read
    await conn.query('UPDATE student_cvs SET is_read = 1 WHERE id != ?', [latestId]);
    await conn.query('UPDATE student_cvs SET is_read = 0 WHERE id = ?', [latestId]);
  }

  console.log('Migration completed successfully!');
  await conn.end();
}

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
