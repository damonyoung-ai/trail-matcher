'use client';

import { useMemo, useState } from 'react';
import { Shell } from './components/Shell';
import { RouteMap } from './components/RouteMap';
import { ElevationCharts } from './components/ElevationCharts';
import { StatsCard } from './components/StatsCard';
import type { Coordinate, RouteStats } from '@/lib/types';

function encodeShare(payload: object) {
  if (typeof window === 'undefined') return '';
  return btoa(encodeURIComponent(JSON.stringify(payload)));
}

export default function HomePage() {
  const [coordinates, setCoordinates] = useState<Coordinate[] | null>(null);
  const [stats, setStats] = useState<RouteStats | null>(null);
  const [elevations, setElevations] = useState<number[] | null>(null);
  const [interval, setInterval] = useState(40);
  const [radius, setRadius] = useState(25);
  const [status, setStatus] = useState('');

  const shareLink = useMemo(() => {
    if (!coordinates || !stats) return '';
    return `${window.location.origin}/match-routes?route=${encodeShare({ coordinates, stats })}&radius=${radius}`;
  }, [coordinates, stats, radius]);

  async function handleFile(file: File) {
    setStatus('Parsing GPX…');
    const form = new FormData();
    form.append('file', file);
    form.append('intervalMeters', String(interval));
    const resp = await fetch('/api/parse-gpx', { method: 'POST', body: form });
    const data = await resp.json();
    if (!resp.ok) {
      setStatus(data.error || 'Error');
      return;
    }
    setCoordinates(data.coordinates);

    setStatus('Fetching elevation…');
    const elevResp = await fetch('/api/elevation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ coordinates: data.coordinates, intervalMeters: interval })
    });
    const elevData = await elevResp.json();
    if (!elevResp.ok) {
      setStatus(elevData.error || 'Elevation error');
      return;
    }
    setElevations(elevData.elevations);
    setStats(elevData.stats);
    setStatus('Ready.');
  }

  async function useDemo() {
    const resp = await fetch('/demo/demo.gpx');
    const blob = await resp.blob();
    const file = new File([blob], 'demo.gpx', { type: 'application/gpx+xml' });
    await handleFile(file);
  }

  return (
    <Shell>
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="space-y-6">
          <div className="rounded-3xl border border-sandstone-200 bg-white/80 p-6 shadow-soft">
            <h2 className="font-display text-2xl text-pine-800">Upload a GPX route</h2>
            <p className="text-sm text-pine-600">We will normalize, sample, and match by elevation profile first.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <label className="rounded-full border border-pine-600 px-4 py-2 text-sm cursor-pointer">
                Select GPX
                <input
                  type="file"
                  accept=".gpx"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                />
              </label>
              <button
                className="rounded-full bg-clay-500 text-white px-4 py-2 text-sm"
                onClick={useDemo}
              >
                Use demo route
              </button>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
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
                <div className="text-sm text-pine-700">{radius} miles</div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-pine-600">Sampling interval (m)</label>
                <input
                  type="range"
                  min={20}
                  max={80}
                  value={interval}
                  onChange={(e) => setInterval(Number(e.target.value))}
                  className="w-full"
                />
                <div className="text-sm text-pine-700">{interval} meters</div>
              </div>
            </div>
            <div className="mt-4 text-sm text-pine-700">{status}</div>
          </div>

          <RouteMap primary={coordinates || undefined} />
          <ElevationCharts profileA={stats?.profile} histA={stats?.elevationHistogram} />
        </section>

        <aside className="space-y-4">
          <StatsCard title="Input Route" stats={stats || undefined} />
          {coordinates && stats && (
            <div className="rounded-2xl border border-sandstone-200 bg-white/80 p-4 text-sm">
              <div className="font-display text-pine-700">Next steps</div>
              <p className="text-pine-600 mt-2">
                Ready to compare? Jump to route matching or segment matching with your current route.
              </p>
              <div className="mt-3 flex flex-col gap-2">
                <a
                  className="rounded-full bg-pine-700 text-white px-4 py-2 text-center"
                  href={`/match-routes?route=${encodeShare({ coordinates, stats })}&radius=${radius}`}
                >
                  Find matching routes
                </a>
                <a
                  className="rounded-full bg-sky-500 text-white px-4 py-2 text-center"
                  href={`/match-segments?route=${encodeShare({ coordinates, stats })}&radius=${radius}`}
                >
                  Find matching segments
                </a>
                <input
                  value={shareLink}
                  readOnly
                  className="text-xs border border-sandstone-200 rounded px-2 py-1"
                />
              </div>
            </div>
          )}
        </aside>
      </div>
    </Shell>
  );
}
