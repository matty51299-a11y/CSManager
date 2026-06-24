export default function EventTabs({ active, onChange, hasPlayoffs }) {
  const tabs = hasPlayoffs ? ['Overview', 'Playoffs', 'Results', 'Stats', 'Placements'] : ['Overview', 'Swiss', 'Results', 'Stats', 'Placements'];
  return <nav className="event-tabs">{tabs.map((tab)=><button key={tab} className={active===tab ? 'active' : ''} onClick={()=>onChange(tab)}>{tab}</button>)}</nav>;
}
