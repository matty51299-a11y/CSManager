import { Link, useNavigate } from 'react-router-dom';
import { OvrBadge } from '../components/StatBadge';
import { formatMoney, tierBadgeClass, monthIndex } from '../utils/helpers';

export default function Dashboard({ gameState, advanceToNextEvent, enterEvent, resetCareer }) {
  const navigate = useNavigate();
  const myTeam = gameState.teams.find((t) => t.teamId === gameState.selectedTeamId);
  const myPlayers = gameState.players.filter((p) => p.teamId === gameState.selectedTeamId && p.status === 'active');
  const topTeams = [...gameState.teams].sort((a, b) => a.ranking - b.ranking).slice(0, 10);
  const nextEvents = [...gameState.events].sort((a, b) => monthIndex(a.month) - monthIndex(b.month));
  const completedIds = new Set(gameState.completedEvents.map((e) => e.eventId));
  const nextEvent = nextEvents.find((e) => !completedIds.has(e.eventId));
  const starPlayer = [...myPlayers].sort((a, b) => b.overall - a.overall)[0];
  const averageOverall = Math.round(myPlayers.reduce((sum, p) => sum + Number(p.overall || 0), 0) / Math.max(1, myPlayers.length));

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <div className="subtitle">Season {gameState.season} — Week {gameState.week} — Data: {gameState.dataSource}</div>
      </div>

      <div className="grid-4" style={{ marginBottom: 16 }}>
        <div className="stat-item">
          <div className="label">Total Teams</div>
          <div className="value">{gameState.teams.length}</div>
        </div>
        <div className="stat-item">
          <div className="label">Total Players</div>
          <div className="value">{gameState.players.length}</div>
        </div>
        <div className="stat-item">
          <div className="label">Total Events</div>
          <div className="value">{gameState.events.length}</div>
        </div>
        <div className="stat-item">
          <div className="label">Active Maps</div>
          <div className="value">{gameState.maps.filter((m) => m.activeDuty).length}</div>
        </div>
      </div>

      <div className="panel cockpit-panel"><div className="panel-header"><h2>Career Control</h2><button className="ghost-button" onClick={resetCareer}>Reset Career</button></div><div className="panel-body action-row"><strong className="phase-pill">{gameState.currentPhase}</strong><span>Season {gameState.season}, Week {gameState.week}, {gameState.currentMonth}.</span>{!gameState.currentPhase.startsWith('event_active') && <button onClick={advanceToNextEvent}>Advance Week / Continue to Next Event</button>}{gameState.currentPhase === 'event_ready' && <button onClick={() => { enterEvent(); navigate('/event-hub'); }}>Enter Event / Sim Background</button>}{gameState.currentPhase.startsWith('event_active') && <button onClick={() => navigate('/event-hub')}>Open Event Hub</button>}</div></div>

      <div className="grid-2">
        {myTeam && (
          <div className="panel">
            <div className="panel-header">
              <h2>My Team — {myTeam.name}</h2>
              <Link to={`/teams/${myTeam.teamId}`}>View</Link>
            </div>
            <div className="panel-body">
              <div className="stat-grid">
                <div className="stat-item">
                  <div className="label">Ranking</div>
                  <div className="value">#{myTeam.ranking}</div>
                </div>
                <div className="stat-item">
                  <div className="label">Avg Overall</div>
                  <div className="value">{averageOverall}</div>
                </div>
                <div className="stat-item">
                  <div className="label">Star Player</div>
                  <div className="value">{starPlayer?.gamertag || '—'}</div>
                </div>
                <div className="stat-item">
                  <div className="label">Budget</div>
                  <div className="value">{formatMoney(myTeam.budget)}</div>
                </div>
              </div>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Role</th>
                  <th className="text-right">OVR</th>
                </tr>
              </thead>
              <tbody>
                {myPlayers.map((p) => (
                  <tr key={p.playerId}>
                    <td><Link to={`/players/${p.playerId}`}>{p.gamertag}</Link></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{p.rolePrimary}</td>
                    <td className="text-right"><OvrBadge value={p.overall} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="panel">
          <div className="panel-header">
            <h2>World Rankings — Top 10</h2>
            <Link to="/rankings">View All</Link>
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Team</th>
                <th>Tier</th>
                <th>Region</th>
                <th className="text-right">Rep</th>
              </tr>
            </thead>
            <tbody>
              {topTeams.map((t) => (
                <tr key={t.teamId}>
                  <td style={{ fontWeight: 700, color: t.ranking <= 3 ? 'var(--accent)' : 'var(--text-secondary)' }}>{t.ranking}</td>
                  <td><Link to={`/teams/${t.teamId}`}>{t.shortName}</Link></td>
                  <td><span className={tierBadgeClass(t.tier)}>{t.tier}</span></td>
                  <td style={{ color: 'var(--text-secondary)' }}>{t.region}</td>
                  <td className="text-right">{t.reputation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <div className="panel-header">
          <h2>Next Event: {gameState.currentEventId ? gameState.events.find((e) => e.eventId === gameState.currentEventId)?.name : nextEvent?.name || 'None'}</h2>
          <Link to="/calendar">Full Calendar</Link>
        </div>
        <table>
          <thead>
            <tr>
              <th>Event</th>
              <th>Type</th>
              <th>Tier</th>
              <th>Month</th>
              <th className="text-center">Teams</th>
              <th className="text-right">Prize Pool</th>
            </tr>
          </thead>
          <tbody>
            {nextEvents.slice(0, 5).map((e) => (
              <tr key={e.eventId}>
                <td><Link to={`/tournaments/${e.eventId}`}>{e.name}</Link></td>
                <td style={{ color: 'var(--text-secondary)' }}>{e.eventType}</td>
                <td><span className={tierBadgeClass(e.tier)}>{e.tier}</span></td>
                <td>{e.month}</td>
                <td className="text-center">{e.teams}</td>
                <td className="text-right">{formatMoney(e.prizePool)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
