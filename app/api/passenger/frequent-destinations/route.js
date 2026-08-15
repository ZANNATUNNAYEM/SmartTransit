import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

import { connectDB } from '@/lib/db';
import { PassengerJourney} from '@/models';

import { verifyAccessToken } from '@/lib/jwt';

export async function GET(request) {
  try {
    await connectDB();

    const token =
      request.cookies.get('access_token')?.value;

    if (!token) {
      return NextResponse.json(
        {
          error: 'Unauthorized',
        },
        {
          status: 401,
        }
      );
    }

    const decoded =
      verifyAccessToken(token);

    if (!decoded?.userId) {
      return NextResponse.json(
        {
          error: 'Invalid token',
        },
        {
          status: 401,
        }
      );
    }

    const destinations =
      await PassengerJourney.aggregate([
        {
          $match: {
            passengerId:
              new mongoose.Types.ObjectId(
                decoded.userId
              ),

            toStopId: {
              $ne: null,
            },

            status: 'completed',
          },
        },

        {
          $group: {
            _id: '$toStopId',

            visitCount: {
              $sum: 1,
            },
          },
        },

        {
          $sort: {
            visitCount: -1,
          },
        },

        {
          $limit: 5,
        },

        {
          $lookup: {
            from: 'busstops',

            localField: '_id',

            foreignField: '_id',

            as: 'stop',
          },
        },

        {
          $unwind: '$stop',
        },

        {
          $project: {
            _id: 0,

            stopId: '$_id',

            name: '$stop.name',

            visitCount: 1,
          },
        },
      ]);

    return NextResponse.json({
      success: true,
      destinations,
    });

  } catch (error) {

    console.error(
      'Frequent destinations error:',
      error
    );

    return NextResponse.json(
      {
        error:
          'Unable to fetch frequent destinations',
      },
      {
        status: 500,
      }
    );
  }
}