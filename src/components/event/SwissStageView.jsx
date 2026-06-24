import EventSwissView from './EventSwissView';
import EventBracketView from './EventBracketView';
import StageTracker from './StageTracker';

// Swiss-format events (PGL Masters, StarSeries, etc.). Shows the Swiss
// qualification board, then the playoff bracket once Swiss is complete.
export default function SwissStageView({ tournament, model, format, onSimUser }) {
  return (
    <div className="format-stage-view">
      <StageTracker format={format} tournament={tournament} />
      {tournament.playoffs
        ? <EventBracketView tournament={tournament} userTeamId={model.userTeamId} onSimUser={onSimUser} />
        : <EventSwissView tournament={tournament} model={model} />}
    </div>
  );
}
