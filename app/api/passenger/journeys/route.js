import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { PassengerJourney, Trip, } from '@/models';
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

    const journeys =
      await PassengerJourney.find({
        passengerId: decoded.userId,
      })
        .populate('tripId')
        .populate('busId')
        .populate('routeId')
        .populate('fromStopId')
        .populate('toStopId')
        .sort({
          journeyDate: -1,
        })
        .limit(20);

    return NextResponse.json({
      success: true,
      journeys,
    });

  } catch (error) {

    console.error(
      'Passenger journey history error:',
      error
    );

    return NextResponse.json(
      {
        error: 'Unable to fetch travel history',
      },
      {
        status: 500,
      }
    );
  }
}

export async function POST(request) {
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

    const body = await request.json();

    const {
      busId,
      routeId,
      fromStopId,
      toStopId,
      journeyDate,
    } = body;

    if (
      !busId ||
      !routeId
    ) {
      return NextResponse.json(
        {
          error:
            'Trip, bus, and route are required',
        },
        {
          status: 400,
        }
      );
    }
    const trip = await Trip.findOne({
    busId,
    status: 'running',
    });

    if (!trip) {
    return NextResponse.json(
        {
        error:
            'No running trip is available for this bus.',
        },
        {
        status: 404,
        }
    );
    }
    const journey =
      await PassengerJourney.create({
        passengerId: decoded.userId,
        tripId: trip._id,
        busId,
        routeId,
        fromStopId: fromStopId || undefined,
        toStopId: toStopId || undefined,
        journeyDate:
          journeyDate || new Date(),
        status: 'active',
      });

    return NextResponse.json(
      {
        success: true,
        journey,
      },
      {
        status: 201,
      }
    );

  } catch (error) {

    console.error(
      'Create passenger journey error:',
      error
    );

    return NextResponse.json(
      {
        error:
          'Unable to save passenger journey',
      },
      {
        status: 500,
      }
    );
  }
}