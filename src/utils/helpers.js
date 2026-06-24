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
  return `badge badge-${tier.toLowerCase()}`;
}
