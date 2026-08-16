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

    if (!decoded?.userId) {
      return NextResponse.json(
        {
          error: 'Invalid token'
        },
        {
          status: 401
        }
      );
    }

    const user =
      await User.findById(decoded.userId)
        .populate({
          path: 'recentSearches.busId',
          populate: {
            path: 'routeId',
            populate: {
              path: 'stops'
            }
          }
        });

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
          error: 'Only passengers can access recent searches'
        },
        {
          status: 403
        }
      );
    }

    return NextResponse.json({
      success: true,
      recentSearches: user.recentSearches || []
    });

  } catch (error) {

    console.error(
      'Recent searches error:',
      error
    );

    return NextResponse.json(
      {
        error: 'Unable to fetch recent searches'
      },
      {
        status: 500
      }
    );
  }
}