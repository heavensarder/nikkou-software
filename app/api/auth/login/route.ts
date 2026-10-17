import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { comparePassword, signSessionToken, COOKIE_NAME, TOKEN_EXPIRATION_SECONDS } from '@/lib/auth';
import { RowDataPacket } from 'mysql2';

interface AdminRecord extends RowDataPacket {
  id: number;
  username: string;
  password_hash: string;
  full_name: string;
  email: string | null;
  role: string;
  is_active: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'Username and password are required.' },
        { status: 400 }
      );
    }

    // Direct MySQL query to find admin
    const admins = await query<AdminRecord[]>(
      'SELECT id, username, password_hash, full_name, email, role, is_active FROM admins WHERE username = ? LIMIT 1',
      [username.trim()]
    );

    if (!admins || admins.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Invalid username or password.' },
        { status: 401 }
      );
    }

    const admin = admins[0];

    if (!admin.is_active) {
      return NextResponse.json(
        { success: false, message: 'This account has been deactivated. Please contact support.' },
        { status: 403 }
      );
    }

    // Verify password with bcrypt
    const isPasswordValid = await comparePassword(password, admin.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, message: 'Invalid username or password.' },
        { status: 401 }
      );
    }

    // Update last_login timestamp in MySQL
    await query('UPDATE admins SET last_login = NOW() WHERE id = ?', [admin.id]);

    const sessionPayload = {
      id: admin.id,
      username: admin.username,
      full_name: admin.full_name,
      email: admin.email,
      role: admin.role,
    };

    const token = await signSessionToken(sessionPayload);

    const response = NextResponse.json({
      success: true,
      message: 'Login successful. Welcome back!',
      user: sessionPayload,
    });

    // Set secure HTTP-only cookie
    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: TOKEN_EXPIRATION_SECONDS,
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'A database or server error occurred during login. Please check MySQL connection.',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}
