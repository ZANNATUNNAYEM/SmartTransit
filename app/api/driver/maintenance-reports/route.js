import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import MaintenanceReport from '@/models/MaintenanceReport';
import Bus from '@/models/Bus';
import User from '@/models/User';
import Notification from '@/models/Notification';
import jwt from 'jsonwebtoken';


export async function POST(request) {

  try {

    await connectDB();


    const token =
      request.cookies.get('access_token')?.value;


    if (!token) {
      return NextResponse.json(
        {
          error: 'Unauthorized'
        },
        {
          status:401
        }
      );
    }


    const decoded =
      jwt.verify(
        token,
        process.env.JWT_SECRET
      );


    const driver =
      await User.findById(
        decoded.userId
      );


    if (
      !driver ||
      driver.role !== 'driver'
    ) {

      return NextResponse.json(
        {
          error:'Driver access required'
        },
        {
          status:403
        }
      );

    }


    const body =
      await request.json();


    const {
      busId,
      category,
      severity,
      location,
      images,
    } = body;


    if (
      !busId ||
      !category ||
      !severity ||
      !location
    ) {

      return NextResponse.json(
        {
          error:'Required fields missing'
        },
        {
          status:400
        }
      );

    }


    const bus =
      await Bus.findOne({
        _id: busId,
        driverId: decoded.userId,
      });


    if (!bus) {

      return NextResponse.json(
        {
          error:
          'This bus is not assigned to you'
        },
        {
          status:403
        }
      );

    }


    const report =
      await MaintenanceReport.create({

        busId,

        driverId:
          decoded.userId,

        category,

        severity,

        location,

        images:
          images || [],

      });

    const admins =
    await User.find({
        role: 'admin',
    });


    for (const admin of admins) {

    await Notification.create({

        userId:
        admin._id,

        type:
        'maintenance',

        message:
        `New maintenance report submitted for bus ${bus.busNumber}`,

    });

    }

    return NextResponse.json(
      {
        success:true,
        report,
      },
      {
        status:201
      }
    );


  } catch(error) {

    console.error(
      'Maintenance report error:',
      error
    );


    return NextResponse.json(
      {
        error:error.message
      },
      {
        status:500
      }
    );

  }

}