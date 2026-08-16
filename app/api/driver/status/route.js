import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { connectDB } from '@/lib/db';
import { verifyAccessToken } from '@/lib/jwt';
import { Bus } from '@/models';


async function getDriver() {

  try {

    const cookieStore = await cookies();

    const token =
      cookieStore.get(
        'access_token'
      )?.value;


    if (!token) {
      return null;
    }


    const payload =
      verifyAccessToken(token);


    if (
      !payload ||
      payload.role !== 'driver'
    ) {
      return null;
    }


    return payload;


  } catch(error) {

    console.error(
      'Driver auth error:',
      error
    );

    return null;

  }

}



export async function PUT(request) {

  try {

    await connectDB();


    const driver =
      await getDriver();


    if (!driver) {

      return NextResponse.json(
        {
          error:
          'Unauthorized'
        },
        {
          status:401
        }
      );

    }



    const {
      status
    } = await request.json();



    const allowedStatuses = [
      'active',
      'delayed',
      'maintenance',
      'breakdown'
    ];



    if (
      !allowedStatuses.includes(status)
    ) {

      return NextResponse.json(
        {
          error:
          'Invalid status'
        },
        {
          status:400
        }
      );

    }



    const bus =
      await Bus.findOneAndUpdate(
        {
          driverId:
          driver.userId
        },
        {
          status
        },
        {
          new:true
        }
      );



    if (!bus) {

      return NextResponse.json(
        {
          error:
          'Assigned bus not found'
        },
        {
          status:404
        }
      );

    }



    return NextResponse.json(
      {
        message:
        'Bus status updated successfully',

        bus
      }
    );



  } catch(error) {

    console.error(
      'Status update error:',
      error
    );


    return NextResponse.json(
      {
        error:
        'Internal Server Error'
      },
      {
        status:500
      }
    );

  }

}