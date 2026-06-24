import { teamSeed, bestFinish } from './eventOverlayUtils';
import EventMapPoolPreview from './EventMapPoolPreview';
import EventResultsFeed from './EventResultsFeed';

export default function EventSidebar({ tournament, model, gameState, actions, summary }) {
  const userMatch = model.userMatch;
  const opponent = model.nextOpponent;
  const latest = model.latestUserMatch;
  const latestHeadline = latest ? `${latest.winner.shortName} beat ${latest.loser.shortName} ${latest.seriesScore}` : 'No user result yet';
  const record = `${model.userRecord.wins}-${model.userRecord.losses}`;
  return <aside className="event-sidebar">
    <div className="overlay-panel compact"><h3>My Team</h3>
      <div className="team-identity"><b>{model.userTeam?.name}</b><span>Seed #{teamSeed(model.userTeam, tournament)} · Rank #{model.userTeam?.ranking}</span></div>
      <div className="mini-grid"><span>Status <b>{model.status}</b></span><span>Record <b>{record}</b></span><span>Stage <b>{model.phaseName}</b></span><span>Best <b>{bestFinish(tournament, model.status)}</b></span></div>
    </div>
    <div className="overlay-panel compact"><h3>Current Match</h3>
      {userMatch ? <>
        <div className="current-match-vs"><b>{model.userTeam.shortName}</b><i>vs</i><b>{opponent.shortName}</b></div>
        <p>{model.phaseName}</p>
        <button onClick={() => actions.simUserMatch()}>Sim This Match</button>
      </> : <>
        <p className="muted">{model.userWaiting ? `Awaiting ${model.userEntryStageName}.` : 'No user match pending.'}</p>
        <b>{latestHeadline}</b>
      </>}
    </div>
    <EventMapPoolPreview teamA={userMatch?.teamA} teamB={userMatch?.teamB} gameState={gameState} />
    <div className="overlay-panel compact"><h3>Latest User Result</h3>
      {latest ? <>
        <b>{latestHeadline}</b>
        <p>{latest.maps.map((m) => `${m.mapName} ${m.scoreA}-${m.scoreB}${m.overtime ? ' OT' : ''}`).join(' | ')}</p>
        {latest.topPerformer && <span className="muted">Top performer: {latest.topPerformer.gamertag}, {latest.topPerformer.totalKills}-{latest.topPerformer.totalDeaths}, {latest.topPerformer.averageRating} rating</span>}
        <div className="path-line">{model.userTeam?.shortName} record: <b>{record}</b></div>
      </> : <p className="muted">Your latest event result will appear here.</p>}
    </div>
    <EventResultsFeed matches={model.allMatches.slice(-5)} userTeamId={model.userTeamId} />
    <div className="overlay-panel compact"><h3>My Path</h3>
      <div className="path-line">Current: <b>{record}</b></div>
      <div className="path-line">Next: <b>{opponent ? `Beat ${opponent.shortName}` : model.userWaiting ? `Await ${model.userEntryStageName}` : model.champion ? 'Event complete' : 'Await next stage'}</b></div>
      <div className="path-line">Finish: <b>{bestFinish(tournament, model.status)}</b></div>
      {summary && <div className="champion-stamp">VRS movement shown in event summary.</div>}
    </div>
  </aside>;
}
