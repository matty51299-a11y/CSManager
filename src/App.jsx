import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import TopNav from './components/TopNav';
import WeaponSprite from './components/WeaponSprite';
import ErrorBoundary from './components/ErrorBoundary';
import Dashboard from './pages/Dashboard';
import Teams from './pages/Teams';
import TeamDetail from './pages/TeamDetail';
import Players from './pages/Players';
import PlayerDetail from './pages/PlayerDetail';
import Rankings from './pages/Rankings';
import Calendar from './pages/Calendar';
import TournamentDetail from './pages/TournamentDetail';
import Roster from './pages/Roster';
import Diagnostics from './pages/Diagnostics';
import MatchCentre from './pages/MatchCentre';
import TournamentCentre from './pages/TournamentCentre';
import StartCareer from './pages/StartCareer';
import Inbox from './pages/Inbox';
import Transfers from './pages/Transfers';
import Fixtures from './pages/Fixtures';
import EventHub from './pages/EventHub';
import EventReadyModal from './components/EventReadyModal';
import { useGameState } from './state';
import { PreMatchModal } from './components/MatchModals';
import MatchReportModal from './components/MatchReportModal';
import { useState } from 'react';
import { isUserFixture } from './utils/careerSimulation';

function EventHubRoute({ gameState, actions }) {
  const navigate = useNavigate();
  const goToDashboard = () => { actions.returnToDashboard(); navigate('/'); };
  return (
    <EventHub
      gameState={gameState}
      simUserMatch={actions.simUserMatch}
      simOtherMatches={actions.simOtherMatches}
      advanceEventStage={actions.advanceEventStage}
      finishEvent={actions.finishEvent}
      returnToDashboard={goToDashboard}
    />
  );
}

export default function App() {
  const [preMatchFixtureId, setPreMatchFixtureId] = useState(null);
  const actions = useGameState();
  const { gameState } = actions;
  const inEventMode = gameState.currentPhase?.startsWith('event_active') || (gameState.currentPhase === 'event_complete' && gameState.activeTournament);

  if (!gameState.careerStarted) {
    return (
      <div className="main-content">
        <ErrorBoundary onReset={actions.resetCareer} currentCareerDate={gameState.currentDate}>
          <StartCareer gameState={gameState} onGoToTeamSelection={actions.goToTeamSelection} onBegin={actions.startCareer} />
        </ErrorBoundary>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <WeaponSprite />
      <div className={inEventMode ? 'fm-shell event-app-mode' : 'fm-shell'}>
        {!inEventMode && <TopNav gameState={gameState} actions={actions} onPlayMatch={(fixtureId) => setPreMatchFixtureId(fixtureId)} />}
        <div className={inEventMode ? 'app-layout event-app-mode' : 'app-layout'}>
        <main className={inEventMode ? 'main-content event-main-content' : 'main-content'}>
          <ErrorBoundary onReset={actions.resetCareer} currentCareerDate={gameState.currentDate}>
            <Routes>
              <Route path="/" element={<Dashboard gameState={gameState} advanceToNextEvent={actions.advanceToNextEvent} enterEvent={actions.enterEvent} resetCareer={actions.resetCareer} />} />
              <Route path="/teams" element={<Teams gameState={gameState} />} />
              <Route path="/teams/:teamId" element={<TeamDetail gameState={gameState} />} />
              <Route path="/players" element={<Players gameState={gameState} />} />
              <Route path="/players/:playerId" element={<PlayerDetail gameState={gameState} />} />
              <Route path="/rankings" element={<Rankings gameState={gameState} />} />
              <Route path="/calendar" element={<Calendar gameState={gameState} advanceToNextEvent={actions.advanceToNextEvent} enterEvent={actions.enterEvent} />} />
              <Route path="/inbox" element={<Inbox gameState={gameState} />} />
              <Route path="/transfers" element={<Transfers gameState={gameState} />} />
              <Route path="/fixtures" element={<Fixtures gameState={gameState} />} />
              <Route path="/event-hub" element={<EventHubRoute gameState={gameState} actions={actions} />} />
              <Route path="/tournaments/:tournamentId" element={<TournamentDetail gameState={gameState} />} />
              <Route path="/roster" element={<Roster gameState={gameState} />} />
              <Route path="/match-centre" element={<MatchCentre gameState={gameState} />} />
              <Route path="/tournament-centre" element={<TournamentCentre gameState={gameState} />} />
              <Route path="/diagnostics" element={<Diagnostics gameState={gameState} resetCareer={actions.resetCareer} />} />
            </Routes>
            {!inEventMode && <EventReadyModal gameState={gameState} enterEvent={() => {
              const snap = gameState.eventInviteSnapshots?.[gameState.currentEventId];
              const invited = snap ? snap.invitees.some((i) => i.teamId === gameState.selectedTeamId) : false;
              actions.enterEvent();
              const dest = invited ? '/event-hub' : '/';
              window.history.pushState(null, '', dest); window.dispatchEvent(new PopStateEvent('popstate'));
            }} viewCalendar={() => { window.history.pushState(null, '', '/calendar'); window.dispatchEvent(new PopStateEvent('popstate')); }} />}
          </ErrorBoundary>
            <PreMatchModal gameState={gameState} fixture={(gameState.fixtures || []).find((f) => f.id === preMatchFixtureId && isUserFixture(f, gameState.selectedTeamId))} onClose={() => setPreMatchFixtureId(null)} onPlay={(fixtureId) => { actions.playFixture(fixtureId); setPreMatchFixtureId(null); }} />
            {gameState.pendingMatchResult && <MatchReportModal match={gameState.pendingMatchResult} onClose={actions.acknowledgeMatchResult} onViewTournament={() => { const tid = gameState.pendingMatchResult?.tournamentId; actions.acknowledgeMatchResult(); window.history.pushState(null, '', `/tournaments/${tid}`); window.dispatchEvent(new PopStateEvent('popstate')); }} />}
        </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
