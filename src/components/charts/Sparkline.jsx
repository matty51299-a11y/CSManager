import { CHART } from './palette';

// Small single-series trend line for budget cards. `data` may be an array of
// numbers or of { v } objects.
export default function Sparkline({ data, color = CHART.teamA, height = 38 }) {
  if (!data || data.length < 2) return null;

  const values = data.map((point) => (typeof point === 'number' ? point : point?.v)).filter((value) => Number.isFinite(value));
  if (values.length < 2) return null;

  const width = 120;
  const padding = 3;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const step = (width - padding * 2) / Math.max(1, values.length - 1);
  const points = values.map((value, index) => {
    const x = padding + index * step;
    const y = height - padding - ((value - min) / range) * (height - padding * 2);
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(' ');

  return (
    <svg className="sparkline" width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.75" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
