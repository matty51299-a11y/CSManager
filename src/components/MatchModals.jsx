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
export function ResultModal({ gameState, result, onClose, onTournament }) {
  if (!result) return null;
  const stats = [...(result.playerStatistics || [])].sort((a,b)=>a.teamId.localeCompare(b.teamId) || b.rating-a.rating);
  return <div className="match-modal-backdrop"><div className="match-modal result-modal">
    <div className="modal-kicker">{result.tournamentName} · {result.stage} · {formatDate(result.date)}</div><h2>{result.winner.shortName} {result.seriesScore} {result.loser.shortName}</h2>
    <div className="result-summary"><div><Crest team={result.teamA} size={46}/><b>{result.teamA.name}</b></div><div className="nm-score"><span>{result.seriesScore.split('-')[0]}</span><span>:</span><span>{result.seriesScore.split('-')[1]}</span></div><div><Crest team={result.teamB} size={46}/><b>{result.teamB.name}</b></div></div>
    <div className="modal-meta"><span>Winner: {result.winner.name}</span><span>MVP: {result.matchMvp?.gamertag} ({result.matchMvp?.rating})</span></div>
    <h3>Map Results</h3><div className="map-result-grid">{result.maps.map((m)=><div key={m.mapKey} className="risk-row"><b>{m.mapName}</b><span>{m.teamARounds}-{m.teamBRounds}{m.overtime?' OT':''} · {m.winnerName}</span></div>)}</div>
    <h3>Player Statistics</h3><div className="stats-table-wrap"><table><thead><tr><th>Player</th><th>K</th><th>A</th><th>D</th><th>+/-</th><th>ADR</th><th>KAST</th><th>HS%</th><th>HLTV-style rating</th></tr></thead><tbody>{stats.map((s)=><tr key={s.playerId} className={`${s.playerId===result.matchMvp?.playerId?'your-team-row':''} ${s.teamId===gameState.selectedTeamId?'controlled-player':''}`}><td>{s.gamertag}</td><td>{s.kills}</td><td>{s.assists}</td><td>{s.deaths}</td><td>{s.kdDiff}</td><td>{s.ADR}</td><td>{s.KAST}%</td><td>{s.headshotPercentage}%</td><td><b>{s.rating.toFixed(2)}</b></td></tr>)}</tbody></table></div>
    <div className="modal-actions"><button className="ghost-button" onClick={onTournament}>View Tournament</button><button className="fn-continue" onClick={onClose}>Continue</button></div>
  </div></div>;
}
