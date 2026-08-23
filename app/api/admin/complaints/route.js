import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Complaint, User } from '@/models';
import { verifyAccessToken } from '@/lib/jwt';

export async function GET(request) {
  try {
    await connectDB();

    const token = request.cookies.get('admin_session')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyAccessToken(token);
    if (!decoded?.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const admin = await User.findById(decoded.userId);
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const complaints = await Complaint.find()
      .populate('userId', 'name email')
      .populate('relatedBusId', 'busNumber')
      .populate('relatedRouteId', 'name')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, complaints });
  } catch (error) {
    console.error('Admin fetch complaints error:', error);
    return NextResponse.json({ error: 'Unable to fetch complaints' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    await connectDB();

    const token = request.cookies.get('admin_session')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyAccessToken(token);
    if (!decoded?.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const admin = await User.findById(decoded.userId);
    if (!admin || admin.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { complaintId, status, resolutionNote } = body;

    if (!complaintId || !status) {
      return NextResponse.json({ error: 'complaintId and status are required' }, { status: 400 });
    }

    const allowedStatuses = ['pending', 'in-progress', 'resolved'];
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const updateFields = { status };
    if (resolutionNote !== undefined) {
      updateFields.resolutionNote = resolutionNote;
    }

    const updatedComplaint = await Complaint.findByIdAndUpdate(
      complaintId,
      updateFields,
      { new: true }
    );

    if (!updatedComplaint) {
      return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, complaint: updatedComplaint });
  } catch (error) {
    console.error('Update complaint error:', error);
    return NextResponse.json({ error: 'Unable to update complaint' }, { status: 500 });
  }
}
