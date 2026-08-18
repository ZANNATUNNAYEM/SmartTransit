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

    const avgDelays = await Trip.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$routeId',
          averageDelayMinutes: { $avg: '$delayMinutes' },
          totalTrips: { $sum: 1 },
          delayedTripsCount: {
            $sum: {
              $cond: [{ $eq: ['$status', 'delayed'] }, 1, 0]
            }
          }
        }
      },
      {
        $lookup: {
          from: 'routes',
          localField: '_id',
          foreignField: '_id',
          as: 'routeDetails'
        }
      },
      { $unwind: '$routeDetails' },
      {
        $project: {
          _id: 1,
          routeName: '$routeDetails.name',
          averageDelayMinutes: { $round: ['$averageDelayMinutes', 1] },
          totalTrips: 1,
          delayedTripsCount: 1
        }
      },
      { $sort: { averageDelayMinutes: -1 } }
    ]);

    return NextResponse.json(avgDelays);
  } catch (error) {
    console.error('GET /api/admin/analytics/average-delay error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
