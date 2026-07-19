import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { verifyAdmin } from '@/lib/auth';
import { Route } from '@/models';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const routes = await Route.find({}).populate('stops');
    return NextResponse.json(routes);
  } catch (error) {
    console.error('GET /api/admin/routes error:', error);
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
    const { name, stops, distance, estimatedDuration } = body;

    if (!name || !distance || !estimatedDuration) {
      return NextResponse.json({ error: 'name, distance, and estimatedDuration are required' }, { status: 400 });
    }

    const existingRoute = await Route.findOne({ name: name.trim() });
    if (existingRoute) {
      return NextResponse.json({ error: 'Route name already exists' }, { status: 400 });
    }

    const route = await Route.create({
      name: name.trim(),
      stops: stops || [],
      distance,
      estimatedDuration
    });

    return NextResponse.json(route, { status: 201 });
  } catch (error) {
    console.error('POST /api/admin/routes error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
