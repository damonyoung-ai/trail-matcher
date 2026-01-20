import { Coordinate } from './types';
import { hashCoordinates } from './geo';

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const trailCache = new Map<string, TrailFeature[]>();

export type TrailFeature = {
  id: string;
  name: string;
  coordinates: Coordinate[];
  tags: Record<string, string>;
};

export function buildOverpassQuery(bbox: [number, number, number, number]) {
  const [minLng, minLat, maxLng, maxLat] = bbox;
  return `[
    out:json
  ];(
    way["highway"~"path|footway|track|bridleway"]["sac_scale"](${minLat},${minLng},${maxLat},${maxLng});
    way["highway"~"path|footway|track|bridleway"](${minLat},${minLng},${maxLat},${maxLng});
    relation["route"="hiking"](${minLat},${minLng},${maxLat},${maxLng});
  );out body;>;out skel qt;`;
}

export async function fetchTrails(bbox: [number, number, number, number]) {
  const hash = hashCoordinates([
    [bbox[0], bbox[1]],
    [bbox[2], bbox[3]]
  ]);
  const cached = trailCache.get(hash);
  if (cached) return cached;

  const query = buildOverpassQuery(bbox);
  const resp = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(query)}`
  });
  if (!resp.ok) {
    throw new Error(`Overpass error: ${resp.status}`);
  }
  const data = (await resp.json()) as {
    elements: Array<
      | { type: 'node'; id: number; lat: number; lon: number }
      | { type: 'way'; id: number; nodes: number[]; tags?: Record<string, string> }
      | { type: 'relation'; id: number; members: Array<{ type: string; ref: number }>; tags?: Record<string, string> }
    >;
  };

  const nodes = new Map<number, Coordinate>();
  const ways = new Map<number, { nodes: number[]; tags?: Record<string, string> }>();
  data.elements.forEach((el) => {
    if (el.type === 'node') nodes.set(el.id, [el.lon, el.lat]);
    if (el.type === 'way') ways.set(el.id, { nodes: el.nodes, tags: el.tags });
  });

  const features: TrailFeature[] = [];
  ways.forEach((way, id) => {
    const coords: Coordinate[] = way.nodes
      .map((nodeId) => nodes.get(nodeId))
      .filter((c): c is Coordinate => Boolean(c));
    if (coords.length < 2) return;
    features.push({
      id: `way-${id}`,
      name: way.tags?.name || way.tags?.ref || 'Trail segment',
      coordinates: coords,
      tags: way.tags || {}
    });
  });

  trailCache.set(hash, features);

  return features;
}
