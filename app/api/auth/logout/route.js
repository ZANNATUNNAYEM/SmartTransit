import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST() {
  const response = NextResponse.json(
    {
      success: true,
      message: 'Logout successful.',
    },
    { status: 200 }
  );

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
  };

  response.cookies.set('access_token', '', {
    ...cookieOptions,
    path: '/',
  });

  response.cookies.set('refresh_token', '', {
    ...cookieOptions,
    path: '/api/auth',
  });

  response.cookies.set('admin_session', '', {
    ...cookieOptions,
    path: '/',
  });

  response.headers.set('Cache-Control', 'no-store');

  return response;
}