import { createContext, createElement, useContext, useEffect, useMemo, useState } from 'react';
import initialData from './data/gameState.js';
import { createTournament, generateEventSummary, generatePlayoffs, simulatePlayoffMatch, simulateSwissMatch } from './utils/tournamentEngine.js';
import { getNextSwissPairings } from './utils/swissEngine.js';

const STORAGE_KEY = 'csdm-career-v2';
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const monthToIndex = (month) => Math.max(0, MONTHS.indexOf(month));
const monthToWeek = (month) => monthToIndex(month) * 4 + 1;
const eventTeamCount = (event) => Number(event?.teams || event?.teamCount || 16);
const rankedTeams = (rankings) => [...rankings].sort((a,b) => Number(a.ranking||999)-Number(b.ranking||999));
const inviteesFor = (event, rankings) => rankedTeams(rankings).slice(0, Math.min(eventTeamCount(event), rankings.length)).map((t) => t.teamId);
const baseRankings = () => rankedTeams(initialData.teams);
const orderedEvents = () => [...initialData.events].sort((a,b) => monthToIndex(a.month) - monthToIndex(b.month));

function news(type, title, body, week) { return { id:`${Date.now()}-${Math.random()}`, type, title, body, week, createdAt:new Date().toISOString() }; }
function seedState() {
  return { careerStarted:false, selectedTeamId:null, season:1, week:1, monthIndex:0, currentMonth:'January', currentPhase:'team_selection', currentEventId:null, activeEventId:null, activeTournament:null, completedEvents:[], inboxItems:[], recentResults:[], rankings:baseRankings(), teamRecords:{} };
}
function loadCareer() { try { return { ...seedState(), ...(JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}) }; } catch { return seedState(); } }
function addInbox(s, title, body, type='news') { return { ...s, inboxItems:[news(type,title,body,s.week), ...s.inboxItems].slice(0,80) }; }
function nextUncompletedEvent(s) { const done = new Set(s.completedEvents.map((e) => e.eventId)); return orderedEvents().find((e) => !done.has(e.eventId) && monthToIndex(e.month) >= s.monthIndex) || orderedEvents().find((e) => !done.has(e.eventId)); }
function backgroundSummary(event, s) { const teams = inviteesFor(event, s.rankings).map((id) => initialData.teams.find((t) => t.teamId === id)).filter(Boolean); const champion = teams[0] || rankedTeams(s.rankings)[0]; return { eventId:event.eventId, eventName:event.name, champion, runnerUp:teams[1] || null, userRecord:{wins:0,losses:0}, userResults:[], prizeMoneyEarned:0, reputationChange:0, rankingMovement:'placeholder', background:true }; }
function teamRecordFromTournament(tournament, teamId) { return tournament.swiss.standings.find((r) => r.teamId === teamId) || { wins:0, losses:0, status:'active' }; }

const GameStateContext = createContext(null);
export function GameStateProvider({ children }) { const value = useGameStateValue(); return createElement(GameStateContext.Provider, { value }, children); }
export function useGameStateContext() { return useContext(GameStateContext); }

