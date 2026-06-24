// Shows the user's path through the current format (PART 7): their record, who
// they play next and what a win or loss means in this format.
export default function EventUserPath({ model }) {
  const record = `${model.userRecord.wins}-${model.userRecord.losses}`;
  const opponent = model.nextOpponent;
  const latest = model.latestUserMatch;
  const phaseKind = model.phase?.kind;
  const team = model.userTeam?.shortName;

  // Format-specific meaning of the next match.
  let implication;
  if (model.userWaiting) implication = `${team} is seeded into ${model.userEntryStageName}. Earlier stages play out first.`;
  else if (model.status === 'Champion') implication = `${team} won the event.`;
  else if (model.status === 'Eliminated') implication = `${team} has been eliminated.`;
  else if (phaseKind === 'swiss') implication = opponent ? `Win moves ${team} closer to qualifying. 3 wins qualifies, 3 losses eliminates.` : '3 wins qualifies for playoffs.';
  else if (phaseKind === 'groups') implication = opponent ? `Top 2 of ${model.phaseName.includes('Group') ? model.phaseName : 'the group'} qualify. Current record ${record}.` : 'Top 2 of the group qualify for playoffs.';
  else implication = opponent ? `Win reaches the next round. A loss eliminates ${team}.` : 'Win the bracket to be crowned champion.';

  return <div className="user-path-card">
    <header><span>My Team Path</span><b>{team} · {record}</b></header>
    <div className="path-node-row">
      <span className="path-node current">{record}</span>
      <i>→</i>
      <span className="path-node">{opponent ? `Next: ${opponent.shortName}` : model.userWaiting ? `Await ${model.userEntryStageName}` : model.status === 'Champion' ? 'Champion' : 'Await next stage'}</span>
      <i>→</i>
      <span className="path-node finish">{model.status === 'Champion' ? 'Champion' : model.status === 'Eliminated' ? 'Eliminated' : model.status === 'Waiting' ? 'Waiting' : 'Alive'}</span>
    </div>
    {latest && <p>{latest.winner.teamId === model.userTeamId ? 'Beat' : 'Lost to'} {latest.winner.teamId === model.userTeamId ? latest.loser.shortName : latest.winner.shortName} · {latest.seriesScore}</p>}
    <p>{implication}</p>
  </div>;
}
