import { createContext, createElement, useContext, useEffect, useMemo, useState } from 'react';
import initialData from '../data/gameState.js';
import { CAREER_START_DATE, compareDate, dateInRange, enrichEventsWithDates, formatDate, monthNameFromDate } from '../utils/calendarDates.js';
import { generateInitialFixtures, getNextFixture, getPrimaryCareerAction, processDailySimulation, simulateFixture } from '../utils/careerSimulation.js';
import { getRankingRows, initializeVrsRankings, updateRankingsAfterEvent } from '../utils/vrsRankingEngine.js';
import { buildInviteSnapshot, getInviteStatus, snapshotTeams } from '../utils/eventInviteEngine.js';
import { getEventFormat, isBreakEvent } from '../utils/eventFormatEngine.js';
import { simulateEventFormat } from '../utils/eventStageEngine.js';
import {
  createLiveTournament,
  simulateUserMatch as ctrlSimUserMatch,
  simulateOtherMatches as ctrlSimOtherMatches,
  advanceStage as ctrlAdvanceStage,
  completeLiveEvent,
  buildLiveSummary,
  buildNewsForMatches,
} from '../utils/liveEventController.js';

const STORAGE_KEY = 'csdm-career-v4';
const eventTeamCount = (event) => Number(event?.teams || event?.teamCount || 16);
const rankedTeams = (rankings) => [...rankings].sort((a, b) => Number(a.currentRank || a.ranking || 999) - Number(b.currentRank || b.ranking || 999));
const inviteesFor = (event, rankings) => rankedTeams(rankings).slice(0, Math.min(eventTeamCount(event), rankings.length)).map((t) => t.teamId);
const baseRankings = () => initializeVrsRankings(initialData.teams);
const datedEvents = () => enrichEventsWithDates(initialData.events);
const orderedEvents = () => datedEvents().sort((a, b) => compareDate(a.startDate, b.startDate));

function news(type, title, body, date) {
  return { id: `${Date.now()}-${Math.random()}`, type, title, body, date, createdAt: new Date().toISOString() };
}

function seedState() {
  return {
    careerStarted: false,
    selectedTeamId: null,
    seasonYear: 2026,
    season: 2026,
    currentDate: CAREER_START_DATE,
    currentMonth: 'January',
    currentPhase: 'no_career',
    lastProcessedDay: CAREER_START_DATE,
    calendarEvents: [],
    fixtures: [],
    matchResults: [],
    pendingMatchResultId: null,
    currentEventId: null,
    nextEventId: null,
    activeEventId: null,
    activeTournament: null,
    completedEvents: [],
    inboxItems: [],
    recentResults: [],
    rankings: baseRankings(),
    teamRecords: {},
    eventInviteSnapshots: {},
    careerRandomnessSeed: Math.random().toString(36).slice(2),
  };
}

function loadCareer() {
  try {
    const s = { ...seedState(), ...JSON.parse(localStorage.getItem(STORAGE_KEY)) };
    return { ...s, currentDate: s.currentDate || CAREER_START_DATE, lastProcessedDay: s.lastProcessedDay || s.currentDate || CAREER_START_DATE, rankings: s.rankings?.[0]?.vrsPoints ? s.rankings : baseRankings(), eventInviteSnapshots: s.eventInviteSnapshots || {}, calendarEvents: s.calendarEvents || [], fixtures: s.fixtures || [], matchResults: s.matchResults || [], pendingMatchResultId: s.pendingMatchResultId || null };
  } catch {
    return seedState();
  }
}

function addInbox(s, title, body, type = 'news') {
  return { ...s, inboxItems: [news(type, title, body, s.currentDate), ...s.inboxItems].slice(0, 80) };
}

function nextUncompletedEvent(s) {
  const done = new Set(s.completedEvents.map((e) => e.eventId));
  return orderedEvents().find((e) => !done.has(e.eventId) && compareDate(e.endDate, s.currentDate) >= 0)
    || orderedEvents().find((e) => !done.has(e.eventId));
}

const matchData = () => ({ players: initialData.players, teamMapRatings: initialData.teamMapRatings });

