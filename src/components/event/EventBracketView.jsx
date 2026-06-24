// Renders the accumulated single-elimination playoff bracket from the live
// model. "Sim This Match" routes through the format-agnostic user action.
export default function EventBracketView({ model, actions }) {
  const rounds = model.bracketRounds || [];
  return <div className="bracket-focus">
    <div className="bracket-overlay">{rounds.map((round) => <section key={round.name}>
      <h3>{round.name}</h3>
      {round.matches.map((match, mi) => {
        const isUser = [match.teamA?.teamId, match.teamB?.teamId].includes(model.userTeamId);
        const isNextUser = isUser && !match.result;
        return <div className={`bracket-node ${isUser ? 'is-user' : ''} ${isNextUser ? 'next-user-match' : ''}`} key={mi}>
          <div><span>{match.teamA?.shortName || 'TBD'}</span><b>{match.result?.mapsWonA ?? '-'}</b></div>
          <div><span>{match.teamB?.shortName || 'TBD'}</span><b>{match.result?.mapsWonB ?? '-'}</b></div>
          {match.result ? <small>{match.result.winner.shortName} advanced</small> : isUser ? <button onClick={() => actions.simUserMatch()}>Sim This Match</button> : <small>Upcoming</small>}
        </div>;
      })}
    </section>)}</div>
    <section className="champion-column"><h3>Champion</h3><div className="champion-card">{model.champion ? model.champion.name : 'TBD'}<small>{model.champion ? 'Event winner' : 'Win the final to lift the trophy'}</small></div></section>
  </div>;
}
