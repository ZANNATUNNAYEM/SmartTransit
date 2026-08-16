import { NextResponse } from 'next/server';

import { connectDB } from '@/lib/db';

import {
  Notification,
} from '@/models';

import { verifyAccessToken } from '@/lib/jwt';


/*
 * GET
 * Fetch notifications for the logged-in
 * passenger/driver/admin.
 */
export async function GET(request) {

  try {

    await connectDB();


    /*
     * IMPORTANT:
     * Admin uses admin_session.
     * Passenger/driver uses access_token.
     *
     * We check admin_session FIRST so that
     * an old access_token cannot interfere
     * with the Admin Dashboard.
     */

    const adminToken =
      request.cookies.get(
        'admin_session'
      )?.value;

    const accessToken =
      request.cookies.get(
        'access_token'
      )?.value;


    const token =
      adminToken || accessToken;


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


    const notifications =
      await Notification.find({
        userId: decoded.userId,
      })
        .sort({
          createdAt: -1,
        })
        .limit(30);


    const unreadCount =
      await Notification.countDocuments({
        userId: decoded.userId,
        read: false,
      });


    return NextResponse.json({

      success: true,

      notifications,

      unreadCount,

    });


  } catch (error) {

    console.error(
      'Get notifications error:',
      error
    );


    return NextResponse.json(
      {
        error:
          'Unable to fetch notifications',
      },
      {
        status: 500,
      }
    );

  }

}


/*
 * POST
 *
 * Create a notification for the
 * currently logged-in passenger/driver.
 */
export async function POST(request) {

  try {

    await connectDB();


    const token =
      request.cookies.get(
        'access_token'
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


    const body =
      await request.json();


    const {
      type,
      message,
    } = body;


    if (
      !type ||
      !message
    ) {

      return NextResponse.json(
        {
          error:
            'Notification type and message are required',
        },
        {
          status: 400,
        }
      );

    }


    const notification =
      await Notification.create({

        userId:
          decoded.userId,

        type,

        message,

      });


    return NextResponse.json(
      {
        success: true,
        notification,
      },
      {
        status: 201,
      }
    );


  } catch (error) {

    console.error(
      'Create notification error:',
      error
    );


    return NextResponse.json(
      {
        error:
          'Unable to create notification',
      },
      {
        status: 500,
      }
    );

  }

}