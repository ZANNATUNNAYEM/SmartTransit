import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { verifyAdmin } from '@/lib/auth';
import { Schedule } from '@/models';

export async function GET(request, context) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const params = await context.params;
    const schedule = await Schedule.findById(params.id)
      .populate('routeId')
      .populate('busId');

    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    return NextResponse.json(schedule);
  } catch (error) {
    console.error('GET /api/admin/schedules/[id] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request, context) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const params = await context.params;
    const body = await request.json();

    const schedule = await Schedule.findById(params.id);
    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    const { departureTimes, frequency, routeId, busId } = body;
    if (departureTimes !== undefined) schedule.departureTimes = departureTimes;
    if (frequency !== undefined) schedule.frequency = frequency;
    if (routeId !== undefined) schedule.routeId = routeId;
    if (busId !== undefined) schedule.busId = busId;

    await schedule.save();
    return NextResponse.json(schedule);
  } catch (error) {
    console.error('PATCH /api/admin/schedules/[id] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request, context) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const params = await context.params;
    const schedule = await Schedule.findByIdAndDelete(params.id);
    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Schedule deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/admin/schedules/[id] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
