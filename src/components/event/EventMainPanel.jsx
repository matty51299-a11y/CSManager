import { buildEventStats } from '../../utils/tournamentEngine';
import EventCanvas from './EventCanvas';
import EventResultsFeed from './EventResultsFeed';
import EventPlacementsPanel from './EventPlacementsPanel';
import SwissStageView from './SwissStageView';
import SingleElimBracketView from './SingleElimBracketView';
import GroupStageView from './GroupStageView';
import MajorStageView from './MajorStageView';

// Pick the format-specific stage view for the adaptive middle tab.
function StageView({ middleTab, tournament, model, format, actions }) {
  if (middleTab === 'Bracket') return <SingleElimBracketView tournament={tournament} model={model} format={format} actions={actions} />;
  if (middleTab === 'Groups') return <GroupStageView tournament={tournament} model={model} format={format} actions={actions} />;
  if (middleTab === 'Stages') return <MajorStageView tournament={tournament} model={model} format={format} actions={actions} />;
  return <SwissStageView tournament={tournament} model={model} format={format} actions={actions} />;
}

export default function EventMainPanel({ activeTab, tournament, model, actions, summary, format }) {
  const stats = buildEventStats(tournament);
  const middleTab = format?.middleTab || 'Swiss';
  return <main className="event-center">
    {activeTab === 'Overview' && <EventCanvas tournament={tournament} model={model} actions={actions} />}
    {activeTab === middleTab && <StageView middleTab={middleTab} tournament={tournament} model={model} format={format} actions={actions} />}
    {activeTab === 'Results' && <EventResultsFeed matches={model.allMatches} userTeamId={model.userTeamId} />}
    {activeTab === 'Placements' && <EventPlacementsPanel tournament={tournament} model={model} summary={summary} />}
    {activeTab === 'Stats' && <div className="overlay-panel"><h3>Event Stats Leaders</h3><div className="stats-leader-grid">{stats.players.sort((a, b) => b.averageRating - a.averageRating).slice(0, 12).map((p) => <div className={p.teamId === model.userTeamId ? 'is-user' : ''} key={p.playerId}><b>{p.gamertag}</b><span>{p.kills}-{p.deaths}-{p.assists}</span><em>{p.ADR} ADR · {p.averageRating} rating · {p.clutches} clutches</em></div>)}</div></div>}
  </main>;
}
