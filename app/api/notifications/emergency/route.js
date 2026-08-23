import { NextResponse } from 'next/server';

import {
  User,
  PassengerJourney,
} from '@/models';

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
      message,
    } = body;


    if (!message) {

      return NextResponse.json(
        {
          error:
            'message is required',
        },
        {
          status: 400,
        }
      );

    }


    // Find all passengers with active journeys
    const journeys =
      await PassengerJourney.find({
        status: 'active',
      }).select(
        'passengerId'
      );


    const passengerIds = [
      ...new Set(
        journeys.map(
          (journey) =>
            journey.passengerId.toString()
        )
      ),
    ];


    const results = [];


    for (
      const passengerId
      of passengerIds
    ) {

      try {

        const result =
          await sendSmartNotification({

            userId:
              passengerId,

            type:
              'emergency',

            title:
              'Emergency Alert',

            message,

          });


        results.push({

          passengerId,

          success:
            result.success,

          pushSent:
            result.pushSent,

        });


      } catch(error) {

        results.push({

          passengerId,

          success:
            false,

          pushSent:
            false,

          error:
            error.message,

        });

      }

    }


    return NextResponse.json({

      success:
        true,

      message:
        'Emergency alert sent to active passengers.',

      notifiedPassengers:
        passengerIds.length,

      results,

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