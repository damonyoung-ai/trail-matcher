import { NextResponse } from 'next/server';
import { exportToGpx } from '@/lib/gpx';
import { Coordinate } from '@/lib/types';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const coords = body.coordinates as Coordinate[];
    const name = body.name as string | undefined;
    if (!coords || coords.length < 2) {
      return NextResponse.json({ error: 'Missing coordinates.' }, { status: 400 });
    }
    const gpx = exportToGpx(coords, name);
    return new NextResponse(gpx, {
      headers: {
        'Content-Type': 'application/gpx+xml',
        'Content-Disposition': `attachment; filename="${name || 'route'}.gpx"`
      }
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
