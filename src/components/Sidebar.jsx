import { NavLink } from 'react-router-dom';

export default function Sidebar({ gameState }) {
  const myTeam = gameState.teams.find((t) => t.teamId === gameState.playerTeamId);

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h1>CS Dynasty</h1>
        <div className="sub">
          {myTeam ? myTeam.shortName : 'No Team'} — Season {gameState.season}, Week {gameState.week}
        </div>
      </div>
      <nav className="sidebar-nav">
        <NavLink to="/">Dashboard</NavLink>
        <NavLink to="/teams">Teams</NavLink>
        <NavLink to="/players">Players</NavLink>
        <NavLink to="/rankings">Rankings</NavLink>
        <NavLink to="/calendar">Calendar</NavLink>
        <NavLink to="/roster">Roster</NavLink>
        <NavLink to="/match-centre">Match Centre</NavLink>
        <NavLink to="/diagnostics">Diagnostics</NavLink>
      </nav>
    </div>
  );
}
