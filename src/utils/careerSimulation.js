import { advanceOneDay, isSameDay } from './careerClock.js';
import { compareDate, monthNameFromDate } from './calendarDates.js';
import { buildInviteSnapshot, snapshotTeams } from './eventInviteEngine.js';
import { simulateMatch } from './matchEngine.js';

const makeId = (...parts) => parts.filter(Boolean).join('-').toLowerCase().replace(/[^a-z0-9]+/g, '-');
export const EVENT_TYPES = ['match','training','recovery','injuryUpdate','transferOffer','contractOffer','scoutingReport','tournamentInvite','tournamentRegistration','rosterDeadline','lineupRequired','news','rankingUpdate','financeUpdate','boardMessage','playerConversation'];

export function createCalendarEvent(input) {
  return { id: input.id, date: input.date, type: input.type || 'news', priority: input.priority ?? 1, title: input.title || 'Calendar event', description: input.description || '', relatedTeamIds: input.relatedTeamIds || [], relatedPlayerIds: input.relatedPlayerIds || [], relatedTournamentId: input.relatedTournamentId || null, relatedMatchId: input.relatedMatchId || null, requiresUserAction: !!input.requiresUserAction, blocksProgression: !!input.blocksProgression, resolved: !!input.resolved, createdAt: input.createdAt || new Date().toISOString(), metadata: input.metadata || {} };
}

export function generateInitialFixtures({ events, rankings, teams, selectedTeamId }) {
  const fixtures = [];
  const calendarEvents = [];
  events.forEach((event) => {
    const snapshot = buildInviteSnapshot(event, rankings, teams);
    const invitees = snapshotTeams(snapshot, teams);
    const field = invitees.length >= 2 ? invitees : teams.slice(0, Math.min(event.teams || 16, teams.length));
    for (let i = 0; i < Math.min(field.length, event.teams || field.length); i += 2) {
      const teamA = field[i]; const teamB = field[i + 1];
      if (!teamA || !teamB) continue;
      const n = i / 2 + 1;
      const isUser = [teamA.teamId, teamB.teamId].includes(selectedTeamId);
      const fixture = { id: makeId('fixture', event.eventId, 'group', n), tournamentId: event.eventId, stageId: 'group', scheduledDate: event.startDate, scheduledTime: '18:00', bestOf: 3, teamAId: teamA.teamId, teamBId: teamB.teamId, status: 'scheduled', result: null, mapScores: [], playerStatistics: [], userTeamInvolved: isUser, simulated: false, round: `Group Stage - Match ${n}`, groupId: 'A', bracketPosition: n };
      fixtures.push(fixture);
      calendarEvents.push(createCalendarEvent({ id: makeId('event', fixture.id), date: fixture.scheduledDate, type: 'match', priority: isUser ? 100 : 20, title: `${teamA.shortName || teamA.name} vs ${teamB.shortName || teamB.name}`, description: `${event.name} · ${fixture.round} · Best of ${fixture.bestOf}`, relatedTeamIds: [teamA.teamId, teamB.teamId], relatedTournamentId: event.eventId, relatedMatchId: fixture.id, requiresUserAction: isUser, blocksProgression: isUser }));
    }
  });
  return { fixtures, calendarEvents };
}

export function getTodayUserFixture(state) { return (state.fixtures || []).find((f) => f.userTeamInvolved && !f.simulated && f.status !== 'completed' && isSameDay(f.scheduledDate, state.currentDate)); }
export function getNextFixture(state, teamId = state.selectedTeamId) { return (state.fixtures || []).filter((f) => !f.simulated && f.status !== 'completed' && [f.teamAId, f.teamBId].includes(teamId) && compareDate(f.scheduledDate, state.currentDate) >= 0).sort((a,b)=>compareDate(a.scheduledDate,b.scheduledDate))[0] || null; }
export function getPrimaryCareerAction(state) {
  const fixture = getTodayUserFixture(state);
  if (fixture) return { type: 'PLAY_MATCH', label: 'PLAY MATCH', fixtureId: fixture.id, disabled: false };
  const blocking = (state.inboxItems || []).find((i) => i.blocksProgression && !i.resolved) || (state.calendarEvents || []).find((e) => e.blocksProgression && !e.resolved && e.type !== 'match' && compareDate(e.date, state.currentDate) <= 0);
  if (blocking) return { type: 'RESPOND', label: 'RESPOND', inboxItemId: blocking.id, disabled: false };
  return { type: 'CONTINUE', label: 'CONTINUE', disabled: false };
}

