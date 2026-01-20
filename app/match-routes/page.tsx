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

function expandBBox(coords: Coordinate[], radiusMiles: number): [number, number, number, number] {
  const lats = coords.map((c) => c[1]);
  const lngs = coords.map((c) => c[0]);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const route = decodeRoute(params.get('route'));
    const radius = Number(params.get('radius') || 25);
    if (!route) {
      setStatus('Missing route data. Go back to upload.');
      return;
    }
    setInputCoords(route.coordinates);
    setInputStats(route.stats);

    const bbox = expandBBox(route.coordinates, radius);
    setStatus('Finding elevation-first matches…');
    fetch('/api/match-routes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coordinates: route.coordinates, bbox })
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) {
          setStatus(data.error);
          return;
        }
        setMatches(data.matches);
        setStatus(`Found ${data.matches.length} matches.`);
      })
      .catch(() => setStatus('Match failed.'));
  }, []);

  const selected = useMemo(() => matches.find((m) => m.id === selectedId) || matches[0], [matches, selectedId]);

  return (
    <Shell>
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-6">
          <RouteMap primary={inputCoords || undefined} secondary={selected?.coordinates} />
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
          <div className="text-sm text-pine-600">{status}</div>
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
