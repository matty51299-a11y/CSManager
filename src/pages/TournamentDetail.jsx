import { useParams, Link } from 'react-router-dom';
import { tierBadgeClass, formatMoney } from '../utils/helpers';

export default function TournamentDetail({ gameState }) {
  const { tournamentId } = useParams();
  const event = gameState.seasonTournaments.find((e) => e.id === tournamentId);
  if (!event) return <div>Tournament not found.</div>;

  const tmpl = gameState.tournamentTemplates.find((t) => t.tournamentId === event.templateId);

  return (
    <div>
      <div className="page-header">
        <h1>{event.name}</h1>
        <div className="subtitle">{tmpl?.description}</div>
      </div>

      <div className="grid-3">
        <div className="stat-item">
          <div className="label">Tier</div>
          <div className="value"><span className={tierBadgeClass(tmpl?.tier || 'C')}>{tmpl?.tier}</span></div>
        </div>
        <div className="stat-item">
          <div className="label">Format</div>
          <div className="value">{tmpl?.format}</div>
        </div>
        <div className="stat-item">
          <div className="label">Teams</div>
          <div className="value">{tmpl?.teamCount}</div>
        </div>
        <div className="stat-item">
          <div className="label">Prize Pool</div>
          <div className="value">{formatMoney(tmpl?.prizePool || 0)}</div>
        </div>
        <div className="stat-item">
          <div className="label">Region</div>
          <div className="value">{tmpl?.region}</div>
        </div>
        <div className="stat-item">
          <div className="label">Schedule</div>
          <div className="value">Week {event.startWeek}–{event.endWeek}</div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 16 }}>
        <div className="panel-header"><h2>Status</h2></div>
        <div className="panel-body">
          <p style={{ color: 'var(--text-secondary)' }}>
            This tournament is currently <strong style={{ textTransform: 'capitalize', color: 'var(--yellow)' }}>{event.status}</strong>.
            Participants and results will be available once tournament simulation is implemented.
          </p>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <Link to="/calendar">Back to Calendar</Link>
      </div>
    </div>
  );
}
