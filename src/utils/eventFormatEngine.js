// Event Format Engine
// Single source of truth for how each Counter-Strike event is structured.
// Different events use different format types so they do not all play the same.
//
// Each format definition describes:
// - formatType: the unique key for this format
// - label: a readable name shown in the UI
// - teamCount: how many teams play the event
// - inviteCount: how many top VRS teams are invited
// - bestOf: default series length for normal matches
// - finalBestOf: series length for the grand final
// - kind: a simple category used by the stage engine and the overlay
//         ('single_elim' | 'swiss' | 'groups' | 'playin' | 'major' | 'break')
// - middleTab: which adaptive overlay tab name to show ('Bracket' | 'Groups' | 'Swiss' | 'Stages')
// - stageNames: the ordered stage labels shown in the overlay for this format
// - description: a short plain-English explanation

export const FORMAT_TYPES = {
  swiss16_playoffs8: {
    formatType: 'swiss16_playoffs8',
    label: '16-Team Swiss + Top 8 Playoffs',
    teamCount: 16,
    inviteCount: 16,
    bestOf: 3,
    finalBestOf: 3,
    kind: 'swiss',
    middleTab: 'Swiss',
    stageNames: ['Swiss', 'Playoffs'],
    description: '16 teams, Swiss stage (3 wins qualify, 3 losses eliminate), top 8 into Bo3 playoffs.',
  },
  bounty32_single_elim: {
    formatType: 'bounty32_single_elim',
    label: '32-Team Bounty Single Elimination',
    teamCount: 32,
    inviteCount: 32,
    bestOf: 3,
    finalBestOf: 3,
    kind: 'single_elim',
    middleTab: 'Bracket',
    stageNames: ['Round of 32', 'Round of 16', 'Quarter-finals', 'Semi-finals', 'Final'],
    description: '32 teams, straight single elimination. Every team carries a bounty and beating a higher-ranked team pays extra.',
  },
  iem24_playin_groups_playoffs: {
    formatType: 'iem24_playin_groups_playoffs',
    label: '24-Team Play-In + Main Stage + Playoffs',
    teamCount: 24,
    inviteCount: 24,
    bestOf: 3,
    finalBestOf: 3,
    kind: 'playin',
    middleTab: 'Stages',
    stageNames: ['Play-In', 'Main Stage', 'Playoffs'],
    description: '24 teams. Top 8 start in the main stage, the lower 16 fight through a Play-In, then top 8 reach the playoffs.',
  },
  epl32_groups_playoffs: {
    formatType: 'epl32_groups_playoffs',
    label: '32-Team Groups + 16-Team Playoffs',
    teamCount: 32,
    inviteCount: 32,
    bestOf: 3,
    finalBestOf: 3,
    kind: 'groups',
    middleTab: 'Groups',
    stageNames: ['Groups', 'Playoffs'],
    description: '32 teams in 8 groups of 4. Top 2 from each group reach a 16-team single elimination playoff.',
  },
  major32_three_stage_playoffs: {
    formatType: 'major32_three_stage_playoffs',
    label: 'Major: 32-Team Three-Stage + Playoffs',
    teamCount: 32,
    inviteCount: 32,
    bestOf: 3,
    finalBestOf: 5,
    kind: 'major',
    middleTab: 'Stages',
    stageNames: ['Stage 1', 'Stage 2', 'Stage 3', 'Playoffs'],
    description: '32 teams across three Swiss stages, then a top 8 single elimination playoff with a Bo5 grand final.',
  },
  rivals8_groups_playoffs: {
    formatType: 'rivals8_groups_playoffs',
    label: '8-Team Elite Groups + Playoffs',
    teamCount: 8,
    inviteCount: 8,
    bestOf: 3,
    finalBestOf: 3,
    kind: 'groups',
    middleTab: 'Groups',
    stageNames: ['Groups', 'Playoffs'],
    description: '8 elite teams in 2 groups of 4. Top 2 from each group reach a 4-team single elimination playoff.',
  },
  background_only_break: {
    formatType: 'background_only_break',
    label: 'Calendar Break (No Matches)',
    teamCount: 0,
    inviteCount: 0,
    bestOf: 0,
    finalBestOf: 0,
    kind: 'break',
    middleTab: 'Overview',
    stageNames: ['Break'],
    description: 'No matches. A calendar-only event that creates a news item and advances the date cleanly.',
  },
};

