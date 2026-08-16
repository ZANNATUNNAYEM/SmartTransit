import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Bus from '@/models/Bus';

export async function GET(request) {
  try {
    await connectDB();

    const { searchParams } =
      new URL(request.url);

    const busId =
      searchParams.get('busId');


    if (!busId) {
      return NextResponse.json(
        {
          error: 'Bus ID required'
        },
        {
          status: 400
        }
      );
    }


    const bus =
      await Bus.findById(busId)
      .select(
        'busNumber currentLocation status'
      );


    if (!bus) {
      return NextResponse.json(
        {
          error: 'Bus not found'
        },
        {
          status:404
        }
      );
    }


    return NextResponse.json({
      success:true,
      busNumber: bus.busNumber,
      status: bus.status,
      currentLocation:
        bus.currentLocation,
      updatedAt:
        new Date()
    });


  } catch(error) {

    console.error(
      'Live location error:',
      error
    );

    return NextResponse.json(
      {
        error:error.message
      },
      {
        status:500
      }
    );

  }
}