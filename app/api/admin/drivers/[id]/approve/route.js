import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { verifyAdmin } from '@/lib/auth';
import { User } from '@/models';

export async function PATCH(request, context) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const params = await context.params;
    const body = await request.json();
    const { action } = body;

    const driver = await User.findById(params.id);
    if (!driver || driver.role !== 'driver') {
      return NextResponse.json({ error: 'Driver not found' }, { status: 404 });
    }

    if (action === 'approve') {
      driver.isApproved = true;
      driver.status = 'active';
    } else if (action === 'reject') {
      driver.isApproved = false;
      driver.status = 'rejected';
    } else {
      return NextResponse.json({ error: 'Invalid action. Use "approve" or "reject"' }, { status: 400 });
    }

    await driver.save();
    return NextResponse.json(driver);
  } catch (error) {
    console.error('PATCH /api/admin/drivers/[id]/approve error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
