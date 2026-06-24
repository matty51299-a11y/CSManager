import { simulateMatch } from './matchEngine.js';
import { summarizeMatch } from './tournamentStandings.js';

export function createPlayoffBracket(qualified = []) {
  const seeds = [...qualified].sort((a, b) => b.wins - a.wins || a.losses - b.losses || a.seed - b.seed).slice(0, 8);
  const pair = (a, b) => ({ teamA: seeds[a]?.team, teamB: seeds[b]?.team, winner: null, result: null });
  return { rounds: [
    { name: 'Quarter-finals', complete: false, matches: [pair(0, 7), pair(3, 4), pair(1, 6), pair(2, 5)] },
    { name: 'Semi-finals', complete: false, matches: [] },
    { name: 'Grand Final', complete: false, matches: [] },
  ], champion: null, runnerUp: null };
}

export function simulateNextPlayoffRound(bracket, { players = [], teamMapRatings = [] } = {}) {
  const nextIndex = bracket.rounds.findIndex((round) => !round.complete && round.matches.length > 0);
  if (nextIndex < 0) return bracket;
  const rounds = bracket.rounds.map((round) => ({ ...round, matches: round.matches.map((match) => ({ ...match })) }));
  const round = rounds[nextIndex];
  round.matches = round.matches.map((match) => {
    const result = summarizeMatch(simulateMatch({ teamA: match.teamA, teamB: match.teamB, players, teamMapRatings, bestOf: 3 }));
    return { ...match, result, winner: result?.winner || null };
  });
  round.complete = true;
  const winners = round.matches.map((match) => match.winner).filter(Boolean);
  if (nextIndex === 0) rounds[1].matches = [{ teamA: winners[0], teamB: winners[1] }, { teamA: winners[2], teamB: winners[3] }];
  if (nextIndex === 1) rounds[2].matches = [{ teamA: winners[0], teamB: winners[1] }];
  const finalMatch = nextIndex === 2 ? round.matches[0] : null;
  return { ...bracket, rounds, champion: finalMatch?.winner || null, runnerUp: finalMatch ? (finalMatch.teamA.teamId === finalMatch.winner.teamId ? finalMatch.teamB : finalMatch.teamA) : null };
}
