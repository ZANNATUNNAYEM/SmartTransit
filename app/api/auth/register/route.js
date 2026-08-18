import crypto from 'node:crypto';
import { NextResponse } from 'next/server';
import {
  deleteProfileImage,
  uploadProfileImage,
} from '@/lib/cloudinary';
import { connectDB } from '@/lib/db';
import { sendVerificationEmail } from '@/lib/email';
import { User } from '@/models';

export const dynamic = 'force-dynamic';

const EMAIL_VERIFICATION_EXPIRY_MINUTES = 30;
const MAX_PROFILE_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_PROFILE_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

function getStringValue(formData, key) {
  const value = formData.get(key);

  return typeof value === 'string' ? value.trim() : '';
}

export async function POST(request) {
  let uploadedProfileImagePublicId = null;
  let createdUserId = null;

  try {
    let formData;

    try {
      formData = await request.formData();
    } catch {
      return NextResponse.json(
        {
          error:
            'Invalid registration form data. Use multipart/form-data.',
        },
        { status: 400 }
      );
    }

    const normalizedName = getStringValue(
      formData,
      'name'
    );

    const normalizedEmail = getStringValue(
      formData,
      'email'
    ).toLowerCase();

    const normalizedPhone = getStringValue(
      formData,
      'phone'
    );

    const normalizedPassword =
      typeof formData.get('password') === 'string'
        ? formData.get('password')
        : '';

    const normalizedRole = getStringValue(
      formData,
      'role'
    ).toLowerCase();

    const normalizedLicenseNo = getStringValue(
      formData,
      'licenseNo'
    );

    const normalizedOrgName = getStringValue(
      formData,
      'orgName'
    );

    const profileImage = formData.get('profileImage');

    if (
      !normalizedName ||
      !normalizedEmail ||
      !normalizedPhone ||
      !normalizedPassword
    ) {
      return NextResponse.json(
        {
          error:
            'Name, email, phone number, and password are required',
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

    const phoneRegex = /^[0-9+\-()\s]{7,20}$/;

    if (!phoneRegex.test(normalizedPhone)) {
      return NextResponse.json(
        {
          error: 'Invalid phone number format',
        },
        { status: 400 }
      );
    }

    if (normalizedPassword.length < 6) {
      return NextResponse.json(
        {
          error:
            'Password must be at least 6 characters long',
        },
        { status: 400 }
      );
    }

    const allowedRoles = ['passenger', 'driver'];

    if (!allowedRoles.includes(normalizedRole)) {
      return NextResponse.json(
        {
          error:
            'Role must be either passenger or driver',
        },
        { status: 400 }
      );
    }

    if (
      normalizedRole === 'driver' &&
      (!normalizedLicenseNo || !normalizedOrgName)
    ) {
      return NextResponse.json(
        {
          error:
            'Driving license number and transport organization are required for driver registration',
        },
        { status: 400 }
      );
    }

    const hasProfileImage =
      profileImage &&
      typeof profileImage !== 'string' &&
      typeof profileImage.arrayBuffer === 'function' &&
      profileImage.size > 0;

    if (hasProfileImage) {
      if (
        !ALLOWED_PROFILE_IMAGE_TYPES.has(
          profileImage.type
        )
      ) {
        return NextResponse.json(
          {
            error:
              'Profile picture must be a JPG, PNG, or WebP image',
          },
          { status: 400 }
        );
      }

      if (profileImage.size > MAX_PROFILE_IMAGE_SIZE) {
        return NextResponse.json(
          {
            error:
              'Profile picture must not exceed 5 MB',
          },
          { status: 400 }
        );
      }
    }

    await connectDB();

    const existingUser = await User.findOne({
      $or: [
        { email: normalizedEmail },
        { phone: normalizedPhone },
      ],
    }).select('email phone');

    if (existingUser?.email === normalizedEmail) {
      return NextResponse.json(
        {
          error: 'Email is already registered',
        },
        { status: 409 }
      );
    }

    if (existingUser?.phone === normalizedPhone) {
      return NextResponse.json(
        {
          error: 'Phone number is already registered',
        },
        { status: 409 }
      );
    }

    if (normalizedRole === 'driver') {
      const existingDriver = await User.findOne({
        'driverDetails.licenseNo':
          normalizedLicenseNo,
      }).select('_id');

      if (existingDriver) {
        return NextResponse.json(
          {
            error:
              'This driving license number is already registered',
          },
          { status: 409 }
        );
      }
    }

    let uploadedProfileImage = null;

    if (hasProfileImage) {
      const imageArrayBuffer =
        await profileImage.arrayBuffer();

      const imageBuffer = Buffer.from(
        imageArrayBuffer
      );

      uploadedProfileImage =
        await uploadProfileImage(imageBuffer);

      uploadedProfileImagePublicId =
        uploadedProfileImage.publicId;
    }

    const verificationToken = crypto
      .randomBytes(32)
      .toString('hex');

    const verificationTokenHash = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex');

    const verificationExpiresAt = new Date(
      Date.now() +
        EMAIL_VERIFICATION_EXPIRY_MINUTES *
          60 *
          1000
    );

    const userData = {
      name: normalizedName,
      email: normalizedEmail,
      phone: normalizedPhone,
      password: normalizedPassword,
      role: normalizedRole,

      profileImageUrl:
        uploadedProfileImage?.url || null,

      profileImagePublicId:
        uploadedProfileImage?.publicId || null,

      isEmailVerified: false,
      emailVerifiedAt: null,

      emailVerificationTokenHash:
        verificationTokenHash,

      emailVerificationExpiresAt:
        verificationExpiresAt,

      isApproved: normalizedRole !== 'driver',

      status:
        normalizedRole === 'driver'
          ? 'pending'
          : 'active',
    };

    if (normalizedRole === 'driver') {
      userData.driverDetails = {
        licenseNo: normalizedLicenseNo,
        orgName: normalizedOrgName,
      };
    }

    const user = await User.create(userData);
    createdUserId = user._id;

    try {
      await sendVerificationEmail({
        recipientEmail: user.email,
        recipientName: user.name,
        verificationToken,
      });
    } catch (emailError) {
      console.error(
        'Verification email sending failed:',
        emailError
      );

      await User.deleteOne({
        _id: user._id,
        isEmailVerified: false,
      });

      if (uploadedProfileImagePublicId) {
        await deleteProfileImage(
          uploadedProfileImagePublicId
        );
      }

      return NextResponse.json(
        {
          error:
            'Registration could not be completed because the verification email could not be sent. Please try again.',
        },
        { status: 502 }
      );
    }

    return NextResponse.json(
      {
        success: true,

        message:
          normalizedRole === 'driver'
            ? 'Registration submitted. Verify your email address, then wait for administrator approval.'
            : 'Registration completed. Check your email to verify your account.',

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
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(
      'POST /api/auth/register error:',
      error
    );

    if (createdUserId) {
      await User.deleteOne({
        _id: createdUserId,
        isEmailVerified: false,
      }).catch(() => {});
    }

    if (uploadedProfileImagePublicId) {
      await deleteProfileImage(
        uploadedProfileImagePublicId
      );
    }

    if (error?.code === 11000) {
      return NextResponse.json(
        {
          error:
            'An account with the provided information already exists',
        },
        { status: 409 }
      );
    }

    if (error?.name === 'ValidationError') {
      const validationMessages = Object.values(
        error.errors
      ).map((item) => item.message);

      return NextResponse.json(
        {
          error: 'Registration validation failed',
          details: validationMessages,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error:
          'Registration could not be completed. Please try again.',
      },
      { status: 500 }
    );
  }
}