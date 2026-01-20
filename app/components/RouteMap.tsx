'use client';

import { useCallback, useRef } from 'react';
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

const lineLayer = (id: string, color: string, width = 4, opacity = 0.85) => ({
  id,
  type: 'line' as const,
  paint: {
    'line-color': color,
    'line-width': width,
    'line-opacity': opacity
  }
});

export function RouteMap({
  primary,
  secondary,
  routes,
  height = 420,
  onBoundsChange,
  centerPoint,
  onMapClick
}: {
  primary?: Coordinate[];
  secondary?: Coordinate[];
  routes?: Coordinate[][];
  height?: number;
  onBoundsChange?: (bbox: [number, number, number, number]) => void;
  centerPoint?: { lat: number; lng: number } | null;
  onMapClick?: (center: { lat: number; lng: number }) => void;
}) {
  const mapRef = useRef<any>(null);
  const first = primary?.[0] || secondary?.[0];
  const center = first ? { longitude: first[0], latitude: first[1] } : { longitude: -120, latitude: 38 };

  const emitBounds = useCallback(() => {
    if (!onBoundsChange) return;
    const map = mapRef.current?.getMap?.() ?? mapRef.current;
    const bounds = map?.getBounds?.();
    if (!bounds) return;
    const bbox: [number, number, number, number] = [
      bounds.getWest(),
      bounds.getSouth(),
      bounds.getEast(),
      bounds.getNorth()
    ];
    onBoundsChange(bbox);
  }, [onBoundsChange]);

  return (
    <div className="rounded-2xl overflow-hidden shadow-soft border border-sandstone-200">
      <Map
        ref={mapRef}
        initialViewState={{
          longitude: center.longitude,
          latitude: center.latitude,
          zoom: primary ? 12 : 4
        }}
        style={{ width: '100%', height }}
        mapStyle={osmStyle}
        onLoad={emitBounds}
        onMoveEnd={emitBounds}
        onClick={(e) => {
          if (!onMapClick) return;
          onMapClick({ lat: e.lngLat.lat, lng: e.lngLat.lng });
        }}
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
        {routes && routes.length > 0 && (
          <Source
            id="routes"
            type="geojson"
            data={{
              type: 'FeatureCollection',
              features: routes.map((coords, idx) => ({
                type: 'Feature',
                id: idx,
                geometry: { type: 'LineString', coordinates: coords },
                properties: {}
              }))
            }}
          >
            <Layer {...lineLayer('routes-line', '#c9b6a7', 2, 0.35)} />
          </Source>
        )}
        {secondary && (
          <Source
            id="secondary"
            type="geojson"
            data={{ type: 'Feature', geometry: { type: 'LineString', coordinates: secondary } }}
          >
            <Layer {...lineLayer('secondary-line', '#e07a5f', 3)} />
          </Source>
        )}
        {centerPoint && (
          <Source
            id="center-point"
            type="geojson"
            data={{
              type: 'Feature',
              geometry: { type: 'Point', coordinates: [centerPoint.lng, centerPoint.lat] }
            }}
          >
            <Layer
              id="center-point-layer"
              type="circle"
              paint={{
                'circle-color': '#0f5b45',
                'circle-radius': 6,
                'circle-stroke-color': '#ffffff',
                'circle-stroke-width': 2
              }}
            />
          </Source>
        )}
      </Map>
    </div>
  );
}
