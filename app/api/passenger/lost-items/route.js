import { NextResponse } from 'next/server';

import { connectDB } from '@/lib/db';

import {
  LostItem,
  User,
  Notification,
} from '@/models';

import {
  verifyAccessToken,
} from '@/lib/jwt';

import {
  sendSmartNotification,
} from '@/lib/notifications';

// GET PASSENGER LOST ITEM REPORTS
export async function GET(request) {

  try {

    await connectDB();


    const token =
      request.cookies.get('access_token')?.value ||
      request.cookies.get('user_session')?.value;


    if (!token) {

      return NextResponse.json(
        {
          error: 'Unauthorized',
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

    const { searchParams } =
      new URL(request.url);

    const mine =
      searchParams.get('mine') === 'true';
    const reports = await LostItem.find(
      mine
        ? { passengerId: decoded.userId }
        : {}
    )
      .populate('passengerId', 'name email')
      .sort({
        createdAt:-1,
      });


    return NextResponse.json({

      success:true,

      reports,

    });


  } catch(error) {


    console.error(
      'Lost item fetch error:',
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

// CREATE LOST ITEM REPORT
export async function POST(request) {

  try {

    await connectDB();


    const token =
      request.cookies.get('access_token')?.value ||
      request.cookies.get('user_session')?.value;


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


    const body =
      await request.json();


    const {
      description,
      busId,
      tripId,      
    } = body;


    if (!description) {

      return NextResponse.json(
        {
          error:
            'Description is required',
        },
        {
          status:400,
        }
      );

    }


    const report =
      await LostItem.create({

        passengerId:
          decoded.userId,
        busId,
        tripId,
        description,

        status:
          'reported',

      });
      await Notification.create({

        userId:
          '6a78e667cf39d3a508afed77',

        type:
          'lost_item',

        message:
          `New lost item report received: ${description}`

      });

    return NextResponse.json({

      success:true,

      report,

    });


  } catch(error) {


    console.error(
      'Lost item creation error:',
      error
    );


    return NextResponse.json(
      {
        error:
          error.message ||
          'Unable to create lost item report',
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
      request.cookies.get('access_token')?.value ||
      request.cookies.get('user_session')?.value;

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = verifyAccessToken(token);

    if (!decoded?.userId) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      );
    }

    const passenger = await User.findById(decoded.userId);

    if (!passenger || passenger.role !== 'passenger') {
      return NextResponse.json(
        { error: 'Passenger access required' },
        { status: 403 }
      );
    }

    const { itemId, status } = await request.json();

    if (!itemId || !status) {
      return NextResponse.json(
        { error: 'itemId and status are required' },
        { status: 400 }
      );
    }

    const allowedStatuses = [
      'found',
      'claimed',
      'submitted_in_office'
    ];

    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid passenger action' },
        { status: 400 }
      );
    }

    const item = await LostItem.findById(itemId);

    if (!item) {
      return NextResponse.json(
        { error: 'Lost item not found' },
        { status: 404 }
      );
    }

    item.status = status;

    await item.save();


    // Get the passenger who originally reported the item
    const reporter = await User.findById(
      item.passengerId
    );


    // Get all administrators
    const admins = await User.find({
      role: 'admin'
    });


    // Convert the database status into a readable action
    const actionLabels = {
      found: 'Found',
      claimed: 'Claimed',
      submitted_in_office: 'Submitted in Office'
    };

    const actionLabel = actionLabels[status];

    const actorName =
      passenger.name ||
      passenger.email ||
      'A passenger';


    // Notify all admins
    for (const admin of admins) {
      try {
        await sendSmartNotification({
          userId: admin._id,
          type: 'lost_item_action',
          title: 'Lost & Found Update',
          message:
            `${actorName} marked the lost item "${item.description}" as "${actionLabel}".`
        });
      } catch (notificationError) {
        console.error(
          'Admin lost item notification failed:',
          notificationError
        );
      }
    }


    // Notify the original reporter
    if (reporter) {
      try {
        await sendSmartNotification({
          userId: reporter._id,
          type: 'lost_item_update',
          title: 'Lost Item Update',
          message:
            `Your lost item "${item.description}" was marked as "${actionLabel}".`
        });
      } catch (notificationError) {
        console.error(
          'Reporter lost item notification failed:',
          notificationError
        );
      }
    }


    return NextResponse.json({
      success: true,
      message: 'Lost item status updated successfully.',
      item
    });

  } catch (error) {
    console.error(
      'Passenger lost item status update error:',
      error
    );

    return NextResponse.json(
      {
        error:
          error.message ||
          'Unable to update lost item'
      },
      { status: 500 }
    );
  }
}