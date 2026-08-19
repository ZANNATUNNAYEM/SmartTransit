import { NextResponse } from 'next/server';

import {
  Route,
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
            'Only administrators can send route diversion alerts',
        },
        {
          status: 403,
        }
      );

    }


    const body =
      await request.json();


    const {
      routeId,
      diversionDetails,
    } = body;


    if (!routeId || !diversionDetails) {

      return NextResponse.json(
        {
          error:
            'routeId and diversionDetails are required',
        },
        {
          status: 400,
        }
      );

    }


    const route =
      await Route.findById(
        routeId
      );


    if (!route) {

      return NextResponse.json(
        {
          error: 'Route not found',
        },
        {
          status: 404,
        }
      );

    }


    /*
     * Find all buses currently assigned
     * to this route.
     */
    const buses =
      await Bus.find({
        routeId: route._id,
      }).select(
        '_id busNumber'
      );


    const busIds =
      buses.map(
        (bus) => bus._id
      );


    /*
     * Find passengers associated with
     * those buses.
     */
    const journeys =
      busIds.length > 0
        ? await PassengerJourney.find({
            busId: {
              $in: busIds,
            },
            status: 'active',
          }).select(
            'passengerId'
          )
        : [];


    /*
     * Remove duplicate passengers.
     */
    const passengerIds = [
      ...new Set(
        journeys.map(
          (journey) =>
            journey.passengerId.toString()
        )
      ),
    ];


    const notificationMessage =
      `Route diversion for ${route.name}: ${diversionDetails}`;


    if (
      passengerIds.length === 0
    ) {

      return NextResponse.json({

        success: true,

        message:
          'Route diversion recorded, but no passengers were found to notify.',

        route: {

          id:
            route._id,

          name:
            route.name,

        },

        affectedBuses:
          buses.length,

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
              'route_diversion',

            title:
              'Route Diversion',

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
          `Route diversion notification failed for passenger ${passengerId}:`,
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
        'Route diversion notification process completed.',

      route: {

        id:
          route._id,

        name:
          route.name,

      },

      affectedBuses:
        buses.length,

      notifiedPassengers:
        passengerIds.length,

      results,

    });


  } catch (error) {

    console.error(
      'Route diversion error:',
      error
    );


    return NextResponse.json(
      {
        error:
          'Unable to process route diversion',
      },
      {
        status: 500,
      }
    );

  }

}