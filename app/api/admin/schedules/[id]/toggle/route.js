import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { verifyAdmin } from '@/lib/auth';
import { Schedule } from '@/models';

export async function PATCH(request, context) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const params = await context.params;
    const body = await request.json();
    const { isActive } = body;

    if (isActive === undefined || typeof isActive !== 'boolean') {
      return NextResponse.json({ error: 'isActive boolean value is required' }, { status: 400 });
    }

    const schedule = await Schedule.findById(params.id);
    if (!schedule) {
      return NextResponse.json({ error: 'Schedule not found' }, { status: 404 });
    }

    schedule.isActive = isActive;
    await schedule.save();

    return NextResponse.json(schedule);
  } catch (error) {
    console.error('PATCH /api/admin/schedules/[id]/toggle error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
