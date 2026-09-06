import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Trip from '@/models/Trip';


export async function GET() {

  try {

    await connectDB();


    const drivers =
      await User.find({
        role:'driver'
      })
      .select(
        'name email phone'
      );



    const performance = [];



    for (const driver of drivers) {


      const trips =
        await Trip.find({

          driverId:
            driver._id,

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
          (onTimeTrips /
          totalCompleted) * 100
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



    performance.push({

        _id:
            driver._id,


        driverName:
            driver.name,


        driverEmail:
            driver.email,


        totalTrips:
            trips.length,


        completedTrips:
            totalCompleted,


        delayedTrips:
            totalDelayed,


        totalDelayMinutes:
            delayedTrips.reduce(
            (sum, trip)=>
                sum + (trip.delayMinutes || 0),
            0
            ),


        punctualityRate:
            punctuality,

        });


    }



    return NextResponse.json({

      success:true,

      performance,

    });



  }
  catch(error){


    console.error(
      'Admin driver performance error:',
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