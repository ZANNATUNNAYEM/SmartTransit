import { NextResponse } from 'next/server';

import { connectDB } from '@/lib/db';

import {
  User,
  PassengerJourney,
} from '@/models';

import { verifyAccessToken } from '@/lib/jwt';


export async function GET(request) {

  try {

    await connectDB();


    const token =
      request.cookies.get('access_token')?.value;


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


    const user =
      await User.findById(
        decoded.userId
      )
        .populate('favoriteRoutes')
        .populate('favoriteStops');


    if (!user) {

      return NextResponse.json(
        {
          error: 'User not found',
        },
        {
          status: 404,
        }
      );

    }


    /*
     * Get recent travel history.
     */

    const journeys =
      await PassengerJourney.find({
        passengerId:
          decoded.userId,
      })
        .populate('routeId')
        .populate('toStopId')
        .sort({
          journeyDate: -1,
        })
        .limit(20);


    /*
     * Recent searches are stored
     * inside the User document.
     *
     * We populate the bus and route
     * information so we can use them
     * for recommendations.
     */

    const userWithSearches =
      await User.findById(
        decoded.userId
      )
        .populate({
          path: 'recentSearches.busId',
          populate: {
            path: 'routeId',
          },
        });


    const suggestions = [];


    /*
     * We use a Map so the same route
     * or stop can receive points from
     * multiple passenger behaviours.
     */

    const routeScores = new Map();

    const stopScores = new Map();


    /*
     * --------------------------------
     * 1. Favourite routes
     * --------------------------------
     */

    if (
      user.favoriteRoutes &&
      user.favoriteRoutes.length > 0
    ) {

      user.favoriteRoutes.forEach(
        (route) => {

          const routeId =
            route._id.toString();

          const existing =
            routeScores.get(routeId) || {
              route,
              score: 0,
              reasons: [],
            };


          existing.score += 100;

          existing.reasons.push(
            'saved as a favourite route'
          );


          routeScores.set(
            routeId,
            existing
          );

        }
      );

    }


    /*
     * --------------------------------
     * 2. Favourite stops
     * --------------------------------
     */

    if (
      user.favoriteStops &&
      user.favoriteStops.length > 0
    ) {

      user.favoriteStops.forEach(
        (stop) => {

          const stopId =
            stop._id.toString();

          const existing =
            stopScores.get(stopId) || {
              stop,
              score: 0,
              reasons: [],
            };


          existing.score += 90;

          existing.reasons.push(
            'saved as a favourite stop'
          );


          stopScores.set(
            stopId,
            existing
          );

        }
      );

    }


    /*
     * --------------------------------
     * 3. Recent searches
     * --------------------------------
     */

    if (
      userWithSearches?.recentSearches
    ) {

      userWithSearches.recentSearches
        .slice(0, 10)
        .forEach((search, index) => {

          const bus =
            search.busId;

          if (!bus?.routeId) {
            return;
          }


          const route =
            bus.routeId;

          const routeId =
            route._id.toString();


          const existing =
            routeScores.get(routeId) || {
              route,
              score: 0,
              reasons: [],
            };


          /*
           * Newer searches receive
           * slightly more points.
           */

          const searchScore =
            Math.max(
              30,
              60 - index * 5
            );


          existing.score +=
            searchScore;


          existing.reasons.push(
            'recently searched'
          );


          routeScores.set(
            routeId,
            existing
          );

        });

    }


    /*
     * --------------------------------
     * 4. Travel history
     * --------------------------------
     */

    const routeTravelCounts =
      new Map();


    journeys.forEach(
      (journey) => {

        if (!journey.routeId) {
          return;
        }


        const routeId =
          journey.routeId._id.toString();


        routeTravelCounts.set(
          routeId,
          (
            routeTravelCounts.get(
              routeId
            ) || 0
          ) + 1
        );


        const existing =
          routeScores.get(routeId) || {
            route:
              journey.routeId,

            score: 0,

            reasons: [],
          };


        existing.score += 80;

        existing.reasons.push(
          'used in your travel history'
        );


        routeScores.set(
          routeId,
          existing
        );

      }
    );


    /*
     * --------------------------------
     * 5. Frequently visited destinations
     * --------------------------------
     */

    const destinationCounts =
      new Map();


    journeys.forEach(
      (journey) => {

        if (!journey.toStopId) {
          return;
        }


        const stopId =
          journey.toStopId._id.toString();


        destinationCounts.set(
          stopId,
          (
            destinationCounts.get(
              stopId
            ) || 0
          ) + 1
        );

      }
    );


    destinationCounts.forEach(
      (count, stopId) => {

        const journey =
          journeys.find(
            (item) =>
              item.toStopId?._id
                ?.toString() === stopId
          );


        if (!journey?.toStopId) {
          return;
        }


        const existing =
          stopScores.get(stopId) || {
            stop:
              journey.toStopId,

            score: 0,

            reasons: [],
          };


        /*
         * More visits = stronger
         * recommendation.
         */

        existing.score +=
          70 + count * 10;


        existing.reasons.push(
          `${count} previous ${
            count === 1
              ? 'visit'
              : 'visits'
          }`
        );


        stopScores.set(
          stopId,
          existing
        );

      }
    );


    /*
     * --------------------------------
     * Convert route scores into
     * recommendation objects.
     * --------------------------------
     */

    routeScores.forEach(
      (item) => {

        suggestions.push({

          type:
            'route-recommendation',

          title:
            item.route.name,

          description:
            'A route that matches your travel habits.',

          reason:
            item.reasons
              .filter(
                (reason, index, array) =>
                  array.indexOf(reason) === index
              )
              .join(' • '),

          routeId:
            item.route._id,

          score:
            item.score,

        });

      }
    );


    /*
     * --------------------------------
     * Convert stop scores into
     * recommendation objects.
     * --------------------------------
     */

    stopScores.forEach(
      (item) => {

        suggestions.push({

          type:
            'destination-recommendation',

          title:
            item.stop.name,

          description:
            'A destination that matches your travel habits.',

          reason:
            item.reasons
              .filter(
                (reason, index, array) =>
                  array.indexOf(reason) === index
              )
              .join(' • '),

          stopId:
            item.stop._id,

          score:
            item.score,

        });

      }
    );


    /*
     * --------------------------------
     * Sort by combined behaviour score.
     * --------------------------------
     */

    suggestions.sort(
      (a, b) =>
        b.score - a.score
    );


    /*
     * Return the strongest 6
     * recommendations.
     */

    return NextResponse.json({

      success: true,

      suggestions:
        suggestions.slice(0, 6),

    });


  } catch (error) {

    console.error(
      'Travel suggestions error:',
      error
    );


    return NextResponse.json(
      {
        error:
          'Unable to generate travel suggestions',
      },
      {
        status: 500,
      }
    );

  }

}