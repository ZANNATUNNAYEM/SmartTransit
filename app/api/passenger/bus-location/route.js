import { NextResponse } from 'next/server';

import { connectDB } from '@/lib/db';
import { Bus } from '@/models';


export async function GET() {

  try {

    await connectDB();


    const bus =
      await Bus.findOne({
        busNumber:
        'DHAKA-METRO-KA-11-2222'
      })
      .populate(
        'routeId'
      );


    if (!bus) {

      return NextResponse.json(
        {
          error:
          'Bus not found'
        },
        {
          status:404
        }
      );

    }



    return NextResponse.json(
      {
        success:true,

        bus:{

          _id: bus._id,
          busNumber:
          bus.busNumber,

          status:
          bus.status,

          currentLocation:
          bus.currentLocation,

          route:
          bus.routeId?.name ||
          null
        }
      }
    );



  } catch(error) {

    console.error(
      'Passenger bus location error:',
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