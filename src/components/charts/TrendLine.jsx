import { CHART } from './palette';

// Two-series (or more) line chart for Win Probability / Round Equipment
// Value, coloured by team. `series` is [{ key, name, color }].
export default function TrendLine({
  data,
  series,
  xKey = 'round',
  height = 200,
  yDomain,
  yTickFormatter,
}) {
  if (!data || data.length === 0 || !series?.length) return null;

  const width = 640;
  const pad = { top: 12, right: 16, bottom: 24, left: 44 };
  const plotWidth = width - pad.left - pad.right;
  const plotHeight = height - pad.top - pad.bottom;
  const values = data.flatMap((row) => series.map(({ key }) => row[key])).filter((value) => Number.isFinite(value));
  if (!values.length) return null;

  const domainMin = Array.isArray(yDomain) && Number.isFinite(yDomain[0]) ? yDomain[0] : Math.min(...values);
  const domainMax = Array.isArray(yDomain) && Number.isFinite(yDomain[1]) ? yDomain[1] : Math.max(...values);
  const range = domainMax - domainMin || 1;
  const xFor = (index) => pad.left + (data.length === 1 ? plotWidth / 2 : (index / (data.length - 1)) * plotWidth);
  const yFor = (value) => pad.top + plotHeight - ((value - domainMin) / range) * plotHeight;
  const ticks = [domainMin, domainMin + range / 2, domainMax];

  return (
    <svg className="trend-line" width="100%" height={height} viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Trend line chart">
      {ticks.map((tick) => (
        <g key={tick}>
          <line x1={pad.left} x2={width - pad.right} y1={yFor(tick)} y2={yFor(tick)} stroke={CHART.grid} strokeWidth="1" />
          <text x={pad.left - 8} y={yFor(tick) + 4} textAnchor="end" fill={CHART.axis} fontSize="10">{yTickFormatter ? yTickFormatter(tick) : Math.round(tick)}</text>
        </g>
      ))}
      {data.map((row, index) => (
        <text key={`${row[xKey]}-${index}`} x={xFor(index)} y={height - 6} textAnchor="middle" fill={CHART.axis} fontSize="10">{row[xKey]}</text>
      ))}
      {series.map(({ key, color }) => {
        const points = data.map((row, index) => Number.isFinite(row[key]) ? `${xFor(index).toFixed(2)},${yFor(row[key]).toFixed(2)}` : null).filter(Boolean).join(' ');
        return <polyline key={key} points={points} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />;
      })}
    </svg>
  );
}
