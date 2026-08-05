import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { sendVerificationEmail } from '@/lib/email';
import { User } from '@/models';

export const dynamic = 'force-dynamic';

const VERIFICATION_EXPIRY_MINUTES = 30;
const RESEND_COOLDOWN_MINUTES = 1;

export async function POST(request) {
  try {
    const body = await request.json();

    const normalizedEmail =
      typeof body.email === 'string'
        ? body.email.toLowerCase().trim()
        : '';

    if (!normalizedEmail) {
      return NextResponse.json(
        {
          error: 'Email address is required',
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

    await connectDB();

    const user = await User.findOne({
      email: normalizedEmail,
    }).select(
      '+emailVerificationTokenHash +emailVerificationExpiresAt name email isEmailVerified'
    );

    /*
     * Use the same response when the account does not exist or
     * has already been verified. This avoids exposing which email
     * addresses are registered.
     */
    if (!user || user.isEmailVerified) {
      return NextResponse.json(
        {
          success: true,
          message:
            'If an unverified account exists with this email address, a verification email will be sent.',
        },
        { status: 200 }
      );
    }

    /*
     * Since verification links expire after 30 minutes, a token
     * with more than 29 minutes remaining was sent less than one
     * minute ago.
     */
    const cooldownBoundary = new Date(
      Date.now() +
        (VERIFICATION_EXPIRY_MINUTES -
          RESEND_COOLDOWN_MINUTES) *
          60 *
          1000
    );

    if (
      user.emailVerificationExpiresAt &&
      user.emailVerificationExpiresAt >
        cooldownBoundary
    ) {
      return NextResponse.json(
        {
          error:
            'Please wait one minute before requesting another verification email.',
        },
        { status: 429 }
      );
    }

    const previousTokenHash =
      user.emailVerificationTokenHash;

    const previousExpiresAt =
      user.emailVerificationExpiresAt;

    const verificationToken = crypto
      .randomBytes(32)
      .toString('hex');

    const verificationTokenHash = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');

    const verificationExpiresAt = new Date(
      Date.now() +
        VERIFICATION_EXPIRY_MINUTES * 60 * 1000
    );

    user.emailVerificationTokenHash =
      verificationTokenHash;

    user.emailVerificationExpiresAt =
      verificationExpiresAt;

    await user.save();

    try {
      await sendVerificationEmail({
        recipientEmail: user.email,
        recipientName: user.name,
        verificationToken,
      });
    } catch (emailError) {
      console.error(
        'Resending verification email failed:',
        emailError
      );

      user.emailVerificationTokenHash =
        previousTokenHash || null;

      user.emailVerificationExpiresAt =
        previousExpiresAt || null;

      await user.save();

      return NextResponse.json(
        {
          error:
            'The verification email could not be sent. Please try again later.',
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message:
          'A new verification email has been sent. Check your inbox and spam folder.',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(
      'POST /api/auth/resend-verification error:',
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