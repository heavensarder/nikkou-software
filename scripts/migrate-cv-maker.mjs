import mysql from 'mysql2/promise';

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'nikkou-software',
  waitForConnections: true,
  connectionLimit: 10,
};

async function migrate() {
  console.log(`Connecting to MySQL database "${dbConfig.database}" for CV Maker migration...`);
  const pool = mysql.createPool(dbConfig);

  try {
    const connection = await pool.getConnection();

    // 1. Create cv_forms table
    console.log('Creating "cv_forms" table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS cv_forms (
        id INT AUTO_INCREMENT PRIMARY KEY,
        form_code VARCHAR(64) NOT NULL UNIQUE,
        title VARCHAR(150) NOT NULL,
        description TEXT NULL,
        is_active TINYINT(1) DEFAULT 1,
        allow_multiple_submissions TINYINT(1) DEFAULT 1,
        expires_at DATETIME NULL,
        total_submissions INT DEFAULT 0,
        created_by INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_form_code (form_code)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. Create student_cvs table
    console.log('Creating "student_cvs" table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS student_cvs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        form_id INT NULL,
        student_code VARCHAR(32) NOT NULL UNIQUE,
        source ENUM('public_form', 'admin_entry') DEFAULT 'public_form',
        full_name VARCHAR(150) NOT NULL,
        email VARCHAR(150) NULL,
        phone VARCHAR(50) NOT NULL,
        gender ENUM('male', 'female', 'other') NULL,
        date_of_birth DATE NULL,
        passport_number VARCHAR(50) NULL,
        photo_url VARCHAR(255) NULL,
        jlpt_level VARCHAR(20) NULL,
        japanese_study_hours INT DEFAULT 0,
        target_intake VARCHAR(50) NULL,
        status ENUM('submitted', 'under_review', 'verified', 'approved') DEFAULT 'submitted',
        details_json JSON NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_student_code (student_code),
        INDEX idx_status (status),
        FOREIGN KEY (form_id) REFERENCES cv_forms(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. Seed default active form link if none exists
    const [existingForms] = await connection.query('SELECT id, form_code FROM cv_forms LIMIT 1');
    if (existingForms.length === 0) {
      console.log('Seeding default active form link "nfc-intake-2026"...');
      await connection.query(`
        INSERT INTO cv_forms (form_code, title, description, is_active, allow_multiple_submissions)
        VALUES ('nfc-intake-2026', 'General Student CV Intake Form', 'Standard intake form for Japanese Language School & Visa Applications', 1, 1)
      `);
      console.log('Default form link seeded successfully.');
    }

    console.log('CV Maker tables created and verified successfully!');
    connection.release();
    await pool.end();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
