import { simulateMatch } from './matchEngine.js';
import { makeInitialStandings, sortStandings, summarizeMatch } from './tournamentStandings.js';

export function createSwissTournament(teams = []) {
  const seededTeams = [...teams].sort((a, b) => Number(a.ranking || 999) - Number(b.ranking || 999)).slice(0, 16);
  return {
    standings: makeInitialStandings(seededTeams),
    rounds: [],
    qualified: [],
    eliminated: [],
    complete: false,
  };
}

function roundOnePairings(active) {
  const sorted = [...active].sort((a, b) => a.seed - b.seed);
  const half = sorted.length / 2;
  return sorted.slice(0, half).map((team, index) => [team, sorted[sorted.length - 1 - index]]);
}

function recordPairings(active) {
  const pool = [...active].sort((a, b) => b.wins - a.wins || a.losses - b.losses || a.seed - b.seed);
  const pairs = [];
  while (pool.length > 1) {
    const first = pool.shift();
    let index = pool.findIndex((team) => team.wins === first.wins && !first.opponents.includes(team.teamId));
    if (index < 0) index = pool.findIndex((team) => !first.opponents.includes(team.teamId));
    if (index < 0) index = 0;
    pairs.push([first, pool.splice(index, 1)[0]]);
  }
  return pairs;
}

export function getNextSwissPairings(state) {
  const active = state.standings.filter((row) => row.status === 'active');
  if (state.rounds.length === 0) return roundOnePairings(active);
  return recordPairings(active);
}

export function simulateNextSwissRound(state, { players = [], teamMapRatings = [] } = {}) {
  if (!state || state.complete) return state;
  const pairings = getNextSwissPairings(state);
  const standings = state.standings.map((row) => ({ ...row, opponents: [...row.opponents] }));
  const byId = new Map(standings.map((row) => [row.teamId, row]));
  const matches = pairings.map(([a, b]) => {
    const result = summarizeMatch(simulateMatch({ teamA: a.team, teamB: b.team, players, teamMapRatings, bestOf: 3 }));
    if (!result) return null;
    const rowA = byId.get(a.teamId);
    const rowB = byId.get(b.teamId);
    rowA.opponents.push(b.teamId);
    rowB.opponents.push(a.teamId);
    rowA.mapsWon += result.mapsWonA; rowA.mapsLost += result.mapsWonB; rowA.roundsWon += result.roundsA; rowA.roundsLost += result.roundsB;
    rowB.mapsWon += result.mapsWonB; rowB.mapsLost += result.mapsWonA; rowB.roundsWon += result.roundsB; rowB.roundsLost += result.roundsA;
    if (result.winner.teamId === rowA.teamId) { rowA.wins += 1; rowB.losses += 1; } else { rowB.wins += 1; rowA.losses += 1; }
    [rowA, rowB].forEach((row) => {
      if (row.wins >= 3) row.status = 'qualified';
      if (row.losses >= 3) row.status = 'eliminated';
    });
    return result;
  }).filter(Boolean);
  const qualified = sortStandings(standings.filter((row) => row.status === 'qualified')).slice(0, 8);
  return {
    ...state,
    standings,
    rounds: [...state.rounds, { number: state.rounds.length + 1, matches }],
    qualified,
    eliminated: sortStandings(standings.filter((row) => row.status === 'eliminated')),
    complete: qualified.length >= 8,
  };
}
