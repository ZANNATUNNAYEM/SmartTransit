import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

import { connectDB } from '@/lib/db';
import { verifyAccessToken } from '@/lib/jwt';

import {
  Bus,
  PassengerJourney,
  BusStop,
} from '@/models';

import {
  sendSmartNotification,
} from '@/lib/notifications';


/*
 * Distance threshold for "approaching".
 * 1 kilometer = 1000 meters.
 */
const APPROACHING_DISTANCE_METERS = 1000;


/*
 * Prevent the same passenger from receiving
 * the same approaching notification repeatedly.
 *
 * Key:
 * passengerId + busId + stopId
 *
 * Value:
 * timestamp of the last notification.
 */
const approachingNotificationCache =
  globalThis.approachingNotificationCache ||
  new Map();

globalThis.approachingNotificationCache =
  approachingNotificationCache;


const NOTIFICATION_COOLDOWN_MS =
  10 * 60 * 1000;


/*
 * Get authenticated driver.
 */
async function getDriver() {

  try {

    const cookieStore =
      await cookies();


    const token =
      cookieStore.get(
        'access_token'
      )?.value;


    if (!token) {
      return null;
    }


    const payload =
      verifyAccessToken(token);


    if (
      !payload ||
      payload.role !== 'driver'
    ) {
      return null;
    }


    return payload;


  } catch (error) {

    console.error(
      'Driver auth error:',
      error
    );

    return null;

  }

}


/*
 * Calculate distance between two
 * geographic coordinates using the
 * Haversine formula.
 *
 * Coordinates:
 * [longitude, latitude]
 */
function calculateDistance(
  latitude1,
  longitude1,
  latitude2,
  longitude2
) {

  const earthRadius =
    6371000;


  const lat1 =
    latitude1 *
    Math.PI / 180;

  const lat2 =
    latitude2 *
    Math.PI / 180;


  const deltaLatitude =
    (latitude2 - latitude1) *
    Math.PI / 180;

  const deltaLongitude =
    (longitude2 - longitude1) *
    Math.PI / 180;


  const a =
    Math.sin(
      deltaLatitude / 2
    ) ** 2 +

    Math.cos(lat1) *
    Math.cos(lat2) *
    Math.sin(
      deltaLongitude / 2
    ) ** 2;


  const c =
    2 *
    Math.atan2(
      Math.sqrt(a),
      Math.sqrt(1 - a)
    );


  return earthRadius * c;

}


/*
 * Check whether passengers have an
 * upcoming destination stop close
 * to the bus.
 */
async function checkApproachingPassengers(
  bus
) {

  try {

    const journeys =
      await PassengerJourney.find({

        busId: bus._id,

        status: {
          $ne: 'cancelled',
        },

      }).select(
        'passengerId toStopId'
      );


    if (!journeys.length) {
      return;
    }


    const stopIds = [
      ...new Set(
        journeys
          .filter(
            (journey) =>
              journey.toStopId
          )
          .map(
            (journey) =>
              journey.toStopId.toString()
          )
      ),
    ];


    if (!stopIds.length) {
      return;
    }


    const stops =
      await BusStop.find({
        _id: {
          $in: stopIds,
        },
      }).select(
        'name location'
      );


    const stopMap =
      new Map(
        stops.map(
          (stop) => [
            stop._id.toString(),
            stop,
          ]
        )
      );


    for (
      const journey
      of journeys
    ) {

      if (!journey.toStopId) {
        continue;
      }


      if (!bus.currentLocation) {
        continue;
      }


      const stop =
        stopMap.get(
          journey.toStopId.toString()
        );


      if (!stop) {
        continue;
      }


      const busCoordinates =
        bus.currentLocation.coordinates;


      const stopCoordinates =
        stop.location.coordinates;


      if (
        !Array.isArray(busCoordinates) ||
        busCoordinates.length !== 2 ||
        !Array.isArray(stopCoordinates) ||
        stopCoordinates.length !== 2
      ) {
        continue;
      }


      const busLongitude =
        busCoordinates[0];

      const busLatitude =
        busCoordinates[1];


      const stopLongitude =
        stopCoordinates[0];

      const stopLatitude =
        stopCoordinates[1];


      const distance =
        calculateDistance(

          busLatitude,
          busLongitude,

          stopLatitude,
          stopLongitude

        );


      /*
       * Bus is approaching the passenger's
       * destination stop.
       */
      if (
        distance <=
        APPROACHING_DISTANCE_METERS
      ) {

        const cacheKey =
          `${journey.passengerId}_${bus._id}_${stop._id}`;


        const lastNotification =
          approachingNotificationCache.get(
            cacheKey
          );


        const now =
          Date.now();


        /*
         * Skip if notification was sent
         * within the last 10 minutes.
         */
        if (
          lastNotification &&
          now - lastNotification <
            NOTIFICATION_COOLDOWN_MS
        ) {
          continue;
        }


        const distanceKm =
          (
            distance / 1000
          ).toFixed(2);


        try {

          await sendSmartNotification({

            userId:
              journey.passengerId,

            type:
              'approaching',

            title:
              'Bus Approaching',

            message:
              `Bus ${bus.busNumber} is approximately ${distanceKm} km from your stop, ${stop.name}.`,

          });


          /*
           * Remember that we sent the
           * notification.
           */
          approachingNotificationCache.set(
            cacheKey,
            now
          );


          console.log(
            `Approaching notification sent: Bus ${bus.busNumber}, Stop ${stop.name}, Distance ${distanceKm} km`
          );


        } catch (error) {

          console.error(
            'Approaching notification failed:',
            error
          );

        }

      }

    }


  } catch (error) {

    console.error(
      'Approaching passenger check error:',
      error
    );

  }

}


export async function PUT(request) {

  try {

    await connectDB();


    const driver =
      await getDriver();


    if (!driver) {

      return NextResponse.json(
        {
          error:
            'Unauthorized',
        },
        {
          status: 401,
        }
      );

    }


    const {
      latitude,
      longitude,
    } = await request.json();


    if (
      typeof latitude !== 'number' ||
      typeof longitude !== 'number'
    ) {

      return NextResponse.json(
        {
          error:
            'Valid coordinates required',
        },
        {
          status: 400,
        }
      );

    }


    /*
     * Update the driver's assigned bus.
     */
    const bus =
      await Bus.findOneAndUpdate(

        {
          driverId:
            driver.userId,
        },

        {

          currentLocation: {

            type:
              'Point',

            coordinates: [

              longitude,

              latitude,

            ],

          },

        },

        {
          new: true,
        }

      );


    if (!bus) {

      return NextResponse.json(
        {
          error:
            'Assigned bus not found',
        },
        {
          status: 404,
        }
      );

    }


    /*
     * After updating the location,
     * check whether passengers have
     * an approaching bus.
     *
     * This runs without blocking the
     * successful GPS update response.
     */
    await checkApproachingPassengers(
      bus
    );


    return NextResponse.json({

      message:
        'Location updated successfully',

      location:
        bus.currentLocation,

    });


  } catch (error) {

    console.error(
      'Location update error:',
      error
    );


    return NextResponse.json(
      {
        error:
          'Internal Server Error',
      },
      {
        status: 500,
      }
    );

  }

}