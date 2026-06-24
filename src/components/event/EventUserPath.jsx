export default function EventUserPath({ tournament, model }) {
  const record = `${model.userStanding?.wins || 0}-${model.userStanding?.losses || 0}`;
  const opponent = model.nextOpponent;
  const latest = model.latestUserMatch;
  const winRecord = `${(model.userStanding?.wins || 0) + 1}-${model.userStanding?.losses || 0}`;
  const lossRecord = `${model.userStanding?.wins || 0}-${(model.userStanding?.losses || 0) + 1}`;

  return <div className="user-path-card">
    <header><span>My Team Path</span><b>{model.userTeam?.shortName} · {record}</b></header>
    <div className="path-node-row">
      <span className="path-node current">{record}</span>
      <i>→</i>
      <span className="path-node">{opponent ? `Next: ${opponent.shortName}` : tournament.playoffs ? 'Playoffs' : 'Await pairing'}</span>
      <i>→</i>
      <span className="path-node finish">{model.status === 'qualified' ? 'Qualified' : model.status === 'eliminated' ? 'Eliminated' : '3 wins qualifies'}</span>
    </div>
    {latest && <p>{latest.winner.teamId === model.userTeamId ? 'Beat' : 'Lost to'} {latest.winner.teamId === model.userTeamId ? latest.loser.shortName : latest.winner.shortName} · {latest.seriesScore}</p>}
    {!tournament.playoffs && opponent && <p>Win moves {model.userTeam?.shortName} to {winRecord}. Loss drops {model.userTeam?.shortName} to {lossRecord}. 3 losses eliminates.</p>}
  </div>;
}
