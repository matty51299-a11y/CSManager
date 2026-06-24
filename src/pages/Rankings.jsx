import { Link } from 'react-router-dom';
import { formatMoney } from '../utils/helpers';

export default function Rankings({ gameState }) {
  const sorted = [...gameState.teams].sort((a, b) => a.ranking - b.ranking);

  return (
    <div>
      <div className="page-header">
        <h1>World Rankings</h1>
        <div className="subtitle">Global team rankings — Season {gameState.season}</div>
      </div>

      <div className="panel">
        <table>
          <thead>
            <tr>
              <th style={{ width: 50 }}>#</th>
              <th>Team</th>
              <th>Region</th>
              <th>Country</th>
              <th className="text-right">Reputation</th>
              <th className="text-right">Budget</th>
              <th>Coach</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((t, i) => (
              <tr key={t.teamId} className="clickable-row">
                <td style={{ fontWeight: 700, color: i < 3 ? 'var(--accent)' : 'var(--text-secondary)' }}>
                  {t.ranking}
                </td>
                <td><Link to={`/teams/${t.teamId}`}>{t.name}</Link></td>
                <td style={{ color: 'var(--text-secondary)' }}>{t.region}</td>
                <td>{t.country}</td>
                <td className="text-right" style={{ fontWeight: 600 }}>{t.reputation}</td>
                <td className="text-right">{formatMoney(t.budget)}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{t.coach}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
