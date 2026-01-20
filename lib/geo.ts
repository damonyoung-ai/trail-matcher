import crypto from 'crypto';
import along from '@turf/along';
import length from '@turf/length';
import { lineString, point } from '@turf/helpers';
import distance from '@turf/distance';
import bbox from '@turf/bbox';
import simplify from '@turf/simplify';
import { Coordinate } from './types';

export function hashCoordinates(coords: Coordinate[]): string {
  const hash = crypto.createHash('sha256');
  hash.update(JSON.stringify(coords));
  return hash.digest('hex');
}

export function computeDistanceMeters(coords: Coordinate[]): number {
  const line = lineString(coords);
  return length(line, { units: 'kilometers' }) * 1000;
}

export function computeBBox(coords: Coordinate[], padMeters = 0): [number, number, number, number] {
  const base = bbox(lineString(coords));
  if (padMeters <= 0) return base as [number, number, number, number];

  const padKm = padMeters / 1000;
  const southwest = point([base[0], base[1]]);
  const northeast = point([base[2], base[3]]);
  const west = distance(southwest, point([base[0] - 0.01, base[1]]), { units: 'kilometers' });
  const north = distance(southwest, point([base[0], base[1] + 0.01]), { units: 'kilometers' });
  const lngPad = (0.01 / west) * padKm;
  const latPad = (0.01 / north) * padKm;
  return [base[0] - lngPad, base[1] - latPad, base[2] + lngPad, base[3] + latPad];
}

export function resampleLine(coords: Coordinate[], intervalMeters: number): Coordinate[] {
  const line = lineString(coords);
  const total = computeDistanceMeters(coords);
  if (total <= intervalMeters) return coords;
  const steps = Math.max(2, Math.floor(total / intervalMeters));
  const sampled: Coordinate[] = [];
  for (let i = 0; i <= steps; i += 1) {
    const dist = (total / steps) * i;
    const pt = along(line, dist / 1000, { units: 'kilometers' });
    sampled.push(pt.geometry.coordinates as Coordinate);
  }
  return sampled;
}

export function simplifyLine(coords: Coordinate[], toleranceMeters = 5): Coordinate[] {
  const line = lineString(coords);
  const simplified = simplify(line, { tolerance: toleranceMeters / 1000, highQuality: true });
  return simplified.geometry.coordinates as Coordinate[];
}

export function normalizeArray(values: number[]): number[] {
  if (values.length === 0) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (max - min < 1e-6) return values.map(() => 0);
  return values.map((v) => (v - min) / (max - min));
}

export function histogram(values: number[], bins = 12): number[] {
  if (values.length === 0) return Array.from({ length: bins }, () => 0);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const counts = Array.from({ length: bins }, () => 0);
  values.forEach((v) => {
    const idx = Math.min(bins - 1, Math.floor(((v - min) / span) * bins));
    counts[idx] += 1;
  });
  const total = values.length || 1;
  return counts.map((c) => c / total);
}

export function gradeSeries(elevations: number[], distanceMeters: number): number[] {
  if (elevations.length < 2) return [];
  const step = distanceMeters / (elevations.length - 1);
  const grades: number[] = [];
  for (let i = 1; i < elevations.length; i += 1) {
    const rise = elevations[i] - elevations[i - 1];
    grades.push((rise / step) * 100);
  }
  return grades;
}

export function maxDistanceFromCenterMeters(
  coords: Coordinate[],
  center: { lat: number; lng: number }
): number {
  const centerPoint = point([center.lng, center.lat]);
  let max = 0;
  for (const coord of coords) {
    const d = distance(point(coord), centerPoint, { units: 'kilometers' }) * 1000;
    if (d > max) max = d;
  }
  return max;
}
