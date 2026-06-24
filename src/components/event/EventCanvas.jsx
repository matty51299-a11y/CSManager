import EventBracketView from './EventBracketView';
import EventUserPath from './EventUserPath';

// The clean Overview centre canvas. Shows the live bracket once playoffs exist,
// otherwise a minimal user-path lane plus the user's recent results. Detailed
// tables live in the format tab, not here.
export default function EventCanvas({ model, actions }) {
  const recentUserMatches = model.userMatches.slice(-3);
  const playoffsLive = (model.bracketRounds || []).length > 0;
  if (playoffsLive) {
    return <div className="event-canvas bracket-canvas"><EventBracketView model={model} actions={actions} /></div>;
  }

  return <div className="event-canvas">
    <div className="canvas-glow" />
    <div className="canvas-stage-label">
      <span>{model.formatType.replace(/_/g, ' ')}</span>
      <b>{model.phaseName}</b>
    </div>
    <EventUserPath model={model} />
    <div className="canvas-mini-results">
      {recentUserMatches.length ? recentUserMatches.map((match) => <div className="canvas-result-node" key={match.id || `${match.teamA.teamId}-${match.teamB.teamId}-${match.seriesScore}`}>
        <span>{match.winner.shortName} def. {match.loser.shortName}</span>
        <b>{match.seriesScore}</b>
      </div>) : <div className="canvas-placeholder"><b>Bracket space reserved</b><span>Current matches live in the rail. Detailed tables are on the {model.phase?.kind === 'groups' ? 'Groups' : model.phase?.kind === 'swiss' ? 'stage' : 'Bracket'} tab.</span></div>}
    </div>
  </div>;
}
