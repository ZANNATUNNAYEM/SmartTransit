import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models';
import { verifyAccessToken } from '@/lib/jwt';

export async function POST(request) {
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

    const { stopId } =
      await request.json();

    if (!stopId) {
      return NextResponse.json(
        {
          error: 'Stop ID is required'
        },
        {
          status: 400
        }
      );
    }

    const user =
      await User.findById(decoded.userId);

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

    if (user.role !== 'passenger') {
      return NextResponse.json(
        {
          error: 'Only passengers can save favourites'
        },
        {
          status: 403
        }
      );
    }

    if (
      !user.favoriteStops.includes(stopId)
    ) {
      user.favoriteStops.push(stopId);
      await user.save();
    }

    return NextResponse.json({
      success: true,
      message: 'Bus stop saved to favourites'
    });

  } catch (error) {

    console.error(
      'Favorite stop error:',
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