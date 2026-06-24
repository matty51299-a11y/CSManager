import { Link } from 'react-router-dom';
import { tierBadgeClass, formatMoney } from '../utils/helpers';
import { compareDate, dateInRange, formatDate, monthNameFromDate } from '../utils/calendarDates';
import { inviteesFor } from '../state/GameStateContext';

function eventStatus(event, gameState, completed) {
  if (completed) return 'completed';
  if (gameState.activeEventId === event.eventId) return 'active';
  if (gameState.currentEventId === event.eventId || dateInRange(gameState.currentDate, event.startDate, event.endDate)) return 'current';
  return compareDate(event.startDate, gameState.currentDate) < 0 ? 'not invited' : 'upcoming';
}

export default function Calendar({ gameState, advanceToNextEvent, enterEvent }) {
  const events = [...gameState.events].sort((a, b) => compareDate(a.startDate, b.startDate));
  const grouped = events.reduce((acc, event) => { const m = monthNameFromDate(event.startDate); acc[m] = [...(acc[m] || []), event]; return acc; }, {});
  const completedById = new Map(gameState.completedEvents.map((e) => [e.eventId, e]));
  return <div><div className="page-header"><h1>Season Calendar</h1><div className="subtitle">Current date: {gameState.currentDateLabel} — {events.length} dated events</div></div>{Object.entries(grouped).map(([month, monthEvents]) => <div className="panel calendar-month" key={month}><div className="panel-header"><h2>{month} 2026</h2></div><div className="panel-body calendar-grid">{monthEvents.map((e) => { const completed = completedById.get(e.eventId); const invited = inviteesFor(e, gameState.rankings).includes(gameState.selectedTeamId); const status = eventStatus(e, gameState, completed); return <div key={e.eventId} className={`calendar-card status-${status.replace(' ', '-')}`}> <div className="match-line"><Link to={`/tournaments/${e.eventId}`}><strong>{e.name}</strong></Link><span>{status}</span></div><div className="muted">{formatDate(e.startDate)} – {formatDate(e.endDate)}</div><div className="muted">{e.eventType} · Tier {e.tier} · {e.teams} teams · {formatMoney(e.prizePool)}</div><div><span className={tierBadgeClass(e.tier)}>{e.tier}</span> <span className={invited ? 'diag-pass' : 'diag-fail'}>{invited ? 'Invited' : 'Not invited'}</span></div>{completed && <div className="muted">Champion: {completed.champion?.shortName || completed.champion?.name || 'TBD'} · Your finish: {completed.userRecord?.wins}-{completed.userRecord?.losses}</div>}{gameState.currentEventId === e.eventId ? <button onClick={enterEvent}>{invited ? 'Enter Event' : 'Sim Event in Background'}</button> : <button onClick={advanceToNextEvent}>Advance to Event Start</button>}</div>; })}</div></div>)}</div>;
}
