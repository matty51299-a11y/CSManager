import { formatMoney } from '../utils/helpers';
import { formatDate } from '../utils/calendarDates';
import { getInviteStatus } from '../utils/vrsRankingEngine';

export default function EventReadyModal({ gameState, enterEvent, viewCalendar }) {
  if (gameState.currentPhase !== 'event_ready') return null;
  const event = gameState.events.find((item) => item.eventId === gameState.currentEventId);
  const team = gameState.teams.find((item) => item.teamId === gameState.selectedTeamId);
  if (!event || !team) return null;
  const status = getInviteStatus(event, gameState.rankings, gameState.teams, team.teamId, gameState.eventInviteSnapshots?.[event.eventId]);
  return (
    <div className="event-ready-backdrop">
      <div className="event-ready-modal">
        <div className="eyebrow">Event Ready</div>
        <h2>{status.invited ? `Enter ${event.name}` : event.name}</h2>
        <p className="subtitle">{formatDate(event.startDate)} to {formatDate(event.endDate)}</p>
        <div className="event-ready-grid">
          <span>Prize pool</span><strong>{formatMoney(event.prizePool)}</strong>
          <span>Teams</span><strong>{event.teams}</strong>
          <span>Your team</span><strong>{team.name}</strong>
          <span>Invite status</span><strong className={status.invited ? 'status-good' : 'status-bad'}>{status.invited ? 'Invited' : 'Not invited'}</strong>
          <span>Your VRS rank</span><strong>#{status.userRank}</strong>
          <span>Invite cutoff</span><strong>Top {status.cutoffRank}</strong>
          {status.invited ? <><span>Seed</span><strong>#{status.seed}</strong></> : <><span>Reason</span><strong>{status.reason}</strong></>}
        </div>
        {!status.invited && <p className="invite-note">Need to climb {status.placesNeeded} places before similar events.</p>}
        <div className="event-ready-actions">
          {status.invited && <button onClick={enterEvent}>Enter Event</button>}
          {!status.invited && <button onClick={enterEvent}>Sim Event in Background</button>}
          <button className="secondary-button" onClick={viewCalendar}>View Calendar</button>
          {!status.invited && <button className="ghost-button" onClick={viewCalendar}>Continue</button>}
        </div>
      </div>
    </div>
  );
}
