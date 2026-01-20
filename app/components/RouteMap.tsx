'use client';

import Map, { Source, Layer, NavigationControl } from 'react-map-gl/maplibre';
import type { Coordinate } from '@/lib/types';

const osmStyle = {
  version: 8 as const,
  sources: {
    osm: {
      type: 'raster' as const,
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© OpenStreetMap contributors'
    }
  },
  layers: [{ id: 'osm', type: 'raster' as const, source: 'osm' }]
};

const lineLayer = (id: string, color: string, width = 4) => ({
  id,
  type: 'line' as const,
  paint: {
    'line-color': color,
    'line-width': width,
    'line-opacity': 0.85
  }
});

export function RouteMap({
  primary,
  secondary,
  height = 420
}: {
  primary?: Coordinate[];
  secondary?: Coordinate[];
  height?: number;
}) {
  const first = primary?.[0] || secondary?.[0];
  const center = first ? { longitude: first[0], latitude: first[1] } : { longitude: -120, latitude: 38 };
  return (
    <div className="rounded-2xl overflow-hidden shadow-soft border border-sandstone-200">
      <Map
        initialViewState={{
          longitude: center.longitude,
          latitude: center.latitude,
          zoom: primary ? 12 : 4
        }}
        style={{ width: '100%', height }}
        mapStyle={osmStyle}
      >
        <NavigationControl position="top-right" />
        {primary && (
          <Source
            id="primary"
            type="geojson"
            data={{ type: 'Feature', geometry: { type: 'LineString', coordinates: primary } }}
          >
            <Layer {...lineLayer('primary-line', '#2a4a3a', 4)} />
          </Source>
        )}
        {secondary && (
          <Source
            id="secondary"
            type="geojson"
            data={{ type: 'Feature', geometry: { type: 'LineString', coordinates: secondary } }}
          >
            <Layer {...lineLayer('secondary-line', '#c98560', 3)} />
          </Source>
        )}
      </Map>
    </div>
  );
}
