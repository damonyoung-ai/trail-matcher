import { Coordinate } from './types';

export function exportToGpx(coords: Coordinate[], name = 'RouteTwin Export') {
  const points = coords
    .map((c) => `      <trkpt lat="${c[1]}" lon="${c[0]}"></trkpt>`)
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="RouteTwin" xmlns="http://www.topografix.com/GPX/1/1">\n  <trk>\n    <name>${name}</name>\n    <trkseg>\n${points}\n    </trkseg>\n  </trk>\n</gpx>`;
}
