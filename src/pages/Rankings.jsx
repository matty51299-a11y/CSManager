import { Link } from 'react-router-dom';
import { formatMoney, tierBadgeClass } from '../utils/helpers';

export default function Rankings({ gameState }) {
  const sorted = [...gameState.teams].sort((a, b) => a.ranking - b.ranking);

  return (
    <div>
      <div className="page-header">
        <h1>World Rankings</h1>
        <div className="subtitle">Global team rankings — {gameState.teams.length} teams</div>
      </div>

      <div className="panel">
        <table>
          <thead>
            <tr>
              <th style={{ width: 50 }}>#</th>
              <th>Team</th>
              <th>Region</th>
              <th>Country</th>
              <th>Tier</th>
              <th className="text-right">Reputation</th>
              <th className="text-right">Budget</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((t) => (
              <tr key={t.teamId} className="clickable-row">
                <td style={{ fontWeight: 700, color: t.ranking <= 3 ? 'var(--accent)' : 'var(--text-secondary)' }}>
                  {t.ranking}
                </td>
                <td><Link to={`/teams/${t.teamId}`}>{t.name}</Link></td>
                <td style={{ color: 'var(--text-secondary)' }}>{t.region}</td>
                <td>{t.country}</td>
                <td><span className={tierBadgeClass(t.tier)}>{t.tier}</span></td>
                <td className="text-right" style={{ fontWeight: 600 }}>{t.reputation}</td>
                <td className="text-right">{formatMoney(t.budget)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
