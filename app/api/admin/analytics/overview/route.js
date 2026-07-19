import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { verifyAdmin } from '@/lib/auth';
import { Bus, Route, Schedule, User, Trip, Complaint } from '@/models';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const admin = await verifyAdmin();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // 1. Gather high-level stats
    const totalBuses = await Bus.countDocuments({});
    const totalRoutes = await Route.countDocuments({});
    const totalSchedules = await Schedule.countDocuments({});
    const pendingDrivers = await User.countDocuments({ role: 'driver', isApproved: false });
    const openComplaints = await Complaint.countDocuments({ status: 'pending' });

    // 2. Average delay across all trips
    const delayStats = await Trip.aggregate([
      {
        $group: {
          _id: null,
          averageDelayMinutes: { $avg: '$delayMinutes' },
          totalTrips: { $sum: 1 },
          completedTrips: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } }
        }
      }
    ]);
    const averageDelay = delayStats.length > 0 ? Math.round(delayStats[0].averageDelayMinutes * 10) / 10 : 0;
    const totalTripsCount = delayStats.length > 0 ? delayStats[0].totalTrips : 0;
    const completedTripsCount = delayStats.length > 0 ? delayStats[0].completedTrips : 0;

    return NextResponse.json({
      success: true,
      summary: {
        totalBuses,
        totalRoutes,
        totalSchedules,
        pendingDrivers,
        openComplaints,
        averageDelayMinutes: averageDelay,
        totalTrips: totalTripsCount,
        completedTrips: completedTripsCount
      }
    });
  } catch (error) {
    console.error('GET /api/admin/analytics/overview error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
