import { advanceOneDay, isSameDay } from './careerClock.js';
import { addDays, compareDate, monthNameFromDate } from './calendarDates.js';
import { buildInviteSnapshot, snapshotTeams } from './eventInviteEngine.js';
import { simulateMatch } from './matchEngine.js';

const makeId = (...parts) => parts.filter(Boolean).join('-').toLowerCase().replace(/[^a-z0-9]+/g, '-');
export const EVENT_TYPES = ['match','training','recovery','injuryUpdate','transferOffer','contractOffer','scoutingReport','tournamentInvite','tournamentRegistration','rosterDeadline','lineupRequired','news','rankingUpdate','financeUpdate','boardMessage','playerConversation'];

export function createCalendarEvent(input) {
  return { id: input.id, date: input.date, type: input.type || 'news', priority: input.priority ?? 1, title: input.title || 'Calendar event', description: input.description || '', relatedTeamIds: input.relatedTeamIds || [], relatedPlayerIds: input.relatedPlayerIds || [], relatedTournamentId: input.relatedTournamentId || null, relatedMatchId: input.relatedMatchId || null, requiresUserAction: !!input.requiresUserAction, blocksProgression: !!input.blocksProgression, resolved: !!input.resolved, createdAt: input.createdAt || new Date().toISOString(), metadata: input.metadata || {} };
}

export function getTournamentFormatDefinition(event) {
  const teams = Number(event?.teams || event?.teamCount || 8);
  const base = {
    tournamentId: event?.eventId,
    name: event?.name,
    startDate: event?.startDate,
    endDate: event?.endDate,
    participatingTeams: teams,
    status: 'upcoming',
    prizeDistribution: [0.4, 0.2, 0.1, 0.1],
    rankingPoints: event?.rankingWeight || 50,
    bestOfByStage: { group: 3, quarterfinal: 3, semifinal: 3, final: 5, grandFinal: 5 },
    seedingRules: 'vrs',
  };
  const fmt = String(event?.format || '').toLowerCase();
  if (fmt.includes('group') || fmt.includes('league')) {
    const groups = fmt.includes('8_groups') ? 8 : fmt.includes('two_groups') ? 2 : Math.max(2, Math.min(4, Math.ceil(teams / 4)));
    return { ...base, format: 'group_playoff', stages: ['group', 'semifinal', 'final'], numberOfGroups: groups, teamsPerGroup: Math.ceil(teams / groups), matchesPerTeam: Math.max(1, Math.ceil(teams / groups) - 1), advancementRules: { advancePerGroup: 2 }, eliminationRules: 'bottom group teams eliminated', bracketSize: Math.min(16, groups * 2), currentStage: 'group' };
  }
  if (fmt.includes('double')) return { ...base, format: 'double_elimination', stages: ['upper', 'lower', 'lowerFinal', 'grandFinal'], bracketSize: teams, currentStage: 'upper' };
  if (fmt.includes('swiss') || fmt.includes('major')) return { ...base, format: 'swiss_playoff', stages: ['swiss', 'quarterfinal', 'semifinal', 'final'], matchesPerTeam: 5, advancementRules: { winsToQualify: 3, lossesToEliminate: 3 }, bracketSize: 8, currentStage: 'swiss' };
  return { ...base, format: 'single_elimination', stages: ['roundOf32','roundOf16','quarterfinal','semifinal','final'], eliminationRules: 'single loss eliminated', bracketSize: teams, currentStage: teams > 16 ? 'roundOf32' : teams > 8 ? 'roundOf16' : teams > 4 ? 'quarterfinal' : teams > 2 ? 'semifinal' : 'final' };
}

const stageNameForSize = (size) => size >= 32 ? 'roundOf32' : size >= 16 ? 'roundOf16' : size >= 8 ? 'quarterfinal' : size >= 4 ? 'semifinal' : 'final';
const stageLabel = (stage) => ({ roundOf32:'Round of 32', roundOf16:'Round of 16', quarterfinal:'Quarterfinal', semifinal:'Semifinal', final:'Final', group:'Group Stage' }[stage] || stage);
const nextStage = (stage) => ({ roundOf32:'roundOf16', roundOf16:'quarterfinal', quarterfinal:'semifinal', semifinal:'final' }[stage] || null);
function emptyGroupRow(teamId) { return { teamId, played:0, wins:0, losses:0, mapsWon:0, mapsLost:0, mapDifference:0, roundsWon:0, roundsLost:0, roundDifference:0, points:0, headToHead:{}, position:0, qualificationStatus:'pending' }; }
function sortGroupRows(rows) { return [...rows].sort((a,b)=> b.points-a.points || b.mapDifference-a.mapDifference || b.roundDifference-a.roundDifference || b.mapsWon-a.mapsWon || a.teamId.localeCompare(b.teamId)).map((r,i)=>({...r, position:i+1})); }

