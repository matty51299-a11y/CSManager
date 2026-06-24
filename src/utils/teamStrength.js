const ROLE_GROUPS = {
  igl: ['igl'],
  awper: ['awper'],
  entry: ['entry', 'star rifler'],
  support: ['support', 'anchor', 'lurker'],
};

export const ACTIVE_MAP_POOL = [
  { key: 'ancient', name: 'Ancient' },
  { key: 'anubis', name: 'Anubis' },
  { key: 'dust2', name: 'Dust II' },
  { key: 'inferno', name: 'Inferno' },
  { key: 'mirage', name: 'Mirage' },
  { key: 'nuke', name: 'Nuke' },
  { key: 'overpass', name: 'Overpass' },
];

function num(value, fallback = 70) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function playerRoles(player) {
  return [player.rolePrimary, player.roleSecondary].filter(Boolean).map((role) => role.toLowerCase());
}

function hasRole(players, wantedRoles) {
  return players.some((player) => playerRoles(player).some((role) => wantedRoles.includes(role)));
}

function maxSkill(players, skill, fallback = 70) {
  if (!players.length) return fallback;
  return Math.max(...players.map((player) => num(player[skill], fallback)));
}

function average(players, field, fallback = 70) {
  if (!players.length) return fallback;
  return players.reduce((sum, player) => sum + num(player[field], fallback), 0) / players.length;
}

export function getMapRating(teamId, mapKey, teamMapRatings = []) {
  const ratings = teamMapRatings.find((rating) => rating.teamId === teamId);
  return num(ratings?.[mapKey], 70);
}

export function getRoleBalance(players = []) {
  const checks = [
    { key: 'IGL', met: hasRole(players, ROLE_GROUPS.igl) },
    { key: 'AWPer', met: hasRole(players, ROLE_GROUPS.awper) },
    { key: 'Entry / Star Rifler', met: hasRole(players, ROLE_GROUPS.entry) },
    { key: 'Support / Anchor / Lurker', met: hasRole(players, ROLE_GROUPS.support) },
  ];
  const metCount = checks.filter((check) => check.met).length;
  return {
    score: 70 + metCount * 7.5,
    metCount,
    checks,
  };
}

export function calculateTeamStrength(team, allPlayers = [], teamMapRatings = [], mapKey = 'ancient') {
  const players = allPlayers.filter((player) => player.teamId === team?.teamId && player.status !== 'inactive').slice(0, 5);
  const roleBalance = getRoleBalance(players);
  const averageOverall = average(players, 'overall');
  const mapRating = getMapRating(team?.teamId, mapKey, teamMapRatings);
  const iglCalling = maxSkill(players.filter((player) => playerRoles(player).includes('igl')), 'calling', maxSkill(players, 'calling'));
  const awperStrength = maxSkill(players.filter((player) => playerRoles(player).includes('awper')), 'awp', maxSkill(players, 'awp'));
  const entryStrength = maxSkill(players, 'entry');
  const clutchStrength = maxSkill(players, 'clutch');
  const consistency = average(players, 'consistency');
  const reputationPressure = Math.max(-4, Math.min(4, (num(team?.reputation, 70) - 75) / 6));

  const total =
    averageOverall * 0.32 +
    roleBalance.score * 0.12 +
    mapRating * 0.18 +
    iglCalling * 0.09 +
    awperStrength * 0.08 +
    entryStrength * 0.07 +
    clutchStrength * 0.07 +
    consistency * 0.07 +
    reputationPressure;

  return {
    total: Math.round(total * 10) / 10,
    players,
    breakdown: {
      averageOverall: Math.round(averageOverall),
      roleBalance: Math.round(roleBalance.score),
      mapRating: Math.round(mapRating),
      iglCalling: Math.round(iglCalling),
      awperStrength: Math.round(awperStrength),
      entryStrength: Math.round(entryStrength),
      clutchStrength: Math.round(clutchStrength),
      consistency: Math.round(consistency),
      reputationPressure: Math.round(reputationPressure * 10) / 10,
    },
    roleChecks: roleBalance.checks,
  };
}
