import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import DriverAttendance from '@/models/DriverAttendance';
import jwt from 'jsonwebtoken';


export async function POST(request) {

  try {

    await connectDB();


    const token =
      request.cookies.get('access_token')?.value;


    if (!token) {

      return NextResponse.json(
        {
          error:'Unauthorized'
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


    const today =
      new Date();


    today.setHours(
      0,
      0,
      0,
      0
    );


    let attendance =
      await DriverAttendance.findOne({

        driverId:
          decoded.userId,

        date: today,

      });



    if (!attendance) {


      attendance =
        await DriverAttendance.create({

          driverId:
            decoded.userId,

          date:
            today,

          status:
            'present',

          checkInTime:
            new Date().toLocaleTimeString(),

        });


    }



    return NextResponse.json({

      success:true,

      attendance,

    });



  } catch(error) {


    console.error(
      'Attendance error:',
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