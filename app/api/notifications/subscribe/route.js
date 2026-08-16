import { NextResponse } from 'next/server';

import { connectDB } from '@/lib/db';

import {
  User,
} from '@/models';

import { verifyAccessToken } from '@/lib/jwt';


export async function POST(request) {

  try {

    await connectDB();


    const token =
      request.cookies.get('access_token')?.value;


    if (!token) {

      return NextResponse.json(
        {
          error: 'Unauthorized',
        },
        {
          status: 401,
        }
      );

    }


    const decoded =
      verifyAccessToken(token);


    if (!decoded?.userId) {

      return NextResponse.json(
        {
          error: 'Invalid token',
        },
        {
          status: 401,
        }
      );

    }


    const body =
      await request.json();


    const {
      subscriptionId,
    } = body;


    if (!subscriptionId) {

      return NextResponse.json(
        {
          error:
            'OneSignal subscription ID is required',
        },
        {
          status: 400,
        }
      );

    }


    const user =
      await User.findById(
        decoded.userId
      );


    if (!user) {

      return NextResponse.json(
        {
          error: 'User not found',
        },
        {
          status: 404,
        }
      );

    }


    if (
      !user.oneSignalSubscriptionIds.includes(
        subscriptionId
      )
    ) {

      user.oneSignalSubscriptionIds.push(
        subscriptionId
      );

      await user.save();

    }


    return NextResponse.json({

      success: true,

      message:
        'OneSignal subscription connected successfully',

      subscriptionId,

    });


  } catch (error) {

    console.error(
      'OneSignal subscription error:',
      error
    );


    return NextResponse.json(
      {
        error:
          'Unable to connect OneSignal subscription',
      },
      {
        status: 500,
      }
    );

  }

}