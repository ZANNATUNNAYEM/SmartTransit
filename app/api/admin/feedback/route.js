import { NextResponse } from 'next/server';

import { connectDB } from '@/lib/db';

import {
  Feedback,
  User,
} from '@/models';

import {
  verifyAccessToken,
} from '@/lib/jwt';


// GET ALL FEEDBACK (ADMIN)

export async function GET(request) {

  try {

    await connectDB();


    const token =
      request.cookies.get('admin_session')?.value;


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


    const admin =
      await User.findById(
        decoded.userId
      );


    if (!admin || admin.role !== 'admin') {

      return NextResponse.json(
        {
          error:'Admin access required',
        },
        {
          status:403,
        }
      );

    }


    const feedbacks =
      await Feedback.find()
        .populate(
          'userId',
          'name email'
        )
        .populate({
        path:'tripId',
        populate:[
            {
            path:'busId',
            select:'busNumber'
            },
            {
            path:'routeId',
            select:'name'
            }
        ]
        })
        .sort({
          createdAt:-1,
        });


    return NextResponse.json({

      success:true,

      feedbacks,

    });



  } catch(error) {


    console.error(
      'Admin feedback fetch error:',
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