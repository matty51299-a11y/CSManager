import EventBracketView from './EventBracketView';
import StageTracker from './StageTracker';

// Group-format events (ESL Pro League, BLAST Rivals). Shows live group tables
// with records, then the playoff bracket once the groups complete.
export default function GroupStageView({ model, actions }) {
  const groups = model.groups || [];
  const playoffsLive = (model.bracketRounds || []).length > 0;
  return (
    <div className="format-stage-view">
      <StageTracker model={model} />
      <div className="group-grid">
        {groups.map((group) => {
          const rows = [...group.rows].sort((a, b) => b.wins - a.wins || b.mapDiff - a.mapDiff || a.seed - b.seed);
          return (
            <section className="group-card" key={group.name}>
              <h3>{group.name}</h3>
              {rows.map((row, idx) => (
                <div className={`group-row ${row.teamId === model.userTeamId ? 'is-user' : ''} ${idx < (group.advancePerGroup || 2) ? 'qualifying' : ''}`} key={row.teamId}>
                  <span>{row.team.shortName}</span><strong>{row.wins}-{row.losses}</strong>
                </div>
              ))}
            </section>
          );
        })}
      </div>
      {playoffsLive && <EventBracketView model={model} actions={actions} />}
    </div>
  );
}
