export default function EventBracketView({ tournament, userTeamId, onSimUser }) {
  const rounds = tournament.playoffs?.rounds || [];
  return <div className="bracket-focus">
    <div className="bracket-overlay">{rounds.map((round,ri)=><section key={round.name}><h3>{round.name}</h3>{round.matches.map((match,mi)=>{const isUser=[match.teamA?.teamId,match.teamB?.teamId].includes(userTeamId); const isNextUser = isUser && !match.result; return <div className={`bracket-node ${isUser?'is-user':''} ${isNextUser?'next-user-match':''}`} key={mi}><div><span>{match.teamA?.shortName || 'TBD'}</span><b>{match.result?.mapsWonA ?? '-'}</b></div><div><span>{match.teamB?.shortName || 'TBD'}</span><b>{match.result?.mapsWonB ?? '-'}</b></div>{match.result ? <small>{match.result.winner.shortName} advanced</small> : isUser ? <button onClick={()=>onSimUser({ roundIndex:ri, matchIndex:mi })}>Sim This Match</button> : <small>Upcoming</small>}</div>;})}</section>)}</div>
    <section className="champion-column"><h3>Champion</h3><div className="champion-card">{tournament.champion ? tournament.champion.name : 'TBD'}<small>{tournament.champion ? 'Event winner' : 'Win the final to lift the trophy'}</small></div></section>
  </div>;
}
