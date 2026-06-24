function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

export function initializeVrsRankings(teams = []) {
  return [...teams]
    .sort((a, b) => Number(a.ranking || 999) - Number(b.ranking || 999))
    .map((team, index) => {
      const rank = index + 1;
      const reputation = Number(team.reputation || 60);
      const points = Math.round(clamp(2050 - (rank - 1) * 34 + (reputation - 75) * 3, 650, 2050));
      return {
        teamId: team.teamId,
        currentRank: rank,
        lastRank: rank,
        rankMovement: 0,
        vrsPoints: points,
        formRating: clamp(62 + Math.round((reputation - 70) / 3) - Math.floor(index / 10), 45, 72),
        recentEventResults: [],
        prizeMoneySeason: 0,
        wins: 0,
        losses: 0,
        mapWins: 0,
        mapLosses: 0,
        strengthOfSchedule: 0,
        lastEvent: 'Season start',
      };
    });
}

export function getRankingRows(rankings = [], teams = []) {
  const teamById = new Map(teams.map((team) => [team.teamId, team]));
  return [...rankings]
    .sort((a, b) => b.vrsPoints - a.vrsPoints)
    .map((row, index) => ({ ...teamById.get(row.teamId), ...row, currentRank: index + 1 }));
}

export function createInviteSnapshot(event, rankings = [], teams = []) {
  const count = Math.min(Number(event?.teams || event?.teamCount || 16), rankings.length);
  const rows = getRankingRows(rankings, teams).slice(0, count);
  return {
    eventId: event.eventId,
    generatedAt: event.startDate,
    cutoffRank: count,
    cutoffPoints: rows[count - 1]?.vrsPoints || 0,
    invitees: rows.map((row, index) => ({ teamId: row.teamId, seed: index + 1, rank: row.currentRank, vrsPoints: row.vrsPoints })),
  };
}

export function getInviteStatus(event, rankings, teams, teamId, existingSnapshot = null) {
  const snapshot = existingSnapshot || createInviteSnapshot(event, rankings, teams);
  const invite = snapshot.invitees.find((row) => row.teamId === teamId);
  const rank = getRankingRows(rankings, teams).find((row) => row.teamId === teamId)?.currentRank || 999;
  return {
    snapshot,
    invited: Boolean(invite),
    seed: invite?.seed || null,
    cutoffRank: snapshot.cutoffRank,
    cutoffPoints: snapshot.cutoffPoints,
    userRank: rank,
    reason: invite ? `Invited as seed #${invite.seed}.` : `Your current VRS ranking is #${rank} and the event invites the top ${snapshot.cutoffRank}.`,
    placesNeeded: invite ? 0 : Math.max(0, rank - snapshot.cutoffRank),
  };
}

function eventWeight(event) {
  const text = `${event?.name || ''} ${event?.type || ''} ${event?.eventType || ''} ${event?.tier || ''}`.toLowerCase();
  if (text.includes('major')) return 1.8;
  if (text.includes('iem championship') || text.includes('katowice') || text.includes('cologne')) return 1.45;
  if (text.includes('rivals') || text.includes('pro league')) return 1.25;
  if (text.includes('pgl') || text.includes('bounty')) return 1.05;
  if (text.includes('regional')) return 0.7;
  return 1;
}

export function updateRankingsAfterEvent(rankings = [], tournament, teams = []) {
  const beforeRows = getRankingRows(rankings, teams);
  const beforeById = new Map(beforeRows.map((row) => [row.teamId, row]));
  const mutable = new Map(rankings.map((row) => [row.teamId, { ...row, lastRank: beforeById.get(row.teamId)?.currentRank || row.currentRank }]));
  const matches = [
    ...(tournament?.swiss?.rounds || []).flatMap((round) => round.matches || []),
    ...(tournament?.playoffs?.rounds || []).flatMap((round) => (round.matches || []).map((match) => match.result).filter(Boolean)),
  ];
  const weight = eventWeight(tournament?.event);
  const teamEvents = new Map();
  matches.forEach((match) => {
    [match.teamA, match.teamB].forEach((team) => {
      if (!teamEvents.has(team.teamId)) teamEvents.set(team.teamId, { wins: 0, losses: 0, mapWins: 0, mapLosses: 0, opponents: [] });
    });
    const winner = mutable.get(match.winner.teamId);
    const loserTeam = match.winner.teamId === match.teamA.teamId ? match.teamB : match.teamA;
    const loser = mutable.get(loserTeam.teamId);
    const winRank = beforeById.get(match.winner.teamId)?.currentRank || 40;
    const loseRank = beforeById.get(loserTeam.teamId)?.currentRank || 40;
    const upsetBonus = clamp((winRank - loseRank) * 1.8, -10, 34);
    const delta = Math.round((18 + upsetBonus) * weight);
    winner.vrsPoints += delta;
    loser.vrsPoints -= Math.round((12 + Math.max(0, loseRank - winRank) * 1.2) * weight);
    winner.formRating = clamp(winner.formRating + 2 + Math.max(0, winRank - loseRank) / 8, 0, 100);
    loser.formRating = clamp(loser.formRating - 2 - Math.max(0, loseRank - winRank) / 10, 0, 100);
    const w = teamEvents.get(match.winner.teamId); const l = teamEvents.get(loserTeam.teamId);
    w.wins += 1; l.losses += 1;
    w.mapWins += match.mapsWonA && match.teamA.teamId === match.winner.teamId ? match.mapsWonA : match.mapsWonB;
    w.mapLosses += match.mapsWonA && match.teamA.teamId === match.winner.teamId ? match.mapsWonB : match.mapsWonA;
    l.mapWins += match.mapsWonA && match.teamA.teamId === loserTeam.teamId ? match.mapsWonA : match.mapsWonB;
    l.mapLosses += match.mapsWonA && match.teamA.teamId === loserTeam.teamId ? match.mapsWonB : match.mapsWonA;
    w.opponents.push(loseRank); l.opponents.push(winRank);
  });
  const championId = tournament?.champion?.teamId;
  if (championId && mutable.has(championId)) { mutable.get(championId).vrsPoints += Math.round(90 * weight); mutable.get(championId).formRating = clamp(mutable.get(championId).formRating + 7, 0, 100); }
  teamEvents.forEach((eventRow, teamId) => {
    const row = mutable.get(teamId);
    row.wins += eventRow.wins; row.losses += eventRow.losses; row.mapWins += eventRow.mapWins; row.mapLosses += eventRow.mapLosses;
    row.strengthOfSchedule = Math.round(eventRow.opponents.reduce((s, r) => s + (65 - r), 0) / Math.max(1, eventRow.opponents.length));
    row.lastEvent = tournament.event.name;
    row.recentEventResults = [{ eventName: tournament.event.name, record: `${eventRow.wins}-${eventRow.losses}` }, ...row.recentEventResults].slice(0, 5);
  });
  const next = [...mutable.values()].map((r) => ({ ...r, vrsPoints: Math.round(clamp(r.vrsPoints, 250, 2300)), formRating: Math.round(r.formRating) })).sort((a, b) => b.vrsPoints - a.vrsPoints);
  return next.map((row, index) => ({ ...row, currentRank: index + 1, rankMovement: (row.lastRank || index + 1) - (index + 1) }));
}
