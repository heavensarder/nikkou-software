import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'nikkou-software',
};

async function resetStudentEyesight() {
  console.log(`Connecting to database "${dbConfig.database}" to reset eyesight for all students...`);
  const conn = await mysql.createConnection(dbConfig);

  try {
    const [rows] = await conn.query('SELECT id, student_code, full_name, details_json FROM student_cvs');
    console.log(`Found ${rows.length} student records.`);

    let updatedCount = 0;
    for (const r of rows) {
      let details = typeof r.details_json === 'string' ? JSON.parse(r.details_json) : (r.details_json || {});
      const previousEyesight = details.eyesight;

      // Reset eyesight field
      details.eyesight = '';

      await conn.query('UPDATE student_cvs SET details_json = ? WHERE id = ?', [
        JSON.stringify(details),
        r.id,
      ]);

      console.log(`Reset Student ID ${r.id} (${r.student_code} - ${r.full_name}): was "${previousEyesight}" -> now ""`);
      updatedCount++;
    }

    console.log(`\nSuccessfully reset eyesight for all ${updatedCount} students.`);
  } catch (error) {
    console.error('Error resetting eyesight:', error);
    process.exit(1);
  } finally {
    await conn.end();
  }
}

resetStudentEyesight();
