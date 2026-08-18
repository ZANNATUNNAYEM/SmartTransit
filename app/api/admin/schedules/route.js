import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { verifyAdmin } from '@/lib/auth';
import { Schedule } from '@/models';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const routeId = searchParams.get('routeId');
    const busId = searchParams.get('busId');

    const filter = {};
    if (routeId) filter.routeId = routeId;
    if (busId) filter.busId = busId;

    const schedules = await Schedule.find(filter)
      .populate('routeId')
      .populate('busId');

    return NextResponse.json(schedules);
  } catch (error) {
    console.error('GET /api/admin/schedules error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await request.json();
    const { routeId, busId, departureTimes, frequency } = body;

    if (!routeId || !busId || !departureTimes) {
      return NextResponse.json({ error: 'routeId, busId, and departureTimes are required' }, { status: 400 });
    }

    const schedule = await Schedule.create({
      routeId,
      busId,
      departureTimes,
      frequency: frequency || ''
    });

    return NextResponse.json(schedule, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/schedules error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
