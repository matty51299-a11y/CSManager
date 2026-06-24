import { formatMoney } from '../../utils/helpers';
import { formatDate } from '../../utils/calendarDates';
import { bestFinish } from './eventOverlayUtils';

export default function EventHeader({ tournament, model, actions }) {
  const next = model.pendingUser || (model.playoffPendingUser && [{ team: model.playoffPendingUser.teamA }, { team: model.playoffPendingUser.teamB }]);
  const nextOpponent = next ? (next[0].team.teamId === model.userTeamId ? next[1].team : next[0].team) : null;
  const record = `${model.userStanding?.wins || 0}-${model.userStanding?.losses || 0}`;
  return <header className="event-topbar">
    <div className="event-title-strip"><span className="event-kicker">LIVE EVENT</span><h1>{tournament.event.name}</h1><span>{formatDate(tournament.event.startDate)} – {formatDate(tournament.event.endDate)}</span></div>
    <div className="event-top-meta"><b>{tournament.playoffs ? 'Playoffs' : `Swiss R${model.activeRound?.number || tournament.swiss.rounds.length + 1}`}</b><span>{formatMoney(tournament.event.prizePool)}</span><span>{tournament.swiss?.standings.filter((s)=>s.status !== 'eliminated').length || 0}/{tournament.teams.length} alive</span><span>{model.userTeam?.shortName} <em>YOUR TEAM</em></span><span className={`live-status ${model.status.toLowerCase()}`}>{model.status}</span><span>Record {record}</span><span>{bestFinish(tournament, model.status)}</span><span>Next: {nextOpponent?.shortName || 'TBD'}</span></div>
    <div className="event-control-buttons">
      {model.pendingUser && <button onClick={() => actions.simUserMatch({ teamAId: model.pendingUser[0].teamId, teamBId: model.pendingUser[1].teamId })}>Sim Your Match</button>}
      {model.playoffPendingUser && <button onClick={() => actions.simUserMatch({ roundIndex: model.playoffPendingUser.roundIndex, matchIndex: model.playoffPendingUser.matchIndex })}>Sim Your Match</button>}
      {!tournament.playoffs && !tournament.swiss.complete && <button onClick={actions.simAiMatches}>Sim Other Matches</button>}
      {!tournament.playoffs && !tournament.swiss.complete && model.pairings.length === 0 && <button onClick={actions.advanceSwissRound}>Advance Round</button>}
      {tournament.swiss.complete && !tournament.playoffs && <button onClick={actions.generatePlayoffs}>Advance Round</button>}
      {tournament.playoffs && !tournament.champion && <button onClick={actions.simPlayoffRound}>Sim Round</button>}
      {tournament.champion && <button onClick={actions.completeEvent}>Finish Event</button>}
    </div>
  </header>;
}
