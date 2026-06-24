import { teamSeed } from './eventOverlayUtils';

function PairingCard({ pair, tournament, userTeamId, onSimUser, onSimOther }) {
  const a = pair.teamA;
  const b = pair.teamB;
  const isUser = [a.teamId, b.teamId].includes(userTeamId);
  return <div className={`rail-match ${isUser ? 'is-user' : ''}`}>
    <div><span>#{teamSeed(a, tournament)}</span><b>{a.shortName}</b>{a.teamId === userTeamId && <em>YOU</em>}</div>
    <div><span>#{teamSeed(b, tournament)}</span><b>{b.shortName}</b>{b.teamId === userTeamId && <em>YOU</em>}</div>
    <footer>
      <small>{isUser ? 'Playing next' : 'Upcoming'}</small>
      <button onClick={() => (isUser ? onSimUser() : onSimOther())}>Sim</button>
    </footer>
  </div>;
}

function ResultCard({ match, userTeamId }) {
  const isUser = [match.teamA.teamId, match.teamB.teamId].includes(userTeamId);
  return <div className={`rail-match done ${isUser ? 'is-user' : ''}`}>
    <div><b>{match.teamA.shortName}</b><strong>{match.mapsWonA}</strong></div>
    <div><b>{match.teamB.shortName}</b><strong>{match.mapsWonB}</strong></div>
    <footer><small>Completed · {match.winner.shortName} won {match.seriesScore}</small></footer>
  </div>;
}

export default function EventMatchRail({ tournament, model, actions }) {
  const pending = model.pendingMatches.slice(0, 8);
  const recent = [...model.allMatches].slice(-5).reverse();
  return <aside className="event-rail">
    <div className="rail-head"><span>NOW</span><h2>{model.phaseName}</h2></div>
    {pending.map((pair) => <PairingCard key={pair.id} pair={pair} tournament={tournament} userTeamId={model.userTeamId} onSimUser={actions.simUserMatch} onSimOther={actions.simOtherMatches} />)}
    {recent.map((m) => <ResultCard key={m.id || `${m.teamA.teamId}-${m.teamB.teamId}-${m.seriesScore}`} match={m} userTeamId={model.userTeamId} />)}
    {!pending.length && !recent.length && <div className="rail-empty">No current matches.</div>}
  </aside>;
}
