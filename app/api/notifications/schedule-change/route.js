import { NextResponse } from 'next/server';

import {
  Schedule,
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
            'Only administrators can change schedules',
        },
        {
          status: 403,
        }
      );

    }


    const body =
      await request.json();


    const {
      scheduleId,
      departureTimes,
      frequency,
      message,
    } = body;


    if (!scheduleId) {

      return NextResponse.json(
        {
          error: 'scheduleId is required',
        },
        {
          status: 400,
        }
      );

    }


    if (
      !Array.isArray(departureTimes) ||
      departureTimes.length === 0
    ) {

      return NextResponse.json(
        {
          error:
            'departureTimes must be a non-empty array',
        },
        {
          status: 400,
        }
      );

    }


    const schedule =
      await Schedule.findById(
        scheduleId
      );


    if (!schedule) {

      return NextResponse.json(
        {
          error: 'Schedule not found',
        },
        {
          status: 404,
        }
      );

    }


    /*
     * Keep the old schedule so we can
     * include it in the notification.
     */
    const oldDepartureTimes = [
      ...schedule.departureTimes,
    ];

    const oldFrequency =
      schedule.frequency;


    /*
     * Update the schedule.
     */
    schedule.departureTimes =
      departureTimes;

    if (frequency !== undefined) {

      schedule.frequency =
        frequency;

    }

    await schedule.save();


    /*
     * Find passengers who have journeys
     * associated with this schedule's bus.
     */
    const journeys =
      await PassengerJourney.find({
        busId: schedule.busId,
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


    const oldTimesText =
      oldDepartureTimes.join(', ');

    const newTimesText =
      departureTimes.join(', ');


    const notificationMessage =
      message ||
      `Schedule changed. Previous departure time(s): ${oldTimesText}. New departure time(s): ${newTimesText}.`;


    if (
      passengerIds.length === 0
    ) {

      return NextResponse.json({

        success: true,

        message:
          'Schedule updated, but no passengers were found to notify.',

        schedule: {

          id:
            schedule._id,

          departureTimes:
            schedule.departureTimes,

          frequency:
            schedule.frequency,

        },

        oldFrequency,

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
              'schedule_change',

            title:
              'Schedule Changed',

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
          `Schedule notification failed for passenger ${passengerId}:`,
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
        'Schedule change notification process completed.',

      schedule: {

        id:
          schedule._id,

        busId:
          schedule.busId,

        departureTimes:
          schedule.departureTimes,

        frequency:
          schedule.frequency,

      },

      oldDepartureTimes,

      oldFrequency,

      notifiedPassengers:
        passengerIds.length,

      results,

    });


  } catch (error) {

    console.error(
      'Schedule change error:',
      error
    );


    return NextResponse.json(
      {
        error:
          'Unable to process schedule change',
      },
      {
        status: 500,
      }
    );

  }

}