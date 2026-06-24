import EventBracketView from './EventBracketView';
import StageTracker from './StageTracker';

// Single-elimination events (BLAST Bounty). Before the live playoff bracket
// exists it shows the seeded field; once playoffs are live it shows the bracket.
export default function SingleElimBracketView({ tournament, model, format, onSimUser }) {
  const standings = model.standings || [];
  return (
    <div className="format-stage-view">
      <StageTracker format={format} tournament={tournament} />
      {tournament.playoffs ? (
        <EventBracketView tournament={tournament} userTeamId={model.userTeamId} onSimUser={onSimUser} />
      ) : (
        <div className="bracket-seed-list">
          <h3>Single elimination field</h3>
          <p className="muted">Win or go home. Beating a higher-seeded team claims their bounty for extra prize money and VRS.</p>
          <div className="seed-grid">
            {standings.map((row) => (
              <div className={`seed-row ${row.teamId === model.userTeamId ? 'is-user' : ''}`} key={row.teamId}>
                <b>#{row.seed}</b><span>{row.team.shortName}</span><strong>{row.wins}-{row.losses}</strong>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
