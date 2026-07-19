import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { verifyAdmin } from '@/lib/auth';
import { BusStop } from '@/models';

export async function GET(request, context) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const params = await context.params;
    const stop = await BusStop.findById(params.id);

    if (!stop) {
      return NextResponse.json({ error: 'Bus stop not found' }, { status: 404 });
    }

    return NextResponse.json(stop);
  } catch (error) {
    console.error('GET /api/admin/bus-stops/[id] error:', error);
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

    const stop = await BusStop.findById(params.id);
    if (!stop) {
      return NextResponse.json({ error: 'Bus stop not found' }, { status: 404 });
    }

    const { name, location, latitude, longitude } = body;
    if (name !== undefined) stop.name = name.trim();

    let geoPoint = null;
    if (location && location.latitude !== undefined && location.longitude !== undefined) {
      geoPoint = { type: 'Point', coordinates: [Number(location.longitude), Number(location.latitude)] };
    } else if (latitude !== undefined && longitude !== undefined) {
      geoPoint = { type: 'Point', coordinates: [Number(longitude), Number(latitude)] };
    } else if (location && location.type === 'Point' && Array.isArray(location.coordinates)) {
      geoPoint = location;
    }

    if (geoPoint) {
      stop.location = geoPoint;
    }

    await stop.save();
    return NextResponse.json(stop);
  } catch (error) {
    console.error('PATCH /api/admin/bus-stops/[id] error:', error);
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
    const stop = await BusStop.findByIdAndDelete(params.id);
    if (!stop) {
      return NextResponse.json({ error: 'Bus stop not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Bus stop deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/admin/bus-stops/[id] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
