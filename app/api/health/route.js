import { NextResponse } from 'next/server';
import { connectDB } from '../../../lib/db';
import { redis } from '../../../lib/redis';
import mongoose from 'mongoose';

// Force dynamic so Next.js doesn't statically optimize this route
export const dynamic = 'force-dynamic';

export async function GET() {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      mongodb: 'unknown',
      redis: 'unknown',
    },
  };

  // 1. Check MongoDB
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

  // 2. Check Redis
  try {
    if (redis) {
      const pingRes = await redis.ping();
      if (pingRes === 'PONG') {
        health.services.redis = 'connected';
      } else {
        health.services.redis = `unexpected ping response: ${pingRes}`;
        health.status = 'unhealthy';
      }
    } else {
      health.services.redis = 'disabled';
      health.status = 'unhealthy';
    }
  } catch (error) {
    health.services.redis = `error: ${error.message}`;
    health.status = 'unhealthy';
  }

  const statusCode = health.status === 'healthy' ? 200 : 500;
  return NextResponse.json(health, { status: statusCode });
}
