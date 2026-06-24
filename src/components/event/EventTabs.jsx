// Tabs adapt to the event's format. The middle tab name comes from the format
// (Bracket / Groups / Swiss / Stages) so a non-Swiss event never shows a Swiss tab.
export default function EventTabs({ active, onChange, tabs = ['Overview', 'Swiss', 'Results', 'Stats', 'Placements'] }) {
  return <nav className="event-tabs">{tabs.map((tab) => <button key={tab} className={active === tab ? 'active' : ''} onClick={() => onChange(tab)}>{tab}</button>)}</nav>;
}
