import { NextResponse } from 'next/server';

import { connectDB } from '@/lib/db';

import {
  User,
  Notification,
} from '@/models';

import { verifyAccessToken } from '@/lib/jwt';


export async function POST(request) {

  try {

    await connectDB();


    // Check logged-in user
    const token =
        request.cookies.get('admin_session')?.value;


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


    // Only admins can send system notifications
    const sender =
      await User.findById(
        decoded.userId
      );


    if (!sender) {

      return NextResponse.json(
        {
          error: 'User not found',
        },
        {
          status: 404,
        }
      );

    }


    if (sender.role !== 'admin') {

      return NextResponse.json(
        {
          error:
            'Only administrators can send notifications',
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


    // Find the target SmartTransit user
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


    const subscriptionIds =
      recipient.oneSignalSubscriptionIds || [];


    if (subscriptionIds.length === 0) {

      return NextResponse.json(
        {
          error:
            'Recipient has no OneSignal subscription',
        },
        {
          status: 400,
        }
      );

    }


    /*
     * Save notification in MongoDB first.
     */
    const notification =
      await Notification.create({
        userId: recipient._id,
        type,
        message,
      });


    /*
     * Send push notification through OneSignal.
     */
    const oneSignalResponse =
      await fetch(
        'https://api.onesignal.com/notifications',
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'application/json',

            Authorization:
              `Key ${process.env.ONESIGNAL_REST_API_KEY}`,
          },

          body: JSON.stringify({

            app_id:
              process.env.ONESIGNAL_APP_ID,

            include_subscription_ids:
              subscriptionIds,

            headings: {
              en:
                title || 'SmartTransit',
            },

            contents: {
              en: message,
            },

            url:
              process.env.NEXT_PUBLIC_APP_URL ||
              'http://localhost:3000/passenger/dashboard',

          }),
        }
      );


    const oneSignalData =
      await oneSignalResponse.json();


    if (!oneSignalResponse.ok) {

      console.error(
        'OneSignal API error:',
        oneSignalData
      );


      return NextResponse.json(
        {
          success: false,

          error:
            'Notification saved but OneSignal push failed',

          notification,

          oneSignalError:
            oneSignalData,
        },
        {
          status: 502,
        }
      );

    }


    return NextResponse.json({

      success: true,

      message:
        'Notification sent successfully',

      notification,

      oneSignal:
        oneSignalData,

    });


  } catch (error) {

    console.error(
      'Send notification error:',
      error
    );


    return NextResponse.json(
      {
        error:
          'Unable to send notification',
      },
      {
        status: 500,
      }
    );

  }

}