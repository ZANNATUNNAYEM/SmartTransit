import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { verifyAdmin } from '@/lib/auth';
import { Route } from '@/models';

export async function PATCH(request, context) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const params = await context.params;
    const body = await request.json();
    const { stops } = body;

    if (!stops || !Array.isArray(stops)) {
      return NextResponse.json({ error: 'stops array is required' }, { status: 400 });
    }

    const route = await Route.findById(params.id);
    if (!route) {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 });
    }

    route.stops = stops;
    await route.save();

    return NextResponse.json(route);
  } catch (error) {
    console.error('PATCH /api/admin/routes/[id]/stops error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
