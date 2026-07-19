import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { verifyAdmin } from '@/lib/auth';
import { Bus } from '@/models';

export async function PATCH(request, context) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const params = await context.params;
    const body = await request.json();
    const { status } = body;

    if (!status || !['active', 'disabled'].includes(status)) {
      return NextResponse.json({ error: 'Invalid or missing status (must be active or disabled)' }, { status: 400 });
    }

    const bus = await Bus.findById(params.id);
    if (!bus) {
      return NextResponse.json({ error: 'Bus not found' }, { status: 404 });
    }

    bus.status = status;
    await bus.save();

    return NextResponse.json(bus);
  } catch (error) {
    console.error('PATCH /api/admin/buses/[id]/status error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
