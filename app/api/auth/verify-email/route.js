import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const body = await request.json();

    const verificationToken =
      typeof body.token === 'string'
        ? body.token.trim()
        : '';

    if (!verificationToken) {
      return NextResponse.json(
        {
          error: 'Email verification token is required',
        },
        { status: 400 }
      );
    }

    // Registration creates a 32-byte token represented by 64 hex characters
    if (!/^[a-f0-9]{64}$/i.test(verificationToken)) {
      return NextResponse.json(
        {
          error: 'Invalid email verification token',
        },
        { status: 400 }
      );
    }

    const verificationTokenHash = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');

    await connectDB();

    const user = await User.findOneAndUpdate(
      {
        emailVerificationTokenHash:
          verificationTokenHash,
        emailVerificationExpiresAt: {
          $gt: new Date(),
        },
        isEmailVerified: false,
      },
      {
        $set: {
          isEmailVerified: true,
          emailVerifiedAt: new Date(),
        },
        $unset: {
          emailVerificationTokenHash: 1,
          emailVerificationExpiresAt: 1,
        },
      },
      {
        new: true,
        runValidators: true,
      }
    ).select(
      'name email phone role status isApproved isEmailVerified emailVerifiedAt'
    );

    if (!user) {
      return NextResponse.json(
        {
          error:
            'The verification link is invalid or has expired',
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          user.role === 'driver'
            ? 'Email verified successfully. Your driver account is waiting for administrator approval.'
            : 'Email verified successfully. You can now sign in.',
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status,
          isApproved: user.isApproved,
          isEmailVerified: user.isEmailVerified,
          emailVerifiedAt: user.emailVerifiedAt,
        },
        redirectTo: '/login',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      'POST /api/auth/verify-email error:',
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