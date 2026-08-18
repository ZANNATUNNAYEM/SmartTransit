import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { verifyAdmin } from '@/lib/auth';
import { Bus } from '@/models';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const routeId = searchParams.get('routeId');

    const filter = {};
    if (status) filter.status = status;
    if (routeId) filter.routeId = routeId;

    const buses = await Bus.find(filter)
      .populate('routeId')
      .populate('driverId', 'name email phone');

    return NextResponse.json(buses);
  } catch (error) {
    console.error('GET /api/admin/buses error:', error);
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
    const { busNumber, capacity, routeId, driverId, status, currentLocation } = body;

    if (!busNumber || !capacity) {
      return NextResponse.json({ error: 'busNumber and capacity are required' }, { status: 400 });
    }

    const existingBus = await Bus.findOne({ busNumber: busNumber.trim() });
    if (existingBus) {
      return NextResponse.json({ error: 'Bus number already exists' }, { status: 400 });
    }

    const bus = await Bus.create({
      busNumber: busNumber.trim(),
      capacity,
      routeId: routeId || null,
      driverId: driverId || null,
      status: status || 'active',
      currentLocation: currentLocation || { type: 'Point', coordinates: [0, 0] }
    });

    return NextResponse.json(bus, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/buses error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