// Map the spreadsheet "format" string (if present) onto a formatType.
const SPREADSHEET_FORMAT_MAP = {
  single_elim_bo3_bounty: 'bounty32_single_elim',
  playin_groups_playoffs: 'iem24_playin_groups_playoffs',
  '8_groups_of_4_to_16_playoff': 'epl32_groups_playoffs',
  swiss_to_top8_playoffs: 'swiss16_playoffs8',
  two_groups_to_playoffs: 'rivals8_groups_playoffs',
  major_32_three_stage_swiss_playoffs: 'major32_three_stage_playoffs',
  offseason_window: 'background_only_break',
  // The remaining spreadsheet formats fall back to a clean Swiss event for now.
  groups_to_playoffs: 'swiss16_playoffs8',
  gsl_groups_to_playoffs: 'swiss16_playoffs8',
  groups_to_6_team_playoffs: 'swiss16_playoffs8',
  regional_league_to_playoffs: 'swiss16_playoffs8',
};

// Fallback mapping by event type / name keywords (used when no format field matches).
function mapByNameOrType(event) {
  const text = `${event?.eventType || ''} ${event?.name || ''}`.toLowerCase();
  if (text.includes('major')) return 'major32_three_stage_playoffs';
  if (text.includes('bounty')) return 'bounty32_single_elim';
  if (text.includes('katowice') || text.includes('cologne') || text.includes('iem championship')) return 'iem24_playin_groups_playoffs';
  if (text.includes('pro league')) return 'epl32_groups_playoffs';
  if (text.includes('rivals')) return 'rivals8_groups_playoffs';
  if (text.includes('break') || text.includes('transfer') || text.includes('offseason') || text.includes('award')) return 'background_only_break';
  if (text.includes('pgl') || text.includes('starseries') || text.includes('starladder') || text.includes('world cup') || text.includes('masters')) return 'swiss16_playoffs8';
  return 'swiss16_playoffs8';
}

// Resolve which formatType an event uses.
// Priority: explicit formatType field -> spreadsheet format string -> name/type fallback.
export function getEventFormatType(event) {
  if (event?.formatType && FORMAT_TYPES[event.formatType]) return event.formatType;
  if (event?.format && SPREADSHEET_FORMAT_MAP[event.format]) return SPREADSHEET_FORMAT_MAP[event.format];
  return mapByNameOrType(event);
}

// Return the full format definition for an event.
export function getEventFormat(event) {
  return FORMAT_TYPES[getEventFormatType(event)];
}

// Build the standard event model with all the required fields in one place.
export function describeEvent(event, currentStage = null) {
  const format = getEventFormat(event);
  return {
    eventId: event.eventId,
    eventName: event.name,
    eventType: event.eventType,
    formatType: format.formatType,
    formatLabel: format.label,
    teams: format.teamCount || Number(event.teams || 0),
    inviteCount: format.inviteCount,
    startDate: event.startDate,
    endDate: event.endDate,
    prizePool: Number(event.prizePool || 0),
    tier: event.tier,
    rankingWeight: Number(event.rankingWeight || 0),
    inviteMethod: event.inviteMethod,
    currentStage: currentStage || format.stageNames[0],
    stages: format.stageNames,
    bestOf: format.bestOf,
    finalBestOf: format.finalBestOf,
    kind: format.kind,
    middleTab: format.middleTab,
    description: format.description,
  };
}

// The adaptive overlay tab list for an event's format.
export function getFormatTabs(event) {
  const format = getEventFormat(event);
  if (format.kind === 'break') return ['Overview', 'Results'];
  return ['Overview', format.middleTab, 'Results', 'Stats', 'Placements'];
}

// Is this event a calendar-only break with no matches?
export function isBreakEvent(event) {
  return getEventFormat(event).kind === 'break';
}
