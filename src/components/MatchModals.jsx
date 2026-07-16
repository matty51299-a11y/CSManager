import { Crest } from './fm';
import { formatDate } from '../utils/calendarDates';

function teamById(gameState, id) { return gameState.teams.find((t) => t.teamId === id); }
function fixtureContext(gameState, fixture) {
  const event = gameState.events.find((e) => e.eventId === fixture?.tournamentId);
  const a = teamById(gameState, fixture?.teamAId); const b = teamById(gameState, fixture?.teamBId);
  return { event, a, b };
}
export function PreMatchModal({ gameState, fixture, onClose, onPlay }) {
  if (!fixture) return null;
  const { event, a, b } = fixtureContext(gameState, fixture);
  const user = a?.teamId === gameState.selectedTeamId ? a : b;
  const opponent = a?.teamId === gameState.selectedTeamId ? b : a;
  return <div className="match-modal-backdrop"><div className="match-modal prematch-modal">
    <div className="modal-kicker">{event?.name || 'Tournament'}</div><h2>{fixture.round}</h2>
    <div className="prematch-versus"><div><Crest team={user} size={72}/><b>{user?.name}</b><span>VRS #{user?.currentRank ?? user?.ranking ?? '—'} · Form {user?.formRating ?? '—'}</span></div><strong>VS</strong><div><Crest team={opponent} size={72}/><b>{opponent?.name}</b><span>VRS #{opponent?.currentRank ?? opponent?.ranking ?? '—'} · Form {opponent?.formRating ?? '—'}</span></div></div>
    <div className="modal-meta"><span>Best of {fixture.bestOf}</span><span>{formatDate(fixture.scheduledDate)}</span><span>{event?.tier} Tier</span></div>
    <div className="modal-actions"><button className="ghost-button" onClick={onClose}>Cancel</button><button className="fn-continue" onClick={() => onPlay(fixture.id)}>Play Match</button></div>
  </div></div>;
}
