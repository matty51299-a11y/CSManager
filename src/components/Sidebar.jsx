import { NavLink } from 'react-router-dom';
import { Crest } from './fm';

const navItems = [
  ['/', '⌂', 'Home'],
  ['/inbox', '✉', 'Inbox'],
  ['/roster', '▰', 'Squad'],
  ['/teams', '◆', 'Teams'],
  ['/players', '●', 'Players'],
  ['/rankings', '≡', 'Rankings'],
  ['/calendar', '▣', 'Schedule'],
  ['/match-centre', '⚔', 'Match Centre'],
  ['/tournament-centre', '◇', 'Sandbox'],
  ['/diagnostics', '✦', 'Diagnostics'],
];

export default function Sidebar({ gameState }) {
  const myTeam = gameState.teams.find((t) => t.teamId === gameState.selectedTeamId);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="side-team-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {myTeam && <Crest team={myTeam} size={26} />}
            <div>
              <span className="eyebrow">My Club</span>
              <strong style={{ fontSize: 13, margin: 0 }}>{myTeam ? myTeam.shortName : 'No Team'}</strong>
            </div>
          </div>
          <small>{gameState.currentDateLabel || gameState.currentMonth}</small>
        </div>
      </div>
      <nav className="sidebar-nav">
        {navItems.map(([to, icon, label]) => (
          <NavLink key={to} to={to} end={to === '/'}>
            <span className="nav-icon">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer"><span>CS Dynasty Manager</span></div>
    </aside>
  );
}