export function aggregatePlayerStats(maps) {
  const by = new Map();
  maps.forEach((map) => [...(map.teamAStats||[]), ...(map.teamBStats||[])].forEach((s) => {
    const row = by.get(s.playerId) || { ...s, kills:0,deaths:0,assists:0,ADR:0,KAST:0,headshotPercentage:0,openingKills:0,clutches:0,multiKills:0,rating:0,maps:0 };
    row.kills += s.kills; row.deaths += s.deaths; row.assists += s.assists; row.ADR += s.ADR; row.headshotPercentage += s.headshotPercentage; row.openingKills += s.openingKills || 0; row.clutches += s.clutches || 0; row.maps += 1;
    by.set(s.playerId, row);
  }));
  return [...by.values()].map((r) => { const kd = r.kills / Math.max(1,r.deaths); const kast = Math.max(52, Math.min(92, Math.round(62 + kd * 7 + r.assists / Math.max(1,r.maps)))); const rating = Math.max(0.6, Math.min(1.9, (0.42*(r.kills/Math.max(1,r.deaths))) + (0.22*(r.ADR/r.maps/80)) + (0.16*(kast/72)) + (0.1*(r.openingKills/Math.max(1,r.maps)/2)) + (0.1*(r.clutches/Math.max(1,r.maps)/1.5)))); return { ...r, ADR: Math.round(r.ADR / r.maps), KAST: kast, headshotPercentage: Math.round(r.headshotPercentage / r.maps), rating: Math.round(rating * 100) / 100, kdDiff: r.kills - r.deaths }; });
}

export function simulateFixture(state, fixtureId, initialData) {
  const fixture = (state.fixtures || []).find((f) => f.id === fixtureId);
  if (!fixture) return { state, error: 'Fixture not found.' };
  if (fixture.simulated || fixture.status === 'completed') return { state, error: 'Match already completed.' };
  const teamA = initialData.teams.find((t)=>t.teamId===fixture.teamAId); const teamB = initialData.teams.find((t)=>t.teamId===fixture.teamBId);
  if (!teamA || !teamB) return { state, error: 'Missing opponent.' };
  const result = simulateMatch({ teamA, teamB, players: initialData.players, teamMapRatings: initialData.teamMapRatings, bestOf: fixture.bestOf, seed: `${state.careerRandomnessSeed}-${fixture.id}-${fixture.scheduledDate}` });
  if (!result.ok) return { state, error: result.error };
  const stats = aggregatePlayerStats(result.maps);
  const mvp = [...stats].sort((a,b)=>b.rating-a.rating)[0];
  const event = initialData.events.find((e)=>e.eventId===fixture.tournamentId);
  const matchRecord = { id: fixture.id, fixtureId: fixture.id, tournamentId: fixture.tournamentId, tournamentName: event?.name || 'Tournament', stage: fixture.round, date: fixture.scheduledDate, bestOf: fixture.bestOf, teamA, teamB, winner: result.winner, loser: result.winner.teamId === teamA.teamId ? teamB : teamA, seriesScore: result.seriesScore, maps: result.maps, playerStatistics: stats, matchMvp: mvp, acknowledged: false };
  const fixtures = state.fixtures.map((f)=>f.id===fixture.id?{...f,status:'completed',simulated:true,result:matchRecord,mapScores:result.maps,playerStatistics:stats}:f);
  const calendarEvents = (state.calendarEvents||[]).map((e)=>e.relatedMatchId===fixture.id?{...e,resolved:true,blocksProgression:false,requiresUserAction:false}:e);
  return { state: { ...state, fixtures, calendarEvents, matchResults: [matchRecord, ...(state.matchResults||[])], recentResults: [`${matchRecord.winner.shortName} beat ${matchRecord.loser.shortName} ${result.seriesScore}`, ...(state.recentResults||[])].slice(0,12), pendingMatchResultId: matchRecord.id }, result: matchRecord };
}

export function processDailySimulation(state, initialData) {
  if (getTodayUserFixture(state)) return state;
  const currentDate = advanceOneDay(state.currentDate);
  let next = { ...state, currentDate, currentMonth: monthNameFromDate(currentDate), lastProcessedDay: currentDate };
  const dueAi = (next.fixtures||[]).filter((f)=>!f.userTeamInvolved && !f.simulated && compareDate(f.scheduledDate,currentDate)<=0);
  dueAi.forEach((f)=>{ next = simulateFixture(next, f.id, initialData).state; });
  if (currentDate.endsWith('-01')) next.inboxItems = [{ id:`finance-${currentDate}`, type:'financeUpdate', title:'Monthly finance update', body:'Salaries, sponsorship and operating costs have been processed.', date:currentDate, createdAt:new Date().toISOString(), blocksProgression:false }, ...(next.inboxItems||[])].slice(0,80);
  if (currentDate.endsWith('-07') || currentDate.endsWith('-14') || currentDate.endsWith('-21') || currentDate.endsWith('-28')) next.inboxItems = [{ id:`training-${currentDate}`, type:'training', title:'Weekly training report', body:'Coaches delivered the weekly development and recovery summary.', date:currentDate, createdAt:new Date().toISOString(), blocksProgression:false }, ...(next.inboxItems||[])].slice(0,80);
  return next;
}
