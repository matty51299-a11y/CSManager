import { Link } from 'react-router-dom';
import { tierBadgeClass, formatMoney } from '../utils/helpers';
import { compareDate, dateInRange, formatDate, monthNameFromDate } from '../utils/calendarDates';
import { inviteesFor } from '../state/GameStateContext';
import { getUserCompletedFixtures, getUserUpcomingFixtures, isUserFixture } from '../utils/careerSimulation';

function eventStatus(event, gameState, completed) {
  if (completed) return 'completed';
  if (gameState.activeEventId === event.eventId) return 'active';
  if (gameState.currentEventId === event.eventId || dateInRange(gameState.currentDate, event.startDate, event.endDate)) return 'current';
  return compareDate(event.startDate, gameState.currentDate) < 0 ? 'not invited' : 'upcoming';
}

function fixtureOpponent(gameState, fixture) {
  const opponentId = fixture.teamAId === gameState.selectedTeamId ? fixture.teamBId : fixture.teamAId;
  return gameState.teams.find((team) => team.teamId === opponentId);
}

function fixtureScore(fixture) {
  return fixture.result?.seriesScore || (fixture.mapScores?.length ? `${fixture.mapScores.filter((m) => m.winner?.teamId === fixture.teamAId).length}-${fixture.mapScores.filter((m) => m.winner?.teamId === fixture.teamBId).length}` : '');
}

function FixtureRow({ gameState, fixture }) {
  const event = gameState.events.find((e) => e.eventId === fixture.tournamentId);
  const opponent = fixtureOpponent(gameState, fixture);
  return <div className="risk-row"><div className="risk-who"><b>{formatDate(fixture.scheduledDate)} · vs {opponent?.shortName || 'TBD'}</b><span>{event?.name || 'Tournament'} · {fixture.stageId || fixture.round} · {fixture.round} · Best of {fixture.bestOf}{fixtureScore(fixture) ? ` · ${fixtureScore(fixture)}` : ''}</span></div><span className={fixture.status === 'completed' ? 'status-good' : 'status-current'}>{fixture.status}</span></div>;
}

export default function Calendar({ gameState }) {
  const events = [...gameState.events].sort((a, b) => compareDate(a.startDate, b.startDate));
  const grouped = events.reduce((acc, event) => { const m = monthNameFromDate(event.startDate); acc[m] = [...(acc[m] || []), event]; return acc; }, {});
  const completedById = new Map(gameState.completedEvents.map((e) => [e.eventId, e]));
  const userFixtures = (gameState.fixtures || []).filter((fixture) => isUserFixture(fixture, gameState.selectedTeamId));
  const todayFixtures = userFixtures.filter((fixture) => fixture.scheduledDate === gameState.currentDate && fixture.status !== 'completed' && !fixture.simulated);
  const upcomingFixtures = getUserUpcomingFixtures(gameState).filter((fixture) => compareDate(fixture.scheduledDate, gameState.currentDate) > 0);
  const completedFixtures = getUserCompletedFixtures(gameState);
  const fixturesByDate = userFixtures.reduce((acc, fixture) => { acc[fixture.scheduledDate] = [...(acc[fixture.scheduledDate] || []), fixture]; return acc; }, {});
  return <div><div className="page-header"><h1>Season Calendar</h1><div className="subtitle">Current date: {gameState.currentDateLabel} — {events.length} dated events · {userFixtures.length} team fixtures</div></div><div className="panel"><div className="panel-header"><h2>Your Fixtures</h2></div><div className="panel-body"><h3>Today</h3>{todayFixtures.length ? todayFixtures.map((f) => <FixtureRow key={f.id} gameState={gameState} fixture={f} />) : <p className="muted">No fixture today.</p>}<h3>Upcoming</h3>{upcomingFixtures.length ? upcomingFixtures.map((f) => <FixtureRow key={f.id} gameState={gameState} fixture={f} />) : <p className="muted">No upcoming fixture.</p>}<h3>Completed</h3>{completedFixtures.length ? completedFixtures.map((f) => <FixtureRow key={f.id} gameState={gameState} fixture={f} />) : <p className="muted">No completed fixture.</p>}</div></div>{Object.entries(grouped).map(([month, monthEvents]) => <div className="panel calendar-month" key={month}><div className="panel-header"><h2>{month} 2026</h2></div><div className="panel-body calendar-grid">{monthEvents.map((e) => { const completed = completedById.get(e.eventId); const invited = inviteesFor(e, gameState.rankings).includes(gameState.selectedTeamId); const status = eventStatus(e, gameState, completed); return <div key={e.eventId} className={`calendar-card status-${status.replace(' ', '-')}`}> <div className="match-line"><Link to={`/tournaments/${e.eventId}`}><strong>{e.name}</strong></Link><span>{status}</span></div><div className="muted">{formatDate(e.startDate)} – {formatDate(e.endDate)}</div><div className="muted">{e.eventType} · Tier {e.tier} · {e.teams} teams · {formatMoney(e.prizePool)}</div><div><span className={tierBadgeClass(e.tier)}>{e.tier}</span> <span className={invited ? 'diag-pass' : 'diag-fail'}>{invited ? 'Invited' : 'Not invited'}</span></div>{completed && <div className="muted">Champion: {completed.champion?.shortName || completed.champion?.name || 'TBD'} · Your finish: {completed.userRecord?.wins}-{completed.userRecord?.losses}</div>}{fixturesByDate[e.startDate]?.length ? <div className="muted">{fixturesByDate[e.startDate].length} of your fixtures generated on opening day</div> : null}</div>; })}</div></div>)}</div>;
}
