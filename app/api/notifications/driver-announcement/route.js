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


    if (
      !admin ||
      admin.role !== 'admin'
    ) {

      return NextResponse.json(
        {
          error:
            'Only administrators can send driver announcements',
        },
        {
          status: 403,
        }
      );

    }


    const body =
      await request.json();


    const {
      driverId,
      message,
    } = body;


    if (!driverId || !message) {

      return NextResponse.json(
        {
          error:
            'driverId and message are required',
        },
        {
          status: 400,
        }
      );

    }


    const driver =
      await User.findOne({
        _id: driverId,
        role: 'driver',
      });


    if (!driver) {

      return NextResponse.json(
        {
          error:
            'Driver not found',
        },
        {
          status: 404,
        }
      );

    }


    const result =
      await sendSmartNotification({

        userId:
          driver._id,

        type:
          'driver_announcement',

        title:
          'Administrative Announcement',

        message,

      });


    return NextResponse.json({

      success:
        result.success,

      message:
        'Driver announcement processed successfully.',

      driver: {

        id:
          driver._id,

        name:
          driver.name,

        email:
          driver.email,

      },

      notification:
        result.notification,

      pushSent:
        result.pushSent,

      oneSignal:
        result.oneSignal || null,

    });


  } catch (error) {

    console.error(
      'Driver announcement error:',
      error
    );


    return NextResponse.json(
      {
        error:
          error.message ||
          'Unable to send driver announcement',
      },
      {
        status: 500,
      }
    );

  }

}