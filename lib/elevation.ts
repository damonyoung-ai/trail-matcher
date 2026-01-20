import { PNG } from 'pngjs';
import { Coordinate, ElevationStats } from './types';
import { hashCoordinates, resampleLine } from './geo';

const MAPBOX_TILE_URL = 'https://api.mapbox.com/v4/mapbox.terrain-rgb';
const elevationCache = new Map<string, number[]>();
const tileCache = new Map<string, PNG>();

const tileSize = 512;
const zoom = Number(process.env.MAPBOX_ELEVATION_ZOOM ?? 14);

function getMapboxToken(): string {
  const token = process.env.MAPBOX_ACCESS_TOKEN;
  if (!token) {
    throw new Error('Missing MAPBOX_ACCESS_TOKEN.');
  }
  return token;
}

function lonLatToTile(lon: number, lat: number, z: number) {
  const n = 2 ** z;
  const x = Math.floor(((lon + 180) / 360) * n);
  const latRad = (lat * Math.PI) / 180;
  const y = Math.floor(
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n
  );
  return { x, y };
}

function lonLatToPixel(lon: number, lat: number, z: number, x: number, y: number) {
  const n = 2 ** z;
  const latRad = (lat * Math.PI) / 180;
  const xPx = ((lon + 180) / 360) * n * tileSize;
  const yPx =
    ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n * tileSize;
  const px = Math.min(tileSize - 1, Math.max(0, Math.floor(xPx - x * tileSize)));
  const py = Math.min(tileSize - 1, Math.max(0, Math.floor(yPx - y * tileSize)));
  return { px, py };
}

async function fetchTerrainTile(z: number, x: number, y: number): Promise<PNG | null> {
  const key = `${z}/${x}/${y}@2x`;
  const cached = tileCache.get(key);
  if (cached) return cached;

  const token = getMapboxToken();
  const url = `${MAPBOX_TILE_URL}/${z}/${x}/${y}@2x.pngraw?access_token=${token}`;
  const resp = await fetch(url);
  if (!resp.ok) {
    if (resp.status === 404 || resp.status === 204) return null;
    const text = await resp.text().catch(() => '');
    if (text.includes('Tile does not exist')) return null;
    throw new Error(`Mapbox elevation error: ${resp.status}`);
  }

  const buffer = Buffer.from(await resp.arrayBuffer());
  const png = PNG.sync.read(buffer);
  tileCache.set(key, png);
  return png;
}

function decodeElevationFromPixel(r: number, g: number, b: number): number {
  return -10000 + (r * 256 * 256 + g * 256 + b) * 0.1;
}

async function getElevationForCoord(coord: Coordinate): Promise<number> {
  const [lon, lat] = coord;
  const { x, y } = lonLatToTile(lon, lat, zoom);
  const tile = await fetchTerrainTile(zoom, x, y);
  if (!tile) return 0;
  const { px, py } = lonLatToPixel(lon, lat, zoom, x, y);
  const idx = (tile.width * py + px) * 4;
  const r = tile.data[idx];
  const g = tile.data[idx + 1];
  const b = tile.data[idx + 2];
  return decodeElevationFromPixel(r, g, b);
}

export async function fetchElevationSamples(
  coords: Coordinate[],
  intervalMeters = 40
): Promise<number[]> {
  const resampled = resampleLine(coords, intervalMeters);
  const hash = hashCoordinates(resampled.concat([[intervalMeters, intervalMeters] as Coordinate]));
  const cached = elevationCache.get(hash);
  if (cached) return cached;

  const elevations: number[] = [];
  for (const coord of resampled) {
    // Sequential sampling keeps Mapbox tile fetches bounded.
    const elevation = await getElevationForCoord(coord);
    elevations.push(Math.round(elevation));
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
