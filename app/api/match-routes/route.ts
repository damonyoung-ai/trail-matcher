import { NextResponse } from 'next/server';
import { fetchTrails } from '@/lib/trails';
import { fetchElevationSamples } from '@/lib/elevation';
import { computeRouteStats } from '@/lib/matching';
import { maxDistanceFromCenterMeters } from '@/lib/geo';
import { buildGraph, findRouteCandidates, sampleStartNodes } from '@/lib/segments';
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
    const minDistance = inputDistance * 0.8;
    const maxDistance = inputDistance * 1.2;
    const graph = buildGraph(radiusFiltered);
    const startNodes = sampleStartNodes(radiusFiltered, 60);

    const stitched = await findRouteCandidates(
      graph,
      startNodes,
      minDistance,
      maxDistance,
      (coords) => fetchElevationSamples(coords, interval),
      inputStats,
      inputCoords
    );

    const filteredResults =
      gainTolerancePct > 0 && inputGain > 0
        ? stitched.filter((r) => Math.abs(r.stats.elevation.gain - inputGain) <= gainTolerance)
        : stitched;

    const results: TrailCandidate[] = filteredResults.map((candidate, idx) => ({
      id: candidate.id || `route-${idx}`,
      name: `Stitched route ${idx + 1}`,
      coordinates: candidate.coordinates,
      stats: candidate.stats,
      score: candidate.score
    }));

    return NextResponse.json({
      input: { stats: inputStats, elevations: inputElevations },
      matches: results.slice(0, 10)
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
