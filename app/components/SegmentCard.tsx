import { SegmentCandidate } from '@/lib/types';

export function SegmentCard({
  segment,
  onSelect
}: {
  segment: SegmentCandidate;
  onSelect: (id: string) => void;
}) {
  const miles = segment.stats.distanceMeters / 1609.34;
  const gainFt = segment.stats.elevation.gain * 3.28084;
  return (
    <div className="rounded-2xl border border-sandstone-200 bg-white/80 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-display text-base text-pine-700">Segment {segment.id.slice(-5)}</div>
          <div className="text-xs text-pine-600">Score {segment.score.total}</div>
        </div>
        <button
          className="rounded-full bg-moss-500 text-white px-3 py-1 text-xs"
          onClick={() => onSelect(segment.id)}
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
          <div className="font-semibold">{segment.score.elevationProfile}</div>
        </div>
      </div>
    </div>
  );
}
