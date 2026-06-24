import { Link } from 'react-router-dom';
import { tierBadgeClass, formatMoney } from '../utils/helpers';

export default function Calendar({ gameState }) {
  const events = [...gameState.seasonTournaments].sort((a, b) => a.startWeek - b.startWeek);

  return (
    <div>
      <div className="page-header">
        <h1>Tournament Calendar</h1>
        <div className="subtitle">Season {gameState.season} — {events.length} scheduled events</div>
      </div>

      <div className="panel">
        <table>
          <thead>
            <tr>
              <th>Event</th>
              <th>Tier</th>
              <th>Format</th>
              <th className="text-center">Teams</th>
              <th className="text-right">Prize Pool</th>
              <th>Region</th>
              <th className="text-center">Weeks</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => {
              const tmpl = gameState.tournamentTemplates.find((t) => t.tournamentId === e.templateId);
              return (
                <tr key={e.id}>
                  <td><Link to={`/tournaments/${e.id}`}>{e.name}</Link></td>
                  <td><span className={tierBadgeClass(tmpl?.tier || 'C')}>{tmpl?.tier}</span></td>
                  <td style={{ color: 'var(--text-secondary)' }}>{tmpl?.format}</td>
                  <td className="text-center">{tmpl?.teamCount}</td>
                  <td className="text-right">{formatMoney(tmpl?.prizePool || 0)}</td>
                  <td>{tmpl?.region}</td>
                  <td className="text-center">W{e.startWeek}–{e.endWeek}</td>
                  <td>
                    <span style={{
                      color: e.status === 'upcoming' ? 'var(--yellow)' :
                             e.status === 'active' ? 'var(--green)' : 'var(--text-muted)',
                      fontWeight: 600,
                      textTransform: 'capitalize',
                    }}>
                      {e.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
