import { NextResponse } from 'next/server';
import { connectDB } from '../../../lib/db';
import mongoose from 'mongoose';

// Force dynamic so Next.js doesn't statically optimize this route
export const dynamic = 'force-dynamic';

export async function GET() {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      mongodb: 'unknown',
    },
  };

  // Check MongoDB
  try {
    await connectDB();
    if (mongoose.connection.readyState === 1) {
      health.services.mongodb = 'connected';
    } else {
      health.services.mongodb = 'disconnected';
      health.status = 'unhealthy';
    }
  } catch (error) {
    health.services.mongodb = `error: ${error.message}`;
    health.status = 'unhealthy';
  }

  const statusCode = health.status === 'healthy' ? 200 : 500;
  return NextResponse.json(health, { status: statusCode });
}
