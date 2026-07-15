import { createMapVeto } from './mapVetoEngine.js';
import { calculateTeamStrength } from './teamStrength.js';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function seededNoise(seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) % 9973;
  return clamp(((hash % 1000) / 1000) * 0.65 + Math.random() * 0.35, 0, 1);
}

function scoreline(strengthA, strengthB, seed) {
  const stageChaos = seed.includes('bo1') ? 14 : seed.includes('bo5') ? 6 : 10;
  const diff = strengthA - strengthB + (seededNoise(seed) - 0.5) * stageChaos;
  const winner = diff >= 0 ? 'A' : 'B';
  const gap = Math.abs(diff);
  const overtimeChance = seededNoise(`${seed}-ot`);
  if (gap < 2.5 && overtimeChance > 0.58) return { winner, winnerRounds: overtimeChance > 0.88 ? 19 : 16, loserRounds: overtimeChance > 0.88 ? 17 : 14 };
  const loserRounds = clamp(Math.round(12 - gap / 1.6 + seededNoise(`${seed}-rounds`) * 3), gap > 18 ? 1 : 5, 11);
  return { winner, winnerRounds: 13, loserRounds };
}

function makePlayerStats(players, won, teamStrength, opponentStrength, seed) {
  return players.map((player, index) => {
    const personal = Number(player.overall || 70) + Number(player.aim || 70) * 0.12 + Number(player.consistency || 70) * 0.08;
    const noise = (seededNoise(`${seed}-${player.playerId}-${index}`) - 0.5) * 10;
    const impact = personal + noise + (teamStrength - opponentStrength) * 0.35 + (won ? 3 : -2);
    const kills = clamp(Math.round(impact / 4.2), 8, 32);
    const deaths = clamp(Math.round(22 - (impact - 75) / 5 + (won ? -2 : 2)), 9, 28);
    return {
      playerId: player.playerId,
      gamertag: player.gamertag,
      teamId: player.teamId,
      kills,
      deaths,
      assists: clamp(Math.round(kills * 0.28 + seededNoise(`${seed}-as-${player.playerId}`) * 5), 1, 12),
      ADR: Math.round(clamp(42 + kills * 2.7 + seededNoise(`${seed}-adr-${player.playerId}`) * 18, 45, 115)),
      rating: Math.round(clamp(0.65 + kills / Math.max(1, deaths) * 0.35 + (won ? 0.08 : 0), 0.65, 1.75) * 100) / 100,
      openingKills: clamp(Math.round(Number(player.entry || 70) / 22 + seededNoise(`${seed}-op-${player.playerId}`) * 3), 0, 8),
      clutches: clamp(Math.round((Number(player.clutch || 70) - 60) / 22 + seededNoise(`${seed}-cl-${player.playerId}`) * 2), 0, 5),
      headshotPercentage: Math.round(clamp(36 + Number(player.aim || 70) / 3.5 + seededNoise(`${seed}-hs-${player.playerId}`) * 16, 35, 75)),
    };
  });
}

// Per-round timeline for a completed map. Purely derived from the final
// score + team strengths — it does not affect the result — and feeds the
// Win Probability and Round Equipment Value charts. `winProbA` is team A's
// live win chance after each round; equipment values approximate the
// standard CS economy (full buy / force / eco) from win-loss streaks.
function economyValue(lossStreak, roundsWon) {
  if (lossStreak >= 2) return 3500 + Math.min(roundsWon, 6) * 350;   // rebuilding / eco
  if (lossStreak === 1) return 12500;                                 // force / half buy
  return 22000 + (roundsWon % 3) * 1200;                              // full buy
}

function buildRoundTimeline(scoreA, scoreB, strengthA, strengthB, seed) {
  const total = scoreA + scoreB;
  const seq = [];
  let a = 0;
  let b = 0;
  for (let i = 0; i < total; i += 1) {
    const remainA = scoreA - a;
    const remainB = scoreB - b;
    let side;
    if (remainA <= 0) side = 'B';
    else if (remainB <= 0) side = 'A';
    else {
      const pull = (strengthA - strengthB) / 20 + (seededNoise(`${seed}-rt-${i}`) - 0.5);
      side = pull >= 0 ? 'A' : 'B';
    }
    if (side === 'A') a += 1; else b += 1;
    seq.push(side);
  }

  let cumA = 0;
  let cumB = 0;
  let lossStreakA = 0;
  let lossStreakB = 0;
  const rounds = [];
  for (let i = 0; i < seq.length; i += 1) {
    const equipA = economyValue(lossStreakA, cumA);
    const equipB = economyValue(lossStreakB, cumB);
    if (seq[i] === 'A') { cumA += 1; lossStreakA = 0; lossStreakB += 1; }
    else { cumB += 1; lossStreakB = 0; lossStreakA += 1; }
    const diff = cumA - cumB;
    const winProbA = clamp(Math.round(50 + diff * 6 + (strengthA - strengthB) * 1.1), 4, 96);
    rounds.push({
      round: i + 1,
      winner: seq[i],
      scoreA: cumA,
      scoreB: cumB,
      winProbA,
      winProbB: 100 - winProbA,
      equipA,
      equipB,
    });
  }
  return rounds;
}

