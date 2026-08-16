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

    const { routeId } =
      await request.json();

    if (!routeId) {
      return NextResponse.json(
        {
          error: 'Route ID is required'
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
      !user.favoriteRoutes.includes(routeId)
    ) {
      user.favoriteRoutes.push(routeId);
      await user.save();
    }

    return NextResponse.json({
      success: true,
      message: 'Route saved to favourites'
    });

  } catch (error) {

    console.error(
      'Favorite route error:',
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