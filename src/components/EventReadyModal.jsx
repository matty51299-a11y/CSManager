import { formatMoney } from '../utils/helpers';
import { formatDate } from '../utils/calendarDates';
import { getInviteStatus } from '../utils/eventInviteEngine';
import { getEventFormat } from '../utils/eventFormatEngine';

export default function EventReadyModal({ gameState, enterEvent, viewCalendar }) {
  if (gameState.currentPhase !== 'event_ready') return null;
  const event = gameState.events.find((item) => item.eventId === gameState.currentEventId);
  const team = gameState.teams.find((item) => item.teamId === gameState.selectedTeamId);
  if (!event || !team) return null;
  const format = getEventFormat(event);
  const status = getInviteStatus(event, gameState.rankings, gameState.teams, team.teamId, gameState.eventInviteSnapshots?.[event.eventId]);
  const isBreak = format.kind === 'break';
  return (
    <div className="event-ready-backdrop">
      <div className="event-ready-modal">
        <div className="eyebrow">Event Ready · {format.label}</div>
        <h2>{status.invited ? `Enter ${event.name}` : event.name}</h2>
        <p className="subtitle">{formatDate(event.startDate)} to {formatDate(event.endDate)}</p>
        <p className="format-blurb">{format.description}</p>
        <div className="event-ready-grid">
          <span>Format</span><strong>{format.label}</strong>
          <span>Teams</span><strong>{format.teamCount}</strong>
          <span>Prize pool</span><strong>{formatMoney(event.prizePool)}</strong>
          <span>Your team</span><strong>{team.name}</strong>
          {!isBreak && <><span>Invite status</span><strong className={status.invited ? 'status-good' : 'status-bad'}>{status.invited ? 'Invited' : 'Not invited'}</strong></>}
          {!isBreak && <><span>Your VRS rank</span><strong>#{status.userRank}</strong></>}
          {!isBreak && <><span>Invite cutoff</span><strong>Top {status.cutoffRank}</strong></>}
          {!isBreak && status.invited && <><span>Projected seed</span><strong>#{status.seed}</strong></>}
          {!isBreak && !status.invited && <><span>Reason</span><strong>{status.reason}</strong></>}
        </div>
        {isBreak && <p className="invite-note">This is a calendar break with no matches. It will create a news item and advance the date.</p>}
        {!isBreak && !status.invited && <p className="invite-note">Need to climb {status.placesNeeded} places before similar events.</p>}
        <div className="event-ready-actions">
          {!isBreak && status.invited && <button onClick={enterEvent}>Enter Event</button>}
          {(isBreak || !status.invited) && <button onClick={enterEvent}>{isBreak ? 'Continue Through Break' : 'Sim Event in Background'}</button>}
          <button className="secondary-button" onClick={viewCalendar}>View Calendar</button>
        </div>
      </div>
    </div>
  );
}
