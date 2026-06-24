// Small horizontal tracker showing the stages of the current event's format
// and highlighting which stage is live.
export default function StageTracker({ format, tournament }) {
  const names = format?.stageNames || [];
  const activeIndex = tournament?.champion || tournament?.playoffs ? names.length - 1 : 0;
  return (
    <div className="stage-tracker">
      {names.map((name, index) => (
        <span key={name} className={`stage-chip ${index === activeIndex ? 'active' : ''} ${index < activeIndex ? 'done' : ''}`}>{name}</span>
      ))}
    </div>
  );
}
