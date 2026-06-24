import { mapPreview } from './eventOverlayUtils';

function edgeLabel(diff, a, b) {
  const leader = diff >= 0 ? a.shortName : b.shortName;
  const value = Math.abs(diff);
  if (value <= 1) return 'Even';
  if (value <= 4) return `${leader} +${value}`;
  return `${leader} strong +${value}`;
}

export default function EventMapPoolPreview({ teamA, teamB, gameState }) {
  const preview = mapPreview(teamA, teamB, gameState);
  if (!preview) return <div className="overlay-panel compact"><h3>Key Matchup</h3><p className="muted">No live matchup selected.</p></div>;
  const diff = preview.teamA.total - preview.teamB.total;
  const mapDiff = preview.teamA.breakdown.mapRating - preview.teamB.breakdown.mapRating;
  const awpDiff = preview.teamA.breakdown.awperStrength - preview.teamB.breakdown.awperStrength;
  const formDiff = (teamA.form || teamA.reputation || 70) - (teamB.form || teamB.reputation || 70);
  const difficulty = Math.abs(diff) <= 3 ? 'Dangerous' : Math.abs(diff) <= 7 ? 'Manageable' : diff > 0 ? 'Favourable' : 'Upset needed';
  return <div className="overlay-panel compact key-matchup"><h3>Key Matchup</h3>
    <div className="matchup-headline">{diff >= 0 ? teamA.shortName : teamB.shortName} {Math.abs(diff) <= 3 ? 'slight edge' : 'edge'}</div>
    <div className="key-row"><span>Map pool</span><b>{edgeLabel(mapDiff, teamA, teamB)}</b></div>
    <div className="key-row"><span>AWP</span><b>{edgeLabel(awpDiff, teamA, teamB)}</b></div>
    <div className="key-row"><span>Form</span><b>{edgeLabel(formDiff, teamA, teamB)}</b></div>
    <div className="key-row"><span>Difficulty</span><b>{difficulty}</b></div>
  </div>;
}
