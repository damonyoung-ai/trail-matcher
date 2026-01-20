import { NextResponse } from 'next/server';
import { fetchTrails } from '@/lib/trails';
import { fetchElevationSamples } from '@/lib/elevation';
import { maxDistanceFromCenterMeters } from '@/lib/geo';
import { computeRouteStats } from '@/lib/matching';
import { buildGraph, findSegmentCandidates, sampleStartNodes } from '@/lib/segments';
import { Coordinate, SegmentPreference } from '@/lib/types';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const bbox = body.bbox as [number, number, number, number];
    const preference = body.preference as SegmentPreference;
    const inputCoords = body.inputCoordinates as Coordinate[] | undefined;
    const center = body.center as { lat: number; lng: number } | undefined;
    const radiusMiles = Number(body.radiusMiles || 0);
    const gainTolerancePct = Number(body.gainTolerancePct || 0);
    if (!bbox || !preference) {
      return NextResponse.json({ error: 'Missing bbox or preference.' }, { status: 400 });
    }

    const trails = await fetchTrails(bbox);
    const graph = buildGraph(trails);
    const startNodes = sampleStartNodes(trails, 40);

    const inputStats = inputCoords
      ? { coords: inputCoords, elevations: await fetchElevationSamples(inputCoords, 40) }
      : undefined;
    const inputGain = inputStats ? computeRouteStats(inputStats.coords, inputStats.elevations).elevation.gain : 0;
    const gainTolerance = gainTolerancePct > 0 ? (inputGain * gainTolerancePct) / 100 : 0;

    const candidates = await findSegmentCandidates(
      graph,
      startNodes,
      preference,
      (coords) => fetchElevationSamples(coords, 40),
      inputStats
    );

    const radiusMeters = radiusMiles > 0 ? radiusMiles * 1609.34 : 0;
    const filtered =
      center && radiusMeters > 0
        ? candidates.filter((c) => maxDistanceFromCenterMeters(c.coordinates, center) <= radiusMeters)
        : candidates;

    const gainFiltered =
      inputGain > 0 && gainTolerancePct > 0
        ? filtered.filter((c) => Math.abs(c.stats.elevation.gain - inputGain) <= gainTolerance)
        : filtered;

    return NextResponse.json({ segments: gainFiltered });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