function createTournamentState(event, field) {
  const format = getTournamentFormatDefinition(event);
  const participants = field.slice(0, Math.min(format.participatingTeams, field.length)).map((team, index) => ({ teamId: team.teamId, seed: index + 1, eliminated:false }));
  const state = { id:event.eventId, name:event.name, status:'active', format, participants, currentStage:format.currentStage, fixtures:[], groupTables:{}, bracket:{ rounds:[] }, eliminatedTeamIds:[], champion:null, runnerUp:null, placements:[], prizePayouts:[], rankingPointsAwarded:false, prizeMoneyAwarded:false };
  if (format.format === 'group_playoff') {
    const groups = Array.from({ length: format.numberOfGroups }, (_, i) => String.fromCharCode(65 + i));
    groups.forEach((g)=>{ state.groupTables[g] = { groupId:g, rows:[] }; });
    participants.forEach((p,i)=> state.groupTables[groups[i % groups.length]].rows.push(emptyGroupRow(p.teamId)));
    Object.values(state.groupTables).forEach((table)=>{ table.rows = sortGroupRows(table.rows); });
  }
  return state;
}

function makeFixture(event, tournament, stage, teamAId, teamBId, scheduledDate, bestOf, selectedTeamId, slot, groupId=null) {
  const isUser = [teamAId, teamBId].includes(selectedTeamId);
  return { id: makeId('fixture', event.eventId, stage, groupId, slot, teamAId, teamBId), tournamentId:event.eventId, stageId:stage, scheduledDate, scheduledTime:'18:00', bestOf, teamAId, teamBId, status:'scheduled', result:null, mapScores:[], playerStatistics:[], userTeamInvolved:isUser, simulated:false, round:`${stageLabel(stage)} - Match ${slot}`, groupId, bracketPosition:slot, nextFixtureId:null };
}
function eventForFixture(fixture, event, teamA, teamB) { return createCalendarEvent({ id: makeId('event', fixture.id), date: fixture.scheduledDate, type:'match', priority: fixture.userTeamInvolved ? 100 : 20, title:`${teamA.shortName || teamA.name} vs ${teamB.shortName || teamB.name}`, description:`${event.name} · ${fixture.round} · Best of ${fixture.bestOf}`, relatedTeamIds:[teamA.teamId, teamB.teamId], relatedTournamentId:event.eventId, relatedMatchId:fixture.id, requiresUserAction:fixture.userTeamInvolved, blocksProgression:fixture.userTeamInvolved }); }

export function generateInitialFixtures({ events, rankings, teams, selectedTeamId }) {
  const fixtures = []; const calendarEvents = []; const tournaments = {};
  events.filter((e)=>Number(e.teams || 0) > 0).forEach((event) => {
    const snapshot = buildInviteSnapshot(event, rankings, teams);
    const invitees = snapshotTeams(snapshot, teams);
    const field = invitees.length >= 2 ? invitees : teams.slice(0, Math.min(event.teams || 16, teams.length));
    const tournament = createTournamentState(event, field); tournaments[event.eventId] = tournament;
    const byId = new Map(field.map((t)=>[t.teamId,t]));
    if (tournament.format.format === 'group_playoff') {
      Object.values(tournament.groupTables).forEach((table) => {
        const ids = table.rows.map((r)=>r.teamId);
        let slot = 1;
        for (let i=0;i<ids.length;i+=1) for (let j=i+1;j<ids.length;j+=1) {
          const f = makeFixture(event, tournament, 'group', ids[i], ids[j], addDays(event.startDate, Math.floor(slot/2)), 3, selectedTeamId, slot, table.groupId);
          fixtures.push(f); tournament.fixtures.push(f.id); calendarEvents.push(eventForFixture(f,event,byId.get(ids[i]),byId.get(ids[j]))); slot+=1;
        }
      });
    } else {
      const stage = tournament.currentStage; const ids = tournament.participants.map((p)=>p.teamId); const roundSize = 2 ** Math.floor(Math.log2(ids.length)); let slot=1;
      for (let i=0;i<roundSize;i+=2) { const f=makeFixture(event,tournament,stage,ids[i],ids[i+1],event.startDate,3,selectedTeamId,slot); fixtures.push(f); tournament.fixtures.push(f.id); calendarEvents.push(eventForFixture(f,event,byId.get(ids[i]),byId.get(ids[i+1]))); slot+=1; }
    }
  });
  return { fixtures, calendarEvents, tournaments };
}