function userRecordFromMatches(allMatches, teamId) {
  return allMatches
    .filter((m) => [m.teamA.teamId, m.teamB.teamId].includes(teamId))
    .reduce((r, m) => ({ wins: r.wins + (m.winner.teamId === teamId ? 1 : 0), losses: r.losses + (m.winner.teamId !== teamId ? 1 : 0) }), { wins: 0, losses: 0 });
}

// Simulate an event the user is NOT invited to, using its real format.
// Returns the new state with VRS updated, news created and the date advanced.
function runBackgroundEvent(s, event, snapshot) {
  const data = matchData();
  const field = snapshotTeams(snapshot, initialData.teams).map((team) => ({
    ...team,
    ranking: getRankingRows(s.rankings, initialData.teams).find((r) => r.teamId === team.teamId)?.currentRank || team.ranking,
  }));
  const result = simulateEventFormat({ event, teams: field, data });
  const isBreak = result.isBreak || isBreakEvent(event);

  const rankingsAfter = isBreak
    ? s.rankings
    : updateRankingsAfterEvent(s.rankings, { event, champion: result.champion, allMatches: result.allMatches }, initialData.teams);
  const before = getRankingRows(s.rankings, initialData.teams).find((r) => r.teamId === s.selectedTeamId);
  const after = getRankingRows(rankingsAfter, initialData.teams).find((r) => r.teamId === s.selectedTeamId);

  const summary = {
    eventId: event.eventId,
    eventName: event.name,
    formatType: result.formatType,
    champion: result.champion,
    runnerUp: result.runnerUp,
    placements: (result.placements || []).slice(0, 8),
    userRecord: { wins: 0, losses: 0 },
    userResults: [],
    prizeMoneyEarned: 0,
    reputationChange: 0,
    background: true,
    rankBefore: before?.currentRank,
    rankAfter: after?.currentRank,
    rankMovement: after?.rankMovement || 0,
    vrsPointDelta: Math.round((after?.vrsPoints || 0) - (before?.vrsPoints || 0)),
  };

  let ns = {
    ...s,
    rankings: rankingsAfter,
    completedEvents: [summary, ...s.completedEvents],
    currentDate: event.endDate,
    currentMonth: monthNameFromDate(event.endDate),
    currentPhase: 'dashboard',
    currentEventId: event.eventId,
    activeEventId: null,
    recentResults: result.champion
      ? [`${result.champion.name} won ${event.name}`, ...s.recentResults].slice(0, 12)
      : s.recentResults,
  };
  (result.news || []).forEach((item) => { ns = addInbox(ns, item.title, item.body, item.type || 'event'); });
  return ns;
}

// Apply a controller mutation to the active tournament, then fold in news and
// the user's latest match result, and refresh the user's team record.
function applyLiveAction(s, controllerFn) {
  const t0 = s.activeTournament;
  if (!t0) return s;
  const t = controllerFn(t0, matchData());
  const added = t.allMatches.slice(t0.allMatches.length);
  let ns = { ...s, activeTournament: t, teamRecords: { ...s.teamRecords, [s.selectedTeamId]: userRecordFromMatches(t.allMatches, s.selectedTeamId) } };
  buildNewsForMatches(added, t.event).forEach((item) => { ns = addInbox(ns, item.title, item.body, item.type || 'event'); });
  const userAdded = added.filter((m) => [m.teamA.teamId, m.teamB.teamId].includes(s.selectedTeamId));
  const last = userAdded[userAdded.length - 1];
  if (last && last.winner && last.loser) {
    ns = addInbox(ns, 'User match result', `${last.winner.shortName} beat ${last.loser.shortName} ${last.seriesScore}.`, 'result');
  }
  return ns;
}

