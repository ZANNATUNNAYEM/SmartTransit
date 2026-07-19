import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { verifyAdmin } from '@/lib/auth';
import { Trip } from '@/models';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const filterType = searchParams.get('groupBy') || 'route'; // 'route', 'bus', or 'driver'

    const matchStage = { status: 'completed' };
    if (startDate || endDate) {
      matchStage.startTime = {};
      if (startDate) matchStage.startTime.$gte = new Date(startDate);
      if (endDate) matchStage.startTime.$lte = new Date(endDate);
    }

    let groupField = '$routeId';
    let lookupFrom = 'routes';
    let localField = '_id';
    let projectionDetails = '$details.name';

    if (filterType === 'bus') {
      groupField = '$busId';
      lookupFrom = 'buses';
      projectionDetails = '$details.busNumber';
    } else if (filterType === 'driver') {
      groupField = '$driverId';
      lookupFrom = 'users';
      projectionDetails = '$details.name';
    }

    const completedTrips = await Trip.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: groupField,
          completedCount: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: lookupFrom,
          localField: '_id',
          foreignField: '_id',
          as: 'details'
        }
      },
      { $unwind: { path: '$details', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          label: { $ifNull: [projectionDetails, 'Unknown'] },
          completedCount: 1
        }
      },
      { $sort: { completedCount: -1 } }
    ]);

    return NextResponse.json(completedTrips);
  } catch (error) {
    console.error('GET /api/admin/analytics/completed-trips error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
