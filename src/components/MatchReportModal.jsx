import { useState } from 'react';
import { Crest, PlayerAvatar, WeaponIcon } from './fm';
import TrendLine from './charts/TrendLine';
import ComparisonBars from './charts/ComparisonBars';
import DeltaChip from './charts/DeltaChip';
import MapVetoStrip from './MapVetoStrip';
import KillHeatmap from './KillHeatmap';
import { CHART } from './charts/palette';
import { comparisonRows, weaponForRound } from './charts/matchStats';

// Full post-match report shown as a pop-up when the user plays a match.
// Reuses the chart / veto / heatmap components so it matches the reference
// match-report look.
export default function MatchReportModal({ match, onClose, onViewTournament }) {
  const maps = match?.maps || [];
  const [mapIdx, setMapIdx] = useState(Math.max(0, maps.length - 1));
  if (!match || !maps.length) return null;

  const { teamA, teamB, winner } = match;
  const userWon = winner?.teamId === teamA.teamId; // orientation is A=left
  const mapsWonA = maps.filter((m) => m.winnerTeamId === teamA.teamId).length;
  const mapsWonB = maps.filter((m) => m.winnerTeamId === teamB.teamId).length;
  const mvp = match.matchMvp || match.topPerformer || (match.seriesPlayerTotals || match.playerStatistics || [])[0];
  const map = maps[mapIdx];
  const first = map.rounds?.[0];
  const last = map.rounds?.[map.rounds.length - 1];

  const mvpPills = mvp ? [
    ['Rating', mvp.averageRating ?? mvp.rating],
    ['ADR', mvp.ADR],
    ['Kills', mvp.totalKills ?? mvp.kills],
    ['Deaths', mvp.totalDeaths ?? mvp.deaths],
    ['Assists', mvp.totalAssists ?? mvp.assists],
    ['Opening', mvp.totalOpeningKills ?? mvp.openingKills],
    ['Clutches', mvp.totalClutches ?? mvp.clutches],
  ] : [];

  return (
    <div className="report-backdrop" onClick={onClose}>
      <div className="report-modal" onClick={(e) => e.stopPropagation()}>
        <button className="report-close" onClick={onClose} title="Close" aria-label="Close">×</button>

        <div className="report-scoreline">
          <div className="report-team">
            <Crest team={teamA} size={54} />
            <div className="report-team-name">{teamA.shortName || teamA.name}</div>
          </div>
          <div className="report-score">
            <span className={userWon ? 'score-win' : ''}>{mapsWonA}</span>
            <i>–</i>
            <span className={!userWon ? 'score-win' : ''}>{mapsWonB}</span>
            <div className="report-series">{winner ? `${winner.shortName || winner.name} win` : 'Series'} · {match.seriesScore}</div>
          </div>
          <div className="report-team">
            <Crest team={teamB} size={54} />
            <div className="report-team-name">{teamB.shortName || teamB.name}</div>
          </div>
        </div>

        {match.veto?.steps?.length > 0 && (
          <div className="report-section">
            <div className="report-h">Map Veto</div>
            <MapVetoStrip steps={match.veto.steps} teamA={teamA} teamB={teamB} />
          </div>
        )}

        <div className="report-grid">
          {mvp && (
            <div className="report-section report-mvp">
              <div className="report-h">Match MVP</div>
              <div className="mvp-card">
                <PlayerAvatar player={mvp} size={54} />
                <div className="mvp-name">{mvp.gamertag}</div>
                <div className="mvp-pills">
                  {mvpPills.map(([label, val]) => (
                    <span className="mvp-pill" key={label}><b>{val}</b>{label}</span>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div className="report-section">
            <div className="report-h">Match Stats · {teamA.shortName} vs {teamB.shortName}</div>
            <ComparisonBars rows={comparisonRows(maps)} teamAName={teamA.shortName} teamBName={teamB.shortName} />
          </div>
        </div>

        <div className="report-section">
          <div className="report-maptabs">
            {maps.map((m, i) => (
              <button key={m.mapKey || i} className={`report-maptab ${i === mapIdx ? 'active' : ''}`} onClick={() => setMapIdx(i)}>
                {m.mapName} <b>{m.scoreA}-{m.scoreB}</b>
              </button>
            ))}
          </div>

          <div className="grid-2">
            <div>
              <div className="chart-legend">
                <span><i style={{ background: CHART.teamA }} />{teamA.shortName}</span>
                <span><i style={{ background: CHART.teamB }} />{teamB.shortName}</span>
              </div>
              <div className="chart-note">Win Probability (%)</div>
              <TrendLine data={map.rounds} yDomain={[0, 100]} series={[
                { key: 'winProbA', name: teamA.shortName, color: CHART.teamA },
                { key: 'winProbB', name: teamB.shortName, color: CHART.teamB },
              ]} tooltipFormatter={(v) => `${v}%`} />
            </div>
            <div>
              <div className="chart-legend">
                <span><i style={{ background: CHART.teamA }} />{teamA.shortName}</span>
                <span><i style={{ background: CHART.teamB }} />{teamB.shortName}</span>
              </div>
              <div className="chart-note">Round Equipment Value ($)</div>
              <TrendLine data={map.rounds} yTickFormatter={(v) => `${Math.round(v / 1000)}k`} series={[
                { key: 'equipA', name: teamA.shortName, color: CHART.teamA },
                { key: 'equipB', name: teamB.shortName, color: CHART.teamB },
              ]} tooltipFormatter={(v) => `$${v.toLocaleString()}`} />
            </div>
          </div>

          <div className="chart-note">Round Win History</div>
          <div className="round-history">
            {map.rounds.map((round) => (
              <div className={`round-cell ${round.winner === 'A' ? 'win-a' : 'win-b'}`} key={round.round} title={`Round ${round.round}`}>
                <WeaponIcon name={weaponForRound(round)} size={14} />
              </div>
            ))}
          </div>

          {first && last && (
            <div style={{ maxWidth: 320, marginTop: 12 }}>
              <DeltaChip label={`${teamA.shortName} Win Probability Swing`} before={first.winProbA} after={last.winProbA} unit="%" />
            </div>
          )}

          <div className="chart-note" style={{ marginTop: 14 }}>Kill Heatmap</div>
          <KillHeatmap map={map} teamA={teamA} teamB={teamB} />
        </div>

        {match.playerStatistics?.length > 0 && (
          <div className="report-section">
            <div className="report-h">Player Statistics</div>
            <div className="stats-table-wrap">
              <table>
                <thead><tr><th>Player</th><th className="text-right">K</th><th className="text-right">A</th><th className="text-right">D</th><th className="text-right">+/-</th><th className="text-right">ADR</th><th className="text-right">KAST</th><th className="text-right">HS%</th><th className="text-right">Rating</th></tr></thead>
                <tbody>
                  {[...match.playerStatistics].sort((a, b) => a.teamId.localeCompare(b.teamId) || b.rating - a.rating).map((s) => (
                    <tr key={s.playerId} className={s.playerId === mvp?.playerId ? 'your-team-row' : ''}>
                      <td>{s.gamertag}</td>
                      <td className="text-right">{s.kills}</td>
                      <td className="text-right">{s.assists}</td>
                      <td className="text-right">{s.deaths}</td>
                      <td className="text-right">{s.kdDiff}</td>
                      <td className="text-right">{s.ADR}</td>
                      <td className="text-right">{s.KAST}%</td>
                      <td className="text-right">{s.headshotPercentage}%</td>
                      <td className="text-right"><b>{typeof s.rating === 'number' ? s.rating.toFixed(2) : s.rating}</b></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="report-actions">
          {onViewTournament && <button className="ghost-button" onClick={onViewTournament}>View Tournament</button>}
          <button onClick={onClose}>Continue</button>
        </div>
      </div>
    </div>
  );
}
