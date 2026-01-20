'use client';

import { useEffect, useMemo, useState } from 'react';
import { Shell } from '../components/Shell';
import { RouteMap } from '../components/RouteMap';
import { ElevationCharts } from '../components/ElevationCharts';
import { StatsCard } from '../components/StatsCard';
import { SegmentCard } from '../components/SegmentCard';
import type { Coordinate, RouteStats, SegmentCandidate, SegmentPreference } from '@/lib/types';

function decodeRoute(param: string | null) {
  if (!param) return null;
  try {
    const json = decodeURIComponent(atob(param));
    return JSON.parse(json) as { coordinates: Coordinate[]; stats: RouteStats };
  } catch {
    return null;
  }
}

function bboxFromCenter(
  center: { lat: number; lng: number },
  radiusMiles: number
): [number, number, number, number] {
  const radiusKm = radiusMiles * 1.60934;
  const latPad = radiusKm / 111;
  const lngPad = radiusKm / (111 * Math.cos((center.lat * Math.PI) / 180));
  return [center.lng - lngPad, center.lat - latPad, center.lng + lngPad, center.lat + latPad];
}

function centerFromCoords(coords: Coordinate[]): { lat: number; lng: number } {
  const lats = coords.map((c) => c[1]);
  const lngs = coords.map((c) => c[0]);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  return { lat: (minLat + maxLat) / 2, lng: (minLng + maxLng) / 2 };
}

export default function MatchSegmentsPage() {
  const [inputCoords, setInputCoords] = useState<Coordinate[] | null>(null);
  const [inputStats, setInputStats] = useState<RouteStats | null>(null);
  const [segments, setSegments] = useState<SegmentCandidate[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [radius, setRadius] = useState(25);
  const [distanceRange, setDistanceRange] = useState([4, 6]);
  const [gainRange, setGainRange] = useState([900, 1200]);
  const [gradeRange, setGradeRange] = useState([4, 12]);
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>({
    lat: 39.7392,
    lng: -104.9903
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const route = decodeRoute(params.get('route'));
    const radiusParam = Number(params.get('radius') || 25);
    setRadius(radiusParam);
    if (route) {
      setInputCoords(route.coordinates);
      setInputStats(route.stats);
      setCenter(centerFromCoords(route.coordinates));
    }
  }, []);

  const selected = useMemo(
    () => segments.find((s) => s.id === selectedId) || segments[0],
    [segments, selectedId]
  );

  async function handleFind() {
    setStatus('Searching trail network…');
    const bbox = center ? bboxFromCenter(center, radius) : null;
    if (!bbox) {
      setStatus('Click the map to set a search center.');
      return;
    }
    const preference: SegmentPreference = {
      minDistanceMeters: distanceRange[0] * 1609.34,
      maxDistanceMeters: distanceRange[1] * 1609.34,
      minGain: gainRange[0] / 3.28084,
      maxGain: gainRange[1] / 3.28084,
      minGrade: gradeRange[0],
      maxGrade: gradeRange[1],
      loopPreference: 'either'
    };
    const resp = await fetch('/api/match-segments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        bbox,
        preference,
        inputCoordinates: inputCoords || undefined,
        center,
        radiusMiles: radius
      })
    });
    const data = await resp.json();
    if (!resp.ok) {
      setStatus(data.error || 'Search failed');
      return;
    }
    setSegments(data.segments);
    setStatus(`Found ${data.segments.length} segment matches.`);
  }

  return (
    <Shell>
      <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="space-y-6">
          <RouteMap
            primary={inputCoords || selected?.coordinates || undefined}
            secondary={inputCoords ? selected?.coordinates : undefined}
            routes={segments.map((s) => s.coordinates)}
            centerPoint={center}
            onMapClick={setCenter}
            radiusMiles={radius}
          />
          <ElevationCharts
            profileA={inputStats?.profile}
            profileB={selected?.stats.profile}
            histA={inputStats?.elevationHistogram}
            histB={selected?.stats.elevationHistogram}
          />
        </section>
        <aside className="space-y-4">
          <div className="rounded-2xl border border-sandstone-200 bg-white/80 p-4">
            <h3 className="font-display text-lg text-pine-700 mb-3">Segment preferences</h3>
            <div className="space-y-3 text-sm">
              <div>
                <label className="text-xs uppercase tracking-wide text-pine-600">Distance range (mi)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={distanceRange[0]}
                    onChange={(e) => setDistanceRange([Number(e.target.value), distanceRange[1]])}
                    className="w-20 border rounded px-2 py-1"
                  />
                  <span className="self-center">to</span>
                  <input
                    type="number"
                    value={distanceRange[1]}
                    onChange={(e) => setDistanceRange([distanceRange[0], Number(e.target.value)])}
                    className="w-20 border rounded px-2 py-1"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-pine-600">Elevation gain (ft)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={gainRange[0]}
                    onChange={(e) => setGainRange([Number(e.target.value), gainRange[1]])}
                    className="w-20 border rounded px-2 py-1"
                  />
                  <span className="self-center">to</span>
                  <input
                    type="number"
                    value={gainRange[1]}
                    onChange={(e) => setGainRange([gainRange[0], Number(e.target.value)])}
                    className="w-20 border rounded px-2 py-1"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-pine-600">Grade range (%)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={gradeRange[0]}
                    onChange={(e) => setGradeRange([Number(e.target.value), gradeRange[1]])}
                    className="w-20 border rounded px-2 py-1"
                  />
                  <span className="self-center">to</span>
                  <input
                    type="number"
                    value={gradeRange[1]}
                    onChange={(e) => setGradeRange([gradeRange[0], Number(e.target.value)])}
                    className="w-20 border rounded px-2 py-1"
                  />
                </div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-pine-600">Search area</div>
                <div className="text-sm text-pine-700">Click the map to set the search center.</div>
              </div>
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
                <div className="text-sm text-pine-700">{radius} miles from the center point</div>
              </div>
            </div>
            <button
              className="mt-4 rounded-full bg-sky-500 text-white px-4 py-2 text-sm"
              onClick={handleFind}
            >
              Find matching segments
            </button>
          </div>

          <StatsCard title="Input Route" stats={inputStats || undefined} />
          {selected && <StatsCard title="Selected Segment" stats={selected.stats} />}
          <div className="text-sm text-pine-600">{status}</div>
          <div className="space-y-3 max-h-[420px] overflow-auto pr-2">
            {segments.map((segment) => (
              <SegmentCard key={segment.id} segment={segment} onSelect={setSelectedId} />
            ))}
          </div>
          {selected && (
            <button
              className="rounded-full bg-clay-500 text-white px-4 py-2 text-sm"
              onClick={async () => {
                const resp = await fetch('/api/export-gpx', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ coordinates: selected.coordinates, name: 'segment-match' })
                });
                const blob = await resp.blob();
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = 'segment-match.gpx';
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
