import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { verifyAdmin } from '@/lib/auth';
import { BusStop } from '@/models';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const stops = await BusStop.find({});
    return NextResponse.json(stops);
  } catch (error) {
    console.error('GET /api/admin/bus-stops error:', error);
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
    const { name, location, latitude, longitude } = body;

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    let geoPoint = null;
    if (location && location.latitude !== undefined && location.longitude !== undefined) {
      geoPoint = { type: 'Point', coordinates: [Number(location.longitude), Number(location.latitude)] };
    } else if (latitude !== undefined && longitude !== undefined) {
      geoPoint = { type: 'Point', coordinates: [Number(longitude), Number(latitude)] };
    } else if (location && location.type === 'Point' && Array.isArray(location.coordinates)) {
      geoPoint = location;
    }

    if (!geoPoint) {
      return NextResponse.json({ error: 'Valid location coordinates are required' }, { status: 400 });
    }

    const stop = await BusStop.create({
      name: name.trim(),
      location: geoPoint
    });

    return NextResponse.json(stop, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/bus-stops error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
