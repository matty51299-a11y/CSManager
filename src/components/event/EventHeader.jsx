import { formatMoney } from '../../utils/helpers';
import { formatDate } from '../../utils/calendarDates';
import { bestFinish } from './eventOverlayUtils';

function nextActionText(tournament, model) {
  if (model.pendingUser || model.playoffPendingUser) return 'Next action: Sim your match';
  if (!tournament.playoffs && !tournament.swiss.complete && model.pairings.length) return `Next action: Sim other Swiss Round ${model.activeRound?.number || tournament.swiss.rounds.length + 1} matches`;
  if (!tournament.playoffs && !tournament.swiss.complete) return 'Next action: Advance to next Swiss round';
  if (tournament.swiss.complete && !tournament.playoffs) return 'Next action: Generate playoffs';
  if (tournament.playoffs && !tournament.champion) return 'Next action: Sim playoff round';
  if (tournament.champion) return 'Next action: Finish event';
  return 'Next action: Review event';
}

export default function EventHeader({ tournament, model, actions, format }) {
  const nextOpponent = model.nextOpponent;
  const record = `${model.userStanding?.wins || 0}-${model.userStanding?.losses || 0}`;
  const stageNames = format?.stageNames || ['Swiss', 'Playoffs'];
  const firstStage = stageNames[0];
  const lastStage = stageNames[stageNames.length - 1];
  const stage = tournament.champion ? 'Complete' : tournament.playoffs ? lastStage : `${firstStage} · Round ${model.activeRound?.number || tournament.swiss.rounds.length + 1}`;
  return <header className="event-topbar">
    <div className="event-title-strip"><span className="event-kicker">LIVE EVENT · {format?.label || 'Event'}</span><h1>{tournament.event.name}</h1><span>{formatDate(tournament.event.startDate)} to {formatDate(tournament.event.endDate)}</span></div>
    <div className="event-top-meta"><b>{stage}</b><span>{formatMoney(tournament.event.prizePool)}</span><span>{tournament.swiss?.standings.filter((s)=>s.status !== 'eliminated').length || 0} alive</span><span>{model.userTeam?.shortName} <em>YOUR TEAM</em></span><span className={`live-status ${model.status.toLowerCase()}`}>{model.status}</span><span>Record {record}</span><span>{bestFinish(tournament, model.status)}</span><span>Next: {nextOpponent?.shortName || 'TBD'}</span></div>
    <div className="event-control-zone"><div className="next-action-strip">{nextActionText(tournament, model)}</div><div className="event-control-buttons">
      {model.pendingUser && <button onClick={() => actions.simUserMatch({ teamAId: model.pendingUser[0].teamId, teamBId: model.pendingUser[1].teamId })}>Sim Your Match</button>}
      {model.playoffPendingUser && <button onClick={() => actions.simUserMatch({ roundIndex: model.playoffPendingUser.roundIndex, matchIndex: model.playoffPendingUser.matchIndex })}>Sim Your Match</button>}
      {!tournament.playoffs && !tournament.swiss.complete && model.pairings.length > 0 && <button onClick={actions.simAiMatches}>Sim Other Matches</button>}
      {!tournament.playoffs && !tournament.swiss.complete && model.pairings.length === 0 && <button onClick={actions.advanceSwissRound}>Advance Round</button>}
      {tournament.swiss.complete && !tournament.playoffs && <button onClick={actions.generatePlayoffs}>Advance Round</button>}
      {tournament.playoffs && !tournament.champion && <button onClick={actions.simPlayoffRound}>Sim Round</button>}
      {tournament.champion && <button onClick={actions.completeEvent}>Finish Event</button>}
    </div></div>
  </header>;
}
