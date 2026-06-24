// Event Prize and VRS Weighting Engine
// Decides how much ranking movement and prize money an event produces.
// Bigger events should move the rankings more than smaller events.

// Ranking impact weight by event type (0-100 scale, from the task spec).
export const EVENT_TYPE_WEIGHTS = {
  Major: 100,
  'IEM Championship': 85,
  'BLAST Rivals': 80,
  'ESL Pro League': 70,
  'Esports World Cup': 70,
  Invitational: 70,
  'IEM Masters': 65,
  'PGL Masters': 60,
  Bounty: 55,
  StarSeries: 55,
  'BLAST Open': 50,
  'Regional Challenger': 35,
};

// Resolve the 0-100 weight for an event.
export function getEventWeight(event) {
  // Prefer an explicit event type match.
  if (event?.eventType && EVENT_TYPE_WEIGHTS[event.eventType] !== undefined) {
    return EVENT_TYPE_WEIGHTS[event.eventType];
  }
  // Otherwise fall back to keywords in the name/type.
  const text = `${event?.eventType || ''} ${event?.name || ''}`.toLowerCase();
  if (text.includes('major')) return 100;
  if (text.includes('katowice') || text.includes('cologne') || text.includes('iem championship')) return 85;
  if (text.includes('rivals')) return 80;
  if (text.includes('pro league')) return 70;
  if (text.includes('world cup')) return 70;
  if (text.includes('iem masters')) return 65;
  if (text.includes('pgl') || text.includes('masters')) return 60;
  if (text.includes('bounty')) return 55;
  if (text.includes('starseries') || text.includes('starladder')) return 55;
  if (text.includes('regional')) return 35;
  // Use the spreadsheet rankingWeight if we have nothing better.
  if (Number(event?.rankingWeight)) return Number(event.rankingWeight);
  return 50;
}

// Turn the 0-100 weight into a VRS points multiplier.
// Bounty/StarSeries (55) sit at roughly 1.0, the Major (100) reaches ~1.8.
export function getVrsMultiplier(event) {
  return Math.round((getEventWeight(event) / 55) * 100) / 100;
}

// Standard prize split by finishing place (fractions of the prize pool).
const PRIZE_SPLIT = [0.32, 0.18, 0.11, 0.11, 0.07, 0.07, 0.04, 0.04];

// Work out how much prize money each placement earns.
// placements is an ordered array of { teamId, place } (place 1 = champion).
export function distributePrize(event, placements = []) {
  const pool = Number(event?.prizePool || 0);
  return placements.map((entry) => {
    const index = (entry.place || 1) - 1;
    const fraction = PRIZE_SPLIT[index] !== undefined ? PRIZE_SPLIT[index] : 0.02;
    return { ...entry, prize: Math.round(pool * fraction) };
  });
}

// Convenience: prize money for a single finishing place.
export function prizeForPlace(event, place) {
  const pool = Number(event?.prizePool || 0);
  const fraction = PRIZE_SPLIT[place - 1] !== undefined ? PRIZE_SPLIT[place - 1] : 0.02;
  return Math.round(pool * fraction);
}
