import { NextResponse } from 'next/server';

import { connectDB } from '@/lib/db';

import {
  Bus,
  PassengerJourney,
  User,
} from '@/models';

import { verifyAccessToken } from '@/lib/jwt';

import {
  sendSmartNotification,
} from '@/lib/notifications';


export async function POST(request) {

  try {

    await connectDB();


    /*
     * Only admins can trigger a system-wide
     * bus delay notification.
     */
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
            'Only administrators can send bus delay notifications',
        },
        {
          status: 403,
        }
      );

    }


    const body =
      await request.json();


    const {
      busId,
      delayMinutes,
    } = body;


    if (!busId) {

      return NextResponse.json(
        {
          error: 'busId is required',
        },
        {
          status: 400,
        }
      );

    }


    const bus =
      await Bus.findById(busId);


    if (!bus) {

      return NextResponse.json(
        {
          error: 'Bus not found',
        },
        {
          status: 404,
        }
      );

    }


    /*
     * Update the actual bus status.
     */
    bus.status = 'delayed';

    await bus.save();


    /*
     * Find passengers whose journey is
     * associated with this bus.
     */
    const journeys =
      await PassengerJourney.find({
        busId: bus._id,
        status: 'active'
      }).select(
        'passengerId'
      );


    /*
     * Remove duplicate passenger IDs.
     */
    const passengerIds = [
      ...new Set(
        journeys.map(
          (journey) =>
            journey.passengerId.toString()
        )
      ),
    ];


    if (passengerIds.length === 0) {

      return NextResponse.json({

        success: true,

        message:
          'Bus marked as delayed, but no passengers were found to notify.',

        bus: {
          id: bus._id,
          busNumber: bus.busNumber,
          status: bus.status,
        },

        notifiedPassengers: 0,

      });

    }


    const delayText =
      delayMinutes
        ? `Bus ${bus.busNumber} is delayed by ${delayMinutes} minutes.`
        : `Bus ${bus.busNumber} is delayed.`;


    const results = [];


    /*
     * Send the notification to each passenger.
     */
    for (const passengerId of passengerIds) {

      try {

        const result =
          await sendSmartNotification({

            userId: passengerId,

            type: 'delay',

            title: 'Bus Delayed',

            message: delayText,

          });


        results.push({

          userId: passengerId,

          success:
            result.success,

          pushSent:
            result.pushSent,

        });


      } catch (error) {

        console.error(
          `Delay notification failed for passenger ${passengerId}:`,
          error
        );


        results.push({

          userId: passengerId,

          success: false,

          pushSent: false,

          error:
            error.message,

        });

      }

    }


    return NextResponse.json({

      success: true,

      message:
        'Bus delay notification process completed.',

      bus: {

        id: bus._id,

        busNumber:
          bus.busNumber,

        status:
          bus.status,

      },

      notifiedPassengers:
        passengerIds.length,

      results,

    });


  } catch (error) {

    console.error(
      'Bus delay notification error:',
      error
    );


    return NextResponse.json(
      {
        error:
          'Unable to process bus delay notification',
      },
      {
        status: 500,
      }
    );

  }

}