import { Coordinate, MatchScore, RouteStats } from './types';
import { computeDistanceMeters, gradeSeries, histogram, normalizeArray, resampleLine, simplifyLine } from './geo';
import pointToLineDistance from '@turf/point-to-line-distance';
import { lineString, point } from '@turf/helpers';

export function computeRouteStats(
  coords: Coordinate[],
  elevations: number[]
): RouteStats {
  const distanceMeters = computeDistanceMeters(coords);
  if (elevations.length === 0) {
    return {
      distanceMeters,
      elevation: { min: 0, max: 0, gain: 0, loss: 0 },
      profile: [],
      gradeHistogram: [],
      elevationHistogram: []
    };
  }
  const grade = gradeSeries(elevations, distanceMeters);
  return {
    distanceMeters,
    elevation: {
      min: Math.min(...elevations),
      max: Math.max(...elevations),
      gain: elevations.reduce((acc, val, idx) => {
        if (idx === 0) return 0;
        return acc + Math.max(0, val - elevations[idx - 1]);
      }, 0),
      loss: elevations.reduce((acc, val, idx) => {
        if (idx === 0) return 0;
        return acc + Math.max(0, elevations[idx - 1] - val);
      }, 0)
    },
    profile: normalizeArray(elevations),
    gradeHistogram: histogram(grade, 10),
    elevationHistogram: histogram(elevations, 12)
  };
}

export function dtwDistance(a: number[], b: number[]): number {
  if (a.length === 0 || b.length === 0) return Number.POSITIVE_INFINITY;
  const n = a.length;
  const m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(m + 1).fill(Number.POSITIVE_INFINITY));
  dp[0][0] = 0;
  for (let i = 1; i <= n; i += 1) {
    for (let j = 1; j <= m; j += 1) {
      const cost = Math.abs(a[i - 1] - b[j - 1]);
      dp[i][j] = cost + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[n][m] / (n + m);
}

export function shapeSimilarity(a: Coordinate[], b: Coordinate[]): number {
  const lineB = lineString(b);
  const aSimplified = simplifyLine(a, 10);
  const distances = aSimplified.map((coord) =>
    pointToLineDistance(point(coord), lineB, { units: 'kilometers' })
  );
  const avgKm = distances.reduce((sum, val) => sum + val, 0) / distances.length;
  const score = Math.max(0, 1 - avgKm / 2); // 2km tolerance
  return score;
}

export function scoreRoute(input: RouteStats, candidate: RouteStats, inputCoords: Coordinate[], candidateCoords: Coordinate[]): MatchScore {
  const elevationScore = 1 - Math.min(1, dtwDistance(input.profile, candidate.profile));
  const gainDiff = Math.abs(input.elevation.gain - candidate.elevation.gain);
  const gainScore = 1 - Math.min(1, gainDiff / Math.max(300, input.elevation.gain || 1));
  const distDiff = Math.abs(input.distanceMeters - candidate.distanceMeters);
  const distScore = 1 - Math.min(1, distDiff / Math.max(1000, input.distanceMeters || 1));
  const shapeScore = shapeSimilarity(inputCoords, candidateCoords);

  const total = (elevationScore * 0.55 + gainScore * 0.2 + distScore * 0.15 + shapeScore * 0.1) * 100;
  return {
    total: Math.round(total),
    elevationProfile: Math.round(elevationScore * 100),
    elevationGain: Math.round(gainScore * 100),
    distance: Math.round(distScore * 100),
    shape: Math.round(shapeScore * 100)
  };
}

export function resampleToMatch(a: number[], b: number[]): [number[], number[]] {
  const maxLen = Math.max(a.length, b.length, 10);
  const resample = (values: number[]) => {
    const out: number[] = [];
    for (let i = 0; i < maxLen; i += 1) {
      const idx = Math.floor((i / (maxLen - 1)) * (values.length - 1));
      out.push(values[idx]);
    }
    return out;
  };
  return [resample(a), resample(b)];
}

export function normalizeScores(scores: MatchScore[]): MatchScore[] {
  const max = Math.max(...scores.map((s) => s.total), 1);
  return scores.map((score) => ({
    ...score,
    total: Math.round((score.total / max) * 100)
  }));
}

export function buildProfileSignature(elevations: number[], buckets = 20): number[] {
  const normalized = normalizeArray(elevations);
  const signature: number[] = [];
  const step = Math.floor(normalized.length / buckets) || 1;
  for (let i = 0; i < normalized.length; i += step) {
    signature.push(normalized[i]);
  }
  return signature.slice(0, buckets);
}
