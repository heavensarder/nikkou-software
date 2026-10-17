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
  console.log('Connected to MySQL. Updating student_cvs status column...');
  await conn.query(`
    ALTER TABLE student_cvs
    MODIFY COLUMN status ENUM('draft', 'submitted', 'under_review', 'verified', 'approved', 'inactive') DEFAULT 'submitted'
  `);
  console.log('Successfully added "draft" and "inactive" to student_cvs status ENUM!');
  await conn.end();
}

run().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
