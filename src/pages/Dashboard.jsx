import { Link } from 'react-router-dom';
import { OvrBadge } from '../components/StatBadge';
import { formatMoney, tierBadgeClass } from '../utils/helpers';

export default function Dashboard({ gameState }) {
  const myTeam = gameState.teams.find((t) => t.teamId === gameState.playerTeamId);
  const myPlayers = gameState.players.filter((p) => p.teamId === gameState.playerTeamId);
  const topTeams = [...gameState.teams].sort((a, b) => a.ranking - b.ranking).slice(0, 5);
  const nextEvents = gameState.seasonTournaments
    .filter((t) => t.status === 'upcoming')
    .sort((a, b) => a.startWeek - b.startWeek)
    .slice(0, 3);

  return (
    <div>
      <div className="page-header">
        <h1>Dashboard</h1>
        <div className="subtitle">Season {gameState.season} — Week {gameState.week}</div>
      </div>

      <div className="grid-2">
        {/* My Team Panel */}
        <div className="panel">
          <div className="panel-header">
            <h2>My Team — {myTeam.name}</h2>
          </div>
          <div className="panel-body">
            <div className="stat-grid">
              <div className="stat-item">
                <div className="label">Ranking</div>
                <div className="value">#{myTeam.ranking}</div>
              </div>
              <div className="stat-item">
                <div className="label">Reputation</div>
                <div className="value">{myTeam.reputation}</div>
              </div>
              <div className="stat-item">
                <div className="label">Budget</div>
                <div className="value">{formatMoney(myTeam.budget)}</div>
              </div>
              <div className="stat-item">
                <div className="label">Region</div>
                <div className="value">{myTeam.region}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Top Rankings */}
        <div className="panel">
          <div className="panel-header">
            <h2>World Rankings</h2>
            <Link to="/rankings">View All</Link>
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Team</th>
                <th>Region</th>
                <th className="text-right">Rep</th>
              </tr>
            </thead>
            <tbody>
              {topTeams.map((t) => (
                <tr key={t.teamId} className="clickable-row">
                  <td>{t.ranking}</td>
                  <td><Link to={`/teams/${t.teamId}`}>{t.shortName}</Link></td>
                  <td style={{ color: 'var(--text-secondary)' }}>{t.region}</td>
                  <td className="text-right">{t.reputation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid-2">
        {/* Roster */}
        <div className="panel">
          <div className="panel-header">
            <h2>Active Roster</h2>
            <Link to="/roster">Manage</Link>
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

        {/* Upcoming Events */}
        <div className="panel">
          <div className="panel-header">
            <h2>Upcoming Events</h2>
            <Link to="/calendar">Full Calendar</Link>
          </div>
          <table>
            <thead>
              <tr>
                <th>Event</th>
                <th>Tier</th>
                <th className="text-right">Week</th>
              </tr>
            </thead>
            <tbody>
              {nextEvents.map((e) => {
                const tmpl = gameState.tournamentTemplates.find((t) => t.tournamentId === e.templateId);
                return (
                  <tr key={e.id}>
                    <td><Link to={`/tournaments/${e.id}`}>{e.name}</Link></td>
                    <td><span className={tierBadgeClass(tmpl?.tier || 'C')}>{tmpl?.tier || '?'}</span></td>
                    <td className="text-right">W{e.startWeek}–{e.endWeek}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
