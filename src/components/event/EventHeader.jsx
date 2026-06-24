import { formatMoney } from '../../utils/helpers';
import { formatDate } from '../../utils/calendarDates';
import { bestFinish } from './eventOverlayUtils';

// Pick the single primary action for the current live state. The model decides
// which action applies for any format (single elim, groups, Swiss or Major).
function runAction(kind, actions) {
  if (kind === 'user') return actions.simUserMatch();
  if (kind === 'other') return actions.simOtherMatches();
  if (kind === 'advance') return actions.advanceEventStage();
  if (kind === 'finish') return actions.finishEvent();
  if (kind === 'return') return actions.returnToDashboard();
  return null;
}

export default function EventHeader({ tournament, model, actions, format }) {
  const record = `${model.userRecord.wins}-${model.userRecord.losses}`;
  const stage = model.champion ? 'Champion' : model.userWaiting ? `Awaiting ${model.userEntryStageName || model.phaseName}` : model.phaseName;
  const action = model.nextAction;
  return <header className="event-topbar">
    <div className="event-title-strip">
      <span className="event-kicker">LIVE EVENT · {format?.label || 'Event'}</span>
      <h1>{tournament.event.name}</h1>
      <span>{formatDate(tournament.event.startDate)} to {formatDate(tournament.event.endDate)}</span>
    </div>
    <div className="event-top-meta">
      <b>{stage}</b>
      <span>{formatMoney(tournament.event.prizePool)}</span>
      <span>{model.aliveCount} alive</span>
      <span>{model.userTeam?.shortName} <em>YOUR TEAM</em></span>
      <span className={`live-status ${model.status.toLowerCase()}`}>{model.status}</span>
      <span>Record {record}</span>
      <span>{bestFinish(tournament, model.status)}</span>
      <span>Next: {model.nextOpponent?.shortName || (model.userWaiting ? 'Wait' : 'TBD')}</span>
    </div>
    <div className="event-control-zone">
      <div className="next-action-strip">Next action: {action.label}</div>
      <div className="event-control-buttons">
        {action.kind !== 'none' && <button onClick={() => runAction(action.kind, actions)}>{action.label}</button>}
      </div>
    </div>
  </header>;
}
