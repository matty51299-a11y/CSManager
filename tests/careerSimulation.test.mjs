import assert from 'node:assert/strict';
import { CAREER_START_DATE, formatDate } from '../src/utils/calendarDates.js';
import { advanceOneDay, getDaysUntil } from '../src/utils/careerClock.js';
import { getPrimaryCareerAction, processDailySimulation, simulateFixture } from '../src/utils/careerSimulation.js';
import { simulateMatch } from '../src/utils/matchEngine.js';

const teams = [
  { teamId: 'team_vitality', name: 'Team Vitality', shortName: 'Vitality', ranking: 1, currentRank: 1, formRating: 86 },
  { teamId: 'betboom', name: 'BetBoom', shortName: 'BetBoom', ranking: 8, currentRank: 8, formRating: 72 },
  { teamId: 'spirit', name: 'Spirit', shortName: 'Spirit', ranking: 2, currentRank: 2 },
  { teamId: 'mouz', name: 'MOUZ', shortName: 'MOUZ', ranking: 3, currentRank: 3 },
];
const players = teams.flatMap((team) => Array.from({ length: 5 }, (_, i) => ({ playerId: `${team.teamId}-${i}`, gamertag: `${team.shortName}${i}`, teamId: team.teamId, status: 'active', overall: 78 + i, aim: 76 + i, consistency: 75, entry: 72, clutch: 70 })));
const initialData = { teams, players, teamMapRatings: [], events: [{ eventId: 'blast_bounty_s1', name: 'BLAST Bounty Season 1', tier: 'A' }] };
function state(date = CAREER_START_DATE) { return { currentDate: date, selectedTeamId: 'team_vitality', careerRandomnessSeed: 'test-seed', inboxItems: [], calendarEvents: [], matchResults: [], fixtures: [] }; }

assert.equal(CAREER_START_DATE, '2026-01-01');
assert.equal(advanceOneDay('2026-01-01'), '2026-01-02');
assert.equal(advanceOneDay('2026-01-31'), '2026-02-01');
assert.equal(advanceOneDay('2028-02-28'), '2028-02-29');
assert.equal(formatDate('2026-01-01'), '1 January 2026');
assert.equal(getDaysUntil('2026-01-01', '2026-01-13'), 12);

assert.equal(processDailySimulation(state('2026-01-01'), initialData).currentDate, '2026-01-02');
let s = state('2026-01-13');
s.fixtures = [{ id:'f1', tournamentId:'blast_bounty_s1', scheduledDate:'2026-01-13', bestOf:3, teamAId:'team_vitality', teamBId:'betboom', userTeamInvolved:true, simulated:false, status:'scheduled', round:'Group Stage - Match 2' }];
assert.equal(getPrimaryCareerAction(s).type, 'PLAY_MATCH');
assert.equal(processDailySimulation(s, initialData).currentDate, '2026-01-13');
s.fixtures[0].scheduledDate = '2026-01-14';
assert.equal(getPrimaryCareerAction(s).type, 'CONTINUE');
s.fixtures[0].scheduledDate = '2026-01-13'; s.fixtures[0].simulated = true; s.fixtures[0].status = 'completed';
assert.equal(getPrimaryCareerAction(s).type, 'CONTINUE');
s.inboxItems = [{ id:'info', blocksProgression:false }];
assert.equal(getPrimaryCareerAction(s).type, 'CONTINUE');
s.inboxItems = [{ id:'decision', blocksProgression:true }];
assert.equal(getPrimaryCareerAction(s).type, 'RESPOND');

const match = simulateMatch({ teamA: teams[0], teamB: teams[1], players, bestOf: 3, seed: 'unit' });
assert.equal(match.ok, true);
assert.ok(match.winner);
assert.match(match.seriesScore, /^[0-2]-[0-2]$/);
assert.ok(match.maps[0].teamAStats[0].rating > 0);

s = state('2026-01-13');
s.fixtures = [{ id:'f1', tournamentId:'blast_bounty_s1', scheduledDate:'2026-01-13', bestOf:3, teamAId:'team_vitality', teamBId:'betboom', userTeamInvolved:true, simulated:false, status:'scheduled', round:'Group Stage - Match 2' }];
let out = simulateFixture(s, 'f1', initialData);
assert.ok(out.result.winner);
assert.ok(out.result.playerStatistics.every((row) => row.rating >= 0.6));
assert.equal(out.state.matchResults.length, 1);
out = simulateFixture(out.state, 'f1', initialData);
assert.equal(out.error, 'Match already completed.');
console.log('career simulation tests passed');
