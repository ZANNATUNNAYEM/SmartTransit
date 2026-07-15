import { NextResponse } from 'next/server';
import { fetchWeather } from '../../../lib/weather';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const lat = parseFloat(searchParams.get('lat') || '23.8103');
  const lng = parseFloat(searchParams.get('lng') || '90.4125');

  try {
    const weather = await fetchWeather(lat, lng);
    return NextResponse.json(weather);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