// Finalise an interactive event: prizes, VRS movement, summary, date advance.
function finishLiveEvent(s) {
  const t = s.activeTournament;
  if (!t?.champion) return s;
  if (s.completedEvents.some((e) => e.eventId === t.event.eventId)) {
    return { ...s, currentPhase: 'event_complete' };
  }
  const finalized = completeLiveEvent(t);
  const rankingsAfter = updateRankingsAfterEvent(s.rankings, finalized, initialData.teams);
  const before = getRankingRows(s.rankings, initialData.teams).find((r) => r.teamId === s.selectedTeamId);
  const after = getRankingRows(rankingsAfter, initialData.teams).find((r) => r.teamId === s.selectedTeamId);
  const base = buildLiveSummary(finalized, s.selectedTeamId);
  const summary = {
    ...base,
    rankBefore: before?.currentRank,
    rankAfter: after?.currentRank,
    rankMovement: after?.rankMovement || 0,
    vrsPointDelta: Math.round((after?.vrsPoints || 0) - (before?.vrsPoints || 0)),
    formChange: Math.round((after?.formRating || 0) - (before?.formRating || 0)),
    majorMovers: getRankingRows(rankingsAfter, initialData.teams).filter((r) => Math.abs(r.rankMovement || 0) >= 3).slice(0, 6),
  };
  let ns = {
    ...s,
    activeTournament: finalized,
    rankings: rankingsAfter,
    completedEvents: [summary, ...s.completedEvents],
    currentDate: t.event.endDate,
    currentMonth: monthNameFromDate(t.event.endDate),
    activeEventId: null,
    currentPhase: 'event_complete',
    recentResults: [
      ...summary.userResults.map((m) => `${m.winner.shortName} beat ${m.loser.shortName} ${m.seriesScore}`),
      ...s.recentResults,
    ].slice(0, 12),
  };
  ns = addInbox(ns, 'Event completed', `${t.champion.name} won ${t.event.name}.`, 'event');
  return ns;
}

const GameStateContext = createContext(null);
export function GameStateProvider({ children }) {
  const value = useGameStateValue();
  return createElement(GameStateContext.Provider, { value }, children);
}
export function useGameStateContext() { return useContext(GameStateContext); }

