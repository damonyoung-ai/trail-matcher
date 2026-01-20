# RouteTwin

Elevation-first trail route matching for runners. Upload a GPX, compare to local trail routes, and find segments that match distance + elevation preferences. Matching emphasizes elevation profile similarity above all else.

## Tech stack
- Next.js App Router + TypeScript + Tailwind
- MapLibre GL JS (via react-map-gl)
- Recharts for elevation charts + histograms
- In-memory caching for trail + elevation calls
- GPX parsing via @mapbox/togeojson + xmldom
- Trail data from OpenStreetMap via Overpass API
- Elevation sampling via Open-Elevation API

## Local setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

### Environment
- No required environment variables for local dev.

## Acceptance checklist
- [ ] Upload GPX -> see route on map, stats, elevation charts.
- [ ] Click “Find Matching Routes” -> list appears with scores; selecting one overlays and charts compare.
- [ ] Set distance + elevation range -> see segment results; selecting one overlays and charts compare.
- [ ] Export GPX works for both a full-route match and a segment.
- [ ] Elevation matching is clearly the top weighted factor and is visible in score breakdown.

## Project structure

```
app/
  api/
    elevation/route.ts
    export-gpx/route.ts
    match-routes/route.ts
    match-segments/route.ts
    parse-gpx/route.ts
    trails/route.ts
  components/
    ElevationCharts.tsx
    MatchCard.tsx
    RouteMap.tsx
    SegmentCard.tsx
    Shell.tsx
    StatsCard.tsx
  match-routes/page.tsx
  match-segments/page.tsx
  layout.tsx
  page.tsx
  globals.css
lib/
  db.ts
  elevation.ts
  geo.ts
  gpx.ts
  matching.ts
  parse.ts
  segments.ts
  trails.ts
  types.ts
prisma/
  schema.prisma
public/
  demo/demo.gpx
tests/
  geo.test.ts
  gpx.test.ts
  matching.test.ts
```

## Notes on trail data + elevation
- Overpass queries pull hiking/footway/path/track/bridleway ways and hiking relations within a bounding box inferred from the GPX route.
- Trail geometry and elevation arrays are cached in SQLite (hash keyed) to avoid repeated downloads and rate limits.
- Elevation sampling defaults to 40m along the line; tune on the upload page.

## Matching overview
- Elevation profile similarity (DTW on normalized profiles) is weighted at 0.55.
- Elevation gain similarity weight 0.20.
- Distance similarity weight 0.15.
- Shape similarity (approx distance to candidate line) weight 0.10.

## One-click demo
Use the “Use demo route” button on the home page to load `public/demo/demo.gpx`.
