import { RouteStats } from '@/lib/types';

export function StatsCard({ title, stats }: { title: string; stats?: RouteStats }) {
  if (!stats) return null;
  const miles = stats.distanceMeters / 1609.34;
  const gainFt = stats.elevation.gain * 3.28084;
  return (
    <div className="bg-white/80 rounded-2xl border border-sandstone-200 p-4 shadow-sm">
      <h4 className="font-display text-base text-pine-700 mb-2">{title}</h4>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-pine-600">Distance</div>
          <div className="font-semibold">{miles.toFixed(1)} mi</div>
        </div>
        <div>
          <div className="text-pine-600">Elevation Gain</div>
          <div className="font-semibold">{gainFt.toFixed(0)} ft</div>
        </div>
        <div>
          <div className="text-pine-600">Min/Max</div>
          <div className="font-semibold">
            {stats.elevation.min.toFixed(0)}m / {stats.elevation.max.toFixed(0)}m
          </div>
        </div>
        <div>
          <div className="text-pine-600">Loss</div>
          <div className="font-semibold">{stats.elevation.loss.toFixed(0)} m</div>
        </div>
      </div>
    </div>
  );
}
