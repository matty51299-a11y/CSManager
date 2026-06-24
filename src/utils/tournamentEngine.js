import { createSwissTournament, simulateNextSwissRound } from './swissEngine.js';
import { createPlayoffBracket, simulateNextPlayoffRound } from './bracketEngine.js';
import { getNextSwissPairings } from './swissEngine.js';
import { simulateMatch } from './matchEngine.js';
import { summarizeMatch, sortStandings } from './tournamentStandings.js';

export function createTournament({ event, teams = [] }) {
  const uniqueTeams = [...new Map(teams.map((team) => [team.teamId, team])).values()]
    .sort((a, b) => Number(a.ranking || 999) - Number(b.ranking || 999))
    .slice(0, 16);
  return { event, teams: uniqueTeams, swiss: createSwissTournament(uniqueTeams), playoffs: null, champion: null, history: null };
}

export function generatePlayoffs(tournament) {
  if (!tournament?.swiss?.complete) return tournament;
  return { ...tournament, playoffs: createPlayoffBracket(tournament.swiss.qualified) };
}

export function simulateSwissRound(tournament, data) {
  return { ...tournament, swiss: simulateNextSwissRound(tournament.swiss, data) };
}

export function simulatePlayoffRound(tournament, data) {
  const playoffs = simulateNextPlayoffRound(tournament.playoffs, data);
  return { ...tournament, playoffs, champion: playoffs.champion };
}

export function runTournamentDiagnostics({ events = [], teams = [], players = [], teamMapRatings = [] }) {
  let tournament = createTournament({ event: events[0], teams });
  const unique = new Set(tournament.teams.map((team) => team.teamId)).size === 16;
  let guard = 0;
  while (!tournament.swiss.complete && guard < 8) { tournament = simulateSwissRound(tournament, { players, teamMapRatings }); guard += 1; }
  tournament = generatePlayoffs(tournament);
  while (!tournament.champion && guard < 12) { tournament = simulatePlayoffRound(tournament, { players, teamMapRatings }); guard += 1; }
  const allMatches = [...tournament.swiss.rounds.flatMap((r) => r.matches), ...(tournament.playoffs?.rounds || []).flatMap((r) => r.matches.map((m) => m.result).filter(Boolean))];
  const noSelfPlay = allMatches.every((m) => m.teamA.teamId !== m.teamB.teamId);
  const errors = [];
  if (!unique) errors.push('Duplicate teams found in generated tournament');
  if (!noSelfPlay) errors.push('A team was paired against itself');
  if (tournament.swiss.qualified.length !== 8) errors.push(`Swiss qualified ${tournament.swiss.qualified.length} teams instead of 8`);
  if (!tournament.champion) errors.push('Playoffs did not produce exactly one champion');
  return { name: 'Tournament simulation diagnostic', valid: unique && noSelfPlay && tournament.swiss.qualified.length === 8 && Boolean(tournament.champion), errors, champion: tournament.champion };
}

function cloneSwiss(swiss) {
  return { ...swiss, standings: swiss.standings.map((r) => ({ ...r, opponents: [...r.opponents] })), rounds: swiss.rounds.map((r) => ({ ...r, matches: [...r.matches] })), qualified: [...swiss.qualified], eliminated: [...swiss.eliminated] };
}
function applySwissResult(swiss, result) {
  const standings = swiss.standings;
  const byId = new Map(standings.map((row) => [row.teamId, row]));
  const rowA = byId.get(result.teamA.teamId); const rowB = byId.get(result.teamB.teamId);
  rowA.opponents.push(rowB.teamId); rowB.opponents.push(rowA.teamId);
  rowA.mapsWon += result.mapsWonA; rowA.mapsLost += result.mapsWonB; rowA.roundsWon += result.roundsA; rowA.roundsLost += result.roundsB;
  rowB.mapsWon += result.mapsWonB; rowB.mapsLost += result.mapsWonA; rowB.roundsWon += result.roundsB; rowB.roundsLost += result.roundsA;
  if (result.winner.teamId === rowA.teamId) { rowA.wins += 1; rowB.losses += 1; } else { rowB.wins += 1; rowA.losses += 1; }
  [rowA,rowB].forEach((row) => { if (row.wins >= 3) row.status = 'qualified'; if (row.losses >= 3) row.status = 'eliminated'; });
}
function resultFor(teamA, teamB, data) {
  return summarizeMatch(simulateMatch({ teamA, teamB, players:data.players, teamMapRatings:data.teamMapRatings, bestOf:3 }));
}

export function simulateSwissMatch(tournament, teamAId, teamBId, data) {
  if (!tournament?.swiss || tournament.swiss.complete) return tournament;
  const swiss = cloneSwiss(tournament.swiss);
  let round = swiss.rounds.find((r) => !r.complete);
  if (!round) {
    round = { number: swiss.rounds.length + 1, matches: [], pendingPairings: getNextSwissPairings(swiss) };
    swiss.rounds = [...swiss.rounds, round];
  }
  const pair = round.pendingPairings.find(([a,b]) => [a.teamId,b.teamId].includes(teamAId) && [a.teamId,b.teamId].includes(teamBId));
  if (!pair) return tournament;
  const key = [teamAId, teamBId].sort().join('-');
  if (round.matches.some((m) => [m.teamA.teamId, m.teamB.teamId].sort().join('-') === key)) return tournament;
  const result = resultFor(pair[0].team, pair[1].team, data);
  applySwissResult(swiss, result);
  round.matches = [...round.matches, result];
  round.complete = round.matches.length >= round.pendingPairings.length;
  swiss.qualified = sortStandings(swiss.standings.filter((r) => r.status === 'qualified')).slice(0, 8);
  swiss.eliminated = sortStandings(swiss.standings.filter((r) => r.status === 'eliminated'));
  if (round.complete && swiss.qualified.length >= 8) swiss.complete = true;
  return { ...tournament, swiss };
}