export function getTodayUserFixture(state) { return (state.fixtures || []).find((fixture) => fixture?.userTeamInvolved && !fixture.simulated && fixture.status !== 'completed' && fixture.scheduledDate && isSameDay(fixture.scheduledDate, state.currentDate)); }
export function getNextFixture(state, teamId = state.selectedTeamId) { return (state.fixtures || []).filter((fixture) => fixture && !fixture.simulated && fixture.status !== 'completed' && fixture.scheduledDate && [fixture.teamAId, fixture.teamBId].includes(teamId) && compareDate(fixture.scheduledDate, state.currentDate) >= 0).sort((fixtureA, fixtureB) => compareDate(fixtureA.scheduledDate, fixtureB.scheduledDate))[0] || null; }
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
  let fixtures = state.fixtures.map((f)=>f.id===fixture.id?{...f,status:'completed',simulated:true,result:matchRecord,mapScores:result.maps,playerStatistics:stats}:f);
  let calendarEvents = (state.calendarEvents||[]).map((e)=>e.relatedMatchId===fixture.id?{...e,resolved:true,blocksProgression:false,requiresUserAction:false}:e);
  let tournaments = state.tournaments || {};
  const progressed = progressTournamentAfterResult({ state: { ...state, fixtures, calendarEvents, tournaments }, fixture: { ...fixture, result: matchRecord }, matchRecord, event, initialData });
  fixtures = progressed.fixtures; calendarEvents = progressed.calendarEvents; tournaments = progressed.tournaments;
  const playerStatus = applyMatchLoad(state.playerStatus || {}, [fixture.teamAId, fixture.teamBId], initialData.players);
  return { state: { ...state, fixtures, calendarEvents, tournaments, playerStatus, matchResults: [matchRecord, ...(state.matchResults||[])], recentResults: [`${matchRecord.winner.shortName} beat ${matchRecord.loser.shortName} ${result.seriesScore}`, ...(state.recentResults||[])].slice(0,12), pendingMatchResultId: matchRecord.id }, result: matchRecord };
}

