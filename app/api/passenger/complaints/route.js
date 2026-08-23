import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Complaint, Notification } from '@/models';
import { verifyAccessToken } from '@/lib/jwt';

export async function GET(request) {
  try {
    await connectDB();

    const token =
      request.cookies.get('access_token')?.value ||
      request.cookies.get('user_session')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyAccessToken(token);
    if (!decoded?.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const complaints = await Complaint.find({ userId: decoded.userId })
      .populate('relatedBusId', 'busNumber')
      .populate('relatedRouteId', 'name')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, complaints });
  } catch (error) {
    console.error('Fetch complaints error:', error);
    return NextResponse.json({ error: 'Unable to fetch complaints' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();

    const token =
      request.cookies.get('access_token')?.value ||
      request.cookies.get('user_session')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyAccessToken(token);
    if (!decoded?.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { category, description, relatedBusId, relatedRouteId } = body;

    if (!category || !description) {
      return NextResponse.json({ error: 'Category and description are required' }, { status: 400 });
    }

    const complaint = await Complaint.create({
      userId: decoded.userId,
      category,
      description,
      relatedBusId: relatedBusId || undefined,
      relatedRouteId: relatedRouteId || undefined,
      status: 'pending',
    });

    await Notification.create({
      userId: '6a78e667cf39d3a508afed77', // Admin User ID
      type: 'complaint',
      message: `New passenger complaint received: "${category}"`,
    });

    return NextResponse.json({ success: true, complaint }, { status: 201 });
  } catch (error) {
    console.error('Create complaint error:', error);
    return NextResponse.json({ error: 'Unable to submit complaint' }, { status: 500 });
  }
}
