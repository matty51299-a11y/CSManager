import { useParams, Link } from 'react-router-dom';
import { OvrBadge } from '../components/StatBadge';
import { formatMoney, statColor, getTeamMapRatings, tierBadgeClass } from '../utils/helpers';

export default function TeamDetail({ gameState }) {
  const { teamId } = useParams();
  const team = gameState.teams.find((t) => t.teamId === teamId);
  if (!team) return <div className="panel"><div className="panel-body">Team not found.</div></div>;

  const players = gameState.players.filter((p) => p.teamId === teamId && p.status === 'active');
  const maps = gameState.maps;
  const ratings = getTeamMapRatings(teamId, gameState.teamMapRatings);
  const avgOvr = players.length > 0
    ? Math.round(players.reduce((sum, p) => sum + p.overall, 0) / players.length)
    : 0;

  return (
    <div>
      <div className="page-header">
        <h1>{team.name}</h1>
        <div className="subtitle">{team.shortName} — {team.region} ({team.country})</div>
      </div>

      <div className="grid-4" style={{ marginBottom: 16 }}>
        <div className="stat-item">
          <div className="label">Ranking</div>
          <div className="value">#{team.ranking}</div>
        </div>
        <div className="stat-item">
          <div className="label">Tier</div>
          <div className="value"><span className={tierBadgeClass(team.tier)}>{team.tier}</span></div>
        </div>
        <div className="stat-item">
          <div className="label">Reputation</div>
          <div className="value">{team.reputation}</div>
        </div>
        <div className="stat-item">
          <div className="label">Budget</div>
          <div className="value">{formatMoney(team.budget)}</div>
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom: 16 }}>
        <div className="stat-item">
          <div className="label">Avg Overall</div>
          <div className="value"><OvrBadge value={avgOvr} /></div>
        </div>
        <div className="stat-item">
          <div className="label">Play Style</div>
          <div className="value" style={{ fontSize: 13 }}>{team.playStyle?.replace(/_/g, ' ') || '—'}</div>
        </div>
      </div>

      <div className="grid-2">
        <div className="panel">
          <div className="panel-header">
            <h2>Roster ({players.length}/5)</h2>
          </div>
          <table>
            <thead>
              <tr>
                <th>Player</th>
                <th>Role</th>
                <th>Nat</th>
                <th>Age</th>
                <th className="text-right">OVR</th>
                <th className="text-right">POT</th>
                <th className="text-right">Salary</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p) => (
                <tr key={p.playerId}>
                  <td><Link to={`/players/${p.playerId}`}>{p.gamertag}</Link></td>
                  <td style={{ color: 'var(--text-secondary)' }}>{p.rolePrimary}</td>
                  <td>{p.nationality}</td>
                  <td>{p.age}</td>
                  <td className="text-right"><OvrBadge value={p.overall} /></td>
                  <td className="text-right"><OvrBadge value={p.potential} /></td>
                  <td className="text-right">{formatMoney(p.salary)}/mo</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="panel">
          <div className="panel-header">
            <h2>Map Pool Ratings</h2>
            {ratings && <span style={{ color: 'var(--text-muted)', fontSize: 11 }}>Ban: {ratings.defaultBan} | Best: {ratings.bestMap}</span>}
          </div>
          <div className="panel-body">
            {ratings ? maps.map((m) => {
              const rating = ratings[m.mapId] || 0;
              const color = statColor(rating);
              return (
                <div key={m.mapId} className="map-bar" style={{ marginBottom: 8 }}>
                  <span style={{ width: 70, fontSize: 12, color: 'var(--text-secondary)' }}>{m.name}</span>
                  <div className="map-bar-track">
                    <div className={`map-bar-fill ${color}`} style={{ width: `${rating}%` }} />
                  </div>
                  <span style={{ width: 28, textAlign: 'right', fontSize: 12, fontWeight: 700 }}>{rating}</span>
                </div>
              );
            }) : <p style={{ color: 'var(--text-muted)' }}>No map ratings available.</p>}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <Link to="/teams">Back to Teams</Link>
      </div>
    </div>
  );
}
