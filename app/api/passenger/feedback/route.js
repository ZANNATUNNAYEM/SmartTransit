import { NextResponse } from 'next/server';

import { connectDB } from '@/lib/db';

import {
  Feedback,
  User,
  Notification,
  Trip,
} from '@/models';

import {
  verifyAccessToken,
} from '@/lib/jwt';



// GET PASSENGER FEEDBACK HISTORY

export async function GET(request) {

  try {

    await connectDB();


    const token =
      request.cookies.get('access_token')?.value ||
      request.cookies.get('user_session')?.value;


    if (!token) {

      return NextResponse.json(
        {
          error:'Unauthorized',
        },
        {
          status:401,
        }
      );

    }


    const decoded =
      verifyAccessToken(token);


    if (!decoded?.userId) {

      return NextResponse.json(
        {
          error:'Invalid token',
        },
        {
          status:401,
        }
      );

    }


    const feedbacks =
      await Feedback.find({
        userId:
          decoded.userId,
      })
      .populate(
        'tripId'
      )
      .sort({
        createdAt:-1,
      });


    return NextResponse.json({

      success:true,

      feedbacks,

    });


  } catch(error) {


    console.error(
      'Feedback fetch error:',
      error
    );


    return NextResponse.json(
      {
        error:
          error.message ||
          'Unable to fetch feedback',
      },
      {
        status:500,
      }
    );

  }

}




// CREATE FEEDBACK

export async function POST(request) {

  try {

    await connectDB();


    const token =
      request.cookies.get('access_token')?.value ||
      request.cookies.get('user_session')?.value;


    if (!token) {

      return NextResponse.json(
        {
          error:'Unauthorized',
        },
        {
          status:401,
        }
      );

    }


    const decoded =
      verifyAccessToken(token);


    if (!decoded?.userId) {

      return NextResponse.json(
        {
          error:'Invalid token',
        },
        {
          status:401,
        }
      );

    }


    const body =
      await request.json();


    const {
      tripId,
      rating,
      comment,
    } = body;



    if (
      !tripId ||
      !rating
    ) {

      return NextResponse.json(
        {
          error:
          'tripId and rating are required',
        },
        {
          status:400,
        }
      );

    }



    if (
      rating < 1 ||
      rating > 5
    ) {

      return NextResponse.json(
        {
          error:
          'Rating must be between 1 and 5',
        },
        {
          status:400,
        }
      );

    }



    const existingFeedback =
      await Feedback.findOne({

        userId:
          decoded.userId,

        tripId,

      });
    const trip =
      await Trip.findById(tripId);

    if (!trip) {

      return NextResponse.json(
        {
          error:
            'Trip not found. Please select a valid trip.',
        },
        {
          status: 404,
        }
      );

    }


    if(existingFeedback){

      return NextResponse.json(
        {
          error:
          'Feedback already submitted for this trip',
        },
        {
          status:400,
        }
      );

    }



    const feedback =
      await Feedback.create({

        userId:
          decoded.userId,

        tripId,

        rating,

        comment:
          comment || '',

      });
      await Notification.create({

        userId:
          '6a78e667cf39d3a508afed77',

        type:
          'feedback',

        message:
          `New passenger feedback received. Rating: ${rating}/5`

      });


    return NextResponse.json({

      success:true,

      feedback,

    });



  } catch(error) {


    console.error(
      'Feedback creation error:',
      error
    );


    return NextResponse.json(
      {
        error:
          error.message ||
          'Unable to submit feedback',
      },
      {
        status:500,
      }
    );

  }

}