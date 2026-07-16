// Shared derivations for match-report visuals (Match Centre + report modal).

// Sum a per-player stat across every map for one side of a series.
export function sumStat(maps, side, key) {
  return maps.reduce((total, map) => total + (map[side] || []).reduce((s, p) => s + (p[key] || 0), 0), 0);
}

// Average a per-player stat across every map for one side of a series.
export function avgStat(maps, side, key) {
  let sum = 0;
  let count = 0;
  maps.forEach((map) => (map[side] || []).forEach((p) => { sum += p[key] || 0; count += 1; }));
  return count ? Math.round(sum / count) : 0;
}

// The two-sided comparison rows for a series.
export function comparisonRows(maps) {
  return [
    { label: 'Kills', a: sumStat(maps, 'teamAStats', 'kills'), b: sumStat(maps, 'teamBStats', 'kills') },
    { label: 'Assists', a: sumStat(maps, 'teamAStats', 'assists'), b: sumStat(maps, 'teamBStats', 'assists') },
    { label: 'Deaths', a: sumStat(maps, 'teamAStats', 'deaths'), b: sumStat(maps, 'teamBStats', 'deaths') },
    { label: 'Clutches', a: sumStat(maps, 'teamAStats', 'clutches'), b: sumStat(maps, 'teamBStats', 'clutches') },
    { label: 'Opening Kills', a: sumStat(maps, 'teamAStats', 'openingKills'), b: sumStat(maps, 'teamBStats', 'openingKills') },
    { label: 'ADR', a: avgStat(maps, 'teamAStats', 'ADR'), b: avgStat(maps, 'teamBStats', 'ADR') },
  ];
}

// Pick a round-history weapon icon from the winning side's economy that round.
export function weaponForRound(round) {
  const equip = round.winner === 'A' ? round.equipA : round.equipB;
  if (equip < 6000) return round.winner === 'A' ? 'usp' : 'glock';
  if (equip < 14000) return 'smg';
  return round.winner === 'A' ? 'm4' : 'ak';
}