function selectPerformers(allStats) {
  const sortedKills = [...allStats].sort((a, b) => b.kills - a.kills);
  const sortedRating = [...allStats].sort((a, b) => b.rating - a.rating);
  const sortedClutch = [...allStats].sort((a, b) => b.clutches - a.clutches || b.rating - a.rating);
  const sortedUnder = [...allStats].sort((a, b) => a.rating - b.rating || a.kills - b.kills);
  return { topFragger: sortedKills[0], highestRated: sortedRating[0], clutchPlayer: sortedClutch[0], underperformer: sortedUnder[0] };
}

export function simulateMatch({ teamA, teamB, players = [], teamMapRatings = [], bestOf = 1 }) {
  const safeBestOf = [1, 3, 5].includes(Number(bestOf)) ? Number(bestOf) : 1;
  if (!teamA || !teamB || teamA.teamId === teamB.teamId) {
    return { ok: false, error: 'Choose two different teams before simulating.' };
  }

  const veto = createMapVeto(teamA, teamB, safeBestOf, teamMapRatings);
  const mapsToWin = Math.ceil(safeBestOf / 2);
  let winsA = 0;
  let winsB = 0;
  const maps = [];

  for (const map of veto.maps) {
    if (winsA === mapsToWin || winsB === mapsToWin) break;
    const strengthA = calculateTeamStrength(teamA, players, teamMapRatings, map.key);
    const strengthB = calculateTeamStrength(teamB, players, teamMapRatings, map.key);
    const score = scoreline(strengthA.total, strengthB.total, `${teamA.teamId}-${teamB.teamId}-${map.key}-${maps.length}-bo${safeBestOf}-${Date.now()}`);
    const winner = score.winner === 'A' ? teamA : teamB;
    if (score.winner === 'A') winsA += 1; else winsB += 1;
    const teamAStats = makePlayerStats(strengthA.players, score.winner === 'A', strengthA.total, strengthB.total, `${map.key}-a`);
    const teamBStats = makePlayerStats(strengthB.players, score.winner === 'B', strengthB.total, strengthA.total, `${map.key}-b`);
    maps.push({
      mapKey: map.key,
      mapName: map.name,
      winner,
      loser: winner.teamId === teamA.teamId ? teamB : teamA,
      winnerTeamId: winner.teamId,
      winnerName: winner.shortName || winner.name,
      score: `${score.winner === 'A' ? score.winnerRounds : score.loserRounds}-${score.winner === 'B' ? score.winnerRounds : score.loserRounds}`,
      teamARounds: score.winner === 'A' ? score.winnerRounds : score.loserRounds,
      teamBRounds: score.winner === 'B' ? score.winnerRounds : score.loserRounds,
      scoreA: score.winner === 'A' ? score.winnerRounds : score.loserRounds,
      scoreB: score.winner === 'B' ? score.winnerRounds : score.loserRounds,
      halfScore: `${Math.floor((score.winner === 'A' ? score.winnerRounds : score.loserRounds) / 2)}-${Math.floor((score.winner === 'B' ? score.winnerRounds : score.loserRounds) / 2)}`,
      overtime: score.winnerRounds > 13,
      teamAStats,
      teamBStats,
      performers: selectPerformers([...teamAStats, ...teamBStats]),
      strengths: { teamA: strengthA, teamB: strengthB },
      rounds: buildRoundTimeline(
        score.winner === 'A' ? score.winnerRounds : score.loserRounds,
        score.winner === 'B' ? score.winnerRounds : score.loserRounds,
        strengthA.total,
        strengthB.total,
        `${teamA.teamId}-${teamB.teamId}-${map.key}-${maps.length}`,
      ),
    });
  }

  return {
    ok: true,
    bestOf: safeBestOf,
    teamA,
    teamB,
    veto,
    maps,
    seriesScore: `${winsA}-${winsB}`,
    winner: winsA > winsB ? teamA : teamB,
  };
}
