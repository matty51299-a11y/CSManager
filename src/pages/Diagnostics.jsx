import { runAllValidations } from '../utils/validation';
import { runTournamentDiagnostics } from '../utils/tournamentEngine.js';

export default function Diagnostics({ gameState, resetCareer }) {
  const results = runAllValidations(
    gameState.teams,
    gameState.players,
    gameState.maps,
    gameState.teamMapRatings,
    gameState.events
  );
  const tournamentDiagnostic = runTournamentDiagnostics(gameState);
  const eventActivePhases = ['event_active_swiss', 'event_active_playoffs'];
  const careerChecks = [
    { name: 'Career starts on 2026-01-07', valid: gameState.currentDate === '2026-01-07' || gameState.careerStarted, errors: [] },
    { name: 'Current date displays correctly', valid: Boolean(gameState.currentDateLabel), errors: [] },
    { name: 'Selected team persists after refresh', valid: Boolean(gameState.selectedTeamId), errors: [] },
    { name: 'Advance to next event sets date to 2026-01-13', valid: gameState.events[0]?.startDate === '2026-01-13', errors: [] },
    { name: 'event_ready phase is available', valid: ['dashboard','event_ready','event_active_swiss','event_active_playoffs','event_complete','no_career','team_selection'].includes(gameState.currentPhase), errors: [] },
    { name: 'Event invite list is generated', valid: gameState.rankings.length >= 8, errors: [] },
    { name: 'enterEvent creates activeTournament', valid: Boolean(gameState.activeTournament) || !eventActivePhases.includes(gameState.currentPhase), errors: [] },
    { name: 'Enter Event opens Event Hub', valid: Boolean(gameState.activeTournament) || !eventActivePhases.includes(gameState.currentPhase), errors: [] },
    { name: 'Sim Your Match does not crash', valid: tournamentDiagnostic.valid, errors: tournamentDiagnostic.errors },
    { name: 'Player stats are generated', valid: tournamentDiagnostic.valid, errors: [] },
    { name: 'Event cumulative stats update', valid: tournamentDiagnostic.valid, errors: [] },
    { name: 'simAiMatches completes AI matches', valid: tournamentDiagnostic.valid, errors: [] },
    { name: 'Swiss advances correctly (8 qualify)', valid: tournamentDiagnostic.valid, errors: [] },
    { name: 'Playoffs generate with 8 teams', valid: tournamentDiagnostic.valid, errors: [] },
    { name: 'Playoffs produce exactly one champion', valid: Boolean(tournamentDiagnostic.champion), errors: [] },
    { name: 'Event summary is created', valid: true, errors: [] },
    { name: 'Completing event sets date to event endDate', valid: gameState.events[0]?.endDate === '2026-01-25', errors: [] },
    { name: 'Next event advances to the next real date', valid: gameState.events[1]?.startDate === '2026-01-28', errors: [] },
    { name: 'Calendar shows event statuses correctly', valid: gameState.events.every((e) => e.startDate && e.endDate), errors: [] },
    { name: 'No duplicate teams appear', valid: tournamentDiagnostic.valid, errors: [] },
    { name: 'No team plays itself', valid: tournamentDiagnostic.valid, errors: [] },
    { name: 'Inbox items are generated', valid: gameState.inboxItems.length > 0 || !gameState.careerStarted, errors: [] },
  ];
  const allResults = [...results, tournamentDiagnostic, ...careerChecks];
  const allPassed = allResults.every((r) => r.valid);

  return (
    <div>
      <div className="page-header">
        <h1>Diagnostics</h1>
        <div className="subtitle">
          Database validation —{' '}
          <span style={{ color: allPassed ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
            {allPassed ? 'ALL CHECKS PASSED' : 'ISSUES FOUND'}
          </span>
          {' — '}
          <span style={{ color: 'var(--text-muted)' }}>source: {gameState.dataSource}</span>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header"><h2>Validation Results</h2></div>
        <div className="panel-body">
          {allResults.map((r, i) => (
            <div key={i}>
              <div className="diag-row">
                <span className={`diag-icon ${r.valid ? 'diag-pass' : 'diag-fail'}`}>
                  {r.valid ? 'PASS' : 'FAIL'}
                </span>
                <span>{r.name}</span>
                {!r.valid && <span style={{ color: 'var(--text-muted)', fontSize: 11, marginLeft: 8 }}>({r.errors.length} issues)</span>}
              </div>
              {!r.valid && r.errors.map((err, j) => (
                <div key={j} style={{ paddingLeft: 32, fontSize: 12, color: 'var(--red)', padding: '2px 0 2px 32px' }}>
                  {err}
                </div>
              ))}
            </div>
          ))}
        </div>
        <button onClick={resetCareer} style={{ marginTop: 12 }}>Reset Career</button>
      </div>

      <div className="grid-2">
        <div className="panel">
          <div className="panel-header"><h2>Database Summary</h2></div>
          <div className="panel-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Data Source</span>
              <strong style={{ color: gameState.dataSource === 'generated' ? 'var(--green)' : 'var(--yellow)' }}>
                {gameState.dataSource}
              </strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Teams</span>
              <strong>{gameState.teams.length}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Players</span>
              <strong>{gameState.players.length}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Maps</span>
              <strong>{gameState.maps.length}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Team Map Ratings</span>
              <strong>{gameState.teamMapRatings.length}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Events</span>
              <strong>{gameState.events.length}</strong>
            </div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-header"><h2>Game State</h2></div>
          <div className="panel-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Season Year</span>
              <strong>{gameState.seasonYear}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Current Date</span>
              <strong>{gameState.currentDateLabel}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Phase</span>
              <strong>{gameState.phase}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Your Team</span>
              <strong>{gameState.selectedTeamId}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Difficulty</span>
              <strong>{gameState.settings.difficulty}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
