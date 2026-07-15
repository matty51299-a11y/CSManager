import assert from 'node:assert/strict';
import { CAREER_START_DATE, formatDate } from '../src/utils/calendarDates.js';
import { advanceOneDay, getDaysUntil } from '../src/utils/careerClock.js';
import { generateInitialFixtures, getPendingUserMatchResult, getPrimaryCareerAction, getTodayUserFixture, getUserFixtures, processDailySimulation, simulateFixture } from '../src/utils/careerSimulation.js';
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
let out = simulateFixture(s, 'f1', initialData, { userInitiated:true });
assert.ok(out.result.winner);
assert.ok(out.result.playerStatistics.every((row) => row.rating >= 0.6));
assert.equal(out.state.matchResults.length, 1);
out = simulateFixture(out.state, 'f1', initialData);
assert.equal(out.error, 'Match already completed.');

// User fixture ownership regressions.
{
  let own = state('2026-01-13');
  own.fixtures = [
    { id:'ai-due', tournamentId:'blast_bounty_s1', scheduledDate:'2026-01-13', bestOf:3, teamAId:'spirit', teamBId:'mouz', userTeamInvolved:false, simulated:false, status:'scheduled', round:'AI Match' },
    { id:'user-due', tournamentId:'blast_bounty_s1', scheduledDate:'2026-01-13', bestOf:3, teamAId:'team_vitality', teamBId:'betboom', userTeamInvolved:true, simulated:false, status:'scheduled', round:'User Match' },
  ];
  assert.equal(getPrimaryCareerAction(own).type, 'PLAY_MATCH');
  assert.equal(getTodayUserFixture(own).id, 'user-due');
  assert.equal(getUserFixtures(own).length, 1);
  const rejected = simulateFixture(own, 'ai-due', initialData, { userInitiated:true });
  assert.equal(rejected.error, 'Cannot manually play an AI-controlled fixture.');
  assert.equal(rejected.state.matchResults.length, 0);
  const aiSim = simulateFixture(own, 'ai-due', initialData, { userInitiated:false });
  assert.equal(aiSim.state.pendingMatchResultId || null, null);
  assert.equal(aiSim.state.matchResults[0].acknowledged, true);
  assert.equal(getPendingUserMatchResult(aiSim.state), null);
  const userSim = simulateFixture(aiSim.state, 'user-due', initialData, { userInitiated:true });
  assert.equal(userSim.state.pendingMatchResultId, 'user-due');
  assert.equal(getPendingUserMatchResult(userSim.state).fixtureId, 'user-due');
}

console.log('career simulation tests passed');

const { createServer } = await import('vite');
const React = await import('react');
const { renderToString } = await import('react-dom/server');
const { MemoryRouter } = await import('react-router-dom');

