import { teams, players, maps, teamMapRatings, events, dataSource } from './loadData.js';

const initialGameState = {
  season: 1,
  week: 1,
  phase: 'offseason',
  playerTeamId: teams.length > 0 ? teams[0].teamId : null,
  teams,
  players,
  maps,
  teamMapRatings,
  events,
  dataSource,
  settings: {
    difficulty: 'normal',
    simSpeed: 'normal',
    currency: 'USD',
  },
};

export default initialGameState;
