import { NextResponse } from 'next/server';

import { verifyAccessToken } from '@/lib/jwt';

import { sendSmartNotification } from '@/lib/notifications';


export async function POST(request) {

  try {

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


    /*
     * The reusable notification service
     * will verify that the recipient exists.
     */
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


    /*
     * Send the notification using the
     * centralized SmartTransit service.
     */
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
          result.success ? 200 : 502,
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