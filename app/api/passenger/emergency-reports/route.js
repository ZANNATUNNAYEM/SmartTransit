import { NextResponse } from 'next/server';

import { connectDB } from '@/lib/db';
import Notification from '@/models/Notification';
import {
  EmergencyReport,
  Bus,
} from '@/models';

import { verifyAccessToken } from '@/lib/jwt';


export async function POST(request) {

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


    const body =
      await request.json();


    const {
      busId,
      latitude,
      longitude,
      category,
      description,
    } = body;


    if (
      !latitude ||
      !longitude ||
      !category ||
      !description
    ) {

      return NextResponse.json(
        {
          error:
            'Location, category, and description are required',
        },
        {
          status: 400,
        }
      );

    }


    if (busId) {

      const bus =
        await Bus.findById(busId);


      if (!bus) {

        return NextResponse.json(
          {
            error:
              'Bus not found',
          },
          {
            status: 404,
          }
        );

      }

    }


    const report =
      await EmergencyReport.create({

        passengerId:
          decoded.userId,

        busId:
          busId || undefined,

        location: {

          type:
            'Point',

          coordinates: [

            Number(longitude),

            Number(latitude),

          ],

        },

        category,

        description,

        status:
          'pending',

      });
      await Notification.create({

        userId: '6a78e667cf39d3a508afed77',

        type: 'emergency',

        message:
          `New ${category} emergency reported by passenger.`

      });

    return NextResponse.json(
      {
        success: true,
        report,
      },
      {
        status: 201,
      }
    );


  } catch(error) {

    console.error(
      'Emergency report creation error:',
      error
    );


    return NextResponse.json(
      {
        error:
          'Unable to submit emergency report',
      },
      {
        status: 500,
      }
    );

  }

}
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


    const reports =
      await EmergencyReport.find({
        passengerId:
          decoded.userId,
      })
      .populate(
        'busId',
        'busNumber'
      )
      .sort({
        createdAt: -1,
      });


    return NextResponse.json({

      success:true,

      reports,

    });


  } catch(error) {


    console.error(
      'Fetch emergency reports error:',
      error
    );


    return NextResponse.json(
      {
        error:
          'Unable to fetch emergency reports',
      },
      {
        status:500,
      }
    );

  }

}