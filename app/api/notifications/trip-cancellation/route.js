import { NextResponse } from 'next/server';

import {
  Trip,
  PassengerJourney,
  User,
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
            'Only administrators can cancel trips',
        },
        {
          status: 403,
        }
      );

    }


    const body =
      await request.json();


    const {
      tripId,
      message,
    } = body;


    if (!tripId) {

      return NextResponse.json(
        {
          error: 'tripId is required',
        },
        {
          status: 400,
        }
      );

    }


    const trip =
      await Trip.findById(
        tripId
      ).populate(
        'busId',
        'busNumber'
      );


    if (!trip) {

      return NextResponse.json(
        {
          error: 'Trip not found',
        },
        {
          status: 404,
        }
      );

    }


    if (
      trip.status === 'completed'
    ) {

      return NextResponse.json(
        {
          error:
            'A completed trip cannot be cancelled',
        },
        {
          status: 400,
        }
      );

    }


    if (
      trip.status === 'cancelled'
    ) {

      return NextResponse.json(
        {
          error:
            'This trip is already cancelled',
        },
        {
          status: 400,
        }
      );

    }


    trip.status = 'cancelled';

    await trip.save();


    /*
     * Find passengers specifically associated
     * with this trip.
     */
    const journeys =
      await PassengerJourney.find({
        tripId: trip._id,
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


    const busNumber =
      trip.busId?.busNumber ||
      'your bus';


    const notificationMessage =
      message ||
      `Trip cancellation alert: ${busNumber} trip has been cancelled.`;


    if (
      passengerIds.length === 0
    ) {

      return NextResponse.json({

        success: true,

        message:
          'Trip cancelled, but no passengers were found to notify.',

        trip: {
          id: trip._id,
          status: trip.status,
        },

        notifiedPassengers: 0,

      });

    }


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
              'cancellation',

            title:
              'Trip Cancelled',

            message:
              notificationMessage,

          });


        results.push({

          userId:
            passengerId,

          success:
            result.success,

          pushSent:
            result.pushSent,

        });


      } catch (error) {

        console.error(
          `Cancellation notification failed for passenger ${passengerId}:`,
          error
        );


        results.push({

          userId:
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

      success: true,

      message:
        'Trip cancellation notification process completed.',

      trip: {

        id:
          trip._id,

        busNumber,

        status:
          trip.status,

      },

      notifiedPassengers:
        passengerIds.length,

      results,

    });


  } catch (error) {

    console.error(
      'Trip cancellation error:',
      error
    );


    return NextResponse.json(
      {
        error:
          'Unable to process trip cancellation',
      },
      {
        status: 500,
      }
    );

  }

}