import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { verifyAdmin } from '@/lib/auth';
import { Bus, User } from '@/models';

export async function PATCH(request, context) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const params = await context.params;
    const body = await request.json();
    const { driverId } = body;

    const bus = await Bus.findById(params.id);
    if (!bus) {
      return NextResponse.json({ error: 'Bus not found' }, { status: 404 });
    }

    if (driverId) {
      const driver = await User.findById(driverId);
      if (!driver || driver.role !== 'driver') {
        return NextResponse.json({ error: 'Valid driverId is required' }, { status: 400 });
      }
    }

    bus.driverId = driverId || null;
    await bus.save();

    return NextResponse.json(bus);
  } catch (error) {
    console.error('PATCH /api/admin/buses/[id]/assign-driver error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
