export function validateEveryTeamHasFivePlayers(teams, players) {
  const errors = [];
  for (const team of teams) {
    const activePlayers = players.filter(
      (p) => p.teamId === team.teamId && p.status === 'active'
    );
    if (activePlayers.length !== 5) {
      errors.push(
        `${team.shortName} has ${activePlayers.length} active players (expected 5)`
      );
    }
  }
  return { valid: errors.length === 0, errors };
}

export function validateNoDuplicateActivePlayers(players) {
  const errors = [];
  const seen = new Set();
  for (const p of players) {
    if (p.status !== 'active') continue;
    if (seen.has(p.playerId)) {
      errors.push(`Duplicate active player: ${p.gamertag} (${p.playerId})`);
    }
    seen.add(p.playerId);
  }
  return { valid: errors.length === 0, errors };
}

export function validatePlayersHaveValidTeamIds(teams, players) {
  const errors = [];
  const teamIds = new Set(teams.map((t) => t.teamId));
  for (const p of players) {
    if (p.status !== 'active') continue;
    if (!teamIds.has(p.teamId)) {
      errors.push(
        `${p.gamertag} has invalid teamId "${p.teamId}"`
      );
    }
  }
  return { valid: errors.length === 0, errors };
}

export function validateTeamMapRatingsExist(teams, maps) {
  const errors = [];
  const mapIds = maps.map((m) => m.mapId);
  for (const team of teams) {
    if (!team.mapRatings) {
      errors.push(`${team.shortName} has no mapRatings`);
      continue;
    }
    for (const mapId of mapIds) {
      if (team.mapRatings[mapId] === undefined) {
        errors.push(`${team.shortName} missing rating for map "${mapId}"`);
      }
    }
  }
  return { valid: errors.length === 0, errors };
}

export function runAllValidations(teams, players, maps) {
  return [
    { name: 'Every team has 5 players', ...validateEveryTeamHasFivePlayers(teams, players) },
    { name: 'No duplicate active players', ...validateNoDuplicateActivePlayers(players) },
    { name: 'Players have valid team IDs', ...validatePlayersHaveValidTeamIds(teams, players) },
    { name: 'Team map ratings exist', ...validateTeamMapRatingsExist(teams, maps) },
  ];
}