const vite = await createServer({ server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
try {
  const { default: Dashboard } = await vite.ssrLoadModule('/src/pages/Dashboard.jsx');
  const { generateInitialFixtures, getNextUserFixture } = await import('../src/utils/careerSimulation.js');

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
    return { ...merged, nextFixture: getNextUserFixture(merged), primaryCareerAction: getPrimaryCareerAction(merged) };
  }

  function renderDashboard(gameState) {
    return renderToString(React.createElement(MemoryRouter, null, React.createElement(Dashboard, { gameState, resetCareer: () => {} })));
  }

  assert.match(renderDashboard(dashboardState()), /Upcoming Events/);
  assert.match(renderDashboard(dashboardState({ fixtures: [] })), /No scheduled fixture/);

  let advanced = dashboardState({ currentDate: '2026-01-01' });
  for (let i = 0; i < 8; i += 1) advanced = { ...processDailySimulation(advanced, initialData), teams, players, events, rankings, completedEvents: [] };
  assert.doesNotThrow(() => renderDashboard({ ...advanced, nextFixture: getNextUserFixture(advanced), primaryCareerAction: getPrimaryCareerAction(advanced) }));

  const aiFixture = { id:'ai1', tournamentId:'blast_bounty_s1', scheduledDate:'2026-01-08', bestOf:3, teamAId:'spirit', teamBId:'mouz', userTeamInvolved:false, simulated:true, status:'completed' };
  assert.doesNotThrow(() => renderDashboard(dashboardState({ fixtures: [aiFixture, ...generated.fixtures] })));

  const migrated = dashboardState({ fixtures: [undefined, { id:'bad1' }, { id:'bad2', scheduledDate:'bad-date', teamAId:null, status:'scheduled' }, ...generated.fixtures] });
  assert.doesNotThrow(() => renderDashboard(migrated));
  assert.equal(getNextUserFixture({ currentDate:'2026-01-08', selectedTeamId:'team_vitality', fixtures:[undefined, { id:'bad' }, ...generated.fixtures] })?.id, 'fixture-blast-bounty-s1-semifinal-1-team-vitality-betboom');

  let actionState = dashboardState({ currentDate: '2026-01-01' });
  for (let i = 0; i < 7; i += 1) actionState = { ...processDailySimulation(actionState, initialData), teams, players, events, rankings, completedEvents: [] };
  assert.equal(getPrimaryCareerAction(actionState).type, 'PLAY_MATCH');
} finally {
  await vite.close();
}


// Integration: persisted single-elimination progression creates later rounds and champion once.
{
  const events = [{ eventId:'cup', name:'Test Cup', teams:4, startDate:'2026-01-03', endDate:'2026-01-08', format:'single_elim', prizePool:100000, rankingWeight:50 }];
  const generated = generateInitialFixtures({ events, rankings: teams.map((t,i)=>({...t, rank:i+1, vrsPoints:1000-i})), teams, selectedTeamId:'team_vitality' });
  let st = { ...state('2026-01-03'), fixtures: generated.fixtures, calendarEvents: generated.calendarEvents, tournaments: generated.tournaments };
  assert.equal(st.fixtures.filter((f)=>f.stageId==='semifinal').length, 2);
  st = simulateFixture(st, st.fixtures[0].id, { ...initialData, events }, { userInitiated:false }).state;
  st = simulateFixture(st, st.fixtures[1].id, { ...initialData, events }, { userInitiated:false }).state;
  assert.equal(st.fixtures.filter((f)=>f.stageId==='final').length, 1);
  const finalId = st.fixtures.find((f)=>f.stageId==='final').id;
  st.currentDate = st.fixtures.find((f)=>f.id===finalId).scheduledDate;
  st = simulateFixture(st, finalId, { ...initialData, events }, { userInitiated:false }).state;
  assert.equal(st.tournaments.cup.status, 'completed');
  assert.ok(st.tournaments.cup.champion);
  const again = simulateFixture(st, finalId, { ...initialData, events });
  assert.equal(again.error, 'Match already completed.');
  assert.equal(st.fixtures.filter((f)=>f.status!=='completed' && [f.teamAId,f.teamBId].includes(st.tournaments.cup.runnerUp)).length, 0);
}

// Integration: group-to-playoff standings persist and qualified teams advance.
{
  const events = [{ eventId:'groups', name:'Groups Cup', teams:4, startDate:'2026-01-03', endDate:'2026-01-10', format:'two_groups_to_playoffs', prizePool:100000, rankingWeight:50 }];
  const generated = generateInitialFixtures({ events, rankings: teams.map((t,i)=>({...t, rank:i+1, vrsPoints:1000-i})), teams, selectedTeamId:'team_vitality' });
  let st = { ...state('2026-01-03'), fixtures: generated.fixtures, calendarEvents: generated.calendarEvents, tournaments: generated.tournaments };
  for (const f of st.fixtures.filter((x)=>x.stageId==='group')) st = simulateFixture(st, f.id, { ...initialData, events }, { userInitiated:false }).state;
  assert.ok(Object.values(st.tournaments.groups.groupTables).every((table)=>table.rows.every((row)=>row.played >= 1 && row.position > 0)));
  assert.ok(st.fixtures.some((f)=>f.stageId==='semifinal' || f.stageId==='final'));
}

// Integration: daily systems recover fatigue, process training and block user match day.
{
  let st = state('2026-01-05');
  st.playerStatus = { 'team_vitality-0': { fitness:80, condition:70, fatigue:50, injuryStatus:'injured', injuryRecoveryDate:'2026-01-06', matchSharpness:50, morale:60, recentWorkload:2, developmentProgress:0 } };
  st.fixtures = [{ id:'block', tournamentId:'blast_bounty_s1', scheduledDate:'2026-01-05', bestOf:3, teamAId:'team_vitality', teamBId:'betboom', userTeamInvolved:true, simulated:false, status:'scheduled', round:'Group Stage - Match 2' }];
  assert.equal(processDailySimulation(st, initialData).currentDate, '2026-01-05');
  st.fixtures = [];
  st = processDailySimulation(st, initialData);
  assert.equal(st.currentDate, '2026-01-06');
  assert.equal(st.playerStatus['team_vitality-0'].injuryStatus, 'healthy');
  assert.ok(st.playerStatus['team_vitality-0'].fatigue < 50);
  assert.ok(st.trainingLog.length >= 1);
}
console.log('integration career flow tests passed');

console.log('dashboard regression tests passed');
