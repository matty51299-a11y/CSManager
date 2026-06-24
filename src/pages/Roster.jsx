import { Link } from 'react-router-dom';
import { OvrBadge, StatWithBar } from '../components/StatBadge';
import { formatMoney, statColor } from '../utils/helpers';

export default function Roster({ gameState }) {
  const myTeam = gameState.teams.find((t) => t.teamId === gameState.playerTeamId);
  const players = gameState.players.filter((p) => p.teamId === gameState.playerTeamId);
  const maps = gameState.maps;

  const totalSalary = players.reduce((sum, p) => sum + p.salary, 0);
  const avgOvr = Math.round(players.reduce((sum, p) => sum + p.overall, 0) / players.length);

  return (
    <div>
      <div className="page-header">
        <h1>Roster Management</h1>
        <div className="subtitle">{myTeam.name} — {players.length} active players</div>
      </div>

      <div className="grid-4" style={{ marginBottom: 16 }}>
        <div className="stat-item">
          <div className="label">Players</div>
          <div className="value" style={{ color: players.length === 5 ? 'var(--green)' : 'var(--red)' }}>
            {players.length}/5
          </div>
        </div>
        <div className="stat-item">
          <div className="label">Avg OVR</div>
          <div className="value"><OvrBadge value={avgOvr} /></div>
        </div>
        <div className="stat-item">
          <div className="label">Monthly Salary</div>
          <div className="value">{formatMoney(totalSalary)}</div>
        </div>
        <div className="stat-item">
          <div className="label">Budget</div>
          <div className="value">{formatMoney(myTeam.budget)}</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header"><h2>Active Roster</h2></div>
        <table>
          <thead>
            <tr>
              <th>Player</th>
              <th>Role</th>
              <th>2nd Role</th>
              <th>Nat</th>
              <th className="text-right">Age</th>
              <th className="text-right">OVR</th>
              <th className="text-right">POT</th>
              <th className="text-right">AIM</th>
              <th className="text-right">AWP</th>
              <th className="text-right">Entry</th>
              <th className="text-right">Clutch</th>
              <th className="text-right">Salary</th>
              <th className="text-right">Contract</th>
              <th className="text-right">Buyout</th>
            </tr>
          </thead>
          <tbody>
            {players.map((p) => (
              <tr key={p.playerId}>
                <td><Link to={`/players/${p.playerId}`}>{p.gamertag}</Link></td>
                <td style={{ color: 'var(--text-secondary)' }}>{p.rolePrimary}</td>
                <td style={{ color: 'var(--text-muted)' }}>{p.roleSecondary}</td>
                <td>{p.nationality}</td>
                <td className="text-right">{p.age}</td>
                <td className="text-right"><OvrBadge value={p.overall} /></td>
                <td className="text-right"><OvrBadge value={p.potential} /></td>
                <td className="text-right">{p.aim}</td>
                <td className="text-right">{p.awp}</td>
                <td className="text-right">{p.entry}</td>
                <td className="text-right">{p.clutch}</td>
                <td className="text-right">{formatMoney(p.salary)}/mo</td>
                <td className="text-right">{p.contractYears}yr</td>
                <td className="text-right">{formatMoney(p.buyout)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Map Pool */}
      <div className="panel">
        <div className="panel-header"><h2>Map Pool Ratings</h2></div>
        <div className="panel-body">
          {maps.map((m) => {
            const rating = myTeam.mapRatings?.[m.mapId] || 0;
            const color = statColor(rating);
            return (
              <div key={m.mapId} className="map-bar" style={{ marginBottom: 8 }}>
                <span style={{ width: 80, fontSize: 12, color: 'var(--text-secondary)' }}>{m.name}</span>
                <div className="map-bar-track">
                  <div className={`map-bar-fill ${color}`} style={{ width: `${rating}%` }} />
                </div>
                <span style={{ width: 28, textAlign: 'right', fontSize: 12, fontWeight: 700 }}>{rating}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