function scoreParts(seriesScore) { const [a,b] = String(seriesScore || '0-0').split('-').map((n)=>Number(n)||0); return [a,b]; }
function progressGroupTable(tournament, fixture, matchRecord) {
  const table = tournament.groupTables?.[fixture.groupId]; if (!table) return tournament;
  const [mapsA,mapsB] = scoreParts(matchRecord.seriesScore);
  const roundsA = (matchRecord.maps||[]).reduce((sum,m)=>sum + (m.teamAScore || 0), 0); const roundsB = (matchRecord.maps||[]).reduce((sum,m)=>sum + (m.teamBScore || 0), 0);
  const rows = table.rows.map((row)=> {
    if (![fixture.teamAId, fixture.teamBId].includes(row.teamId)) return row;
    const isA = row.teamId === fixture.teamAId; const won = matchRecord.winner.teamId === row.teamId; const mw = isA ? mapsA : mapsB; const ml = isA ? mapsB : mapsA; const rw = isA ? roundsA : roundsB; const rl = isA ? roundsB : roundsA;
    return { ...row, played:row.played+1, wins:row.wins+(won?1:0), losses:row.losses+(won?0:1), mapsWon:row.mapsWon+mw, mapsLost:row.mapsLost+ml, mapDifference:row.mapDifference+mw-ml, roundsWon:row.roundsWon+rw, roundsLost:row.roundsLost+rl, roundDifference:row.roundDifference+rw-rl, points:row.points+(won?3:0), headToHead:{...row.headToHead, [won ? matchRecord.loser.teamId : matchRecord.winner.teamId]: won ? 'W' : 'L'} };
  });
  const sorted = sortGroupRows(rows);
  const advance = tournament.format.advancementRules?.advancePerGroup || 2;
  table.rows = sorted.map((r,i)=> ({ ...r, qualificationStatus: i < advance && r.played >= Math.max(1, sorted.length - 1) ? 'qualified' : (i >= advance && r.played >= Math.max(1, sorted.length - 1) ? 'eliminated' : 'pending') }));
  return { ...tournament, groupTables:{ ...tournament.groupTables, [fixture.groupId]: table } };
}
function existingFixture(fixtures, tournamentId, stage, a, b) { const key=[a,b].sort().join('|'); return fixtures.some((f)=>f.tournamentId===tournamentId && f.stageId===stage && [f.teamAId,f.teamBId].sort().join('|')===key); }
function progressTournamentAfterResult({ state, fixture, matchRecord, event, initialData }) {
  const tournaments = { ...state.tournaments }; let tournament = tournaments[fixture.tournamentId];
  let fixtures = state.fixtures; let calendarEvents = state.calendarEvents;
  if (!tournament) return { fixtures, calendarEvents, tournaments };
  const byId = new Map(initialData.teams.map((t)=>[t.teamId,t]));
  if (fixture.stageId === 'group') {
    tournament = progressGroupTable(tournament, fixture, matchRecord);
    const groupFixtures = fixtures.filter((f)=>f.tournamentId===fixture.tournamentId && f.stageId==='group');
    if (groupFixtures.every((f)=>f.status==='completed')) {
      const qualified = Object.values(tournament.groupTables).flatMap((table)=>sortGroupRows(table.rows).slice(0, tournament.format.advancementRules?.advancePerGroup || 2).map((r)=>r.teamId));
      const stage = stageNameForSize(qualified.length); tournament.currentStage = stage;
      for (let i=0;i<qualified.length;i+=2) { const a=qualified[i], b=qualified[i+1]; if (!a||!b||existingFixture(fixtures, fixture.tournamentId, stage, a, b)) continue; const f=makeFixture(event,tournament,stage,a,b,addDays(fixture.scheduledDate,1+Math.floor(i/2)), tournament.format.bestOfByStage?.[stage] || 3, state.selectedTeamId, (i/2)+1); fixtures=[...fixtures,f]; calendarEvents=[...calendarEvents,eventForFixture(f,event,byId.get(a),byId.get(b))]; tournament.fixtures=[...tournament.fixtures,f.id]; }
    }
  } else {
    const stageFixtures = fixtures.filter((f)=>f.tournamentId===fixture.tournamentId && f.stageId===fixture.stageId);
    const loser = matchRecord.loser.teamId; tournament.eliminatedTeamIds = [...new Set([...(tournament.eliminatedTeamIds||[]), loser])];
    if (fixture.stageId === 'final') {
      tournament = { ...tournament, status:'completed', champion:matchRecord.winner.teamId, runnerUp:matchRecord.loser.teamId, placements:[matchRecord.winner.teamId, matchRecord.loser.teamId, ...(tournament.eliminatedTeamIds||[])], prizePayouts:(tournament.format.prizeDistribution||[]).map((pct,i)=>({ teamId:[matchRecord.winner.teamId,matchRecord.loser.teamId][i] || null, amount:Math.round((event.prizePool||0)*pct) })), prizeMoneyAwarded:true, rankingPointsAwarded:true };
    } else if (stageFixtures.every((f)=>f.status==='completed')) {
      const winners = stageFixtures.map((f)=>f.result?.winner?.teamId).filter(Boolean); const ns = nextStage(fixture.stageId); tournament.currentStage = ns || fixture.stageId;
      if (ns) for (let i=0;i<winners.length;i+=2) { const a=winners[i], b=winners[i+1]; if (!a||!b||existingFixture(fixtures, fixture.tournamentId, ns, a, b)) continue; const f=makeFixture(event,tournament,ns,a,b,addDays(fixture.scheduledDate,1+Math.floor(i/2)), tournament.format.bestOfByStage?.[ns] || 3, state.selectedTeamId, (i/2)+1); fixtures=[...fixtures,f]; calendarEvents=[...calendarEvents,eventForFixture(f,event,byId.get(a),byId.get(b))]; tournament.fixtures=[...tournament.fixtures,f.id]; }
    }
  }
  tournaments[fixture.tournamentId] = tournament;
  return { fixtures, calendarEvents, tournaments };
}

