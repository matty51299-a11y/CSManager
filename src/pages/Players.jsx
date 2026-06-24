import { useState } from 'react';
import { Link } from 'react-router-dom';
import { OvrBadge } from '../components/StatBadge';
import { formatMoney } from '../utils/helpers';

export default function Players({ gameState }) {
  const [sortBy, setSortBy] = useState('overall');
  const [sortDir, setSortDir] = useState('desc');

  function handleSort(field) {
    if (sortBy === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
  }

  const sorted = [...gameState.players].sort((a, b) => {
    const mul = sortDir === 'asc' ? 1 : -1;
    if (typeof a[sortBy] === 'number') return (a[sortBy] - b[sortBy]) * mul;
    return String(a[sortBy]).localeCompare(String(b[sortBy])) * mul;
  });

  function sortArrow(field) {
    if (sortBy !== field) return '';
    return sortDir === 'asc' ? ' ▲' : ' ▼';
  }

  const teamMap = {};
  gameState.teams.forEach((t) => { teamMap[t.teamId] = t.shortName; });

  return (
    <div>
      <div className="page-header">
        <h1>Players</h1>
        <div className="subtitle">{gameState.players.length} players in database — click headers to sort</div>
      </div>

      <div className="panel">
        <table>
          <thead>
            <tr>
              <th onClick={() => handleSort('gamertag')} style={{ cursor: 'pointer' }}>Player{sortArrow('gamertag')}</th>
              <th>Team</th>
              <th onClick={() => handleSort('rolePrimary')} style={{ cursor: 'pointer' }}>Role{sortArrow('rolePrimary')}</th>
              <th>Nat</th>
              <th onClick={() => handleSort('age')} style={{ cursor: 'pointer' }} className="text-right">Age{sortArrow('age')}</th>
              <th onClick={() => handleSort('overall')} style={{ cursor: 'pointer' }} className="text-right">OVR{sortArrow('overall')}</th>
              <th onClick={() => handleSort('potential')} style={{ cursor: 'pointer' }} className="text-right">POT{sortArrow('potential')}</th>
              <th onClick={() => handleSort('aim')} style={{ cursor: 'pointer' }} className="text-right">AIM{sortArrow('aim')}</th>
              <th onClick={() => handleSort('awp')} style={{ cursor: 'pointer' }} className="text-right">AWP{sortArrow('awp')}</th>
              <th onClick={() => handleSort('salary')} style={{ cursor: 'pointer' }} className="text-right">Salary{sortArrow('salary')}</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((p) => (
              <tr key={p.playerId}>
                <td><Link to={`/players/${p.playerId}`}>{p.gamertag}</Link></td>
                <td><Link to={`/teams/${p.teamId}`}>{teamMap[p.teamId] || 'FA'}</Link></td>
                <td style={{ color: 'var(--text-secondary)' }}>{p.rolePrimary}</td>
                <td>{p.nationality}</td>
                <td className="text-right">{p.age}</td>
                <td className="text-right"><OvrBadge value={p.overall} /></td>
                <td className="text-right"><OvrBadge value={p.potential} /></td>
                <td className="text-right">{p.aim}</td>
                <td className="text-right">{p.awp}</td>
                <td className="text-right">{formatMoney(p.salary)}/mo</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
