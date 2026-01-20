import { describe, it, expect } from 'vitest';
import { computeDistanceMeters, resampleLine } from '@/lib/geo';

const line = [
  [-105.0, 39.7],
  [-105.0, 39.8]
] as [number, number][];

describe('geo helpers', () => {
  it('computes distance in meters', () => {
    const dist = computeDistanceMeters(line);
    expect(dist).toBeGreaterThan(10000);
  });

  it('resamples to fixed interval', () => {
    const resampled = resampleLine(line, 200);
    expect(resampled.length).toBeGreaterThan(5);
  });
});
