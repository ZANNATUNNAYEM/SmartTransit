import { NextResponse } from 'next/server';
import { verifyAccessToken } from '@/lib/jwt';

function redirectTo(request, pathname) {
  const url = new URL(pathname, request.url);

  url.searchParams.set('next', request.nextUrl.pathname);

  return NextResponse.redirect(url);
}

function getTokenPayload(request, cookieName) {
  try {
    const token = request.cookies.get(cookieName)?.value;

    return token ? verifyAccessToken(token) : null;
  } catch {
    return null;
  }
}

export function proxy(request) {
  const pathname = request.nextUrl.pathname;

  // Allow login pages
  if (
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/admin/login'
  ) {
    return NextResponse.next();
  }

  // Protect administrator pages
  if (pathname.startsWith('/admin')) {
    const payload = getTokenPayload(
      request,
      'admin_session'
    );

    if (!payload || payload.role !== 'admin') {
      return redirectTo(request, '/admin/login');
    }

    return NextResponse.next();
  }

  // Protect passenger pages
  if (pathname.startsWith('/passenger')) {
    const payload = getTokenPayload(
      request,
      'access_token'
    );

    if (!payload) {
      return redirectTo(request, '/login');
    }

    if (payload.role !== 'passenger') {
      if (payload.role === 'driver') {
        return NextResponse.redirect(
          new URL('/driver/dashboard', request.url)
        );
      }

      return redirectTo(request, '/login');
    }

    return NextResponse.next();
  }

  // Protect driver pages
  if (pathname.startsWith('/driver')) {
    const payload = getTokenPayload(
      request,
      'access_token'
    );

    if (!payload) {
      return redirectTo(request, '/login');
    }

    if (payload.role !== 'driver') {
      if (payload.role === 'passenger') {
        return NextResponse.redirect(
          new URL('/passenger/dashboard', request.url)
        );
      }

      return redirectTo(request, '/login');
    }

    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/driver/:path*',
    '/passenger/:path*',
  ],
};