import { runAllValidations } from '../utils/validation';

export default function Diagnostics({ gameState }) {
  const results = runAllValidations(gameState.teams, gameState.players, gameState.maps);
  const allPassed = results.every((r) => r.valid);

  return (
    <div>
      <div className="page-header">
        <h1>Diagnostics</h1>
        <div className="subtitle">
          Seed database validation —{' '}
          <span style={{ color: allPassed ? 'var(--green)' : 'var(--red)', fontWeight: 600 }}>
            {allPassed ? 'ALL CHECKS PASSED' : 'ISSUES FOUND'}
          </span>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header"><h2>Validation Results</h2></div>
        <div className="panel-body">
          {results.map((r, i) => (
            <div key={i}>
              <div className="diag-row">
                <span className={`diag-icon ${r.valid ? 'diag-pass' : 'diag-fail'}`}>
                  {r.valid ? 'PASS' : 'FAIL'}
                </span>
                <span>{r.name}</span>
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

      <div className="grid-3">
        <div className="panel">
          <div className="panel-header"><h2>Database Summary</h2></div>
          <div className="panel-body">
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
              <span style={{ color: 'var(--text-secondary)' }}>Tournament Templates</span>
              <strong>{gameState.tournamentTemplates.length}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Scheduled Events</span>
              <strong>{gameState.seasonTournaments.length}</strong>
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
          </div>
        </div>

        <div className="panel">
          <div className="panel-header"><h2>Settings</h2></div>
          <div className="panel-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Difficulty</span>
              <strong>{gameState.settings.difficulty}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Sim Speed</span>
              <strong>{gameState.settings.simSpeed}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Currency</span>
              <strong>{gameState.settings.currency}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
