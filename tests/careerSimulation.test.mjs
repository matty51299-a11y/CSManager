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

const { createServer } = await import('vite');
const React = await import('react');
const { renderToString } = await import('react-dom/server');
const { MemoryRouter } = await import('react-router-dom');

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
try {
  const { default: Dashboard } = await vite.ssrLoadModule('/src/pages/Dashboard.jsx');
  const { generateInitialFixtures, getNextFixture } = await import('../src/utils/careerSimulation.js');

  const events = [
    { eventId: 'blast_bounty_s1', name: 'BLAST Bounty Season 1', tier: 'A', teams: 4, startDate: '2026-01-08', endDate: '2026-01-18', prizePool: 500000, eventType: 'LAN' },
    { eventId: 'katowice_2026', name: 'IEM Katowice 2026', tier: 'S', teams: 4, startDate: '2026-01-15', endDate: '2026-01-25', prizePool: 1000000, eventType: 'LAN' },
  ];
  const rankings = teams.map((team, index) => ({ ...team, rank: index + 1, vrsPoints: 1000 - index * 50 }));
  const generated = generateInitialFixtures({ events, rankings, teams, selectedTeamId: 'team_vitality' });

  function dashboardState(overrides = {}) {
    const base = {
      careerStarted: true,
      currentDate: '2026-01-08',
      currentDateLabel: '8 January 2026',
      currentPhase: 'dashboard',
      selectedTeamId: 'team_vitality',
      teams,
      players,
      events,
      rankings,
      completedEvents: [],
      eventInviteSnapshots: {},
      inboxItems: [],
      fixtures: generated.fixtures,
      calendarEvents: generated.calendarEvents,
      matchResults: [],
    };
    const merged = { ...base, ...overrides };
    return { ...merged, nextFixture: getNextFixture(merged), primaryCareerAction: getPrimaryCareerAction(merged) };
  }

  function renderDashboard(gameState) {
    return renderToString(React.createElement(MemoryRouter, null, React.createElement(Dashboard, { gameState, resetCareer: () => {} })));
  }

  assert.match(renderDashboard(dashboardState()), /Upcoming Events/);
  assert.match(renderDashboard(dashboardState({ fixtures: [] })), /No scheduled fixture/);

  let advanced = dashboardState({ currentDate: '2026-01-01' });
  for (let i = 0; i < 8; i += 1) advanced = { ...processDailySimulation(advanced, initialData), teams, players, events, rankings, completedEvents: [] };
  assert.doesNotThrow(() => renderDashboard({ ...advanced, nextFixture: getNextFixture(advanced), primaryCareerAction: getPrimaryCareerAction(advanced) }));

  const aiFixture = { id:'ai1', tournamentId:'blast_bounty_s1', scheduledDate:'2026-01-08', bestOf:3, teamAId:'spirit', teamBId:'mouz', userTeamInvolved:false, simulated:true, status:'completed' };
  assert.doesNotThrow(() => renderDashboard(dashboardState({ fixtures: [aiFixture, ...generated.fixtures] })));

  const migrated = dashboardState({ fixtures: [undefined, { id:'bad1' }, { id:'bad2', scheduledDate:'bad-date', teamAId:null, status:'scheduled' }, ...generated.fixtures] });
  assert.doesNotThrow(() => renderDashboard(migrated));
  assert.equal(getNextFixture({ currentDate:'2026-01-08', selectedTeamId:'team_vitality', fixtures:[undefined, { id:'bad' }, ...generated.fixtures] })?.id, 'fixture-blast-bounty-s1-group-1');

  let actionState = dashboardState({ currentDate: '2026-01-01' });
  for (let i = 0; i < 7; i += 1) actionState = { ...processDailySimulation(actionState, initialData), teams, players, events, rankings, completedEvents: [] };
  assert.equal(getPrimaryCareerAction(actionState).type, 'PLAY_MATCH');
} finally {
  await vite.close();
}
console.log('dashboard regression tests passed');
