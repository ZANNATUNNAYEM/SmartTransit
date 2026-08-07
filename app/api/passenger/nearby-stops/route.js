import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import BusStop from '@/models/BusStop';


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
      lat1 * Math.PI / 180
    ) *
      Math.cos(
        lat2 * Math.PI / 180
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


    const lat =
      Number(searchParams.get('lat'));

    const lng =
      Number(searchParams.get('lng'));


    if (!lat || !lng) {

      return NextResponse.json(
        {
          error:
            'Latitude and longitude required'
        },
        {
          status:400
        }
      );

    }


    const stops =
      await BusStop.find();



    const nearbyStops =
      stops.map((stop)=>{

        const distance =
          calculateDistance(
            lat,
            lng,
            stop.location.coordinates[1],
            stop.location.coordinates[0]
          );


        return {
          ...stop.toObject(),
          distance:
            Number(
              distance.toFixed(2)
            )
        };

      })
      .sort(
        (a,b)=>
          a.distance-b.distance
      )
      .slice(0,5);



    return NextResponse.json({

      success:true,

      stops: nearbyStops

    });


  } catch(error) {


    console.error(
      'Nearby stops error:',
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