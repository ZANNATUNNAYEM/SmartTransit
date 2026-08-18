import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import {
  signAccessToken,
  signRefreshToken,
} from '@/lib/jwt';
import { User } from '@/models';

export const dynamic = 'force-dynamic';

const ACCESS_TOKEN_MAX_AGE = 15 * 60;
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60;

export async function POST(request) {
  try {
    await connectDB();

    const body = await request.json();

    const normalizedEmail =
      typeof body.email === 'string'
        ? body.email.toLowerCase().trim()
        : '';

    const normalizedPassword =
      typeof body.password === 'string'
        ? body.password
        : '';

    if (!normalizedEmail || !normalizedPassword) {
      return NextResponse.json(
        {
          error: 'Email and password are required',
        },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      return NextResponse.json(
        {
          error: 'Invalid email format',
        },
        { status: 400 }
      );
    }

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return NextResponse.json(
        {
          error: 'Invalid email or password',
        },
        { status: 401 }
      );
    }

    if (!['passenger', 'driver'].includes(user.role)) {
      return NextResponse.json(
        {
          error: 'Please use the administrator login page',
        },
        { status: 403 }
      );
    }

    const isPasswordValid = await user.comparePassword(
      normalizedPassword
    );

    if (!isPasswordValid) {
      return NextResponse.json(
        {
          error: 'Invalid email or password',
        },
        { status: 401 }
      );
    }

    if (!user.isEmailVerified) {
      return NextResponse.json(
        {
          error:
            'Verify your email address before signing in.',
        },
        { status: 403 }
      );
    }

    if (user.status === 'disabled') {
      return NextResponse.json(
        {
          error:
            'Your account has been disabled. Contact the administrator.',
        },
        { status: 403 }
      );
    }

    if (user.role === 'driver') {
      if (user.status === 'rejected') {
        return NextResponse.json(
          {
            error:
              'Your driver registration was rejected. Contact the administrator.',
          },
          { status: 403 }
        );
      }

      if (user.status === 'pending') {
        return NextResponse.json(
          {
            error:
              'Your driver account is waiting for administrator approval.',
          },
          { status: 403 }
        );
      }

      if (!user.isApproved) {
        return NextResponse.json(
          {
            error:
              'Your driver account has not been approved.',
          },
          { status: 403 }
        );
      }

      if (!['approved', 'active'].includes(user.status)) {
        return NextResponse.json(
          {
            error:
              'Your driver account is not currently active.',
          },
          { status: 403 }
        );
      }
    }

    if (
      user.role === 'passenger' &&
      user.status !== 'active'
    ) {
      return NextResponse.json(
        {
          error:
            'Your passenger account is not currently active.',
        },
        { status: 403 }
      );
    }

    const tokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    const response = NextResponse.json(
      {
        success: true,
        message: 'Login successful.',
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

    response.cookies.set('access_token', accessToken, {
      ...cookieOptions,
      path: '/',
      maxAge: ACCESS_TOKEN_MAX_AGE,
    });

    response.cookies.set('refresh_token', refreshToken, {
      ...cookieOptions,
      path: '/api/auth',
      maxAge: REFRESH_TOKEN_MAX_AGE,
    });

    response.headers.set('Cache-Control', 'no-store');

    return response;
  } catch (error) {
    console.error(
      'POST /api/auth/login error:',
      error
    );

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          error: 'Invalid request body',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Internal Server Error',
      },
      { status: 500 }
    );
  }
}