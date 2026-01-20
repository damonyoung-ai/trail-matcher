import { NextResponse } from 'next/server';
import { parseGpxToLine } from '@/lib/parse';
import { computeBBox, computeDistanceMeters, resampleLine } from '@/lib/geo';

const fallbackId = () => `upload-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export async function POST(req: Request) {
  try {
    const form = await req.formData();
    const file = form.get('file');
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'Missing GPX file.' }, { status: 400 });
    }
    const interval = Number(form.get('intervalMeters') || 40);
    const name = String(form.get('name') || file.name || 'Uploaded GPX');
    const text = await file.text();
    const coords = parseGpxToLine(text);
    const resampled = resampleLine(coords, interval);
    const bbox = computeBBox(resampled, 500);
    const distanceMeters = computeDistanceMeters(resampled);

    return NextResponse.json({
      id: typeof crypto?.randomUUID === 'function' ? crypto.randomUUID() : fallbackId(),
      name,
      coordinates: resampled,
      bbox,
      distanceMeters
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
