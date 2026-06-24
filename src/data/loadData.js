import FALLBACK_TEAMS from './fallback/teams.js';
import FALLBACK_PLAYERS from './fallback/players.js';
import FALLBACK_MAPS from './fallback/maps.js';
import FALLBACK_TEAM_MAP_RATINGS from './fallback/teamMapRatings.js';
import FALLBACK_EVENTS from './fallback/events.js';

const generated = import.meta.glob('./generated/*.json', { eager: true });

function getGenerated(name) {
  const mod = generated[`./generated/${name}.json`];
  return mod?.default;
}

export const teams = getGenerated('teams') || FALLBACK_TEAMS;
export const players = getGenerated('players') || FALLBACK_PLAYERS;
export const maps = getGenerated('maps') || FALLBACK_MAPS;
export const teamMapRatings = getGenerated('teamMapRatings') || FALLBACK_TEAM_MAP_RATINGS;
export const events = getGenerated('events') || FALLBACK_EVENTS;
export const dataSource = getGenerated('teams') ? 'generated' : 'fallback';
