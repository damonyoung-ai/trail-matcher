import { Coordinate, ElevationStats } from './types';
import { hashCoordinates, resampleLine } from './geo';
const OPEN_ELEVATION_URL = 'https://api.open-elevation.com/api/v1/lookup';
const elevationCache = new Map<string, number[]>();

export async function fetchElevationSamples(
  coords: Coordinate[],
  intervalMeters = 40
): Promise<number[]> {
  const resampled = resampleLine(coords, intervalMeters);
  const hash = hashCoordinates(resampled.concat([[intervalMeters, intervalMeters] as Coordinate]));
  const cached = elevationCache.get(hash);
  if (cached) return cached;

  const elevations: number[] = [];
  const batchSize = 100;
  for (let i = 0; i < resampled.length; i += batchSize) {
    const batch = resampled.slice(i, i + batchSize);
    const locations = batch
      .map((c) => `${c[1].toFixed(6)},${c[0].toFixed(6)}`)
      .join('|');
    const url = `${OPEN_ELEVATION_URL}?locations=${encodeURIComponent(locations)}`;
    const resp = await fetch(url);
    if (!resp.ok) {
      throw new Error(`Elevation API error: ${resp.status}`);
    }
    const data = (await resp.json()) as { results: { elevation: number }[] };
    data.results.forEach((r) => elevations.push(r.elevation));
  }

  elevationCache.set(hash, elevations);

  return elevations;
}

export function computeElevationStats(elevations: number[]): ElevationStats {
  if (elevations.length === 0) {
    return { min: 0, max: 0, gain: 0, loss: 0 };
  }
  let gain = 0;
  let loss = 0;
  for (let i = 1; i < elevations.length; i += 1) {
    const delta = elevations[i] - elevations[i - 1];
    if (delta > 0) gain += delta;
    if (delta < 0) loss += Math.abs(delta);
  }
  return {
    min: Math.min(...elevations),
    max: Math.max(...elevations),
    gain: Math.round(gain),
    loss: Math.round(loss)
  };
}
