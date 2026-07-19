import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { verifyAdmin } from '@/lib/auth';
import { Route } from '@/models';

export async function GET(request, context) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const params = await context.params;
    const route = await Route.findById(params.id).populate('stops');

    if (!route) {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 });
    }

    return NextResponse.json(route);
  } catch (error) {
    console.error('GET /api/admin/routes/[id] error:', error);
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

    const route = await Route.findById(params.id);
    if (!route) {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 });
    }

    const { name, distance, estimatedDuration } = body;
    if (name !== undefined) route.name = name.trim();
    if (distance !== undefined) route.distance = distance;
    if (estimatedDuration !== undefined) route.estimatedDuration = estimatedDuration;

    await route.save();
    return NextResponse.json(route);
  } catch (error) {
    console.error('PATCH /api/admin/routes/[id] error:', error);
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
    const route = await Route.findByIdAndDelete(params.id);
    if (!route) {
      return NextResponse.json({ error: 'Route not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Route deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/admin/routes/[id] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
