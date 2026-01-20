import { TrailCandidate } from '@/lib/types';

export function MatchCard({
  match,
  onSelect
}: {
  match: TrailCandidate;
  onSelect: (id: string) => void;
}) {
  const miles = match.stats.distanceMeters / 1609.34;
  const gainFt = match.stats.elevation.gain * 3.28084;
  return (
    <div className="rounded-2xl border border-sandstone-200 bg-white/80 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-display text-base text-pine-700">{match.name}</div>
          <div className="text-xs text-pine-600">Score {match.score.total}</div>
        </div>
        <button
          className="rounded-full bg-pine-700 text-white px-3 py-1 text-xs"
          onClick={() => onSelect(match.id)}
        >
          Compare
        </button>
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
        <div>
          <div className="text-pine-500">Distance</div>
          <div className="font-semibold">{miles.toFixed(1)} mi</div>
        </div>
        <div>
          <div className="text-pine-500">Gain</div>
          <div className="font-semibold">{gainFt.toFixed(0)} ft</div>
        </div>
        <div>
          <div className="text-pine-500">Elevation match</div>
          <div className="font-semibold">{match.score.elevationProfile}</div>
        </div>
      </div>
    </div>
  );
}
