import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models';
import { verifyAccessToken } from '@/lib/jwt';

export async function GET(request) {
  try {
    await connectDB();

    const token =
      request.cookies.get('access_token')?.value;

    if (!token) {
      return NextResponse.json(
        {
          error: 'Unauthorized'
        },
        {
          status: 401
        }
      );
    }

    const decoded =
      verifyAccessToken(token);

    const user =
      await User.findById(decoded.userId)
        .populate('favoriteRoutes')
        .populate('favoriteStops');

    if (!user) {
      return NextResponse.json(
        {
          error: 'User not found'
        },
        {
          status: 404
        }
      );
    }

    return NextResponse.json({
      success: true,
      favoriteRoutes: user.favoriteRoutes,
      favoriteStops: user.favoriteStops
    });

  } catch (error) {

    console.error(
      'Get favorites error:',
      error
    );

    return NextResponse.json(
      {
        error: error.message
      },
      {
        status: 500
      }
    );

  }
}