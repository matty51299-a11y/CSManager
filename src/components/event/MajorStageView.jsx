import EventBracketView from './EventBracketView';
import StageTracker from './StageTracker';

// Multi-stage events (Major three-stage, IEM Play-In + Main Stage). Shows the
// stage tracker and a live standings board, then the playoff bracket.
export default function MajorStageView({ tournament, model, format, onSimUser }) {
  const standings = model.standings || [];
  return (
    <div className="format-stage-view">
      <StageTracker format={format} tournament={tournament} />
      {tournament.playoffs ? (
        <EventBracketView tournament={tournament} userTeamId={model.userTeamId} onSimUser={onSimUser} />
      ) : (
        <div className="major-stage-board">
          <p className="muted">{format?.description}</p>
          <div className="stage-standings">
            {standings.map((row) => (
              <div className={`stage-row ${row.teamId === model.userTeamId ? 'is-user' : ''} ${row.status}`} key={row.teamId}>
                <b>#{row.seed}</b><span>{row.team.shortName}</span><strong>{row.wins}-{row.losses}</strong><em>{row.status}</em>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
