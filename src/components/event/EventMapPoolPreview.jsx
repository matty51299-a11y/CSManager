import { mapPreview } from './eventOverlayUtils';
const labels = [['averageOverall','Overall'],['awperStrength','AWP'],['entryStrength','Entry'],['clutchStrength','Clutch'],['iglCalling','Calling'],['mapRating','Map pool']];
export default function EventMapPoolPreview({ teamA, teamB, gameState }) {
  const preview = mapPreview(teamA, teamB, gameState);
  if (!preview) return <div className="overlay-panel compact"><h3>Matchup / Map Pool</h3><p className="muted">No live matchup selected.</p></div>;
  return <div className="overlay-panel compact"><h3>Matchup / Map Pool Preview</h3><div className="vs-strength"><b>{teamA.shortName}</b><span>{preview.teamA.total}</span><i>VS</i><span>{preview.teamB.total}</span><b>{teamB.shortName}</b></div>{labels.map(([key,label])=><div className="comparison-row" key={key}><span>{label}</span><b>{preview.teamA.breakdown[key]}</b><meter min="50" max="100" value={(preview.teamA.breakdown[key]+preview.teamB.breakdown[key])/2}></meter><b>{preview.teamB.breakdown[key]}</b></div>)}<h4>Projected veto / picks</h4>{preview.projected.map((item)=><div className="map-edge" key={item.map.key}><span>{item.map.name}</span><b>{item.edge >= 0 ? teamA.shortName : teamB.shortName} edge +{Math.abs(item.edge)}</b></div>)}</div>;
}