export function useGameStateValue() {
  const [career, setCareer] = useState(loadCareer);
  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(career)); }, [career]);

  const gameState = useMemo(() => {
    const rankingRows = getRankingRows(career.rankings, initialData.teams);
    const rankById = new Map(rankingRows.map((row) => [row.teamId, row]));
    const rankedTeamData = initialData.teams.map((team) => {
      const rank = rankById.get(team.teamId);
      return { ...team, ...rank, ranking: rank?.currentRank || team.ranking };
    });
    return ({
      ...initialData,
      teams: rankedTeamData,
      events: datedEvents(),
      ...career,
      activeTournament: career.activeTournament || null,
      nextFixture: getNextFixture(career),
      primaryCareerAction: getPrimaryCareerAction(career),
      pendingMatchResult: (career.matchResults || []).find((m) => m.id === career.pendingMatchResultId) || null,
      currentDateLabel: formatDate(career.currentDate),
      playerTeamId: career.selectedTeamId || initialData.playerTeamId,
      phase: career.currentPhase,
    });
  }, [career]);

  const save = (fn) => setCareer((s) => fn({ ...s }));

  const goToTeamSelection = () => save((s) => ({ ...s, currentPhase: 'team_selection' }));

  const startCareer = (teamId) => save((s) => {
    const team = initialData.teams.find((t) => t.teamId === teamId);
    if (!team) return s;
    const generated = generateInitialFixtures({ events: datedEvents(), rankings: s.rankings, teams: initialData.teams, selectedTeamId: teamId });
    return addInbox(
      { ...s, careerStarted: true, selectedTeamId: teamId, currentDate: CAREER_START_DATE, currentMonth: monthNameFromDate(CAREER_START_DATE), currentPhase: 'dashboard', fixtures: generated.fixtures, calendarEvents: generated.calendarEvents, matchResults: [] },
      'Career started',
      `You have taken charge of ${team.name}.`,
      'career',
    );
  });

  const resetCareer = () => { localStorage.removeItem(STORAGE_KEY); setCareer(seedState()); };


  const continueCareer = () => save((s) => {
    if (getPrimaryCareerAction(s).type !== 'CONTINUE') return s;
    return processDailySimulation(s, initialData);
  });

  const playFixture = (fixtureId) => save((s) => simulateFixture(s, fixtureId, initialData).state);

  const acknowledgeMatchResult = () => save((s) => ({
    ...s,
    pendingMatchResultId: null,
    matchResults: (s.matchResults || []).map((m) => (m.id === s.pendingMatchResultId ? { ...m, acknowledged: true } : m)),
  }));

  const advanceToNextEvent = () => save((s) => {
    const event = nextUncompletedEvent(s);
    if (!event) {
      return addInbox({ ...s, currentPhase: 'season_complete' }, 'Season complete', 'There are no more scheduled events this season.', 'calendar');
    }
    const snapshot = buildInviteSnapshot(event, s.rankings, initialData.teams);
    const inviteStatus = getInviteStatus(event, s.rankings, initialData.teams, s.selectedTeamId, snapshot);
    const invited = inviteStatus.invited;
    const ns = {
      ...s,
      currentDate: event.startDate,
      seasonYear: Number(event.startDate.slice(0, 4)),
      season: Number(event.startDate.slice(0, 4)),
      currentMonth: monthNameFromDate(event.startDate),
      currentEventId: event.eventId,
      nextEventId: event.eventId,
      currentPhase: dateInRange(event.startDate, event.startDate, event.endDate) ? 'event_ready' : 'dashboard',
      eventInviteSnapshots: { ...s.eventInviteSnapshots, [event.eventId]: snapshot },
    };
    return addInbox(
      ns,
      invited ? 'Event invite received' : 'Event reached: not invited',
      invited ? `${event.name} invited your team as seed #${inviteStatus.seed}.` : `${event.name} is live, but ${inviteStatus.reason}`,
      'event',
    );
  });

  // Enter an event. Break events and events the user is not invited to are
  // simulated in the background. Invited events now build a real live tournament
  // using the selected event's actual format and play it interactively.
  const enterEvent = () => save((s) => {
    const event = orderedEvents().find((e) => e.eventId === s.currentEventId);
    if (!event) return s;
    const snapshot = s.eventInviteSnapshots?.[event.eventId] || buildInviteSnapshot(event, s.rankings, initialData.teams);
    const invitedIds = snapshot.invitees.map((invite) => invite.teamId);
    const format = getEventFormat(event);

    if (isBreakEvent(event) || !invitedIds.includes(s.selectedTeamId)) {
      return runBackgroundEvent(s, event, snapshot);
    }

    const liveSnapshot = { ...snapshot, userTeamId: s.selectedTeamId };
    return addInbox(
      {
        ...s,
        currentDate: event.startDate,
        currentMonth: monthNameFromDate(event.startDate),
        activeEventId: event.eventId,
        currentEventId: event.eventId,
        currentPhase: 'event_active',
        activeTournament: createLiveTournament(event, liveSnapshot, initialData.teams, s.rankings),
      },
      'Event started',
      `${event.name} (${format.label}) has started in the Event Hub.`,
      'event',
    );
  });

  const returnToDashboard = () => save((s) => ({
    ...s,
    currentPhase: s.currentPhase === 'event_complete' ? 'dashboard' : s.currentPhase,
    activeTournament: s.currentPhase === 'event_complete' ? null : s.activeTournament,
    activeEventId: s.currentPhase === 'event_complete' ? null : s.activeEventId,
  }));

  // Interactive live-event actions (PART 3). Each inspects the active
  // tournament's format via the controller, so no button assumes Swiss.
  const simUserMatch = () => save((s) => applyLiveAction(s, (t, data) => ctrlSimUserMatch(t, s.selectedTeamId, data)));
  const simOtherMatches = () => save((s) => applyLiveAction(s, (t, data) => ctrlSimOtherMatches(t, s.selectedTeamId, data)));
  const advanceEventStage = () => save((s) => {
    if (!s.activeTournament) return s;
    return { ...s, activeTournament: ctrlAdvanceStage(s.activeTournament) };
  });
  const finishEvent = () => save((s) => finishLiveEvent(s));
  const completeCurrentEvent = () => save((s) => finishLiveEvent(s));

  return {
    gameState,
    goToTeamSelection,
    startCareer,
    resetCareer,
    advanceToNextEvent,
    continueCareer,
    playFixture,
    acknowledgeMatchResult,
    enterEvent,
    // new format-agnostic live actions
    simUserMatch,
    simOtherMatches,
    advanceEventStage,
    finishEvent,
    completeCurrentEvent,
    returnToDashboard,
    // backward-compatible aliases so older call sites keep working
    simOtherMatch: simOtherMatches,
    simAiMatches: simOtherMatches,
    advanceSwissRound: advanceEventStage,
    generatePlayoffs: advanceEventStage,
    simPlayoffRound: advanceEventStage,
    completeEvent: finishEvent,
  };
}

export function useGameState() { return useGameStateValue(); }
export { inviteesFor, orderedEvents };
