import { NextResponse } from 'next/server';
import { fetchTrails } from '@/lib/trails';
import { fetchElevationSamples } from '@/lib/elevation';
import { buildGraph, findSegmentCandidates, sampleStartNodes } from '@/lib/segments';
import { Coordinate, SegmentPreference } from '@/lib/types';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const bbox = body.bbox as [number, number, number, number];
    const preference = body.preference as SegmentPreference;
    const inputCoords = body.inputCoordinates as Coordinate[] | undefined;
    if (!bbox || !preference) {
      return NextResponse.json({ error: 'Missing bbox or preference.' }, { status: 400 });
    }

    const trails = await fetchTrails(bbox);
    const graph = buildGraph(trails);
    const startNodes = sampleStartNodes(trails, 40);

    const inputStats = inputCoords
      ? { coords: inputCoords, elevations: await fetchElevationSamples(inputCoords, 40) }
      : undefined;

    const candidates = await findSegmentCandidates(
      graph,
      startNodes,
      preference,
      (coords) => fetchElevationSamples(coords, 40),
      inputStats
    );

    return NextResponse.json({ segments: candidates });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
