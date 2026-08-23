import { NextResponse } from 'next/server';

import { connectDB } from '@/lib/db';

import {
  EmergencyReport,
  User,
  Bus,
} from '@/models';

import { verifyAccessToken } from '@/lib/jwt';


// GET ALL EMERGENCY REPORTS (ADMIN)

export async function GET(request) {

  try {

    await connectDB();


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


    const admin =
      await User.findById(
        decoded.userId
      );


    if (
      !admin ||
      admin.role !== 'admin'
    ) {

      return NextResponse.json(
        {
          error:
            'Admin access required',
        },
        {
          status: 403,
        }
      );

    }


    const reports =
      await EmergencyReport.find()
        .populate(
          'passengerId',
          'name email'
        )
        .populate(
          'busId',
          'busNumber'
        )
        .sort({
          createdAt: -1,
        });


    return NextResponse.json({

      success: true,

      reports,

    });


  } catch(error) {


    console.error(
      'Admin emergency reports error:',
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

export async function PATCH(request) {

  try {

    await connectDB();


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


    const admin =
      await User.findById(decoded.userId);


    if (!admin || admin.role !== 'admin') {

      return NextResponse.json(
        {
          error: 'Admin access required',
        },
        {
          status: 403,
        }
      );

    }


    const body =
      await request.json();


    const {
      reportId,
      status,
    } = body;


    if (!reportId || !status) {

      return NextResponse.json(
        {
          error:
            'reportId and status are required',
        },
        {
          status: 400,
        }
      );

    }


    const allowedStatuses = [
      'pending',
      'investigating',
      'resolved'
    ];


    if (!allowedStatuses.includes(status)) {

      return NextResponse.json(
        {
          error:
            'Invalid status',
        },
        {
          status: 400,
        }
      );

    }


    const updatedReport =
      await EmergencyReport.findByIdAndUpdate(
        reportId,
        {
          status,
        },
        {
          new:true,
        }
      );


    if (!updatedReport) {

      return NextResponse.json(
        {
          error:
            'Emergency report not found',
        },
        {
          status:404,
        }
      );

    }


    return NextResponse.json({

      success:true,

      report:
        updatedReport,

    });


  } catch(error) {


    console.error(
      'Update emergency report error:',
      error
    );


    return NextResponse.json(
      {
        error:
          error.message ||
          'Unable to update emergency report',
      },
      {
        status:500,
      }
    );

  }

}