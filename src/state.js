import { useEffect, useMemo, useState } from 'react';
import initialData from './data/gameState.js';
import { createTournament, generateEventSummary, generatePlayoffs, simulatePlayoffMatch, simulateSwissMatch } from './utils/tournamentEngine.js';
import { getNextSwissPairings } from './utils/swissEngine.js';

const STORAGE_KEY = 'csdm-career-v1';
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const monthToWeek = (month) => Math.max(1, (MONTHS.indexOf(month) + 1 || 1) * 4 - 3);
const teamCount = (event) => Number(event?.teams || event?.teamCount || 16);
const inviteesFor = (event, rankings) => rankings.slice(0, Math.min(teamCount(event), rankings.length)).map((t) => t.teamId);
const baseRankings = () => [...initialData.teams].sort((a,b) => Number(a.ranking||999)-Number(b.ranking||999));

function seedState() {
  return { careerStarted:false, selectedTeamId:null, season:1, week:1, currentDateLabel:'January', currentPhase:'Start Screen', activeEventId:null, activeTournamentState:null, completedEvents:[], inboxItems:[], rankings:baseRankings(), teamRecords:{}, recentResults:[] };
}
function loadCareer() { try { return { ...seedState(), ...(JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}) }; } catch { return seedState(); } }
function item(type, title, body) { return { id:`${Date.now()}-${Math.random()}`, type, title, body, week:0, createdAt:new Date().toISOString() }; }

export function useGameState() {
  const [career, setCareer] = useState(loadCareer);
  useEffect(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(career)), [career]);
  const gameState = useMemo(() => ({ ...initialData, ...career, playerTeamId: career.selectedTeamId || initialData.playerTeamId, phase: career.currentPhase }), [career]);
  const save = (fn) => setCareer((s) => fn({ ...s }));
  const addInbox = (s, title, body, type='news') => ({ ...s, inboxItems: [{ ...item(type,title,body), week:s.week }, ...s.inboxItems].slice(0,50) });
  const startCareer = (teamId) => save((s) => addInbox({ ...s, careerStarted:true, selectedTeamId:teamId, currentPhase:'Manager Dashboard' }, 'Career started', `You have taken charge of ${initialData.teams.find(t=>t.teamId===teamId)?.name}.`, 'career'));
  const resetCareer = () => { localStorage.removeItem(STORAGE_KEY); setCareer(seedState()); };
  const enterEvent = (eventId) => save((s) => {
    const event = initialData.events.find(e => e.eventId === eventId);
    const teams = inviteesFor(event, s.rankings).map(id => initialData.teams.find(t=>t.teamId===id)).filter(Boolean).slice(0,16);
    return addInbox({ ...s, activeEventId:eventId, currentPhase:'Tournament', activeTournamentState:createTournament({ event, teams }) }, 'Event begins', `${event.name} has started.`, 'event');
  });
  const advanceTime = () => save((s) => {
    if (s.activeEventId) return s;
    const completed = new Set(s.completedEvents.map(e=>e.eventId));
    const events = [...initialData.events].sort((a,b)=>monthToWeek(a.month)-monthToWeek(b.month));
    const next = events.find(e => !completed.has(e.eventId) && monthToWeek(e.month) >= s.week) || events.find(e => !completed.has(e.eventId));
    if (!next) return addInbox({ ...s, week:s.week+1, currentDateLabel:MONTHS[Math.min(11, Math.floor(s.week/4))], currentPhase:'Off week' }, 'Season quiet week', 'No more scheduled events are available.', 'calendar');
    const eventWeek = monthToWeek(next.month);
    if (s.week < eventWeek) return { ...s, week:eventWeek, currentDateLabel:next.month, currentPhase:'Event Week' };
    const invited = inviteesFor(next, s.rankings).includes(s.selectedTeamId);
    return addInbox({ ...s, week:eventWeek, currentDateLabel:next.month, currentPhase: invited ? 'Event Invite' : 'Background Event', activeEventId: invited ? next.eventId : null }, invited ? 'Event invite received' : 'Event passed in background', invited ? `${next.name} invited your team.` : `${next.name} took place without your team.`, 'event');
  });
  const updateTournament = (action, payload={}) => save((s) => {
    let t = s.activeTournamentState; if (!t) return s;
    if (action === 'swiss-match') t = simulateSwissMatch(t, payload.teamAId, payload.teamBId, initialData);
    if (action === 'swiss-round') { const active = t.swiss.rounds.find((r) => !r.complete); const pairings = active?.pendingPairings || getNextSwissPairings(t.swiss); pairings.forEach(([a,b]) => { t = simulateSwissMatch(t, a.teamId, b.teamId, initialData); }); }
    if (action === 'playoffs') t = generatePlayoffs(t);
    if (action === 'playoff-match') t = simulatePlayoffMatch(t, payload.roundIndex, payload.matchIndex, initialData);
    if (action === 'playoff-round') { const ri = t.playoffs?.rounds.findIndex(r=>!r.complete && r.matches.length); t.playoffs?.rounds[ri]?.matches.forEach((m,i)=>{ if(!m.result) t = simulatePlayoffMatch(t, ri, i, initialData); }); }
    let ns = { ...s, activeTournamentState:t };
    if (t.champion && !s.completedEvents.some(e=>e.eventId===t.event.eventId)) {
      const summary = generateEventSummary(t, s.selectedTeamId);
      ns = addInbox({ ...ns, completedEvents:[summary, ...s.completedEvents], activeEventId:null, currentPhase:'Event Complete', recentResults:[...summary.userResults, ...s.recentResults].slice(0,10) }, 'Event champion crowned', `${t.champion.name} won ${t.event.name}.`, 'event');
    }
    return ns;
  });
  return { gameState, startCareer, resetCareer, advanceTime, enterEvent, updateTournament };
}
