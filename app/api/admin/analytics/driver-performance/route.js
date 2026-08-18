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

    const matchStage = {};
    if (startDate || endDate) {
      matchStage.startTime = {};
      if (startDate) matchStage.startTime.$gte = new Date(startDate);
      if (endDate) matchStage.startTime.$lte = new Date(endDate);
    }

    const performance = await Trip.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$driverId',
          totalTrips: { $sum: 1 },
          completedTrips: {
            $sum: {
              $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
            }
          },
          delayedTrips: {
            $sum: {
              $cond: [{ $eq: ['$status', 'delayed'] }, 1, 0]
            }
          },
          totalDelayMinutes: { $sum: '$delayMinutes' }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'driverDetails'
        }
      },
      { $unwind: '$driverDetails' },
      {
        $project: {
          _id: 1,
          driverName: '$driverDetails.name',
          driverEmail: '$driverDetails.email',
          totalTrips: 1,
          completedTrips: 1,
          delayedTrips: 1,
          totalDelayMinutes: 1,
          punctualityRate: {
            $cond: [
              { $gt: ['$totalTrips', 0] },
              { $round: [{ $multiply: [{ $divide: [{ $subtract: ['$totalTrips', '$delayedTrips'] }, '$totalTrips'] }, 100] }, 1] },
              100
            ]
          }
        }
      },
      { $sort: { punctualityRate: -1 } }
    ]);

    return NextResponse.json(performance);
  } catch (error) {
    console.error('GET /api/admin/analytics/driver-performance error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
