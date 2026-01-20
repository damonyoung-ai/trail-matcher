import { NextResponse } from 'next/server';
import { fetchElevationSamples } from '@/lib/elevation';
import { computeRouteStats } from '@/lib/matching';
import { Coordinate } from '@/lib/types';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const coords = body.coordinates as Coordinate[];
    const interval = Number(body.intervalMeters || 40);
    if (!coords || coords.length < 2) {
      return NextResponse.json({ error: 'Missing coordinates.' }, { status: 400 });
    }
    const elevations = await fetchElevationSamples(coords, interval);
    const stats = computeRouteStats(coords, elevations);
    return NextResponse.json({ elevations, stats });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
