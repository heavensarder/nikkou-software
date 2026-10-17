import mysql, { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';

declare global {
  // eslint-disable-next-line no-var
  var __mysqlPool: Pool | undefined;
  // eslint-disable-next-line no-var
  var __mysqlPoolConfigVersion: number | undefined;
}

const POOL_CONFIG_VERSION = 2;

if (global.__mysqlPool && global.__mysqlPoolConfigVersion !== POOL_CONFIG_VERSION) {
  try {
    global.__mysqlPool.end();
  } catch {}
  global.__mysqlPool = undefined;
}

const poolConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'nikkou-software',
  waitForConnections: true,
  connectionLimit: 10,
  maxIdle: 10,
  idleTimeout: 60000,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  dateStrings: true,
};

export const pool: Pool =
  global.__mysqlPool ||
  (global.__mysqlPool = (global.__mysqlPoolConfigVersion = POOL_CONFIG_VERSION, mysql.createPool(poolConfig)));

export async function query<T extends RowDataPacket[] | RowDataPacket[][] | ResultSetHeader>(
  sql: string,
  params?: any[]
): Promise<T> {
  const [results] = await pool.query(sql, params);
  return results as T;
}

export default pool;
