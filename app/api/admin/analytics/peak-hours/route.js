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

    const peakHours = await Trip.aggregate([
      { $match: matchStage },
      {
        $project: {
          hour: { $hour: '$startTime' }
        }
      },
      {
        $group: {
          _id: '$hour',
          tripCount: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          hour: '$_id',
          tripCount: 1
        }
      },
      { $sort: { hour: 1 } }
    ]);

    return NextResponse.json(peakHours);
  } catch (error) {
    console.error('GET /api/admin/analytics/peak-hours error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
