import { Link } from 'react-router-dom';
import { formatMoney } from '../utils/helpers';

export default function Rankings({ gameState }) {
  const sorted = [...gameState.teams].sort((a, b) => a.currentRank - b.currentRank);

  return (
    <div>
      <div className="page-header">
        <h1>World Rankings</h1>
        <div className="subtitle">Dynamic VRS-style standings — {gameState.teams.length} teams</div>
      </div>

      <div className="panel">
        <table>
          <thead>
            <tr>
              <th style={{ width: 50 }}>#</th>
              <th>Move</th>
              <th>Team</th>
              <th>Region</th>
              <th className="text-right">VRS Points</th>
              <th className="text-right">Form</th>
              <th>Record</th>
              <th>Last Event</th>
              <th className="text-right">Prize Money</th>
              <th className="text-right">Reputation</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((t) => (
              <tr key={t.teamId} className="clickable-row">
                <td style={{ fontWeight: 700, color: t.ranking <= 3 ? 'var(--accent)' : 'var(--text-secondary)' }}>
                  {t.currentRank}
                </td>
                <td>{t.rankMovement > 0 ? `↑ Up ${t.rankMovement}` : t.rankMovement < 0 ? `↓ Down ${Math.abs(t.rankMovement)}` : '— No change'}</td>
                <td><Link to={`/teams/${t.teamId}`}>{t.name}</Link></td>
                <td style={{ color: 'var(--text-secondary)' }}>{t.region}</td>
                <td className="text-right" style={{ fontWeight: 700 }}>{t.vrsPoints}</td>
                <td className="text-right">{t.formRating}</td>
                <td>{t.wins}-{t.losses} ({t.mapWins}-{t.mapLosses} maps)</td>
                <td>{t.lastEvent || 'Season start'}</td>
                <td className="text-right">{formatMoney(t.prizeMoneySeason || 0)}</td>
                <td className="text-right" style={{ fontWeight: 600 }}>{t.reputation}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
