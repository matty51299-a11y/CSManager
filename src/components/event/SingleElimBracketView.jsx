import EventBracketView from './EventBracketView';
import StageTracker from './StageTracker';

// Single-elimination events (BLAST Bounty). The whole event is one live
// bracket, revealed round by round (Round of 32 -> ... -> Final -> Champion).
export default function SingleElimBracketView({ model, actions }) {
  return (
    <div className="format-stage-view">
      <StageTracker model={model} />
      <p className="muted">Win or go home. Beating a higher-seeded team claims their bounty for extra prize money and VRS.</p>
      <EventBracketView model={model} actions={actions} />
    </div>
  );
}
