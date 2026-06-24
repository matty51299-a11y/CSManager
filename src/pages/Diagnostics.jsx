import { runAllValidations } from '../utils/validation';
import { runTournamentDiagnostics } from '../utils/tournamentEngine.js';

export default function Diagnostics({ gameState }) {
  const results = runAllValidations(
    gameState.teams,
    gameState.players,
    gameState.maps,
    gameState.teamMapRatings,
    gameState.events
  );
  const tournamentDiagnostic = runTournamentDiagnostics(gameState);
  const allResults = [...results, tournamentDiagnostic];
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
              <span style={{ color: 'var(--text-secondary)' }}>Season</span>
              <strong>{gameState.season}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Week</span>
              <strong>{gameState.week}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Phase</span>
              <strong>{gameState.phase}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Your Team</span>
              <strong>{gameState.playerTeamId}</strong>
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
