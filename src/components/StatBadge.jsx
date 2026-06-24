import { ovrClass, statColor } from '../utils/helpers';

export function OvrBadge({ value }) {
  return <span className={`ovr ${ovrClass(value)}`}>{value}</span>;
}

export function StatWithBar({ value }) {
  const color = statColor(value);
  return (
    <span>
      <span className={`ovr ${ovrClass(value)}`}>{value}</span>
      <span className="stat-bar">
        <span className={`stat-bar-fill ${color}`} style={{ width: `${value}%` }} />
      </span>
    </span>
  );
}
