import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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
  tooltipFormatter,
}) {
  if (!data || data.length === 0) return null;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 2 }}>
        <CartesianGrid stroke={CHART.grid} vertical={false} />
        <XAxis dataKey={xKey} stroke={CHART.axis} tick={{ fontSize: 10, fill: CHART.axis }} tickLine={false} axisLine={{ stroke: CHART.grid }} />
        <YAxis
          stroke={CHART.axis}
          tick={{ fontSize: 10, fill: CHART.axis }}
          tickLine={false}
          axisLine={{ stroke: CHART.grid }}
          width={44}
          domain={yDomain}
          tickFormatter={yTickFormatter}
        />
        <Tooltip
          contentStyle={{ background: CHART.tooltipBg, border: `1px solid ${CHART.tooltipBorder}`, borderRadius: 4, fontSize: 11 }}
          labelStyle={{ color: CHART.text, fontWeight: 700 }}
          itemStyle={{ fontSize: 11 }}
          formatter={tooltipFormatter}
        />
        {series.map((s) => (
          <Line key={s.key} type="monotone" dataKey={s.key} name={s.name} stroke={s.color} strokeWidth={2} dot={false} isAnimationActive={false} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
