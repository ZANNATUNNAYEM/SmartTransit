import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { verifyAdmin } from '@/lib/auth';
import { Bus, Route } from '@/models';

export async function PATCH(request, context) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const params = await context.params;
    const body = await request.json();
    const { routeId } = body;

    const bus = await Bus.findById(params.id);
    if (!bus) {
      return NextResponse.json({ error: 'Bus not found' }, { status: 404 });
    }

    if (routeId) {
      const route = await Route.findById(routeId);
      if (!route) {
        return NextResponse.json({ error: 'Valid routeId is required' }, { status: 400 });
      }
    }

    bus.routeId = routeId || null;
    await bus.save();

    return NextResponse.json(bus);
  } catch (error) {
    console.error('PATCH /api/admin/buses/[id]/assign-route error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
