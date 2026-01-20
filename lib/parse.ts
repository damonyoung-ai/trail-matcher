import { DOMParser } from '@xmldom/xmldom';
import { gpx } from '@mapbox/togeojson';
import { Coordinate } from './types';

export function parseGpxToLine(gpxText: string): Coordinate[] {
  const dom = new DOMParser().parseFromString(gpxText, 'text/xml');
  const geojson = gpx(dom);
  const features = geojson.features || [];
  const lineFeature = features.find((f: any) => f.geometry.type === 'LineString');
  if (lineFeature && lineFeature.geometry.type === 'LineString') {
    return lineFeature.geometry.coordinates as Coordinate[];
  }
  const multi = features.find((f: any) => f.geometry.type === 'MultiLineString');
  if (multi && multi.geometry.type === 'MultiLineString') {
    const coords = (multi.geometry.coordinates as Coordinate[][]).flat();
    return coords;
  }
  throw new Error('No LineString found in GPX.');
}
