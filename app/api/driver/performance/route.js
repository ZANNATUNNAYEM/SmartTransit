import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Trip from '@/models/Trip';
import jwt from 'jsonwebtoken';


export async function GET(request) {

  try {

    await connectDB();


    const token =
      request.cookies.get('access_token')?.value;


    if (!token) {

      return NextResponse.json(
        {
          error:'Unauthorized'
        },
        {
          status:401
        }
      );

    }


    const decoded =
      jwt.verify(
        token,
        process.env.JWT_SECRET
      );


    const trips =
      await Trip.find({

        driverId:
          decoded.userId,

      });



    const completedTrips =
      trips.filter(
        (trip)=>
          trip.status === 'completed'
      );



    const delayedTrips =
      trips.filter(
        (trip)=>
          trip.status === 'delayed' ||
          trip.delayMinutes > 0
      );



    const totalCompleted =
      completedTrips.length;



    const totalDelayed =
      delayedTrips.length;



    const onTimeTrips =
      Math.max(
        totalCompleted - totalDelayed,
        0
      );



    const punctuality =
      totalCompleted > 0
      ?
      Math.round(
        (onTimeTrips / totalCompleted)
        * 100
      )
      :
      0;



    const totalDistance =
      completedTrips.reduce(
        (sum,trip)=>
          sum + (trip.distance || 0),
        0
      );



    const averageDuration =
      totalCompleted > 0
      ?
      Math.round(
        completedTrips.reduce(
          (sum,trip)=>
            sum + (trip.actualDuration || 0),
          0
        )
        /
        totalCompleted
      )
      :
      0;



    let rating = 'Poor';


    if(punctuality >= 90){

      rating = 'Excellent';

    }
    else if(punctuality >= 75){

      rating = 'Good';

    }
    else if(punctuality >= 50){

      rating = 'Average';

    }



    return NextResponse.json({

      success:true,

      performance:{

        totalTrips:
          trips.length,

        completedTrips:
          totalCompleted,

        delayedTrips:
          totalDelayed,

        onTimeTrips,

        punctuality,

        totalDistance,

        averageDuration,

        rating,

      }

    });



  }
  catch(error){


    console.error(
      'Performance error:',
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