export function useGameStateValue() {
  const [career, setCareer] = useState(loadCareer);
  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(career)), [career]);
  const gameState = useMemo(() => ({ ...initialData, ...career, activeTournamentState: career.activeTournament, currentDateLabel: career.currentMonth, playerTeamId: career.selectedTeamId || initialData.playerTeamId, phase: career.currentPhase }), [career]);
  const save = (fn) => setCareer((s) => fn({ ...s }));

  const startCareer = (teamId) => save((s) => addInbox({ ...s, careerStarted:true, selectedTeamId:teamId, currentPhase:'dashboard' }, 'Career started', `You have taken charge of ${initialData.teams.find(t=>t.teamId===teamId)?.name}.`, 'career'));
  const resetCareer = () => { localStorage.removeItem(STORAGE_KEY); setCareer(seedState()); };
  const continueToNextEvent = () => save((s) => {
    const event = nextUncompletedEvent(s);
    if (!event) return addInbox({ ...s, currentPhase:'offseason_placeholder' }, 'Season complete', 'There are no more scheduled events this season.', 'calendar');
    const invited = inviteesFor(event, s.rankings).includes(s.selectedTeamId);
    const ns = { ...s, week:monthToWeek(event.month), monthIndex:monthToIndex(event.month), currentMonth:event.month, currentEventId:event.eventId, currentPhase:'event_ready' };
    return addInbox(ns, invited ? 'Event invite received' : 'Event reached: not invited', invited ? `${event.name} invited your team.` : `${event.name} is live, but your team was outside the invite cut.`, 'event');
  });
  const advanceWeek = () => save((s) => ({ ...s, week:s.week + 1, monthIndex:Math.min(11, Math.floor(s.week / 4)), currentMonth:MONTHS[Math.min(11, Math.floor(s.week / 4))], currentPhase:'advancing' }));
  const enterCurrentEvent = () => save((s) => {
    const event = initialData.events.find(e => e.eventId === s.currentEventId);
    if (!event) return s;
    const invitedIds = inviteesFor(event, s.rankings);
    if (!invitedIds.includes(s.selectedTeamId)) { const summary = backgroundSummary(event, s); return addInbox({ ...s, completedEvents:[summary, ...s.completedEvents], currentPhase:'event_complete', currentEventId:event.eventId, recentResults:[`${summary.champion.name} won ${event.name}`, ...s.recentResults].slice(0,12) }, 'Event champion crowned', `${summary.champion.name} won ${event.name} while your team watched from home.`, 'event'); }
    const teams = invitedIds.map(id => initialData.teams.find(t=>t.teamId===id)).filter(Boolean).slice(0,16);
    return addInbox({ ...s, activeEventId:event.eventId, currentEventId:event.eventId, currentPhase:'event_active', activeTournament:createTournament({ event, teams }) }, 'Event started', `${event.name} has started in the Event Hub.`, 'event');
  });
  const returnToDashboard = () => save((s) => ({ ...s, currentPhase:s.currentPhase === 'event_complete' ? 'dashboard' : s.currentPhase }));

  const updateTournament = (action, payload={}) => save((s) => {
    let t = s.activeTournament; if (!t) return s;
    const data = { players:initialData.players, teamMapRatings:initialData.teamMapRatings };
    if (action === 'swiss-match') t = simulateSwissMatch(t, payload.teamAId, payload.teamBId, data);
    if (action === 'swiss-round') { const active = t.swiss.rounds.find((r) => !r.complete); const pairings = active?.pendingPairings || getNextSwissPairings(t.swiss); const completed = new Set((active?.matches || []).map((m) => [m.teamA.teamId, m.teamB.teamId].sort().join('-'))); pairings.filter(([a,b]) => !completed.has([a.teamId,b.teamId].sort().join('-')) && ![a.teamId,b.teamId].includes(s.selectedTeamId)).forEach(([a,b]) => { t = simulateSwissMatch(t, a.teamId, b.teamId, data); }); if ((t.swiss.rounds.find((r) => !r.complete)?.pendingPairings || []).every(([a,b]) => (t.swiss.rounds.find((r) => !r.complete)?.matches || []).some((m) => [m.teamA.teamId,m.teamB.teamId].sort().join('-') === [a.teamId,b.teamId].sort().join('-')))) { t = { ...t, swiss:{ ...t.swiss, rounds:t.swiss.rounds.map((r,i,arr) => i === arr.findIndex(x=>!x.complete) ? { ...r, complete:true } : r) } }; } }
    if (action === 'playoffs') t = generatePlayoffs(t);
    if (action === 'playoff-match') t = simulatePlayoffMatch(t, payload.roundIndex, payload.matchIndex, data);
    if (action === 'playoff-round') { const ri = t.playoffs?.rounds.findIndex(r=>!r.complete && r.matches.length); if (ri >= 0) t.playoffs.rounds[ri].matches.forEach((m,i)=>{ if(!m.result) t = simulatePlayoffMatch(t, ri, i, data); }); }
    let ns = { ...s, activeTournament:t, teamRecords:{...s.teamRecords, [s.selectedTeamId]:teamRecordFromTournament(t, s.selectedTeamId)} };
    const latestUserMatch = [...t.swiss.rounds.flatMap(r=>r.matches), ...(t.playoffs?.rounds || []).flatMap(r=>r.matches.map(m=>m.result).filter(Boolean))].reverse().find(m => [m.teamA.teamId, m.teamB.teamId].includes(s.selectedTeamId));
    if (latestUserMatch && action.includes('match')) ns = addInbox(ns, 'User match result', `${latestUserMatch.winner.shortName} beat ${latestUserMatch.loser.shortName} ${latestUserMatch.seriesScore}.`, 'result');
    if (t.champion && !s.completedEvents.some(e=>e.eventId===t.event.eventId)) { const summary = generateEventSummary(t, s.selectedTeamId); ns = addInbox({ ...ns, completedEvents:[summary, ...s.completedEvents], activeEventId:null, currentPhase:'event_complete', recentResults:[...summary.userResults.map(m=>`${m.winner.shortName} beat ${m.loser.shortName} ${m.seriesScore}`), ...s.recentResults].slice(0,12) }, 'Event completed', `${t.champion.name} won ${t.event.name}.`, 'event'); }
    return ns;
  });
  return { gameState, startCareer, resetCareer, advanceWeek, continueToNextEvent, advanceTime:continueToNextEvent, enterCurrentEvent, enterEvent:enterCurrentEvent, simulateUserMatch:(a,b)=>updateTournament('swiss-match',a,b), simulateAiMatches:()=>updateTournament('swiss-round'), advanceTournamentRound:()=>updateTournament('playoffs'), completeCurrentEvent:()=>updateTournament('playoff-round'), returnToDashboard, updateTournament };
}
export function useGameState() { return useGameStateValue(); }
export { inviteesFor, orderedEvents };
