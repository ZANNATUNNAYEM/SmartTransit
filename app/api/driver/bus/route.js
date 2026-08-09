import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { connectDB } from '@/lib/db';
import { verifyAccessToken } from '@/lib/jwt';
import { Bus } from '@/models';

export async function GET() {
  try {
    await connectDB();

    const cookieStore = await cookies();

    const token =
      cookieStore.get('access_token')?.value;


    if (!token) {
      return NextResponse.json(
        {
          error: 'Unauthorized'
        },
        {
          status: 401
        }
      );
    }


    const payload =
      verifyAccessToken(token);


    if (
      !payload ||
      payload.role !== 'driver'
    ) {
      return NextResponse.json(
        {
          error: 'Driver access required'
        },
        {
          status:403
        }
      );
    }


    const bus =
      await Bus.findOne({
        driverId: payload.userId
      })
      .populate(
        'routeId'
      );


    if (!bus) {
      return NextResponse.json(
        {
          success:true,
          bus:null
        }
      );
    }


    return NextResponse.json(
      {
        success:true,
        bus
      }
    );


  } catch(error) {

    console.error(
      'Driver bus fetch error:',
      error
    );


    return NextResponse.json(
      {
        error:'Internal Server Error'
      },
      {
        status:500
      }
    );

  }
}