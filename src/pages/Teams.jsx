import { Link } from 'react-router-dom';
import { formatMoney } from '../utils/helpers';

export default function Teams({ gameState }) {
  const sorted = [...gameState.teams].sort((a, b) => a.ranking - b.ranking);

  return (
    <div>
      <div className="page-header">
        <h1>Teams</h1>
        <div className="subtitle">{gameState.teams.length} teams in database</div>
      </div>

      <div className="panel">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Team</th>
              <th>Short</th>
              <th>Region</th>
              <th>Country</th>
              <th className="text-right">Rep</th>
              <th className="text-right">Budget</th>
              <th>Coach</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((t) => (
              <tr key={t.teamId} className="clickable-row">
                <td>{t.ranking}</td>
                <td><Link to={`/teams/${t.teamId}`}>{t.name}</Link></td>
                <td style={{ color: 'var(--text-secondary)' }}>{t.shortName}</td>
                <td>{t.region}</td>
                <td>{t.country}</td>
                <td className="text-right">{t.reputation}</td>
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
