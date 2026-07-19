import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { verifyAdmin } from '@/lib/auth';
import { Bus } from '@/models';

export async function GET(request, context) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const params = await context.params;
    const bus = await Bus.findById(params.id)
      .populate('routeId')
      .populate('driverId', 'name email phone');

    if (!bus) {
      return NextResponse.json({ error: 'Bus not found' }, { status: 404 });
    }

    return NextResponse.json(bus);
  } catch (error) {
    console.error('GET /api/admin/buses/[id] error:', error);
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

    const bus = await Bus.findById(params.id);
    if (!bus) {
      return NextResponse.json({ error: 'Bus not found' }, { status: 404 });
    }

    // Update allowed fields
    const { busNumber, capacity, routeId, driverId, status, currentLocation } = body;
    if (busNumber !== undefined) bus.busNumber = busNumber.trim();
    if (capacity !== undefined) bus.capacity = capacity;
    if (routeId !== undefined) bus.routeId = routeId || null;
    if (driverId !== undefined) bus.driverId = driverId || null;
    if (status !== undefined) bus.status = status;
    if (currentLocation !== undefined) bus.currentLocation = currentLocation;

    await bus.save();
    return NextResponse.json(bus);
  } catch (error) {
    console.error('PATCH /api/admin/buses/[id] error:', error);
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
    const bus = await Bus.findByIdAndDelete(params.id);
    if (!bus) {
      return NextResponse.json({ error: 'Bus not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Bus deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/admin/buses/[id] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
