import { NextResponse } from 'next/server';

import { connectDB } from '@/lib/db';

import Bus from '@/models/Bus';
import Route from '@/models/Route';
import Trip from '@/models/Trip';



function calculateDistance(
  lat1,
  lon1,
  lat2,
  lon2
) {

  const R = 6371;

  const dLat =
    ((lat2 - lat1) * Math.PI) / 180;

  const dLon =
    ((lon2 - lon1) * Math.PI) / 180;


  const a =
    Math.sin(dLat / 2) *
      Math.sin(dLat / 2) +

    Math.cos(
      (lat1 * Math.PI) / 180
    ) *

      Math.cos(
        (lat2 * Math.PI) / 180
      ) *

      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);


  return (
    R *
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    )
  );

}



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
          error:
            'Bus ID required'
        },
        {
          status:400
        }
      );

    }



        const bus =
        await Bus.findById(busId)
            .populate({
            path: 'routeId',
            populate: {
                path: 'stops'
            }
            });


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



    const route =
      bus.routeId;



    const trip =
      await Trip.findOne({
        busId: bus._id,
        status: 'running'
      });



    const busLat =
      bus.currentLocation.coordinates[1];


    const busLng =
      bus.currentLocation.coordinates[0];



    const destination =
      route.stops[
        route.stops.length - 1
      ];



    const destinationLat =
      destination.location.coordinates[1];


    const destinationLng =
      destination.location.coordinates[0];



    const remainingDistance =
      calculateDistance(
        busLat,
        busLng,
        destinationLat,
        destinationLng
      );



    const speed =
      route.distance /
      route.estimatedDuration;



    let eta =
      Math.ceil(
        remainingDistance /
        speed
      );



    if (trip?.delayMinutes) {

      eta += trip.delayMinutes;

    }

    return NextResponse.json({

      success:true,

      busNumber:
        bus.busNumber,

      route:
        route.name,

      distanceRemaining:
        Number(
          remainingDistance.toFixed(2)
        ),

      etaMinutes:
        eta
    });

 } catch(error) {

    console.error(
        'ETA error:',
        error
    );

    return NextResponse.json(
        {
        error: error.message
        },
        {
        status:500
        }
    );
    }
}