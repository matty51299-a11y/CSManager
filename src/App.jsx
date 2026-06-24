import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
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
import EventHub from './pages/EventHub';
import { useGameState } from './state';

export default function App() {
  const actions = useGameState();
  const { gameState } = actions;
  if (!gameState.careerStarted) return <div className="main-content"><StartCareer gameState={gameState} onBegin={actions.startCareer} /></div>;
  return <BrowserRouter><div className="app-layout"><Sidebar gameState={gameState} /><main className="main-content"><Routes>
    <Route path="/" element={<Dashboard {...actions} />} />
    <Route path="/teams" element={<Teams gameState={gameState} />} />
    <Route path="/teams/:teamId" element={<TeamDetail gameState={gameState} />} />
    <Route path="/players" element={<Players gameState={gameState} />} />
    <Route path="/players/:playerId" element={<PlayerDetail gameState={gameState} />} />
    <Route path="/rankings" element={<Rankings gameState={gameState} />} />
    <Route path="/calendar" element={<Calendar {...actions} />} />
    <Route path="/inbox" element={<Inbox gameState={gameState} />} />
    <Route path="/event-hub" element={<EventHub gameState={gameState} updateTournament={actions.updateTournament} />} />
    <Route path="/tournaments/:tournamentId" element={<TournamentDetail gameState={gameState} />} />
    <Route path="/roster" element={<Roster gameState={gameState} />} />
    <Route path="/match-centre" element={<MatchCentre gameState={gameState} />} />
    <Route path="/tournament-centre" element={<TournamentCentre gameState={gameState} />} />
    <Route path="/diagnostics" element={<Diagnostics {...actions} />} />
  </Routes></main></div></BrowserRouter>;
}
