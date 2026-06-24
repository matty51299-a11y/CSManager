import { teamSeed } from './eventOverlayUtils';
function PairingCard({ a, b, tournament, userTeamId, onSim }) {
  const isUser = [a.teamId, b.teamId].includes(userTeamId);
  return <div className={`rail-match ${isUser ? 'is-user' : ''}`}><div><span>#{teamSeed(a.team, tournament)}</span><b>{a.team.shortName}</b>{a.teamId===userTeamId && <em>YOU</em>}</div><div><span>#{teamSeed(b.team, tournament)}</span><b>{b.team.shortName}</b>{b.teamId===userTeamId && <em>YOU</em>}</div><footer><small>Upcoming · Bo3</small><button onClick={()=>onSim({ teamAId:a.teamId, teamBId:b.teamId })}>Sim</button></footer></div>;
}
function ResultCard({ match, userTeamId }) { const isUser=[match.teamA.teamId,match.teamB.teamId].includes(userTeamId); return <div className={`rail-match done ${isUser?'is-user':''}`}><div><b>{match.teamA.shortName}</b><strong>{match.mapsWonA}</strong></div><div><b>{match.teamB.shortName}</b><strong>{match.mapsWonB}</strong></div><footer><small>{match.winner.shortName} won {match.seriesScore}</small></footer></div>; }
export default function EventMatchRail({ tournament, model, onSimOther }) {
  const played = model.activeRound?.matches || [];
  return <aside className="event-rail"><div className="rail-head"><span>NOW</span><h2>{tournament.playoffs ? 'Playoff Match List' : `Swiss Round ${model.activeRound?.number || tournament.swiss.rounds.length + 1}`}</h2></div>{model.pairings.map(([a,b])=><PairingCard key={`${a.teamId}-${b.teamId}`} a={a} b={b} tournament={tournament} userTeamId={model.userTeamId} onSim={onSimOther}/>) }{played.map((m)=><ResultCard key={m.id || `${m.teamA.teamId}-${m.teamB.teamId}-${m.seriesScore}`} match={m} userTeamId={model.userTeamId}/>) }{!model.pairings.length && !played.length && <div className="rail-empty">No live round matches.</div>}</aside>;
}
