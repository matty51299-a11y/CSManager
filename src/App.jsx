import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
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
import initialGameState from './data/gameState';

export default function App() {
  const [gameState] = useState(initialGameState);

  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar gameState={gameState} />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Dashboard gameState={gameState} />} />
            <Route path="/teams" element={<Teams gameState={gameState} />} />
            <Route path="/teams/:teamId" element={<TeamDetail gameState={gameState} />} />
            <Route path="/players" element={<Players gameState={gameState} />} />
            <Route path="/players/:playerId" element={<PlayerDetail gameState={gameState} />} />
            <Route path="/rankings" element={<Rankings gameState={gameState} />} />
            <Route path="/calendar" element={<Calendar gameState={gameState} />} />
            <Route path="/tournaments/:tournamentId" element={<TournamentDetail gameState={gameState} />} />
            <Route path="/roster" element={<Roster gameState={gameState} />} />
            <Route path="/diagnostics" element={<Diagnostics gameState={gameState} />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
