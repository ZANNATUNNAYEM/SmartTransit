import { NextResponse } from 'next/server';

import { connectDB } from '@/lib/db';

import {
  Notification,
} from '@/models';

import { verifyAccessToken } from '@/lib/jwt';

import {
  sendSmartNotification,
} from '@/lib/notifications';


/*
 * POST
 * Send a notification to a SmartTransit user.
 */
export async function POST(
  request,
  { params }
) {

  try {

    await connectDB();


    // Check admin authentication
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


    const body =
      await request.json();


    const {
      userId,
      type,
      message,
      title,
    } = body;


    if (
      !userId ||
      !type ||
      !message
    ) {

      return NextResponse.json(
        {
          error:
            'userId, type and message are required',
        },
        {
          status: 400,
        }
      );

    }


    const result =
      await sendSmartNotification({
        userId,
        type,
        title,
        message,
      });


    return NextResponse.json(
      result,
      {
        status:
          result.success
            ? 200
            : 502,
      }
    );


  } catch (error) {

    console.error(
      'Send notification error:',
      error
    );


    return NextResponse.json(
      {
        error:
          error.message ||
          'Unable to send notification',
      },
      {
        status: 500,
      }
    );

  }

}


/*
 * PATCH
 * Mark a notification as read.
 */
export async function PATCH(
  request,
  { params }
) {
  try {
    await connectDB();

    // Driver/passenger authentication
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

    // Next.js dynamic route params
    const {
      id: notificationId,
    } = await params;

    if (!notificationId) {
      return NextResponse.json(
        {
          error:
            'Notification ID is required',
        },
        {
          status: 400,
        }
      );
    }

    /*
     * Only update a notification that belongs
     * to the currently logged-in user.
     */
    const notification =
      await Notification.findOneAndUpdate(
        {
          _id: notificationId,
          userId: decoded.userId,
        },
        {
          $set: {
            read: true,
          },
        },
        {
          returnDocument: 'after',
        }
      );

    if (!notification) {
      return NextResponse.json(
        {
          error:
            'Notification not found',
        },
        {
          status: 404,
        }
      );
    }

    return NextResponse.json({
      success: true,
      message:
        'Notification marked as read',
      notification,
    });

  } catch (error) {
    console.error(
      'Mark notification as read error:',
      error
    );

    return NextResponse.json(
      {
        error:
          error.message ||
          'Unable to mark notification as read',
      },
      {
        status: 500,
      }
    );
  }
}