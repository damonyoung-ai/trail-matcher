import { NextResponse } from 'next/server';
import { fetchTrails } from '@/lib/trails';
import { fetchElevationSamples } from '@/lib/elevation';
import { computeRouteStats, scoreRoute } from '@/lib/matching';
import { computeDistanceMeters, maxDistanceFromCenterMeters, resampleLine } from '@/lib/geo';
import { Coordinate, TrailCandidate } from '@/lib/types';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const inputCoords = body.coordinates as Coordinate[];
    const bbox = body.bbox as [number, number, number, number];
    const center = body.center as { lat: number; lng: number } | undefined;
    const radiusMiles = Number(body.radiusMiles || 0);
    const gainTolerancePct = Number(body.gainTolerancePct || 0);
    const interval = Number(body.intervalMeters || 40);
    if (!inputCoords || !bbox) {
      return NextResponse.json({ error: 'Missing input coordinates or bbox.' }, { status: 400 });
    }

    const inputElevations = await fetchElevationSamples(inputCoords, interval);
    const inputStats = computeRouteStats(inputCoords, inputElevations);
    const trails = await fetchTrails(bbox);
    const radiusMeters = radiusMiles > 0 ? radiusMiles * 1609.34 : 0;
    const radiusFiltered =
      center && radiusMeters > 0
        ? trails.filter((trail) => maxDistanceFromCenterMeters(trail.coordinates, center) <= radiusMeters)
        : trails;

    const inputDistance = inputStats.distanceMeters;
    const inputGain = inputStats.elevation.gain;
    const gainTolerance = gainTolerancePct > 0 ? (inputGain * gainTolerancePct) / 100 : 0;
    const candidates = radiusFiltered
      .filter((trail) => {
        const dist = computeDistanceMeters(trail.coordinates);
        return dist > inputDistance * 0.8 && dist < inputDistance * 1.2;
      })
      .slice(0, 80);

    const results: TrailCandidate[] = [];
    for (const trail of candidates) {
      const trailCoords = resampleLine(trail.coordinates, interval);
      const elevations = await fetchElevationSamples(trailCoords, interval);
      const stats = computeRouteStats(trailCoords, elevations);
      const score = scoreRoute(inputStats, stats, inputCoords, trailCoords);
      if (gainTolerancePct > 0 && inputGain > 0) {
        const gainDiff = Math.abs(stats.elevation.gain - inputGain);
        if (gainDiff > gainTolerance) continue;
      }
      results.push({
        id: trail.id,
        name: trail.name,
        coordinates: trailCoords,
        stats,
        score
      });
    }

    const filteredResults =
      center && radiusMeters > 0
        ? results.filter((r) => maxDistanceFromCenterMeters(r.coordinates, center) <= radiusMeters)
        : results;
    filteredResults.sort((a, b) => b.score.total - a.score.total);

    return NextResponse.json({
      input: { stats: inputStats, elevations: inputElevations },
      matches: filteredResults.slice(0, 10)
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
