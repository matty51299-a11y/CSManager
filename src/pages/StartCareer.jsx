import { useMemo, useState } from 'react';
import { formatMoney } from '../utils/helpers';
import { Crest, Stars } from '../components/fm';


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
  const selectedRow = rows.find((r) => r.team.teamId === selected) || rows[0];
  return <div className="team-select-screen">
    <div className="career-crumbs">Create Manager <span>›</span> Select Game Mode <span>›</span> <b>Select Team</b> <span>›</span> Start Save</div>
    <div className="team-select-top"><div className="page-header"><h1>Select Your Team</h1><div className="subtitle">By selecting a certain game mode your staff reputation, facility quality and roster strength will determine your first challenge.</div></div><button className="fm-continue" disabled={!selected} onClick={()=>onBegin(selected)}>Continue</button></div>
    <div className="team-select-layout">
      <aside className="region-filter"><button className="active">Global</button><button>Europe</button><button>Asia</button><button>North America</button><button>South America</button><button>Oceania</button><label>⌕<input placeholder="Search for a specific Nation" /></label><label>⌕<input placeholder="Search for a specific Team" /></label><div className="create-team-card"><b>Create Your Own Team</b><span>Build from zero. Manage everything.</span><i>＋</i></div></aside>
      <main>
        {selectedRow && <div className="team-select-summary"><strong>R{selectedRow.team.ranking}</strong><Stars value={selectedRow.team.reputation} /><span>{selectedRow.team.tier} Tier</span><span>{selectedRow.diff}</span><span>{formatMoney(selectedRow.team.budget)}</span><Crest team={selectedRow.team} size={34} /><span>{selectedRow.team.region}</span><span>{selectedRow.team.country}</span></div>}
        <div className="team-card-grid">{rows.slice(0, 25).map((r, index)=><button type="button" key={r.team.teamId} onClick={()=>setSelected(r.team.teamId)} className={selected===r.team.teamId?'team-pick-card selected':'team-pick-card'}><span className="country-code">{r.team.country?.slice(0,2).toUpperCase()}</span><Crest team={r.team} size={44} /><b>{r.team.name}</b><em>#{index + 1}</em></button>)}</div>
      </main>
    </div>
  </div>;
}
