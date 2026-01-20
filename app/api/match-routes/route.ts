import { NextResponse } from 'next/server';
import { fetchTrails } from '@/lib/trails';
import { fetchElevationSamples } from '@/lib/elevation';
import { computeRouteStats, scoreRoute } from '@/lib/matching';
import { computeDistanceMeters, resampleLine } from '@/lib/geo';
import { Coordinate, TrailCandidate } from '@/lib/types';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const inputCoords = body.coordinates as Coordinate[];
    const bbox = body.bbox as [number, number, number, number];
    const interval = Number(body.intervalMeters || 40);
    if (!inputCoords || !bbox) {
      return NextResponse.json({ error: 'Missing input coordinates or bbox.' }, { status: 400 });
    }

    const inputElevations = await fetchElevationSamples(inputCoords, interval);
    const inputStats = computeRouteStats(inputCoords, inputElevations);
    const trails = await fetchTrails(bbox);

    const inputDistance = inputStats.distanceMeters;
    const candidates = trails
      .filter((trail) => {
        const dist = computeDistanceMeters(trail.coordinates);
        return dist > inputDistance * 0.5 && dist < inputDistance * 1.6;
      })
      .slice(0, 80);

    const results: TrailCandidate[] = [];
    for (const trail of candidates) {
      const trailCoords = resampleLine(trail.coordinates, interval);
      const elevations = await fetchElevationSamples(trailCoords, interval);
      const stats = computeRouteStats(trailCoords, elevations);
      const score = scoreRoute(inputStats, stats, inputCoords, trailCoords);
      results.push({
        id: trail.id,
        name: trail.name,
        coordinates: trailCoords,
        stats,
        score
      });
    }

    results.sort((a, b) => b.score.total - a.score.total);

    return NextResponse.json({
      input: { stats: inputStats, elevations: inputElevations },
      matches: results.slice(0, 10)
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
