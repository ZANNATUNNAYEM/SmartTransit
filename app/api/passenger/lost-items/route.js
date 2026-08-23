import { NextResponse } from 'next/server';

import { connectDB } from '@/lib/db';

import {
  LostItem,
  User,
  Notification,
} from '@/models';

import {
  verifyAccessToken,
} from '@/lib/jwt';


// GET PASSENGER LOST ITEM REPORTS

export async function GET(request) {

  try {

    await connectDB();


    const token =
      request.cookies.get('access_token')?.value ||
      request.cookies.get('user_session')?.value;


    if (!token) {

      return NextResponse.json(
        {
          error: 'Unauthorized',
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


    const reports =
      await LostItem.find({
        passengerId:
          decoded.userId,
      })
      .sort({
        createdAt:-1,
      });


    return NextResponse.json({

      success:true,

      reports,

    });


  } catch(error) {


    console.error(
      'Lost item fetch error:',
      error
    );


    return NextResponse.json(
      {
        error:
          error.message ||
          'Unable to fetch lost items',
      },
      {
        status:500,
      }
    );

  }

}




// CREATE LOST ITEM REPORT

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
      description,
      busId,
      tripId,      
    } = body;


    if (!description) {

      return NextResponse.json(
        {
          error:
            'Description is required',
        },
        {
          status:400,
        }
      );

    }


    const report =
      await LostItem.create({

        passengerId:
          decoded.userId,
        busId,
        tripId,
        description,

        status:
          'reported',

      });
      await Notification.create({

        userId:
          '6a78e667cf39d3a508afed77',

        type:
          'lost_item',

        message:
          `New lost item report received: ${description}`

      });

    return NextResponse.json({

      success:true,

      report,

    });


  } catch(error) {


    console.error(
      'Lost item creation error:',
      error
    );


    return NextResponse.json(
      {
        error:
          error.message ||
          'Unable to create lost item report',
      },
      {
        status:500,
      }
    );

  }

}