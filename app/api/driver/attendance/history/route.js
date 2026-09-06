import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import DriverAttendance from '@/models/DriverAttendance';
import jwt from 'jsonwebtoken';


export async function GET(request) {

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


    const attendance =
      await DriverAttendance.find({

        driverId:
          decoded.userId,

    })
    .sort({
      date:-1
    });



    return NextResponse.json({

      success:true,

      attendance,

    });



  } catch(error) {


    console.error(
      'Attendance history error:',
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