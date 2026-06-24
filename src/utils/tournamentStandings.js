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
  const totals = new Map();
  allStats.forEach((stat) => {
    const current = totals.get(stat.playerId) || { ...stat, totalKills: 0, totalDeaths: 0, totalAssists: 0, totalOpeningKills: 0, totalClutches: 0, ratingSum: 0, mapsPlayed: 0 };
    current.totalKills += stat.kills; current.totalDeaths += stat.deaths; current.totalAssists += stat.assists || 0; current.totalOpeningKills += stat.openingKills || 0; current.totalClutches += stat.clutches || 0; current.ratingSum += stat.rating || 0; current.mapsPlayed += 1;
    current.averageRating = Math.round((current.ratingSum / current.mapsPlayed) * 100) / 100;
    current.rating = current.averageRating;
    current.kills = current.totalKills;
    totals.set(stat.playerId, current);
  });
  const seriesPlayerTotals = [...totals.values()].sort((a,b)=>b.averageRating-a.averageRating || b.totalKills-a.totalKills);
  const topPerformer = seriesPlayerTotals[0];
  const loser = match.winner.teamId === match.teamA.teamId ? match.teamB : match.teamA;
  const rankingGap = Number(match.winner.ranking || 999) - Number(loser.ranking || 999);
  return {
    ...match,
    mapsWonA,
    mapsWonB,
    roundsA,
    roundsB,
    topPerformer,
    seriesPlayerTotals,
    summaryText: `${match.winner.shortName || match.winner.name} defeated ${(match.winner.teamId === match.teamA.teamId ? match.teamB : match.teamA).shortName || (match.winner.teamId === match.teamA.teamId ? match.teamB : match.teamA).name} ${mapsWonA}-${mapsWonB} behind ${topPerformer?.gamertag || 'a star performance'}.`,
    loser,
    upset: rankingGap >= 10,
  };
}
