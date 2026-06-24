import EventBracketView from './EventBracketView';
import EventUserPath from './EventUserPath';

export default function EventCanvas({ tournament, model, actions }) {
  const recentUserMatches = model.allMatches.filter((match) => [match.teamA.teamId, match.teamB.teamId].includes(model.userTeamId)).slice(-3);
  if (tournament.playoffs) {
    return <div className="event-canvas bracket-canvas"><EventBracketView tournament={tournament} userTeamId={model.userTeamId} onSimUser={actions.simUserMatch}/></div>;
  }

  return <div className="event-canvas">
    <div className="canvas-glow" />
    <div className="canvas-stage-label">
      <span>Swiss path canvas</span>
      <b>Round {model.activeRound?.number || tournament.swiss.rounds.length + 1}</b>
    </div>
    <EventUserPath tournament={tournament} model={model}/>
    <div className="canvas-mini-results">
      {recentUserMatches.length ? recentUserMatches.map((match) => <div className="canvas-result-node" key={match.id || `${match.teamA.teamId}-${match.teamB.teamId}-${match.seriesScore}`}>
        <span>{match.winner.shortName} def. {match.loser.shortName}</span>
        <b>{match.seriesScore}</b>
      </div>) : <div className="canvas-placeholder"><b>Bracket space reserved</b><span>Current round matches live in the rail. Detailed Swiss pools are on the Swiss tab.</span></div>}
    </div>
  </div>;
}
