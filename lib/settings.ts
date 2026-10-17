import { query } from './db';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface SettingRow extends RowDataPacket {
  setting_key: string;
  setting_value: string | null;
  description: string | null;
  updated_at: string;
}

export async function getSystemSetting(key: string, defaultValue: string = ''): Promise<string> {
  try {
    const rows = await query<SettingRow[]>(
      'SELECT setting_value FROM system_settings WHERE setting_key = ? LIMIT 1',
      [key]
    );
    if (rows && rows.length > 0 && rows[0].setting_value !== null) {
      return rows[0].setting_value;
    }
    return defaultValue;
  } catch (error) {
    console.error(`Error reading system setting "${key}":`, error);
    return defaultValue;
  }
}

export async function getSystemSettings(keys?: string[]): Promise<Record<string, string>> {
  try {
    let sql = 'SELECT setting_key, setting_value FROM system_settings';
    const params: any[] = [];
    if (keys && keys.length > 0) {
      sql += ` WHERE setting_key IN (${keys.map(() => '?').join(', ')})`;
      params.push(...keys);
    }
    const rows = await query<SettingRow[]>(sql, params);
    const result: Record<string, string> = {};
    for (const r of rows) {
      result[r.setting_key] = r.setting_value || '';
    }
    return result;
  } catch (error) {
    console.error('Error reading system settings:', error);
    return {};
  }
}

export async function setSystemSetting(key: string, value: string, description?: string): Promise<void> {
  try {
    await query<ResultSetHeader>(
      `INSERT INTO system_settings (setting_key, setting_value, description)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = CURRENT_TIMESTAMP`,
      [key, value, description || null]
    );
  } catch (error) {
    console.error(`Error writing system setting "${key}":`, error);
    throw error;
  }
}

export async function isAiAutofillEnabled(): Promise<boolean> {
  const val = await getSystemSetting('ai_autofill_enabled', 'false');
  return val.toLowerCase() === 'true';
}
