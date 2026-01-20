import { NextResponse } from 'next/server';
import { fetchTrails } from '@/lib/trails';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const bbox = body.bbox as [number, number, number, number];
    if (!bbox) {
      return NextResponse.json({ error: 'Missing bbox.' }, { status: 400 });
    }
    const trails = await fetchTrails(bbox);
    return NextResponse.json({ trails });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
