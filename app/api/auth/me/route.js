import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { verifyAccessToken } from '@/lib/jwt';
import { User } from '@/models';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const accessToken =
      request.cookies.get('access_token')?.value;

    if (!accessToken) {
      return NextResponse.json(
        {
          error: 'Authentication required',
        },
        { status: 401 }
      );
    }

    const tokenPayload = verifyAccessToken(accessToken);

    if (
      !tokenPayload ||
      !tokenPayload.userId ||
      !['passenger', 'driver'].includes(tokenPayload.role)
    ) {
      return NextResponse.json(
        {
          error: 'Invalid or expired access token',
        },
        { status: 401 }
      );
    }

    if (
      !mongoose.isObjectIdOrHexString(
        tokenPayload.userId
      )
    ) {
      return NextResponse.json(
        {
          error: 'Invalid authentication token',
        },
        { status: 401 }
      );
    }

    await connectDB();

    const user = await User.findById(
        tokenPayload.userId
    ).select(
        'name email phone role profileImageUrl status isApproved isEmailVerified emailVerifiedAt driverDetails'
    );

    if (
      !user ||
      user.role !== tokenPayload.role ||
      !['passenger', 'driver'].includes(user.role)
    ) {
      return NextResponse.json(
        {
          error: 'Authenticated user was not found',
        },
        { status: 401 }
      );
    }

    if (!user.isEmailVerified) {
      return NextResponse.json(
        {
          error:
            'Verify your email address before accessing your account.',
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

    if (
      user.role === 'driver' &&
      (
        !user.isApproved ||
        !['approved', 'active'].includes(user.status)
      )
    ) {
      return NextResponse.json(
        {
          error:
            'Your driver account is not approved or active.',
        },
        { status: 403 }
      );
    }

    const response = NextResponse.json(
      {
        success: true,
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
          driverDetails:
            user.role === 'driver'
              ? user.driverDetails
              : undefined,
        },
        redirectTo:
          user.role === 'driver'
            ? '/driver/dashboard'
            : '/passenger/dashboard',
      },
      { status: 200 }
    );

    response.headers.set('Cache-Control', 'no-store');

    return response;
  } catch (error) {
    console.error(
      'GET /api/auth/me error:',
      error
    );

    return NextResponse.json(
      {
        error: 'Internal Server Error',
      },
      { status: 500 }
    );
  }
}