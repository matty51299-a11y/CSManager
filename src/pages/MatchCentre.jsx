import { useMemo, useState } from 'react';
import { simulateMatch } from '../utils/matchEngine.js';

function StrengthTable({ title, strength }) {
  if (!strength) return null;
  return (
    <div className="panel compact-panel">
      <div className="panel-header"><h2>{title} Strength: {strength.total}</h2></div>
      <div className="panel-body">
        <table>
          <tbody>
            {Object.entries(strength.breakdown).map(([key, value]) => (
              <tr key={key}><td>{key.replace(/([A-Z])/g, ' $1')}</td><td className="text-right">{value}</td></tr>
            ))}
          </tbody>
        </table>
        <div className="role-checks">
          {strength.roleChecks.map((check) => <span key={check.key} className={check.met ? 'diag-pass' : 'diag-fail'}>{check.met ? '✓' : '×'} {check.key}</span>)}
        </div>
      </div>
    </div>
  );
}

function PerformerCell({ player }) {
  if (!player) return '—';
  return `${player.gamertag} (${player.kills}-${player.deaths}, ${player.rating})`;
}

export default function MatchCentre({ gameState }) {
  const teams = useMemo(() => [...gameState.teams].sort((a, b) => a.ranking - b.ranking), [gameState.teams]);
  const [teamAId, setTeamAId] = useState('team_spirit');
  const [teamBId, setTeamBId] = useState('team_vitality');
  const [bestOf, setBestOf] = useState(3);
  const [result, setResult] = useState(null);

  const teamA = teams.find((team) => team.teamId === teamAId) || teams[0];
  const teamB = teams.find((team) => team.teamId === teamBId) || teams[1];

  function runSimulation() {
    setResult(simulateMatch({ teamA, teamB, players: gameState.players, teamMapRatings: gameState.teamMapRatings, bestOf }));
  }

  const latestStrengths = result?.ok ? result.maps[result.maps.length - 1]?.strengths : null;

  return (
    <div>
      <div className="page-header">
        <h1>Match Centre</h1>
        <div className="subtitle">Simulate a Counter-Strike series using generated teams, players and map ratings.</div>
      </div>

      <div className="panel">
        <div className="panel-header"><h2>Match Setup</h2></div>
        <div className="panel-body match-controls">
          <label>Team A
            <select value={teamAId} onChange={(event) => setTeamAId(event.target.value)}>
              {teams.map((team) => <option key={team.teamId} value={team.teamId}>#{team.ranking} {team.name}</option>)}
            </select>
          </label>
          <label>Team B
            <select value={teamBId} onChange={(event) => setTeamBId(event.target.value)}>
              {teams.map((team) => <option key={team.teamId} value={team.teamId}>#{team.ranking} {team.name}</option>)}
            </select>
          </label>
          <label>Format
            <select value={bestOf} onChange={(event) => setBestOf(Number(event.target.value))}>
              <option value={1}>Best of 1</option>
              <option value={3}>Best of 3</option>
              <option value={5}>Best of 5</option>
            </select>
          </label>
          <button type="button" onClick={runSimulation}>Simulate Match</button>
        </div>
      </div>

      {result && !result.ok && <div className="panel"><div className="panel-body diag-fail">{result.error}</div></div>}

      {result?.ok && (
        <>
          <div className="result-card">
            <div><span className="muted">Winner</span><strong>{result.winner.name}</strong></div>
            <div><span className="muted">Series</span><strong>{result.seriesScore}</strong></div>
            <div><span className="muted">Format</span><strong>Bo{result.bestOf}</strong></div>
          </div>

          <div className="grid-2">
            <div className="panel">
              <div className="panel-header"><h2>Veto / Picks</h2></div>
              <div className="panel-body">
                <table>
                  <thead><tr><th>Step</th><th>Team</th><th>Map</th></tr></thead>
                  <tbody>{result.veto.steps.map((item, index) => <tr key={`${item.action}-${item.mapKey}-${index}`}><td>{item.action}</td><td>{item.teamName}</td><td>{item.mapName}</td></tr>)}</tbody>
                </table>
              </div>
            </div>
            <div className="panel">
              <div className="panel-header"><h2>Map Scores</h2></div>
              <div className="panel-body">
                <table>
                  <thead><tr><th>Map</th><th>{teamA.shortName}</th><th>{teamB.shortName}</th><th>Winner</th></tr></thead>
                  <tbody>{result.maps.map((map) => <tr key={map.mapKey}><td>{map.mapName}</td><td>{map.scoreA}</td><td>{map.scoreB}</td><td>{map.winnerName}</td></tr>)}</tbody>
                </table>
              </div>
            </div>
          </div>

          {result.maps.map((map) => (
            <div className="panel" key={`${map.mapKey}-perf`}>
              <div className="panel-header"><h2>{map.mapName} Top Performers</h2></div>
              <div className="panel-body">
                <table>
                  <tbody>
                    <tr><td>Top fragger</td><td><PerformerCell player={map.performers.topFragger} /></td></tr>
                    <tr><td>Highest rated</td><td><PerformerCell player={map.performers.highestRated} /></td></tr>
                    <tr><td>Clutch player</td><td><PerformerCell player={map.performers.clutchPlayer} /></td></tr>
                    <tr><td>Underperformer</td><td><PerformerCell player={map.performers.underperformer} /></td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          ))}

          <div className="grid-2">
            <StrengthTable title={teamA.shortName} strength={latestStrengths?.teamA} />
            <StrengthTable title={teamB.shortName} strength={latestStrengths?.teamB} />
          </div>
        </>
      )}
    </div>
  );
}
