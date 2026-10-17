import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'nikkou-software',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

async function seedDatabase() {
  console.log(`Connecting to MySQL database "${dbConfig.database}" at ${dbConfig.host}:${dbConfig.port}...`);
  const pool = mysql.createPool(dbConfig);

  try {
    const connection = await pool.getConnection();
    console.log('Successfully connected to MySQL database.');

    // 1. Create admins table if not exists
    console.log('Ensuring "admins" table exists...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(64) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(120) NOT NULL,
        email VARCHAR(120) NULL,
        role ENUM('super_admin', 'admin', 'staff') DEFAULT 'admin',
        avatar_url VARCHAR(255) NULL,
        is_active TINYINT(1) DEFAULT 1,
        last_login DATETIME NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. Check if default admin exists
    const [rows] = await connection.query(
      'SELECT id, username FROM admins WHERE username = ? LIMIT 1',
      ['nikkou_admin']
    );

    const targetUsername = 'nikkou_admin';
    const rawPassword = 'nikkou_Center_Software_2026@#!';
    const hashedPassword = await bcrypt.hash(rawPassword, 12);

    if (rows.length === 0) {
      console.log(`Admin "${targetUsername}" not found. Inserting default admin...`);
      await connection.query(
        `INSERT INTO admins (username, password_hash, full_name, email, role, is_active)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          targetUsername,
          hashedPassword,
          'Nikkou Administrator',
          'admin@nikkoucentre.com',
          'super_admin',
          1
        ]
      );
      console.log(`Admin "${targetUsername}" successfully seeded!`);
    } else {
      console.log(`Admin "${targetUsername}" already exists. Updating password hash to guarantee match...`);
      await connection.query(
        'UPDATE admins SET password_hash = ?, is_active = 1 WHERE username = ?',
        [hashedPassword, targetUsername]
      );
      console.log(`Admin "${targetUsername}" password verified and updated.`);
    }

    // Verify row
    const [adminCheck] = await connection.query(
      'SELECT id, username, full_name, email, role, is_active, created_at FROM admins WHERE username = ?',
      [targetUsername]
    );
    console.log('Admin record in DB:', adminCheck);

    connection.release();
    await pool.end();
    console.log('Database initialization completed successfully.');
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
}

seedDatabase();