function defaultPlayerStatus(players) { const out={}; (players||[]).forEach((p)=>{ out[p.playerId]={ fitness:88, condition:88, fatigue:12, injuryStatus:'healthy', injuryRecoveryDate:null, matchSharpness:55, morale:65, recentWorkload:0, developmentProgress:0 }; }); return out; }
function applyMatchLoad(status, teamIds, players) { const next={...status}; (players||[]).filter((p)=>teamIds.includes(p.teamId)).forEach((p)=>{ const row=next[p.playerId] || defaultPlayerStatus([p])[p.playerId]; next[p.playerId]={...row, fatigue:Math.min(100,row.fatigue+10), condition:Math.max(35,row.condition-6), fitness:Math.max(45,row.fitness-3), matchSharpness:Math.min(100,row.matchSharpness+4), recentWorkload:row.recentWorkload+1}; }); return next; }
function processPlayerDay(state, initialData, currentDate) { const status={...(state.playerStatus || defaultPlayerStatus(initialData.players))}; (initialData.players||[]).forEach((p)=>{ const row=status[p.playerId] || defaultPlayerStatus([p])[p.playerId]; const injured=row.injuryStatus==='injured' && row.injuryRecoveryDate && compareDate(row.injuryRecoveryDate,currentDate)>0; status[p.playerId]={...row, fatigue:Math.max(0,row.fatigue-5), condition:Math.min(100,row.condition+3), fitness:Math.min(100,row.fitness+2), injuryStatus:injured?'injured':'healthy', injuryRecoveryDate:injured?row.injuryRecoveryDate:null, morale:Math.max(0,Math.min(100,row.morale + (row.fatigue>70?-1:0))), recentWorkload:Math.max(0,row.recentWorkload-1)}; }); return status; }
function processTrainingDay(status, players, currentDate) { const weekday = new Date(`${currentDate}T00:00:00Z`).getUTCDay(); if (![2,4,6].includes(weekday)) return { status, report:null }; const next={...status}; let total=0,count=0; (players||[]).forEach((p)=>{ const row=next[p.playerId] || defaultPlayerStatus([p])[p.playerId]; const score=Math.round(55 + (row.condition-row.fatigue)*0.25 + (p.overall||75)*0.25); total+=score; count+=1; next[p.playerId]={...row, fatigue:Math.min(100,row.fatigue+4), condition:Math.max(40,row.condition-2), developmentProgress:(row.developmentProgress||0)+Math.max(0,score-60)/100, matchSharpness:Math.min(100,row.matchSharpness+1)}; }); return { status:next, report:{ date:currentDate, averageScore:Math.round(total/Math.max(1,count)), players:count } }; }


export function processDailySimulation(state, initialData) {
  if (getTodayUserFixture(state)) return state;
  const currentDate = advanceOneDay(state.currentDate);
  let playerStatus = processPlayerDay(state, initialData, currentDate);
  const training = processTrainingDay(playerStatus, initialData.players, currentDate);
  playerStatus = training.status;
  let next = { ...state, currentDate, currentMonth: monthNameFromDate(currentDate), lastProcessedDay: currentDate, playerStatus, trainingLog: training.report ? [training.report, ...(state.trainingLog||[])].slice(0,60) : (state.trainingLog||[]) };
  const dueAi = (next.fixtures||[]).filter((fixture) => fixture && !fixture.userTeamInvolved && !fixture.simulated && fixture.scheduledDate && compareDate(fixture.scheduledDate,currentDate)<=0);
  dueAi.forEach((fixture) => { next = simulateFixture(next, fixture.id, initialData).state; });
  if (currentDate.endsWith('-01')) next.inboxItems = [{ id:`finance-${currentDate}`, type:'financeUpdate', title:'Monthly finance update', body:'Salaries, sponsorship and operating costs have been processed.', date:currentDate, createdAt:new Date().toISOString(), blocksProgression:false }, ...(next.inboxItems||[])].slice(0,80);
  if (training.report && (currentDate.endsWith('-07') || currentDate.endsWith('-14') || currentDate.endsWith('-21') || currentDate.endsWith('-28'))) next.inboxItems = [{ id:`training-${currentDate}`, type:'training', title:'Weekly training report', body:`Training processed for ${training.report.players} players. Average score: ${training.report.averageScore}.`, date:currentDate, createdAt:new Date().toISOString(), blocksProgression:false, metadata:training.report }, ...(next.inboxItems||[])].slice(0,80);
  return next;
}
