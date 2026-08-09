import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { connectDB } from '@/lib/db';
import { verifyAccessToken } from '@/lib/jwt';

import {
  Trip,
  Bus,
  User,
} from '@/models';


// Get logged-in driver
async function getDriver() {
  try {
    const cookieStore = await cookies();

    const token = cookieStore.get(
      'access_token'
    )?.value;

    if (!token) {
      return null;
    }

    const payload = verifyAccessToken(token);

    if (!payload || payload.role !== 'driver') {
      return null;
    }

    return payload;

  } catch (error) {
    console.error(
      'Driver authentication error:',
      error
    );

    return null;
  }
}


// GET: Driver trip history
export async function GET() {

  try {

    await connectDB();


    const driver = await getDriver();


    if (!driver) {
      return NextResponse.json(
        {
          error: 'Unauthorized'
        },
        {
          status: 401
        }
      );
    }


    const trips = await Trip.find({
      driverId: driver.id || driver.userId
    })
    .populate(
      'busId',
      'busNumber'
    )
    .populate(
      'routeId',
      'name'
    )
    .sort({
      createdAt: -1
    });


    return NextResponse.json({
      trips
    });


  } catch(error) {

    console.error(
      'Get trips error:',
      error
    );

    return NextResponse.json(
      {
        error:'Unable to fetch trips'
      },
      {
        status:500
      }
    );
  }
}



// POST: Start trip
export async function POST(request) {

  try {

    await connectDB();


    const driver = await getDriver();


    if (!driver) {
      return NextResponse.json(
        {
          error:'Unauthorized'
        },
        {
          status:401
        }
      );
    }


    const body = await request.json();


    const {
      busId,
      routeId
    } = body;


    if (!busId || !routeId) {

      return NextResponse.json(
        {
          error:
          'Bus and route are required'
        },
        {
          status:400
        }
      );
    }


    const trip = await Trip.create({

      busId,

      driverId:
      driver.id || driver.userId,

      routeId,

      startTime:
      new Date(),

      status:
      'running'

    });


    return NextResponse.json(
      {
        message:
        'Trip started successfully',

        trip
      },
      {
        status:201
      }
    );


  } catch(error) {

    console.error(
      'Start trip error:',
      error
    );


    return NextResponse.json(
      {
        error:
        'Unable to start trip'
      },
      {
        status:500
      }
    );
  }
}



// PUT: End trip
export async function PUT(request) {

  try {

    await connectDB();


    const driver = await getDriver();


    if (!driver) {

      return NextResponse.json(
        {
          error:'Unauthorized'
        },
        {
          status:401
        }
      );

    }


    const {
      tripId,
      distance
    } = await request.json();



    const trip =
      await Trip.findOne({
        _id: tripId,
        driverId:
        driver.id || driver.userId
      });



    if (!trip) {

      return NextResponse.json(
        {
          error:
          'Trip not found'
        },
        {
          status:404
        }
      );

    }



    const endTime =
      new Date();


    const duration =
      Math.round(
        (
          endTime -
          trip.startTime
        )
        /
        (1000 * 60)
      );



    trip.endTime = endTime;

    trip.distance =
      distance || 0;

    trip.actualDuration =
      duration;

    trip.status =
      'completed';



    await trip.save();



    return NextResponse.json({

      message:
      'Trip completed successfully',

      trip

    });



  } catch(error) {

    console.error(
      'End trip error:',
      error
    );


    return NextResponse.json(
      {
        error:
        'Unable to complete trip'
      },
      {
        status:500
      }
    );

  }

}