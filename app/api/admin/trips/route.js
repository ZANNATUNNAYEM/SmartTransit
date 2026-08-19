import { NextResponse } from 'next/server';
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
    const trips = await Trip.find({})
      .populate('busId', 'busNumber')
      .populate('driverId', 'name email')
      .populate('routeId', 'name')
      .sort({ startTime: -1 })
      .limit(100);

    return NextResponse.json(trips);
  } catch (error) {
    console.error('GET /api/admin/trips error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
