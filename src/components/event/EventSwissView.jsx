function Pool({ title, subtitle, teams, userTeamId }) {
  return <section className="swiss-pool"><header><h3>{title}</h3><span>{subtitle}</span></header>{teams.length ? teams.map((standing) => <div className={`pool-team ${standing.teamId === userTeamId ? 'is-user' : ''}`} key={standing.teamId}><b>{standing.team.shortName}</b><span>#{standing.team.ranking}</span><strong>{standing.wins}-{standing.losses}</strong></div>) : <p className="muted">No teams in this pool.</p>}</section>;
}

export default function EventSwissView({ model }) {
  const standings = model.swissStandings || [];
  const active = standings.filter((s) => s.status === 'active');
  const byRecord = (wins, losses) => active.filter((s) => s.wins === wins && s.losses === losses);
  const danger = active.filter((s) => s.losses === 2 && s.wins < 3);
  const nearQual = active.filter((s) => s.wins === 2 && s.losses < 3);
  const middle = active.filter((s) => !nearQual.includes(s) && !danger.includes(s));
  const opponent = model.nextOpponent;
  const userRecord = `${model.userRecord.wins}-${model.userRecord.losses}`;
  const winRecord = `${model.userRecord.wins + 1}-${model.userRecord.losses}`;
  const lossRecord = `${model.userRecord.wins}-${model.userRecord.losses + 1}`;
  const qualified = standings.filter((s) => s.status === 'qualified');
  const eliminated = standings.filter((s) => s.status === 'eliminated');

  return <div className="swiss-focus-board">
    <div className="swiss-stage-card">
      <span className="live-chip">SWISS LIVE</span>
      <h2>{model.phaseName}: qualification race</h2>
      <p>3 wins qualifies. 3 losses eliminates. Teams are paired by record and rematches are avoided where possible.</p>
      <div className="your-path-strip"><b>{model.userTeam?.shortName} path:</b><span>{userRecord}</span><i>→</i><span>{opponent ? `beat ${opponent.shortName} to reach ${winRecord}` : 'wait for next pairing'}</span><i>•</i><span>{opponent ? `loss drops to ${lossRecord}` : '3 wins qualifies'}</span></div>
      <div className="progress-lanes"><div><b>{qualified.length}</b><span>Qualified</span></div><div><b>{active.length}</b><span>Alive</span></div><div><b>{eliminated.length}</b><span>Eliminated</span></div></div>
    </div>
    <div className="pool-grid">
      <Pool title="2-win pool" subtitle="one win from playoffs" teams={nearQual.length ? nearQual : byRecord(2, 0)} userTeamId={model.userTeamId} />
      <Pool title="Middle pool" subtitle="record groups in play" teams={middle} userTeamId={model.userTeamId} />
      <Pool title="0-2 / danger" subtitle="one loss from elimination" teams={danger.length ? danger : byRecord(0, 2)} userTeamId={model.userTeamId} />
      <Pool title="Qualified" subtitle="playoff bound" teams={qualified} userTeamId={model.userTeamId} />
      <Pool title="Eliminated" subtitle="event over" teams={eliminated} userTeamId={model.userTeamId} />
    </div>
  </div>;
}
