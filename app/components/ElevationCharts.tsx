'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';

export function ElevationCharts({
  profileA,
  profileB,
  histA,
  histB
}: {
  profileA?: number[];
  profileB?: number[];
  histA?: number[];
  histB?: number[];
}) {
  const profileData = (profileA || []).map((e, idx) => ({
    idx,
    a: e,
    b: profileB?.[idx]
  }));
  const histData = (histA || []).map((val, idx) => ({
    bin: idx,
    a: val,
    b: histB?.[idx]
  }));

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="bg-white/70 backdrop-blur rounded-2xl border border-sandstone-200 p-5">
        <h3 className="font-display text-lg text-pine-700 mb-3">Elevation Profile</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={profileData}>
              <XAxis dataKey="idx" hide />
              <YAxis tick={{ fontSize: 10 }} width={30} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="a" stroke="#2a4a3a" strokeWidth={2} dot={false} name="Input" />
              {profileB && (
                <Line type="monotone" dataKey="b" stroke="#c98560" strokeWidth={2} dot={false} name="Match" />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-white/70 backdrop-blur rounded-2xl border border-sandstone-200 p-5">
        <h3 className="font-display text-lg text-pine-700 mb-3">Elevation Distribution</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={histData}>
              <XAxis dataKey="bin" hide />
              <YAxis tick={{ fontSize: 10 }} width={30} />
              <Tooltip />
              <Legend />
              <Bar dataKey="a" fill="#2a4a3a" name="Input" />
              {histB && <Bar dataKey="b" fill="#c98560" name="Match" />}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
