import { NavLink } from 'react-router-dom';

const navItems = [
  ['/', '⌂', 'Dashboard'],
  ['/teams', '◆', 'Teams'],
  ['/players', '●', 'Players'],
  ['/rankings', '≡', 'Rankings'],
  ['/calendar', '▣', 'Calendar'],
  ['/inbox', '✉', 'Inbox'],
  ['/roster', '▰', 'Squad'],
  ['/match-centre', '⚔', 'Match Centre'],
  ['/tournament-centre', '◇', 'Sandbox'],
  ['/diagnostics', '✦', 'Diagnostics'],
];

export default function Sidebar({ gameState }) {
  const myTeam = gameState.teams.find((t) => t.teamId === gameState.selectedTeamId);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="brand-row"><span className="brand-mark">CS</span><div><h1>CS Dynasty</h1><div className="sub">Career Control</div></div></div>
        <div className="side-team-card">
          <span className="eyebrow">Selected Team</span>
          <strong>{myTeam ? myTeam.shortName : 'No Team'}</strong>
          <small>{gameState.currentDateLabel || gameState.currentMonth}</small>
        </div>
      </div>
      <nav className="sidebar-nav">
        {navItems.map(([to, icon, label]) => <NavLink key={to} to={to} end={to === '/'}><span className="nav-icon">{icon}</span>{label}</NavLink>)}
      </nav>
      <div className="sidebar-footer"><span>{gameState.currentPhase}</span></div>
    </aside>
  );
}
