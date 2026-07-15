import { useMemo, useState } from 'react';
import { simulateMatch } from '../utils/matchEngine.js';
import TrendLine from '../components/charts/TrendLine';
import ComparisonBars from '../components/charts/ComparisonBars';
import DeltaChip from '../components/charts/DeltaChip';
import { CHART } from '../components/charts/palette';
import { MapThumb, WeaponIcon } from '../components/fm';

// Pick a round-history weapon icon from the winning side's economy that round.
function weaponForRound(round) {
  const equip = round.winner === 'A' ? round.equipA : round.equipB;
  if (equip < 6000) return round.winner === 'A' ? 'usp' : 'glock';
  if (equip < 14000) return 'smg';
  return round.winner === 'A' ? 'm4' : 'ak';
}

// Sum a per-player stat across every map for one side of the series.
function sumStat(maps, side, key) {
  return maps.reduce((total, map) => total + (map[side] || []).reduce((s, p) => s + (p[key] || 0), 0), 0);
}
function avgStat(maps, side, key) {
  let sum = 0;
  let count = 0;
  maps.forEach((map) => (map[side] || []).forEach((p) => { sum += p[key] || 0; count += 1; }));
  return count ? Math.round(sum / count) : 0;
}

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

  const cmpRows = result?.ok ? [
    { label: 'Kills', a: sumStat(result.maps, 'teamAStats', 'kills'), b: sumStat(result.maps, 'teamBStats', 'kills') },
    { label: 'Assists', a: sumStat(result.maps, 'teamAStats', 'assists'), b: sumStat(result.maps, 'teamBStats', 'assists') },
    { label: 'Deaths', a: sumStat(result.maps, 'teamAStats', 'deaths'), b: sumStat(result.maps, 'teamBStats', 'deaths') },
    { label: 'Clutches', a: sumStat(result.maps, 'teamAStats', 'clutches'), b: sumStat(result.maps, 'teamBStats', 'clutches') },
    { label: 'Opening Kills', a: sumStat(result.maps, 'teamAStats', 'openingKills'), b: sumStat(result.maps, 'teamBStats', 'openingKills') },
    { label: 'ADR', a: avgStat(result.maps, 'teamAStats', 'ADR'), b: avgStat(result.maps, 'teamBStats', 'ADR') },
  ] : [];

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

          <div className="panel">
            <div className="panel-header"><h2>Maps</h2></div>
            <div className="panel-body">
              <div className="mapthumb-strip">
                {result.maps.map((map) => (
                  <div className="mapthumb-item" key={`${map.mapKey}-thumb`}>
                    <MapThumb mapKey={map.mapKey} mapName={map.mapName} width={132} height={78} />
                    <div className="mapthumb-score">
                      <span style={{ color: CHART.teamA }}>{map.scoreA}</span>
                      <i>–</i>
                      <span style={{ color: CHART.teamB }}>{map.scoreB}</span>
                    </div>
                    <div className="muted" style={{ textAlign: 'center' }}>{map.winnerName}</div>
                  </div>
                ))}
              </div>
            </div>
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

          <div className="panel">
            <div className="panel-header"><h2>Match Stats · {teamA.shortName} vs {teamB.shortName}</h2></div>
            <div className="panel-body">
              <ComparisonBars rows={cmpRows} teamAName={teamA.shortName} teamBName={teamB.shortName} />
            </div>
          </div>

          {result.maps.map((map) => {
            const first = map.rounds[0];
            const last = map.rounds[map.rounds.length - 1];
            return (
              <div className="panel" key={`${map.mapKey}-charts`}>
                <div className="panel-header"><h2>{map.mapName} · Round-by-Round</h2><span className="muted">{map.scoreA}-{map.scoreB}</span></div>
                <div className="panel-body">
                  <div className="grid-2">
                    <div>
                      <div className="chart-legend">
                        <span><i style={{ background: CHART.teamA }} />{teamA.shortName}</span>
                        <span><i style={{ background: CHART.teamB }} />{teamB.shortName}</span>
                      </div>
                      <div className="chart-note">Win Probability (%)</div>
                      <TrendLine
                        data={map.rounds}
                        yDomain={[0, 100]}
                        series={[
                          { key: 'winProbA', name: teamA.shortName, color: CHART.teamA },
                          { key: 'winProbB', name: teamB.shortName, color: CHART.teamB },
                        ]}
                        tooltipFormatter={(v) => `${v}%`}
                      />
                    </div>
                    <div>
                      <div className="chart-legend">
                        <span><i style={{ background: CHART.teamA }} />{teamA.shortName}</span>
                        <span><i style={{ background: CHART.teamB }} />{teamB.shortName}</span>
                      </div>
                      <div className="chart-note">Round Equipment Value ($)</div>
                      <TrendLine
                        data={map.rounds}
                        yTickFormatter={(v) => `${Math.round(v / 1000)}k`}
                        series={[
                          { key: 'equipA', name: teamA.shortName, color: CHART.teamA },
                          { key: 'equipB', name: teamB.shortName, color: CHART.teamB },
                        ]}
                        tooltipFormatter={(v) => `$${v.toLocaleString()}`}
                      />
                    </div>
                  </div>
                  <div className="chart-note">Round Win History</div>
                  <div className="round-history">
                    {map.rounds.map((round) => (
                      <div className={`round-cell ${round.winner === 'A' ? 'win-a' : 'win-b'}`} key={round.round} title={`Round ${round.round}: ${round.winner === 'A' ? teamA.shortName : teamB.shortName}`}>
                        <WeaponIcon name={weaponForRound(round)} size={14} />
                      </div>
                    ))}
                  </div>
                  {first && last && (
                    <div style={{ maxWidth: 320, marginTop: 12 }}>
                      <DeltaChip label={`${teamA.shortName} Win Probability Swing`} before={first.winProbA} after={last.winProbA} unit="%" />
                    </div>
                  )}
                </div>
              </div>
            );
          })}

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
