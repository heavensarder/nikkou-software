import { SignJWT, jwtVerify } from 'jose';
import bcrypt from 'bcryptjs';
import { AdminSession } from '@/types/admin';

const JWT_SECRET_STRING =
  process.env.JWT_SECRET || 'nikkou_secret_key_session_token_2026_tokyo_secure_admin_auth';
const JWT_SECRET = new TextEncoder().encode(JWT_SECRET_STRING);

export const COOKIE_NAME = 'nikkou_session';
export const TOKEN_EXPIRATION_SECONDS = 60 * 60 * 24 * 7; // 7 days

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function signSessionToken(payload: AdminSession): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET);
}

export async function verifySessionToken(token: string): Promise<AdminSession | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return {
      id: Number(payload.id),
      username: String(payload.username),
      full_name: String(payload.full_name),
      email: payload.email ? String(payload.email) : null,
      role: String(payload.role),
    };
  } catch {
    return null;
  }
}
