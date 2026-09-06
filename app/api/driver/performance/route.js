import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Trip from '@/models/Trip';
import Feedback from '@/models/Feedback';
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



    // Get passenger ratings for this driver's trips
    const tripIds = trips.map(
      (trip) => trip._id
    );

    const feedbacks = await Feedback.find({
      tripId: {
        $in: tripIds
      },
      rating: {
        $gte: 1,
        $lte: 5
      }
    });


    // Calculate average passenger rating
    const averagePassengerRating =
      feedbacks.length > 0
        ?
        Number(
          (
            feedbacks.reduce(
              (sum, feedback) =>
                sum + feedback.rating,
              0
            ) / feedbacks.length
          ).toFixed(1)
        )
        :
        0;


    // Convert average rating into a performance label
    let rating = 'No Rating';

    if (averagePassengerRating >= 4.5) {
      rating = 'Excellent';
    }
    else if (averagePassengerRating >= 3.5) {
      rating = 'Good';
    }
    else if (averagePassengerRating >= 2.5) {
      rating = 'Average';
    }
    else if (averagePassengerRating > 0) {
      rating = 'Poor';
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

        averagePassengerRating,

        totalPassengerRatings:
          feedbacks.length,

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
