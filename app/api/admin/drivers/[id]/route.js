import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { verifyAdmin } from '@/lib/auth';
import { User } from '@/models';

export async function DELETE(request, context) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const params = await context.params;
    
    const driver = await User.findOneAndDelete({ _id: params.id, role: 'driver' });
    if (!driver) {
      return NextResponse.json({ error: 'Driver request not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Driver request deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/admin/drivers/[id] error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
