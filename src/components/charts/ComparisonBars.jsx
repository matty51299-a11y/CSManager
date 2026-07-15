import { CHART } from './palette';

// Two-sided horizontal comparison bars for match stats
// (Kills / Assists / Deaths / Clutches / Opening Kills / ADR / …).
// `rows` is [{ label, a, b }]; each row scales both sides to the row max so
// the higher value fills its side fully.
export default function ComparisonBars({ rows, colorA = CHART.teamA, colorB = CHART.teamB, teamAName, teamBName }) {
  if (!rows || rows.length === 0) return null;
  return (
    <div className="cmp-bars">
      {(teamAName || teamBName) && (
        <div className="cmp-head">
          <span style={{ color: colorA }}>{teamAName}</span>
          <span />
          <span style={{ color: colorB }}>{teamBName}</span>
        </div>
      )}
      {rows.map((r) => {
        const mx = Math.max(r.a, r.b, 1);
        const aWin = r.a >= r.b;
        return (
          <div className="cmp-row" key={r.label}>
            <div className="cmp-val left" style={{ color: aWin ? colorA : undefined }}>{r.display ? r.display(r.a) : r.a}</div>
            <div className="cmp-track a">
              <span className="cmp-bar" style={{ width: `${(r.a / mx) * 100}%`, background: colorA, opacity: aWin ? 1 : 0.55 }} />
            </div>
            <div className="cmp-label">{r.label}</div>
            <div className="cmp-track b">
              <span className="cmp-bar" style={{ width: `${(r.b / mx) * 100}%`, background: colorB, opacity: aWin ? 0.55 : 1 }} />
            </div>
            <div className="cmp-val right" style={{ color: aWin ? undefined : colorB }}>{r.display ? r.display(r.b) : r.b}</div>
          </div>
        );
      })}
    </div>
  );
}
