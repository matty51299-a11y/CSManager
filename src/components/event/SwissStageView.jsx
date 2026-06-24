import EventSwissView from './EventSwissView';
import EventBracketView from './EventBracketView';
import StageTracker from './StageTracker';

// Swiss-format events (PGL Masters, StarSeries, etc.). Shows the Swiss
// qualification board, then the playoff bracket once Swiss is complete.
export default function SwissStageView({ model, actions }) {
  const playoffsLive = (model.bracketRounds || []).length > 0;
  return (
    <div className="format-stage-view">
      <StageTracker model={model} />
      {playoffsLive
        ? <EventBracketView model={model} actions={actions} />
        : <EventSwissView model={model} />}
    </div>
  );
}
