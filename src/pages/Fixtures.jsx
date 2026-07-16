import { Link, useNavigate } from 'react-router-dom';
import { tierBadgeClass, formatMoney } from '../utils/helpers';
import { compareDate, formatDate } from '../utils/calendarDates';
import { Crest } from '../components/fm';
import { getUserFixtures } from '../utils/careerSimulation';

const STAGE_LABEL = {
  group: 'Group Stage', swiss: 'Swiss Stage', roundOf32: 'Round of 32', roundOf16: 'Round of 16',
  quarterfinal: 'Quarterfinal', semifinal: 'Semifinal', final: 'Final', upper: 'Upper Bracket', lower: 'Lower Bracket',
};

function stageOf(tournament, event, currentDate) {
  if (tournament?.champion) return { label: 'Completed', cls: 'completed' };
  if (compareDate(event.startDate, currentDate) > 0) return { label: STAGE_LABEL[tournament?.currentStage] || 'Upcoming', cls: 'upcoming' };
  return { label: STAGE_LABEL[tournament?.currentStage] || 'In progress', cls: 'live' };
}

export default function Fixtures({ gameState }) {
  const navigate = useNavigate();
  const myTeam = gameState.teams.find((t) => t.teamId === gameState.selectedTeamId);
  const teamById = new Map(gameState.teams.map((t) => [t.teamId, t]));
  const userFixtures = getUserFixtures(gameState);

  // Group the user's fixtures by competition.
  const byTournament = new Map();
  userFixtures.forEach((f) => {
    if (!byTournament.has(f.tournamentId)) byTournament.set(f.tournamentId, []);
    byTournament.get(f.tournamentId).push(f);
  });

  const competitions = [...byTournament.entries()]
    .map(([tid, fixtures]) => {
      const event = gameState.events.find((e) => e.eventId === tid);
      if (!event) return null;
      const tournament = gameState.tournaments?.[tid];
      const played = fixtures.filter((f) => f.status === 'completed' || f.simulated);
      const wins = played.filter((f) => f.result?.winner?.teamId === gameState.selectedTeamId).length;
      const record = { wins, losses: played.length - wins };
      const upcoming = fixtures
        .filter((f) => f.status !== 'completed' && !f.simulated)
        .sort((a, b) => compareDate(a.scheduledDate, b.scheduledDate) || (a.sequence || 0) - (b.sequence || 0))[0] || null;
      const opponentId = upcoming ? (upcoming.teamAId === gameState.selectedTeamId ? upcoming.teamBId : upcoming.teamAId) : null;
      return { event, tournament, stage: stageOf(tournament, event, gameState.currentDate), record, upcoming, opponent: opponentId ? teamById.get(opponentId) : null };
    })
    .filter(Boolean)
    .sort((a, b) => compareDate(a.event.startDate, b.event.startDate));

  // The user's next few individual matches across all competitions.
  const nextMatches = userFixtures
    .filter((f) => f.status !== 'completed' && !f.simulated)
    .sort((a, b) => compareDate(a.scheduledDate, b.scheduledDate) || (a.sequence || 0) - (b.sequence || 0))
    .slice(0, 6);

  return (
    <div className="fixtures-page">
      <div className="page-header">
        <h1>Fixtures</h1>
        <div className="subtitle">{myTeam?.name || 'Your team'}'s season — {competitions.length} competitions. Click one to view its bracket or group stage.</div>
      </div>

      <section className="panel">
        <div className="panel-header"><h2>Next Matches</h2><span className="muted">{myTeam?.shortName}</span></div>
        <div className="panel-body">
          {nextMatches.length === 0 && <div className="muted">No scheduled matches.</div>}
          {nextMatches.map((f) => {
            const oppId = f.teamAId === gameState.selectedTeamId ? f.teamBId : f.teamAId;
            const opp = teamById.get(oppId);
            const event = gameState.events.find((e) => e.eventId === f.tournamentId);
            const isToday = f.scheduledDate === gameState.currentDate;
            return (
              <div key={f.id} className={`risk-row ${isToday ? 'clickable-row' : ''}`} onClick={() => navigate(`/tournaments/${f.tournamentId}`)}>
                <div className="risk-who">
                  <b style={{ display: 'flex', alignItems: 'center', gap: 7 }}>{opp && <Crest team={opp} size={16} />}vs {opp?.shortName || 'TBD'}</b>
                  <span>{event?.name} · {f.round} · Bo{f.bestOf}</span>
                </div>
                <span className={isToday ? 'status-active' : 'muted'}>{isToday ? 'MATCH DAY' : formatDate(f.scheduledDate)}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="panel">
        <div className="panel-header"><h2>Competitions</h2><Link to="/calendar">Full Calendar</Link></div>
        <table>
          <thead>
            <tr><th>Competition</th><th>Window</th><th>Stage</th><th>Next</th><th>Record</th></tr>
          </thead>
          <tbody>
            {competitions.map(({ event, stage, record, upcoming, opponent }) => (
              <tr key={event.eventId} className="clickable-row" onClick={() => navigate(`/tournaments/${event.eventId}`)}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="fixture-badge">{event.name.split(/\s+/).map((w) => w[0]).join('').slice(0, 3).toUpperCase()}</span>
                    <div>
                      <b>{event.name}</b>
                      <div className="muted" style={{ fontSize: 10 }}><span className={tierBadgeClass(event.tier)}>{event.tier}</span> · {formatMoney(event.prizePool)}</div>
                    </div>
                  </div>
                </td>
                <td>{formatDate(event.startDate)} – {formatDate(event.endDate)}</td>
                <td><span className={`fixture-stage stage-${stage.cls}`}>{stage.label}</span></td>
                <td>{upcoming ? <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>{opponent && <Crest team={opponent} size={14} />}{opponent?.shortName || 'TBD'}</span> : <span className="muted">—</span>}</td>
                <td><span className="muted">{record.wins}-{record.losses}</span></td>
              </tr>
            ))}
            {competitions.length === 0 && <tr><td colSpan={5} className="muted">No fixtures — your team isn't currently in any events.</td></tr>}
          </tbody>
        </table>
      </section>
    </div>
  );
}
