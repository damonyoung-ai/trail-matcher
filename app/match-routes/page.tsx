'use client';

import { useEffect, useMemo, useState } from 'react';
import { Shell } from '../components/Shell';
import { RouteMap } from '../components/RouteMap';
import { ElevationCharts } from '../components/ElevationCharts';
import { StatsCard } from '../components/StatsCard';
import { MatchCard } from '../components/MatchCard';
import type { Coordinate, RouteStats, TrailCandidate } from '@/lib/types';

function decodeRoute(param: string | null) {
  if (!param) return null;
  try {
    const json = decodeURIComponent(atob(param));
    return JSON.parse(json) as { coordinates: Coordinate[]; stats: RouteStats };
  } catch {
    return null;
  }
}

function padBBox(bbox: [number, number, number, number], radiusMiles: number): [number, number, number, number] {
  const [minLng, minLat, maxLng, maxLat] = bbox;
  const radiusKm = radiusMiles * 1.60934;
  const latPad = radiusKm / 111;
  const avgLat = (minLat + maxLat) / 2;
  const lngPad = radiusKm / (111 * Math.cos((avgLat * Math.PI) / 180));
  return [minLng - lngPad, minLat - latPad, maxLng + lngPad, maxLat + latPad];
}

export default function MatchRoutesPage() {
  const [inputCoords, setInputCoords] = useState<Coordinate[] | null>(null);
  const [inputStats, setInputStats] = useState<RouteStats | null>(null);
  const [matches, setMatches] = useState<TrailCandidate[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [radius, setRadius] = useState(25);
  const [mapBbox, setMapBbox] = useState<[number, number, number, number] | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const route = decodeRoute(params.get('route'));
    const radiusParam = Number(params.get('radius') || 25);
    if (!route) {
      setStatus('Missing route data. Go back to upload.');
      return;
    }
    setInputCoords(route.coordinates);
    setInputStats(route.stats);
    setRadius(radiusParam);
  }, []);

  const selected = useMemo(() => matches.find((m) => m.id === selectedId) || matches[0], [matches, selectedId]);

  async function runSearch(nextBbox: [number, number, number, number]) {
    if (!inputCoords) return;
    setStatus('Finding elevation-first matches…');
    const bbox = padBBox(nextBbox, radius);
    const resp = await fetch('/api/match-routes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coordinates: inputCoords, bbox })
    });
    const data = await resp.json();
    if (!resp.ok || data.error) {
      setStatus(data.error || 'Match failed.');
      return;
    }
    setMatches(data.matches);
    setStatus(`Found ${data.matches.length} matches.`);
  }

  useEffect(() => {
    if (!mapBbox || !inputCoords || matches.length > 0 || status) return;
    runSearch(mapBbox);
  }, [mapBbox, inputCoords]);

  return (
    <Shell>
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-6">
          <RouteMap
            primary={inputCoords || undefined}
            secondary={selected?.coordinates}
            routes={matches.map((m) => m.coordinates)}
            onBoundsChange={setMapBbox}
          />
          <ElevationCharts
            profileA={inputStats?.profile}
            profileB={selected?.stats.profile}
            histA={inputStats?.elevationHistogram}
            histB={selected?.stats.elevationHistogram}
          />
        </section>
        <aside className="space-y-4">
          <StatsCard title="Input Route" stats={inputStats || undefined} />
          {selected && <StatsCard title="Selected Match" stats={selected.stats} />}
          <div className="rounded-2xl border border-sandstone-200 bg-white/80 p-4 space-y-3">
            <div className="text-sm text-pine-700">Drag the map to set the search area.</div>
            <div>
              <label className="text-xs uppercase tracking-wide text-pine-600">Search radius (mi)</label>
              <input
                type="range"
                min={5}
                max={60}
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-full"
              />
              <div className="text-sm text-pine-700">{radius} miles beyond the map bounds</div>
            </div>
            <button
              className="rounded-full bg-sky-500 text-white px-4 py-2 text-sm"
              onClick={() => mapBbox && runSearch(mapBbox)}
            >
              Search this area
            </button>
            <div className="text-sm text-pine-600">{status}</div>
          </div>
          <div className="space-y-3 max-h-[520px] overflow-auto pr-2">
            {matches.map((match) => (
              <MatchCard key={match.id} match={match} onSelect={setSelectedId} />
            ))}
          </div>
          {selected && (
            <button
              className="rounded-full bg-clay-500 text-white px-4 py-2 text-sm"
              onClick={async () => {
                const resp = await fetch('/api/export-gpx', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ coordinates: selected.coordinates, name: selected.name })
                });
                const blob = await resp.blob();
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${selected.name || 'match'}.gpx`;
                link.click();
                URL.revokeObjectURL(url);
              }}
            >
              Export selected GPX
            </button>
          )}
        </aside>
      </div>
    </Shell>
  );
}