export function simulatePlayoffMatch(tournament, roundIndex, matchIndex, data) {
  if (!tournament?.playoffs || tournament.champion) return tournament;
  const playoffs = { ...tournament.playoffs, rounds: tournament.playoffs.rounds.map((r) => ({ ...r, matches: r.matches.map((m) => ({ ...m })) })) };
  const match = playoffs.rounds[roundIndex]?.matches[matchIndex];
  if (!match || match.result || !match.teamA || !match.teamB) return tournament;
  const result = resultFor(match.teamA, match.teamB, data);
  Object.assign(match, { result, winner: result.winner });
  const round = playoffs.rounds[roundIndex];
  round.complete = round.matches.every((m) => m.result);
  if (round.complete) {
    const winners = round.matches.map((m) => m.winner).filter(Boolean);
    if (roundIndex === 0) playoffs.rounds[1].matches = [{ teamA:winners[0], teamB:winners[1] }, { teamA:winners[2], teamB:winners[3] }];
    if (roundIndex === 1) playoffs.rounds[2].matches = [{ teamA:winners[0], teamB:winners[1] }];
    if (roundIndex === 2) { playoffs.champion = match.winner; playoffs.runnerUp = match.teamA.teamId === match.winner.teamId ? match.teamB : match.teamA; }
  }
  return { ...tournament, playoffs, champion: playoffs.champion || null };
}

export function generateEventSummary(tournament, userTeamId) {
  const allMatches = [...tournament.swiss.rounds.flatMap((r) => r.matches), ...(tournament.playoffs?.rounds || []).flatMap((r) => r.matches.map((m) => m.result).filter(Boolean))];
  const userResults = allMatches.filter((m) => m.teamA.teamId === userTeamId || m.teamB.teamId === userTeamId);
  const biggestUpset = allMatches.filter((m) => m.upset).sort((a,b) => Math.abs((b.teamA.ranking||0)-(b.teamB.ranking||0))-Math.abs((a.teamA.ranking||0)-(a.teamB.ranking||0)))[0] || null;
  return { eventId:tournament.event.eventId, eventName:tournament.event.name, champion:tournament.champion, runnerUp:tournament.playoffs?.runnerUp, semiFinalists:tournament.playoffs?.rounds?.[1]?.matches.flatMap((m)=>[m.teamA,m.teamB]).filter(Boolean) || [], userRecord:userResults.reduce((r,m)=>({ wins:r.wins + (m.winner.teamId===userTeamId?1:0), losses:r.losses + (m.winner.teamId!==userTeamId?1:0)}), {wins:0,losses:0}), userResults, biggestUpset, mvp:allMatches[0]?.topPerformer || null, prizeMoneyEarned:tournament.champion?.teamId===userTeamId ? Math.round((tournament.event.prizePool||0)*0.4) : 0, reputationChange:tournament.champion?.teamId===userTeamId ? 5 : 0, rankingMovement:'placeholder' };
}

export function buildEventStats(tournament) {
  const matches = [
    ...(tournament?.swiss?.rounds || []).flatMap((round) => round.matches || []),
    ...(tournament?.playoffs?.rounds || []).flatMap((round) => (round.matches || []).map((m) => m.result).filter(Boolean)),
  ];
  const playerStats = new Map();
  const teamStats = new Map();
  matches.forEach((match) => {
    const winnerTeamId = match.winner?.teamId;
    [match.teamA, match.teamB].forEach((team) => {
      if (!team) return;
      const row = teamStats.get(team.teamId) || { team, wins: 0, losses: 0, mapsWon: 0, mapsLost: 0 };
      if (winnerTeamId === team.teamId) row.wins += 1; else row.losses += 1;
      row.mapsWon += team.teamId === match.teamA.teamId ? match.mapsWonA : match.mapsWonB;
      row.mapsLost += team.teamId === match.teamA.teamId ? match.mapsWonB : match.mapsWonA;
      teamStats.set(team.teamId, row);
    });
    (match.maps || []).forEach((map) => [...(map.teamAStats || []), ...(map.teamBStats || [])].forEach((stat) => {
      const row = playerStats.get(stat.playerId) || { playerId: stat.playerId, gamertag: stat.gamertag, teamId: stat.teamId, mapsPlayed: 0, kills: 0, deaths: 0, assists: 0, ratingSum: 0, adrSum: 0, clutches: 0, openingKills: 0 };
      row.mapsPlayed += 1; row.kills += stat.kills || 0; row.deaths += stat.deaths || 0; row.assists += stat.assists || 0; row.ratingSum += stat.rating || 0; row.adrSum += stat.ADR || 0; row.clutches += stat.clutches || 0; row.openingKills += stat.openingKills || 0;
      row.averageRating = Math.round((row.ratingSum / row.mapsPlayed) * 100) / 100;
      row.ADR = Math.round(row.adrSum / row.mapsPlayed);
      playerStats.set(stat.playerId, row);
    }));
  });
  const players = [...playerStats.values()];
  const byRating = [...players].sort((a,b)=>b.averageRating-a.averageRating || b.kills-a.kills);
  const byKills = [...players].sort((a,b)=>b.kills-a.kills);
  const byClutches = [...players].sort((a,b)=>b.clutches-a.clutches);
  return { players, teams: [...teamStats.values()], highestRated: byRating[0], topFragger: byKills[0], mostClutches: byClutches[0] };
}
