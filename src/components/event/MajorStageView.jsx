import EventBracketView from './EventBracketView';
import StageTracker from './StageTracker';

// Multi-stage events (Major three-stage, IEM Play-In + Main Stage). Shows the
// current stage's live standings, then the playoff bracket once it exists.
export default function MajorStageView({ model, format, actions }) {
  const standings = model.swissStandings || [];
  const playoffsLive = (model.bracketRounds || []).length > 0;
  return (
    <div className="format-stage-view">
      <StageTracker model={model} />
      <p className="muted">{format?.description}</p>
      {model.userWaiting && <p className="waiting-note">Your team is seeded into {model.userEntryStageName}. Sim the earlier stages to reach it.</p>}
      {!playoffsLive && (
        <div className="major-stage-board">
          <h3>{model.phaseName} standings</h3>
          <div className="stage-standings">
            {standings.map((row) => (
              <div className={`stage-row ${row.teamId === model.userTeamId ? 'is-user' : ''} ${row.status}`} key={row.teamId}>
                <b>#{row.seed}</b><span>{row.team.shortName}</span><strong>{row.wins}-{row.losses}</strong><em>{row.status}</em>
              </div>
            ))}
          </div>
        </div>
      )}
      {playoffsLive && <EventBracketView model={model} actions={actions} />}
    </div>
  );
}
