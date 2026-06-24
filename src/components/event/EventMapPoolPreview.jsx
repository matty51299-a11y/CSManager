import { mapPreview } from './eventOverlayUtils';

function edgeLabel(diff, a, b) {
  const leader = diff >= 0 ? a.shortName : b.shortName;
  const value = Math.abs(Math.round(diff));
  if (value <= 1) return 'Even';
  if (value <= 4) return `${leader} +${value}`;
  return `${leader} strong +${value}`;
}

export default function EventMapPoolPreview({ teamA, teamB, gameState }) {
  const preview = mapPreview(teamA, teamB, gameState);
  if (!preview) return <div className="overlay-panel compact"><h3>Map Pool Preview</h3><p className="muted">No live matchup selected.</p></div>;
  const diff = preview.teamA.total - preview.teamB.total;
  const mapDiff = preview.teamA.breakdown.mapRating - preview.teamB.breakdown.mapRating;
  const awpDiff = preview.teamA.breakdown.awperStrength - preview.teamB.breakdown.awperStrength;
  const entryDiff = preview.teamA.breakdown.entryStrength - preview.teamB.breakdown.entryStrength;
  const formDiff = (teamA.form || teamA.reputation || 70) - (teamB.form || teamB.reputation || 70);
  const rows = [
    ['Overall edge', diff],
    ['Map pool edge', mapDiff],
    ['AWP edge', awpDiff],
    ['Entry edge', entryDiff],
    ['Form edge', formDiff],
  ];
  return <div className="overlay-panel compact key-matchup"><h3>Map Pool Preview</h3>
    {rows.map(([label, value]) => <div className="key-row" key={label}><span>{label}</span><b>{edgeLabel(value, teamA, teamB)}</b></div>)}
    <div className="projected-map-list"><span>Projected maps</span>{preview.projected.map(({ map, edge }) => <div key={map.key}><b>{map.name}</b><em>{edgeLabel(edge, teamA, teamB)}</em></div>)}</div>
  </div>;
}
