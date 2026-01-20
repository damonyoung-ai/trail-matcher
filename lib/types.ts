export type Coordinate = [number, number];

export type ElevationSample = {
  distance: number;
  elevation: number;
};

export type ElevationStats = {
  min: number;
  max: number;
  gain: number;
  loss: number;
};

export type RouteStats = {
  distanceMeters: number;
  elevation: ElevationStats;
  profile: number[];
  gradeHistogram: number[];
  elevationHistogram: number[];
};

export type MatchScore = {
  total: number;
  elevationProfile: number;
  elevationGain: number;
  distance: number;
  shape: number;
};

export type TrailCandidate = {
  id: string;
  name: string;
  coordinates: Coordinate[];
  stats: RouteStats;
  score: MatchScore;
};

export type SegmentPreference = {
  minDistanceMeters: number;
  maxDistanceMeters: number;
  minGain: number;
  maxGain: number;
  maxGrade?: number;
  minGrade?: number;
  loopPreference?: 'loop' | 'out-and-back' | 'either';
};

export type SegmentCandidate = {
  id: string;
  coordinates: Coordinate[];
  stats: RouteStats;
  score: MatchScore;
};

export type ElevationCacheRecord = {
  hash: string;
  samples: number[];
  createdAt: string;
};
