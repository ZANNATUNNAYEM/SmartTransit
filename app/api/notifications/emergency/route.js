import { NextResponse } from 'next/server';

import { User } from '@/models';

import { verifyAccessToken } from '@/lib/jwt';

import {
  sendSmartNotification,
} from '@/lib/notifications';


export async function POST(request) {

  try {

    const token =
      request.cookies.get(
        'admin_session'
      )?.value;


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


    const admin =
      await User.findById(
        decoded.userId
      );


    if (!admin || admin.role !== 'admin') {

      return NextResponse.json(
        {
          error:
            'Only administrators can send emergency alerts',
        },
        {
          status: 403,
        }
      );

    }


    const body =
      await request.json();


    const {
      userId,
      message,
    } = body;


    if (!userId || !message) {

      return NextResponse.json(
        {
          error:
            'userId and message are required',
        },
        {
          status: 400,
        }
      );

    }


    const recipient =
      await User.findById(userId);


    if (!recipient) {

      return NextResponse.json(
        {
          error:
            'Recipient user not found',
        },
        {
          status: 404,
        }
      );

    }


    const result =
      await sendSmartNotification({

        userId:

          recipient._id,

        type:
          'emergency',

        title:
          'Emergency Alert',

        message,

      });


    return NextResponse.json({

      success:
        result.success,

      message:
        'Emergency alert processed successfully.',

      notification:
        result.notification,

      pushSent:
        result.pushSent,

      oneSignal:
        result.oneSignal || null,

    });


  } catch (error) {

    console.error(
      'Emergency notification error:',
      error
    );


    return NextResponse.json(
      {
        error:
          error.message ||
          'Unable to send emergency alert',
      },
      {
        status: 500,
      }
    );

  }

}