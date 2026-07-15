// Before/after value with a big coloured up/down arrow — the Elo Change /
// budget-movement card. `format` shapes each number for display.
export default function DeltaChip({ before, after, label, format = (v) => v, unit = '' }) {
  const delta = after - before;
  const dir = delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';
  const arrow = dir === 'up' ? '▲' : dir === 'down' ? '▼' : '→';
  const sign = delta > 0 ? '+' : '';
  return (
    <div className={`delta-chip delta-${dir}`}>
      {label && <div className="delta-label">{label}</div>}
      <div className="delta-body">
        <div className="delta-values">
          <span className="delta-before">{format(before)}{unit}</span>
          <span className="delta-after">{format(after)}{unit}</span>
        </div>
        <div className="delta-arrow" aria-hidden="true">{arrow}</div>
      </div>
      <div className="delta-amount">{sign}{format(delta)}{unit}</div>
    </div>
  );
}
