import { describe, it, expect } from 'vitest';
import { normalizeScores } from '@/lib/matching';

const scores = [
  { total: 50, elevationProfile: 50, elevationGain: 50, distance: 50, shape: 50 },
  { total: 100, elevationProfile: 80, elevationGain: 70, distance: 60, shape: 60 }
];

describe('matching', () => {
  it('normalizes total scores', () => {
    const normalized = normalizeScores(scores);
    expect(normalized[1].total).toBe(100);
    expect(normalized[0].total).toBe(50);
  });
});
