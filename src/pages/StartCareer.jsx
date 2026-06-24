import { useMemo, useState } from 'react';
import { formatMoney } from '../utils/helpers';


function avg(players) { return Math.round(players.reduce((s,p)=>s+Number(p.overall||0),0) / Math.max(1, players.length)); }
function difficulty(team) {
  if (team.ranking <= 5) return 'Superclub';
  if (team.ranking <= 15) return 'Contender';
  if (team.reputation >= 78 && team.ranking > 20) return 'Fallen Giant';
  if (team.ranking <= 35) return 'Regional Challenger';
  return 'Rebuild Project';
}

export default function StartCareer({ gameState, onGoToTeamSelection, onBegin }) {
  const [selected, setSelected] = useState(null);
  const rows = useMemo(() => (gameState.teams || []).map((t) => {
    const roster = gameState.players.filter((p) => p.teamId === t.teamId && p.status === 'active');
    const star = [...roster].sort((a,b)=>b.overall-a.overall)[0];
    return { team:t, roster, avg:avg(roster), star, diff:difficulty(t) };
  }).sort((a,b)=>a.team.ranking-b.team.ranking), [gameState]);
  if (gameState.currentPhase !== 'team_selection') return <div className="start-screen"><h1>CS Dynasty Manager</h1><p>Build an elite Counter-Strike dynasty through a season calendar of invites, Swiss stages, playoffs and ranking pressure.</p><button onClick={onGoToTeamSelection}>Start New Career</button></div>;
  return <div><div className="page-header"><h1>Select Your Team</h1><div className="subtitle">Choose one imported database team to begin your career.</div></div><div className="panel dense-scroll"><table><thead><tr><th>Team</th><th>Region</th><th>Country</th><th>Rank</th><th>Tier</th><th>Rep</th><th>Budget</th><th>Avg</th><th>Star Player</th><th>Difficulty</th></tr></thead><tbody>{rows.map((r)=><tr key={r.team.teamId} onClick={()=>setSelected(r.team.teamId)} className={selected===r.team.teamId?'your-team-row clickable-row':'clickable-row'}><td>{r.team.name}</td><td>{r.team.region}</td><td>{r.team.country}</td><td>#{r.team.ranking}</td><td>{r.team.tier}</td><td>{r.team.reputation}</td><td>{formatMoney(r.team.budget)}</td><td>{r.avg}</td><td>{r.star?.gamertag || '—'}</td><td><strong>{r.diff}</strong></td></tr>)}</tbody></table></div><button disabled={!selected} onClick={()=>onBegin(selected)}>Begin Career</button></div>;
}
