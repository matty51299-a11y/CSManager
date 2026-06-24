import { useState } from 'react';
import EventHeader from '../components/event/EventHeader';
import EventTabs from '../components/event/EventTabs';
import EventMatchRail from '../components/event/EventMatchRail';
import EventMainPanel from '../components/event/EventMainPanel';
import EventSidebar from '../components/event/EventSidebar';
import { getOverlayModel } from '../components/event/eventOverlayUtils';
import { getEventFormat, getFormatTabs } from '../utils/eventFormatEngine';

export default function EventOverlay(props) {
  const { gameState } = props;
  const [activeTab, setActiveTab] = useState('Overview');
  const tournament = gameState.activeTournament;
  if (!tournament?.swiss || !tournament.event) {
    return <div className="event-overlay no-event"><h1>Event Overlay</h1><p>Enter an active career event from the Dashboard or Calendar.</p></div>;
  }
  const model = getOverlayModel(tournament, gameState);
  const format = getEventFormat(tournament.event);
  const tabs = getFormatTabs(tournament.event);
  const summary = (gameState.completedEvents || []).find((event) => event.eventId === tournament.event.eventId);
  const actions = {
    simUserMatch: props.simUserMatch,
    simOtherMatch: props.simOtherMatch,
    simAiMatches: props.simAiMatches,
    advanceSwissRound: props.advanceSwissRound,
    generatePlayoffs: props.generatePlayoffs,
    simPlayoffRound: props.simPlayoffRound,
    completeEvent: tournament.champion && summary ? props.returnToDashboard : props.completeEvent,
  };
  return <div className="event-overlay event-mode-shell">
    <EventHeader tournament={tournament} model={model} actions={actions} format={format}/>
    <EventTabs active={activeTab} onChange={setActiveTab} tabs={tabs}/>
    <div className="event-broadcast-grid">
      <EventMatchRail tournament={tournament} model={model} onSimOther={props.simOtherMatch}/>
      <EventMainPanel activeTab={activeTab} tournament={tournament} model={model} gameState={gameState} actions={actions} summary={summary} format={format}/>
      <EventSidebar tournament={tournament} model={model} gameState={gameState} actions={actions} summary={summary}/>
    </div>
  </div>;
}
