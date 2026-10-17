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
  console.log(`Connecting to MySQL database "${dbConfig.database}" for AI settings migration...`);
  const pool = mysql.createPool(dbConfig);

  try {
    const connection = await pool.getConnection();

    console.log('Creating "system_settings" table...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS system_settings (
        setting_key VARCHAR(100) PRIMARY KEY,
        setting_value TEXT NULL,
        description VARCHAR(255) NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Insert default values if not exists
    await connection.query(`
      INSERT IGNORE INTO system_settings (setting_key, setting_value, description)
      VALUES 
        ('ai_autofill_enabled', 'false', 'Enable or disable AI document autofill button'),
        ('ai_api_key', '', 'API Key for AI service'),
        ('ai_model', 'gpt-4o-mini', 'AI model used for document parsing');
    `);

    console.log('System settings table verified and initialized successfully!');
    connection.release();
    await pool.end();
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
