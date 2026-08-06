import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '@/lib/jwt';
import { User } from '@/models';

export const dynamic = 'force-dynamic';

const ACCESS_TOKEN_MAX_AGE = 15 * 60;
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60;

function clearAuthenticationCookies(response) {
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

  response.headers.set('Cache-Control', 'no-store');

  return response;
}

export async function POST(request) {
  try {
    const refreshToken =
      request.cookies.get('refresh_token')?.value;

    if (!refreshToken) {
      return NextResponse.json(
        {
          error: 'Refresh token is required',
        },
        { status: 401 }
      );
    }

    const tokenPayload = verifyRefreshToken(refreshToken);

    if (
      !tokenPayload ||
      !tokenPayload.userId ||
      !['passenger', 'driver'].includes(tokenPayload.role)
    ) {
      const response = NextResponse.json(
        {
          error: 'Invalid or expired refresh token',
        },
        { status: 401 }
      );

      return clearAuthenticationCookies(response);
    }

    if (
      !mongoose.isObjectIdOrHexString(tokenPayload.userId)
    ) {
      const response = NextResponse.json(
        {
          error: 'Invalid authentication token',
        },
        { status: 401 }
      );

      return clearAuthenticationCookies(response);
    }

    await connectDB();

    const user = await User.findById(
        tokenPayload.userId
    ).select(
        'name email phone role profileImageUrl status isApproved isEmailVerified emailVerifiedAt'
    );

    if (
      !user ||
      user.role !== tokenPayload.role ||
      !['passenger', 'driver'].includes(user.role)
    ) {
      const response = NextResponse.json(
        {
          error: 'Authenticated user was not found',
        },
        { status: 401 }
      );

      return clearAuthenticationCookies(response);
    }

    if (!user.isEmailVerified) {
      const response = NextResponse.json(
        {
          error:
            'Verify your email address before accessing your account.',
        },
        { status: 403 }
      );

      return clearAuthenticationCookies(response);
    }

    if (user.status === 'disabled') {
      const response = NextResponse.json(
        {
          error:
            'Your account has been disabled. Contact the administrator.',
        },
        { status: 403 }
      );

      return clearAuthenticationCookies(response);
    }

    if (
      user.role === 'passenger' &&
      user.status !== 'active'
    ) {
      const response = NextResponse.json(
        {
          error:
            'Your passenger account is not currently active.',
        },
        { status: 403 }
      );

      return clearAuthenticationCookies(response);
    }

    if (
      user.role === 'driver' &&
      (
        !user.isApproved ||
        !['approved', 'active'].includes(user.status)
      )
    ) {
      const response = NextResponse.json(
        {
          error:
            'Your driver account is not approved or active.',
        },
        { status: 403 }
      );

      return clearAuthenticationCookies(response);
    }

    const newTokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const newAccessToken =
      signAccessToken(newTokenPayload);

    const newRefreshToken =
      signRefreshToken(newTokenPayload);

    const response = NextResponse.json(
      {
        success: true,
        message: 'Authentication tokens refreshed.',
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          profileImageUrl: user.profileImageUrl,
          status: user.status,
          isApproved: user.isApproved,
          isEmailVerified: user.isEmailVerified,
          emailVerifiedAt: user.emailVerifiedAt,
        },
        redirectTo:
          user.role === 'driver'
            ? '/driver/dashboard'
            : '/passenger/dashboard',
      },
      { status: 200 }
    );

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    };

    response.cookies.set('access_token', newAccessToken, {
      ...cookieOptions,
      path: '/',
      maxAge: ACCESS_TOKEN_MAX_AGE,
    });

    response.cookies.set('refresh_token', newRefreshToken, {
      ...cookieOptions,
      path: '/api/auth',
      maxAge: REFRESH_TOKEN_MAX_AGE,
    });

    response.headers.set('Cache-Control', 'no-store');

    return response;
  } catch (error) {
    console.error(
      'POST /api/auth/refresh error:',
      error
    );

    const response = NextResponse.json(
      {
        error: 'Internal Server Error',
      },
      { status: 500 }
    );

    return clearAuthenticationCookies(response);
  }
}