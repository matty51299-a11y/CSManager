import { NavLink } from 'react-router-dom';

export default function Sidebar({ gameState }) {
  const myTeam = gameState.teams.find((t) => t.teamId === gameState.selectedTeamId);

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>CS Dynasty</h1>
        <div className="sub">
          {myTeam ? myTeam.shortName : 'No Team'} — {gameState.currentDateLabel || gameState.currentMonth}
        </div>
      </div>
      <nav className="sidebar-nav">
        <NavLink to="/">Dashboard</NavLink>
        <NavLink to="/teams">Teams</NavLink>
        <NavLink to="/players">Players</NavLink>
        <NavLink to="/rankings">Rankings</NavLink>
        <NavLink to="/calendar">Calendar</NavLink>
        <NavLink to="/inbox">Inbox</NavLink>
        <NavLink to="/roster">Squad</NavLink>
        <NavLink to="/match-centre">Match Centre</NavLink>
        <NavLink to="/tournament-centre">Tournament Sandbox</NavLink>
        <NavLink to="/diagnostics">Diagnostics</NavLink>
      </nav>
    </div>
  );
}
