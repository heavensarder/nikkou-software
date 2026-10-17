import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_NAME, verifySessionToken } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(COOKIE_NAME)?.value;

  const isAuth = token ? await verifySessionToken(token) : null;

  // Protect /dashboard routes
  if (pathname.startsWith('/dashboard')) {
    if (!isAuth) {
      const loginUrl = new URL('/', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Redirect away from login page if already logged in
  if (pathname === '/') {
    if (isAuth) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/dashboard/:path*'],
};
