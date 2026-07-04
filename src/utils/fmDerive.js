// Deterministic derived attributes for the FM-style presentation layer.
// Everything here is computed from existing game state so the sim engine
// stays untouched and values never flicker between renders.

export function hashString(str) {
  let h = 2166136261;
  const s = String(str || '');
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h >>> 0);
}

export function crestHue(teamId) {
  return hashString(teamId) % 360;
}

export function teamInitials(team) {
  if (!team) return '?';
  const short = team.shortName || team.name || '?';
  const words = short.trim().split(/\s+/);
  if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase();
  return short.slice(0, 3).toUpperCase();
}

// 0.5 – 5.0 star scale in half-star steps, mapped from a 40-99 rating range.
export function starRating(value) {
  const v = Number(value) || 0;
  const stars = (v - 48) / 10;
  return Math.max(0.5, Math.min(5, Math.round(stars * 2) / 2));
}

// Match condition: 82-100%, seeded by player + current date so it drifts
// between events but never changes mid-screen.
export function condition(player, dateSeed) {
  const seed = hashString(`${player.playerId}-${dateSeed || ''}`);
  const base = 82 + (seed % 15);
  const disciplineBonus = Math.round((Number(player.discipline) || 70) / 25);
  return Math.min(100, base + disciplineBonus);
}

const MORALE_LEVELS = [
  { label: 'Very Poor', cls: 'morale-vpoor' },
  { label: 'Poor', cls: 'morale-poor' },
  { label: 'Okay', cls: 'morale-okay' },
  { label: 'Good', cls: 'morale-good' },
  { label: 'Very Good', cls: 'morale-vgood' },
  { label: 'Superb', cls: 'morale-superb' },
];

export function morale(player, team) {
  const form = Number(team?.formRating) || 70;
  const composure = Number(player.composure) || 70;
  const wobble = hashString(player.playerId) % 12;
  const score = form * 0.55 + composure * 0.35 + wobble;
  const idx = score >= 92 ? 5 : score >= 84 ? 4 : score >= 74 ? 3 : score >= 64 ? 2 : score >= 54 ? 1 : 0;
  return MORALE_LEVELS[idx];
}

// Burnout risk = the CS analogue of FM's injury risk. Older players with
// low discipline and heavy schedules run hotter.
export function burnoutRisk(player, dateSeed) {
  const cond = condition(player, dateSeed);
  const age = Number(player.age) || 22;
  const discipline = Number(player.discipline) || 70;
  const score = (100 - cond) * 2 + Math.max(0, age - 25) * 4 + Math.max(0, 80 - discipline);
  if (score >= 46) return { label: 'Very High Risk', cls: 'risk-vhigh', score };
  if (score >= 34) return { label: 'High Risk', cls: 'risk-high', score };
  if (score >= 22) return { label: 'Medium Risk', cls: 'risk-med', score };
  return { label: 'Low Risk', cls: 'risk-low', score };
}

// Training rating 5.00-9.50, driven by consistency + a per-date wobble.
export function trainingRating(player, dateSeed) {
  const seed = hashString(`train-${player.playerId}-${dateSeed || ''}`);
  const base = 5 + ((Number(player.consistency) || 70) - 50) / 16;
  const wobble = ((seed % 140) - 70) / 100;
  return Math.max(4.6, Math.min(9.6, base + wobble));
}

export function transferValue(player) {
  const ovr = Number(player.overall) || 60;
  const pot = Number(player.potential) || ovr;
  const age = Number(player.age) || 24;
  const base = Math.pow(Math.max(0, ovr - 55), 2.35) * 900;
  const potentialBonus = Math.max(0, pot - ovr) * 42000;
  const ageMod = age <= 21 ? 1.35 : age <= 25 ? 1.15 : age <= 28 ? 0.95 : 0.7;
  return Math.round((base + potentialBonus) * ageMod / 5000) * 5000;
}

const NAT_CODES = {
  Russia: 'RUS', Ukraine: 'UKR', France: 'FRA', Denmark: 'DEN', Sweden: 'SWE',
  Norway: 'NOR', Finland: 'FIN', Germany: 'GER', Poland: 'POL', 'Czech Republic': 'CZE',
  Slovakia: 'SVK', Hungary: 'HUN', Romania: 'ROU', Bulgaria: 'BUL', Serbia: 'SRB',
  'Bosnia and Herzegovina': 'BIH', Croatia: 'CRO', Slovenia: 'SVN', Netherlands: 'NED',
  Belgium: 'BEL', 'United Kingdom': 'GBR', England: 'ENG', Scotland: 'SCO', Wales: 'WAL',
  Ireland: 'IRL', Spain: 'ESP', Portugal: 'POR', Italy: 'ITA', Switzerland: 'SUI',
  Austria: 'AUT', Turkey: 'TUR', Israel: 'ISR', Kazakhstan: 'KAZ', Mongolia: 'MGL',
  China: 'CHN', 'South Korea': 'KOR', Japan: 'JPN', Australia: 'AUS', 'New Zealand': 'NZL',
  Brazil: 'BRA', Argentina: 'ARG', Chile: 'CHI', Uruguay: 'URU', 'United States': 'USA',
  USA: 'USA', Canada: 'CAN', Mexico: 'MEX', 'Saudi Arabia': 'KSA', Jordan: 'JOR',
  'United Arab Emirates': 'UAE', Indonesia: 'IDN', Malaysia: 'MAS', Latvia: 'LVA',
  Lithuania: 'LTU', Estonia: 'EST', Belarus: 'BLR',
};

export function natCode(nationality) {
  if (!nationality) return '—';
  return NAT_CODES[nationality] || nationality.slice(0, 3).toUpperCase();
}

const ROLE_ABBR = {
  AWPer: 'AWP', Entry: 'ENT', 'Star Rifler': 'RIF', Rifler: 'RIF', Lurker: 'LRK',
  IGL: 'IGL', Support: 'SUP', Clutcher: 'CLU', Anchor: 'ANC', Coach: 'COA',
};

export function roleAbbr(role) {
  if (!role) return '—';
  return ROLE_ABBR[role] || role.slice(0, 3).toUpperCase();
}

const ROLE_CLASS = {
  AWP: 'pos-awp', ENT: 'pos-ent', RIF: 'pos-rif', LRK: 'pos-lrk',
  IGL: 'pos-igl', SUP: 'pos-sup', CLU: 'pos-clu', ANC: 'pos-anc',
};

export function roleClass(role) {
  return ROLE_CLASS[roleAbbr(role)] || 'pos-rif';
}

export function contractExpiryYear(player, currentDate) {
  const year = Number(String(currentDate || '2026-01-01').slice(0, 4)) || 2026;
  return year + (Number(player.contractYears) || 1);
}

// FM-style squad status derived from overall relative to team.
export function squadStatus(player, teamPlayers) {
  const sorted = [...teamPlayers].sort((a, b) => b.overall - a.overall);
  const idx = sorted.findIndex((p) => p.playerId === player.playerId);
  const pot = Number(player.potential) || 0;
  if (idx === 0) return { label: 'Star Player', cls: 'status-star' };
  if (player.age <= 21 && pot - player.overall >= 8) return { label: 'Future Prospect', cls: 'status-prospect' };
  if (idx <= 3) return { label: 'Important Player', cls: 'status-important' };
  if (idx === 4) return { label: 'Regular Starter', cls: 'status-regular' };
  return { label: 'Squad Player', cls: 'status-squad' };
}
