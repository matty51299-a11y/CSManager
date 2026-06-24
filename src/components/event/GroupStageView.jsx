import EventBracketView from './EventBracketView';
import StageTracker from './StageTracker';

// Group-format events (ESL Pro League, BLAST Rivals). Splits the live field
// into groups of four with current records, then shows the playoff bracket.
export default function GroupStageView({ tournament, model, format, onSimUser }) {
  const standings = model.standings || [];
  const groupSize = 4;
  const groupCount = Math.max(2, Math.ceil(standings.length / groupSize));
  const groups = Array.from({ length: groupCount }, (unused, i) => ({ name: `Group ${String.fromCharCode(65 + i)}`, rows: [] }));
  standings.forEach((row, index) => { groups[index % groupCount].rows.push(row); });

  return (
    <div className="format-stage-view">
      <StageTracker format={format} tournament={tournament} />
      {tournament.playoffs ? (
        <EventBracketView tournament={tournament} userTeamId={model.userTeamId} onSimUser={onSimUser} />
      ) : (
        <div className="group-grid">
          {groups.map((group) => (
            <section className="group-card" key={group.name}>
              <h3>{group.name}</h3>
              {group.rows.map((row) => (
                <div className={`group-row ${row.teamId === model.userTeamId ? 'is-user' : ''}`} key={row.teamId}>
                  <span>{row.team.shortName}</span><strong>{row.wins}-{row.losses}</strong>
                </div>
              ))}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
