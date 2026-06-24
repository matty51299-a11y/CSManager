import { teamSeed, bestFinish } from './eventOverlayUtils';
import EventMapPoolPreview from './EventMapPoolPreview';
import EventResultsFeed from './EventResultsFeed';

export default function EventSidebar({ tournament, model, gameState, actions, summary }) {
  const matchup = model.pendingUser ? [model.pendingUser[0].team, model.pendingUser[1].team] : model.playoffPendingUser ? [model.playoffPendingUser.teamA, model.playoffPendingUser.teamB] : [];
  const opponent = matchup.find((team)=>team?.teamId !== model.userTeamId);
  const latest = model.latestUserMatch;
  const latestHeadline = latest ? `${latest.winner.shortName} beat ${latest.loser.shortName} ${latest.seriesScore}` : 'No user result yet';
  return <aside className="event-sidebar">
    <div className="overlay-panel compact"><h3>My Team</h3><div className="team-identity"><b>{model.userTeam?.name}</b><span>Seed #{teamSeed(model.userTeam, tournament)} · Rank #{model.userTeam?.ranking}</span></div><div className="mini-grid"><span>Status <b>{model.status}</b></span><span>Record <b>{model.userStanding?.wins || 0}-{model.userStanding?.losses || 0}</b></span><span>Stage <b>{tournament.playoffs ? 'Playoffs' : 'Swiss'}</b></span><span>Best <b>{bestFinish(tournament, model.status)}</b></span></div></div>
    <div className="overlay-panel compact"><h3>Current Match</h3>{opponent ? <><div className="current-match-vs"><b>{model.userTeam.shortName}</b><i>vs</i><b>{opponent.shortName}</b></div><p>{model.playoffPendingUser?.roundName || `Swiss Round ${model.activeRound?.number || 1}`}</p><button onClick={()=> model.playoffPendingUser ? actions.simUserMatch({ roundIndex:model.playoffPendingUser.roundIndex, matchIndex:model.playoffPendingUser.matchIndex }) : actions.simUserMatch({ teamAId:model.pendingUser[0].teamId, teamBId:model.pendingUser[1].teamId })}>Sim This Match</button></> : <><p className="muted">No user match pending.</p><b>{latestHeadline}</b></>}</div>
    <EventMapPoolPreview teamA={matchup[0]} teamB={matchup[1]} gameState={gameState}/>
    <div className="overlay-panel compact"><h3>Latest User Result</h3>{latest ? <><b>{latestHeadline}</b><p>{latest.maps.map((m)=>`${m.mapName} ${m.scoreA}-${m.scoreB}${m.overtime ? ' OT' : ''}`).join(' | ')}</p>{latest.topPerformer && <span className="muted">Top performer: {latest.topPerformer.gamertag}, {latest.topPerformer.totalKills}-{latest.topPerformer.totalDeaths}, {latest.topPerformer.averageRating} rating</span>}<div className="path-line">{model.userTeam?.shortName} record: <b>{model.userStanding?.wins || 0}-{model.userStanding?.losses || 0}</b></div></> : <p className="muted">Your latest event result will appear here.</p>}</div>
    <EventResultsFeed matches={model.allMatches.slice(-5)} userTeamId={model.userTeamId}/>
    <div className="overlay-panel compact"><h3>My Path</h3><div className="path-line">Current: <b>{model.userStanding?.wins || 0}-{model.userStanding?.losses || 0}</b></div><div className="path-line">Next requirement: <b>{model.nextOpponent ? `Beat ${model.nextOpponent.shortName}` : tournament.playoffs ? 'Win playoff rounds' : 'Wait for pairing'}</b></div><div className="path-line">Swiss rule: <b>3 wins qualifies · 3 losses out</b></div>{summary && <div className="champion-stamp">VRS movement shown in event summary.</div>}</div>
  </aside>;
}
