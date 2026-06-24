export function ovrClass(ovr) {
  if (ovr >= 90) return 'ovr-elite';
  if (ovr >= 82) return 'ovr-good';
  if (ovr >= 74) return 'ovr-average';
  if (ovr >= 65) return 'ovr-below';
  return 'ovr-poor';
}

export function statColor(val) {
  if (val >= 85) return 'stat-high';
  if (val >= 70) return 'stat-mid';
  if (val >= 55) return 'stat-low';
  return 'stat-vlow';
}

export function formatMoney(amount) {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount}`;
}

export function tierBadgeClass(tier) {
  const t = (tier || 'c').toLowerCase().replace('+', 'plus');
  return `badge badge-${t}`;
}

export function getTeamMapRatings(teamId, teamMapRatings) {
  return teamMapRatings.find((r) => r.teamId === teamId) || null;
}

const MONTH_ORDER = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export function monthIndex(month) {
  const idx = MONTH_ORDER.indexOf(month);
  return idx >= 0 ? idx : 99;
}
