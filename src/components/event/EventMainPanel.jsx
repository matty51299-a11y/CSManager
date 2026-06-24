import { buildEventStats } from '../../utils/tournamentEngine';
import EventSwissView from './EventSwissView';
import EventBracketView from './EventBracketView';
import EventResultsFeed from './EventResultsFeed';
import EventPlacementsPanel from './EventPlacementsPanel';

function RichResult({ match }) { if (!match) return null; return <div className="rich-result"><span>LAST USER RESULT</span><h2>{match.winner.shortName} beat {match.loser.shortName} {match.seriesScore}</h2><p>{match.maps.map((m)=>`${m.mapName} ${m.scoreA}-${m.scoreB}${m.overtime?' OT':''}`).join(' · ')}</p>{match.topPerformer && <b>Top performer: {match.topPerformer.gamertag}, {match.topPerformer.totalKills}-{match.topPerformer.totalDeaths}, {match.topPerformer.averageRating} rating</b>}</div>; }
export default function EventMainPanel({ activeTab, tournament, model, actions, summary }) {
  const stats = buildEventStats(tournament);
  const contentTab = activeTab === 'Overview' ? (tournament.playoffs ? 'Playoffs' : 'Swiss') : activeTab;
  return <main className="event-center"><RichResult match={model.latestUserMatch}/>{contentTab === 'Swiss' && <EventSwissView tournament={tournament} model={model}/>} {contentTab === 'Playoffs' && <EventBracketView tournament={tournament} userTeamId={model.userTeamId} onSimUser={actions.simUserMatch}/>} {contentTab === 'Results' && <EventResultsFeed matches={model.allMatches} userTeamId={model.userTeamId}/>} {contentTab === 'Placements' && <EventPlacementsPanel tournament={tournament} model={model} summary={summary}/>} {contentTab === 'Stats' && <div className="overlay-panel"><h3>Event Stats Leaders</h3><div className="stats-leader-grid">{stats.players.sort((a,b)=>b.averageRating-a.averageRating).slice(0,12).map((p)=><div className={p.teamId===model.userTeamId?'is-user':''} key={p.playerId}><b>{p.gamertag}</b><span>{p.kills}-{p.deaths}-{p.assists}</span><em>{p.ADR} ADR · {p.averageRating} rating · {p.clutches} clutches</em></div>)}</div></div>}</main>;
}
