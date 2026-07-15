import { LineChart, Line, YAxis, ResponsiveContainer } from 'recharts';
import { CHART } from './palette';

// Small single-series trend line for budget cards. `data` may be an array of
// numbers or of { v } objects.
export default function Sparkline({ data, color = CHART.teamA, height = 38 }) {
  if (!data || data.length < 2) return null;
  const series = data.map((d, i) => (typeof d === 'number' ? { i, v: d } : d));
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={series} margin={{ top: 3, right: 2, left: 2, bottom: 3 }}>
        <YAxis hide domain={['dataMin', 'dataMax']} />
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.75} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
