import TEAMS from './teams.js';
import PLAYERS from './players.js';
import MAPS from './maps.js';
import { TOURNAMENT_TEMPLATES, SEASON_TOURNAMENTS } from './tournaments.js';

const initialGameState = {
  season: 1,
  week: 1,
  phase: 'offseason',
  playerTeamId: 'navi',
  teams: TEAMS,
  players: PLAYERS,
  maps: MAPS,
  tournamentTemplates: TOURNAMENT_TEMPLATES,
  seasonTournaments: SEASON_TOURNAMENTS,
  settings: {
    difficulty: 'normal',
    simSpeed: 'normal',
    currency: 'USD',
  },
};

export default initialGameState;
