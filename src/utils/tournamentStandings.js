export function makeInitialStandings(teams = []) {
  return teams.map((team, index) => ({
    team,
    teamId: team.teamId,
    seed: index + 1,
    wins: 0,
    losses: 0,
    mapsWon: 0,
    mapsLost: 0,
    roundsWon: 0,
    roundsLost: 0,
    status: 'active',
    opponents: [],
  }));
}

export function sortStandings(standings = []) {
  const order = { qualified: 0, active: 1, eliminated: 2 };
  return [...standings].sort((a, b) =>
    order[a.status] - order[b.status]
    || b.wins - a.wins
    || a.losses - b.losses
    || (b.mapsWon - b.mapsLost) - (a.mapsWon - a.mapsLost)
    || (b.roundsWon - b.roundsLost) - (a.roundsWon - a.roundsLost)
    || a.seed - b.seed
  );
}

export function summarizeMatch(match) {
  if (!match?.ok) return null;
  const mapsWonA = match.maps.filter((map) => map.winnerTeamId === match.teamA.teamId).length;
  const mapsWonB = match.maps.filter((map) => map.winnerTeamId === match.teamB.teamId).length;
  const roundsA = match.maps.reduce((sum, map) => sum + map.scoreA, 0);
  const roundsB = match.maps.reduce((sum, map) => sum + map.scoreB, 0);
  const allStats = match.maps.flatMap((map) => [...map.teamAStats, ...map.teamBStats]);
  const topPerformer = allStats.sort((a, b) => b.rating - a.rating || b.kills - a.kills)[0];
  const rankingGap = Number(match.winner.ranking || 999) - Number((match.winner.teamId === match.teamA.teamId ? match.teamB : match.teamA).ranking || 999);
  return {
    ...match,
    mapsWonA,
    mapsWonB,
    roundsA,
    roundsB,
    topPerformer,
    upset: rankingGap >= 10,
  };
}
