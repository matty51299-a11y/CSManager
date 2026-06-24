import { getNextSwissPairings } from '../../utils/swissEngine';
import { sortStandings } from '../../utils/tournamentStandings';
import { ACTIVE_MAP_POOL, calculateTeamStrength } from '../../utils/teamStrength';

export function getOverlayModel(tournament, gameState) {
  const userTeamId = gameState.selectedTeamId;
  const userTeam = gameState.teams.find((team) => team.teamId === userTeamId);
  const activeRound = tournament.swiss?.rounds.find((round) => !round.complete);
  const completedKeys = new Set((activeRound?.matches || []).map((m) => [m.teamA.teamId, m.teamB.teamId].sort().join('-')));
  const basePairings = activeRound?.pendingPairings || (!tournament.swiss?.complete ? getNextSwissPairings(tournament.swiss) : []);
  const pairings = basePairings.filter(([a, b]) => a && b && !completedKeys.has([a.teamId, b.teamId].sort().join('-')));
  const userStanding = tournament.swiss?.standings.find((standing) => standing.teamId === userTeamId);
  const pendingUser = pairings.find(([a, b]) => [a.teamId, b.teamId].includes(userTeamId));
  const nextOpponent = pendingUser ? (pendingUser[0].teamId === userTeamId ? pendingUser[1].team : pendingUser[0].team) : null;
  const playoffPendingUser = tournament.playoffs?.rounds.flatMap((round, roundIndex) => round.matches.map((match, matchIndex) => ({ ...match, roundName: round.name, roundIndex, matchIndex }))).find((match) => !match.result && [match.teamA?.teamId, match.teamB?.teamId].includes(userTeamId));
  const allMatches = [
    ...(tournament.swiss?.rounds || []).flatMap((round) => round.matches || []),
    ...(tournament.playoffs?.rounds || []).flatMap((round) => round.matches.map((match) => match.result).filter(Boolean)),
  ];
  const latestUserMatch = [...allMatches].reverse().find((match) => [match.teamA.teamId, match.teamB.teamId].includes(userTeamId));
  const status = tournament.champion ? 'Finished' : tournament.playoffs ? (userStanding?.status === 'qualified' ? 'Alive' : 'Eliminated') : userStanding?.status === 'eliminated' ? 'Eliminated' : userStanding?.status === 'qualified' ? 'Qualified' : 'Alive';
  const playoffOpponent = playoffPendingUser ? (playoffPendingUser.teamA?.teamId === userTeamId ? playoffPendingUser.teamB : playoffPendingUser.teamA) : null;
  return { userTeamId, userTeam, activeRound, pairings, pendingUser, playoffPendingUser, nextOpponent: nextOpponent || playoffOpponent, userStanding, allMatches, latestUserMatch, status, standings: sortStandings(tournament.swiss?.standings || []) };
}

export function teamSeed(team, tournament) {
  return tournament.teams.findIndex((entry) => entry.teamId === team?.teamId) + 1 || Number(team?.ranking || 99);
}

export function bestFinish(tournament, status) {
  if (tournament.champion) return tournament.champion.shortName ? `${tournament.champion.shortName} champion` : 'Event complete';
  if (status === 'Eliminated') return 'Placement locked';
  return 'Champion possible';
}

export function mapPreview(teamA, teamB, gameState) {
  if (!teamA || !teamB) return null;
  const strengths = ACTIVE_MAP_POOL.map((map) => {
    const a = calculateTeamStrength(teamA, gameState.players, gameState.teamMapRatings, map.key);
    const b = calculateTeamStrength(teamB, gameState.players, gameState.teamMapRatings, map.key);
    return { map, a: a.breakdown.mapRating, b: b.breakdown.mapRating, edge: a.breakdown.mapRating - b.breakdown.mapRating };
  }).sort((x, y) => Math.abs(y.edge) - Math.abs(x.edge));
  return {
    teamA: calculateTeamStrength(teamA, gameState.players, gameState.teamMapRatings, strengths[0]?.map.key || 'ancient'),
    teamB: calculateTeamStrength(teamB, gameState.players, gameState.teamMapRatings, strengths[0]?.map.key || 'ancient'),
    maps: strengths,
    projected: strengths.slice(0, 3),
  };
}
