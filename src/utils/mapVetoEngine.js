import { ACTIVE_MAP_POOL, getMapRating } from './teamStrength.js';

function mapLabel(mapKey) {
  return ACTIVE_MAP_POOL.find((map) => map.key === mapKey)?.name || mapKey;
}

function weakestMap(team, remaining, teamMapRatings) {
  return [...remaining].sort((a, b) => getMapRating(team.teamId, a, teamMapRatings) - getMapRating(team.teamId, b, teamMapRatings))[0];
}

function strongestMap(team, remaining, teamMapRatings) {
  return [...remaining].sort((a, b) => getMapRating(team.teamId, b, teamMapRatings) - getMapRating(team.teamId, a, teamMapRatings))[0];
}

function removeMap(remaining, mapKey) {
  return remaining.filter((key) => key !== mapKey);
}

function step(action, team, mapKey) {
  return { action, teamId: team.teamId, teamName: team.shortName || team.name, mapKey, mapName: mapLabel(mapKey) };
}

export function createMapVeto(teamA, teamB, bestOf = 1, teamMapRatings = []) {
  let remaining = ACTIVE_MAP_POOL.map((map) => map.key);
  const steps = [];
  const pickedMaps = [];

  const ban = (team) => {
    const mapKey = weakestMap(team, remaining, teamMapRatings);
    remaining = removeMap(remaining, mapKey);
    steps.push(step('ban', team, mapKey));
  };
  const pick = (team) => {
    const mapKey = strongestMap(team, remaining, teamMapRatings);
    remaining = removeMap(remaining, mapKey);
    pickedMaps.push(mapKey);
    steps.push(step('pick', team, mapKey));
  };

  if (bestOf === 1) {
    let turn = teamA;
    while (remaining.length > 1) {
      ban(turn);
      turn = turn.teamId === teamA.teamId ? teamB : teamA;
    }
    pickedMaps.push(remaining[0]);
    steps.push({ action: 'decider', teamId: null, teamName: 'Decider', mapKey: remaining[0], mapName: mapLabel(remaining[0]) });
  } else if (bestOf === 3) {
    ban(teamA); ban(teamB); pick(teamA); pick(teamB); ban(teamA); ban(teamB);
    pickedMaps.push(remaining[0]);
    steps.push({ action: 'decider', teamId: null, teamName: 'Decider', mapKey: remaining[0], mapName: mapLabel(remaining[0]) });
  } else {
    ban(teamA); ban(teamB); pick(teamA); pick(teamB); pick(teamA); pick(teamB);
    pickedMaps.push(remaining[0]);
    steps.push({ action: 'decider', teamId: null, teamName: 'Decider', mapKey: remaining[0], mapName: mapLabel(remaining[0]) });
  }

  return { bestOf, steps, maps: pickedMaps.map((key) => ({ key, name: mapLabel(key) })) };
}
