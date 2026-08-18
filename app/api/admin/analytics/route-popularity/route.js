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

    const routePopularity = await Trip.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$routeId',
          tripCount: { $sum: 1 }
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
          tripCount: 1,
          routeName: '$routeDetails.name'
        }
      },
      { $sort: { tripCount: -1 } }
    ]);

    return NextResponse.json(routePopularity);
  } catch (error) {
    console.error('GET /api/admin/analytics/route-popularity error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
