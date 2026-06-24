export default function EventResultsFeed({ matches, userTeamId }) {
  const ordered = [...matches].reverse().slice(0, 8);
  return <div className="overlay-panel compact"><h3>Latest Results</h3>{ordered.length ? ordered.map((m,i)=><div className={`feed-row ${[m.teamA.teamId,m.teamB.teamId].includes(userTeamId)?'is-user':''}`} key={i}><b>{m.winner.shortName} beat {m.loser.shortName}</b><span>{m.seriesScore} · {m.maps.map((map)=>`${map.mapName} ${map.scoreA}-${map.scoreB}`).join(' / ')}</span>{m.topPerformer && <small>Top: {m.topPerformer.gamertag}, {m.topPerformer.totalKills}-{m.topPerformer.totalDeaths}, {m.topPerformer.averageRating} rating</small>}</div>) : <p className="muted">Results will populate as matches finish.</p>}</div>;
}
