import { buildEventStats } from '../../utils/tournamentEngine';
import { teamSeed, bestFinish } from './eventOverlayUtils';
import EventMapPoolPreview from './EventMapPoolPreview';
import EventResultsFeed from './EventResultsFeed';
import EventPlacementsPanel from './EventPlacementsPanel';

export default function EventSidebar({ tournament, model, gameState, actions, summary }) {
  const matchup = model.pendingUser ? [model.pendingUser[0].team, model.pendingUser[1].team] : model.playoffPendingUser ? [model.playoffPendingUser.teamA, model.playoffPendingUser.teamB] : [];
  const opponent = matchup.find((team)=>team?.teamId !== model.userTeamId);
  const userStats = buildEventStats(tournament).players.filter((p)=>p.teamId===model.userTeamId).sort((a,b)=>b.averageRating-a.averageRating);
  return <aside className="event-sidebar">
    <div className="overlay-panel compact"><h3>My Team</h3><div className="team-identity"><b>{model.userTeam?.name}</b><span>Seed #{teamSeed(model.userTeam, tournament)} · Ranking #{model.userTeam?.ranking}</span></div><div className="mini-grid"><span>Status <b>{model.status}</b></span><span>Record <b>{model.userStanding?.wins || 0}-{model.userStanding?.losses || 0}</b></span><span>Position <b>{tournament.playoffs ? 'Playoffs' : 'Swiss'}</b></span><span>Best <b>{bestFinish(tournament, model.status)}</b></span></div></div>
    <div className="overlay-panel compact"><h3>Current Match</h3>{opponent ? <><div className="current-match-vs"><b>{model.userTeam.shortName}</b><i>vs</i><b>{opponent.shortName}</b></div><p>{model.playoffPendingUser?.roundName || `Swiss Round ${model.activeRound?.number || 1}`}</p><button onClick={()=> model.playoffPendingUser ? actions.simUserMatch({ roundIndex:model.playoffPendingUser.roundIndex, matchIndex:model.playoffPendingUser.matchIndex }) : actions.simUserMatch({ teamAId:model.pendingUser[0].teamId, teamBId:model.pendingUser[1].teamId })}>Sim This Match</button></> : <p className="muted">No user match pending. Sim or advance other matches.</p>}</div>
    <EventMapPoolPreview teamA={matchup[0]} teamB={matchup[1]} gameState={gameState}/>
    <div className="overlay-panel compact"><h3>My Team Path</h3><div className="path-line">{model.status}</div><div className="path-line">Next opponent: <b>{opponent?.shortName || 'TBD'}</b></div><div className="path-line">Best player: <b>{userStats[0]?.gamertag || 'TBD'}</b></div></div>
    <EventResultsFeed matches={model.allMatches} userTeamId={model.userTeamId}/>
    <EventPlacementsPanel tournament={tournament} model={model} summary={summary}/>
  </aside>;
}
