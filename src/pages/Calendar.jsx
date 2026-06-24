import { Link } from 'react-router-dom';
import { tierBadgeClass, formatMoney, monthIndex } from '../utils/helpers';

export default function Calendar({ gameState, advanceTime, enterEvent }) {
  const events = [...gameState.events].sort((a, b) => monthIndex(a.month) - monthIndex(b.month));

  return (
    <div>
      <div className="page-header">
        <h1>Tournament Calendar</h1>
        <div className="subtitle">Season {gameState.season} — {events.length} events</div>
      </div>

      <div className="panel">
        <table>
          <thead>
            <tr>
              <th>Event</th>
              <th>Type</th>
              <th>Tier</th>
              <th>Month</th>
              <th className="text-center">Teams</th>
              <th>Format</th>
              <th className="text-right">Prize Pool</th>
              <th>Region</th>
              <th>Invite</th><th>Career Action</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.eventId}>
                <td><Link to={`/tournaments/${e.eventId}`}>{e.name}</Link></td>
                <td style={{ color: 'var(--text-secondary)' }}>{e.eventType}</td>
                <td><span className={tierBadgeClass(e.tier)}>{e.tier}</span></td>
                <td>{e.month}</td>
                <td className="text-center">{e.teams}</td>
                <td style={{ color: 'var(--text-muted)', fontSize: 11 }}>{e.format?.replace(/_/g, ' ')}</td>
                <td className="text-right">{formatMoney(e.prizePool)}</td>
                <td style={{ color: 'var(--text-secondary)' }}>{e.regionRestriction}</td>
                <td style={{ color: 'var(--text-muted)', fontSize: 11 }}>{e.inviteMethod}</td><td>{gameState.activeEventId === e.eventId ? <button onClick={() => enterEvent(e.eventId)}>Enter Event</button> : <button onClick={advanceTime}>Continue</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
