import { createSwissTournament, simulateNextSwissRound } from './swissEngine.js';
import { createPlayoffBracket, simulateNextPlayoffRound } from './bracketEngine.js';

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
  return { name: 'Tournament simulation diagnostic', valid: unique && tournament.swiss.qualified.length === 8 && Boolean(tournament.champion), errors: unique ? [] : ['Duplicate teams found in generated tournament'], champion: tournament.champion };
}
