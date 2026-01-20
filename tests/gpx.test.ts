import { describe, it, expect } from 'vitest';
import { exportToGpx } from '@/lib/gpx';

describe('gpx export', () => {
  it('exports with trackpoints', () => {
    const gpx = exportToGpx([
      [-105.0, 39.7],
      [-105.01, 39.71]
    ]);
    expect(gpx).toContain('<trkpt');
    expect(gpx).toContain('<gpx');
  });
});
