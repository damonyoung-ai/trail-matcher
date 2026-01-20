import { Coordinate, SegmentCandidate, SegmentPreference } from './types';
import { computeDistanceMeters, resampleLine } from './geo';
import { computeRouteStats, scoreRoute } from './matching';

export type GraphEdge = {
  to: string;
  coordinates: Coordinate[];
  length: number;
};

export type Graph = Map<string, GraphEdge[]>;

function key(coord: Coordinate): string {
  return `${coord[0].toFixed(6)},${coord[1].toFixed(6)}`;
}

export function buildGraph(trails: { coordinates: Coordinate[] }[]): Graph {
  const graph: Graph = new Map();
  const addEdge = (from: Coordinate, to: Coordinate, coords: Coordinate[]) => {
    const fromKey = key(from);
    const list = graph.get(fromKey) || [];
    list.push({ to: key(to), coordinates: coords, length: computeDistanceMeters(coords) });
    graph.set(fromKey, list);
  };

  trails.forEach((trail) => {
    const coords = trail.coordinates;
    for (let i = 0; i < coords.length - 1; i += 1) {
      const segment = [coords[i], coords[i + 1]] as Coordinate[];
      addEdge(coords[i], coords[i + 1], segment);
      addEdge(coords[i + 1], coords[i], segment.slice().reverse());
    }
  });

  return graph;
}

export async function findSegmentCandidates(
  graph: Graph,
  startNodes: Coordinate[],
  preference: SegmentPreference,
  getElevations: (coords: Coordinate[]) => Promise<number[]>,
  inputStats?: { coords: Coordinate[]; elevations: number[] }
): Promise<SegmentCandidate[]> {
  const candidates: SegmentCandidate[] = [];
  const maxCandidates = 2000;
  const maxDepth = 120;

  for (const start of startNodes) {
    if (candidates.length >= maxCandidates) break;
    const startKey = key(start);
    const stack: { node: string; path: Coordinate[]; distance: number; depth: number }[] = [
      { node: startKey, path: [start], distance: 0, depth: 0 }
    ];

    while (stack.length && candidates.length < maxCandidates) {
      const current = stack.pop();
      if (!current) continue;
      if (current.depth > maxDepth) continue;

      if (
        current.distance >= preference.minDistanceMeters &&
        current.distance <= preference.maxDistanceMeters
      ) {
        const elevations = await getElevations(current.path);
        const stats = computeRouteStats(current.path, elevations);
        if (stats.elevation.gain < preference.minGain || stats.elevation.gain > preference.maxGain) {
          continue;
        }
        if (preference.minGrade !== undefined || preference.maxGrade !== undefined) {
          const gradePercent =
            stats.distanceMeters > 0 ? (stats.elevation.gain / stats.distanceMeters) * 100 : 0;
          if (preference.minGrade !== undefined && gradePercent < preference.minGrade) {
            continue;
          }
          if (preference.maxGrade !== undefined && gradePercent > preference.maxGrade) {
            continue;
          }
        }
        const score = inputStats
          ? scoreRoute(
              computeRouteStats(inputStats.coords, inputStats.elevations),
              stats,
              inputStats.coords,
              current.path
            )
          : {
              total: Math.round((1 - Math.abs(stats.elevation.gain - preference.maxGain) / preference.maxGain) * 100),
              elevationProfile: 80,
              elevationGain: 80,
              distance: 80,
              shape: 60
            };
        candidates.push({
          id: `segment-${startKey}-${current.depth}`,
          coordinates: current.path,
          stats,
          score
        });
        continue;
      }

      if (current.distance > preference.maxDistanceMeters) continue;

      const edges = graph.get(current.node) || [];
      edges.slice(0, 4).forEach((edge) => {
        const nextCoord = edge.coordinates[edge.coordinates.length - 1];
        stack.push({
          node: edge.to,
          path: current.path.concat([nextCoord]),
          distance: current.distance + edge.length,
          depth: current.depth + 1
        });
      });
    }
  }

  return candidates
    .sort((a, b) => b.score.total - a.score.total)
    .slice(0, 20);
}

export function sampleStartNodes(trails: { coordinates: Coordinate[] }[], maxNodes = 40): Coordinate[] {
  const nodes: Coordinate[] = [];
  trails.forEach((trail) => {
    const coords = resampleLine(trail.coordinates, 200);
    coords.forEach((coord) => {
      if (nodes.length < maxNodes) nodes.push(coord);
    });
  });
  return nodes;
}
