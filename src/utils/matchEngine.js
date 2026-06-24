import { createMapVeto } from './mapVetoEngine.js';
import { calculateTeamStrength } from './teamStrength.js';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function seededNoise(seed) {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) % 9973;
  return (hash % 1000) / 1000;
}

function scoreline(strengthA, strengthB, seed) {
  const diff = strengthA - strengthB + (seededNoise(seed) - 0.5) * 8;
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
      kills,
      deaths,
      rating: Math.round(clamp(0.65 + kills / Math.max(1, deaths) * 0.35 + (won ? 0.08 : 0), 0.65, 1.75) * 100) / 100,
      openingKills: clamp(Math.round(Number(player.entry || 70) / 22 + seededNoise(`${seed}-op-${player.playerId}`) * 3), 0, 8),
      clutches: clamp(Math.round((Number(player.clutch || 70) - 60) / 22 + seededNoise(`${seed}-cl-${player.playerId}`) * 2), 0, 5),
    };
  });
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
    const score = scoreline(strengthA.total, strengthB.total, `${teamA.teamId}-${teamB.teamId}-${map.key}-${maps.length}`);
    const winner = score.winner === 'A' ? teamA : teamB;
    if (score.winner === 'A') winsA += 1; else winsB += 1;
    const teamAStats = makePlayerStats(strengthA.players, score.winner === 'A', strengthA.total, strengthB.total, `${map.key}-a`);
    const teamBStats = makePlayerStats(strengthB.players, score.winner === 'B', strengthB.total, strengthA.total, `${map.key}-b`);
    maps.push({
      mapKey: map.key,
      mapName: map.name,
      winnerTeamId: winner.teamId,
      winnerName: winner.shortName || winner.name,
      scoreA: score.winner === 'A' ? score.winnerRounds : score.loserRounds,
      scoreB: score.winner === 'B' ? score.winnerRounds : score.loserRounds,
      teamAStats,
      teamBStats,
      performers: selectPerformers([...teamAStats, ...teamBStats]),
      strengths: { teamA: strengthA, teamB: strengthB },
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
