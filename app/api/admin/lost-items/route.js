import { NextResponse } from 'next/server';

import { connectDB } from '@/lib/db';

import {
  LostItem,
  User,
} from '@/models';

import {
  verifyAccessToken,
} from '@/lib/jwt';



// GET ALL LOST ITEM REPORTS (ADMIN)

export async function GET(request) {

  try {

    await connectDB();


    const token =
      request.cookies.get('admin_session')?.value;


    if (!token) {

      return NextResponse.json(
        {
          error:'Unauthorized',
        },
        {
          status:401,
        }
      );

    }


    const decoded =
      verifyAccessToken(token);


    if (!decoded?.userId) {

      return NextResponse.json(
        {
          error:'Invalid token',
        },
        {
          status:401,
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
          error:'Admin access required',
        },
        {
          status:403,
        }
      );

    }


    const reports =
      await LostItem.find()
        .populate(
          'passengerId',
          'name email'
        )
        .populate(
          'busId',
          'busNumber'
        )
        .populate(
          'tripId',
          'journeyDate'
        )        
        .sort({
          createdAt:-1,
        });


    return NextResponse.json({

      success:true,

      reports,

    });


  } catch(error) {


    console.error(
      'Admin lost items fetch error:',
      error
    );


    return NextResponse.json(
      {
        error:
          error.message ||
          'Unable to fetch lost items',
      },
      {
        status:500,
      }
    );

  }

}




// UPDATE LOST ITEM STATUS

export async function PATCH(request) {

  try {

    await connectDB();


    const token =
      request.cookies.get('admin_session')?.value;


    if (!token) {

      return NextResponse.json(
        {
          error:'Unauthorized',
        },
        {
          status:401,
        }
      );

    }


    const decoded =
      verifyAccessToken(token);


    if (!decoded?.userId) {

      return NextResponse.json(
        {
          error:'Invalid token',
        },
        {
          status:401,
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
          error:'Admin access required',
        },
        {
          status:403,
        }
      );

    }


    const body =
      await request.json();


    const {
      itemId,
      status,
    } = body;


    if (!itemId || !status) {

      return NextResponse.json(
        {
          error:
            'itemId and status are required',
        },
        {
          status:400,
        }
      );

    }


    const allowedStatuses = [
      'reported',
      'found',
      'claimed',
    ];


    if (!allowedStatuses.includes(status)) {

      return NextResponse.json(
        {
          error:
            'Invalid status',
        },
        {
          status:400,
        }
      );

    }


    const updatedItem =
      await LostItem.findByIdAndUpdate(
        itemId,
        {
          status,
        },
        {
          new:true,
        }
      );


    if (!updatedItem) {

      return NextResponse.json(
        {
          error:
            'Lost item not found',
        },
        {
          status:404,
        }
      );

    }


    return NextResponse.json({

      success:true,

      item:
        updatedItem,

    });


  } catch(error) {


    console.error(
      'Lost item update error:',
      error
    );


    return NextResponse.json(
      {
        error:
          error.message ||
          'Unable to update lost item',
      },
      {
        status:500,
      }
    );

  }

}