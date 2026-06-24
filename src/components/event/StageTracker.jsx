// Horizontal tracker showing the live format's progressive stages and which
// step is currently active. Steps and the active index come from the model so
// they reflect real format progress (e.g. Round of 32 -> ... -> Champion).
export default function StageTracker({ model }) {
  const names = model?.trackerSteps || [];
  const activeIndex = model?.activeTrackerIndex ?? 0;
  return (
    <div className="stage-tracker">
      {names.map((name, index) => (
        <span key={name} className={`stage-chip ${index === activeIndex ? 'active' : ''} ${index < activeIndex ? 'done' : ''}`}>{name}</span>
      ))}
    </div>
  );
}
