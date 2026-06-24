import { useParams, Link } from 'react-router-dom';
import { tierBadgeClass, formatMoney } from '../utils/helpers';

export default function TournamentDetail({ gameState }) {
  const { tournamentId } = useParams();
  const event = gameState.events.find((e) => e.eventId === tournamentId);
  if (!event) return <div className="panel"><div className="panel-body">Event not found.</div></div>;

  return (
    <div>
      <div className="page-header">
        <h1>{event.name}</h1>
        <div className="subtitle">{event.eventType}</div>
      </div>

      <div className="grid-3" style={{ marginBottom: 16 }}>
        <div className="stat-item">
          <div className="label">Tier</div>
          <div className="value"><span className={tierBadgeClass(event.tier)}>{event.tier}</span></div>
        </div>
        <div className="stat-item">
          <div className="label">Format</div>
          <div className="value" style={{ fontSize: 13 }}>{event.format?.replace(/_/g, ' ')}</div>
        </div>
        <div className="stat-item">
          <div className="label">Teams</div>
          <div className="value">{event.teams}</div>
        </div>
        <div className="stat-item">
          <div className="label">Prize Pool</div>
          <div className="value">{formatMoney(event.prizePool)}</div>
        </div>
        <div className="stat-item">
          <div className="label">Month</div>
          <div className="value">{event.month}</div>
        </div>
        <div className="stat-item">
          <div className="label">Region</div>
          <div className="value">{event.regionRestriction}</div>
        </div>
        <div className="stat-item">
          <div className="label">Ranking Weight</div>
          <div className="value">{event.rankingWeight}</div>
        </div>
        <div className="stat-item">
          <div className="label">Invite Method</div>
          <div className="value" style={{ fontSize: 12 }}>{event.inviteMethod}</div>
        </div>
      </div>

      {event.notes && (
        <div className="panel">
          <div className="panel-header"><h2>Notes</h2></div>
          <div className="panel-body">
            <p style={{ color: 'var(--text-secondary)' }}>{event.notes}</p>
          </div>
        </div>
      )}

      <div className="panel">
        <div className="panel-header"><h2>Status</h2></div>
        <div className="panel-body">
          <p style={{ color: 'var(--text-secondary)' }}>
            Tournament simulation is not yet implemented. Participants and results will be available in a future update.
          </p>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <Link to="/calendar">Back to Calendar</Link>
      </div>
    </div>
  );
}
