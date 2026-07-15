import { NextResponse } from 'next/server';

export function middleware(request) {
  // Placeholder middleware: proceed with request
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/driver/:path*',
    '/passenger/:path*',
  ],
};
