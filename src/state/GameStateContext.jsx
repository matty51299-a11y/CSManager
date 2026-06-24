import { createContext, createElement, useContext, useEffect, useMemo, useState } from 'react';
import initialData from '../data/gameState.js';
import { createTournament, generateEventSummary, generatePlayoffs as generatePlayoffsBracket, simulatePlayoffMatch, simulateSwissMatch } from '../utils/tournamentEngine.js';
import { getNextSwissPairings } from '../utils/swissEngine.js';
import { CAREER_START_DATE, compareDate, dateInRange, enrichEventsWithDates, formatDate, monthNameFromDate } from '../utils/calendarDates.js';
import { getRankingRows, initializeVrsRankings, updateRankingsAfterEvent } from '../utils/vrsRankingEngine.js';
import { buildInviteSnapshot, getInviteStatus, snapshotTeams } from '../utils/eventInviteEngine.js';
import { getEventFormat, isBreakEvent } from '../utils/eventFormatEngine.js';
import { simulateEventFormat } from '../utils/eventStageEngine.js';

const STORAGE_KEY = 'csdm-career-v4';
const eventTeamCount = (event) => Number(event?.teams || event?.teamCount || 16);
const rankedTeams = (rankings) => [...rankings].sort((a, b) => Number(a.currentRank || a.ranking || 999) - Number(b.currentRank || b.ranking || 999));
const inviteesFor = (event, rankings) => rankedTeams(rankings).slice(0, Math.min(eventTeamCount(event), rankings.length)).map((t) => t.teamId);
const baseRankings = () => initializeVrsRankings(initialData.teams);
const datedEvents = () => enrichEventsWithDates(initialData.events);
const orderedEvents = () => datedEvents().sort((a, b) => compareDate(a.startDate, b.startDate));

function news(type, title, body, date) {
  return { id: `${Date.now()}-${Math.random()}`, type, title, date, createdAt: new Date().toISOString() };
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
    return { ...s, rankings: s.rankings?.[0]?.vrsPoints ? s.rankings : baseRankings(), eventInviteSnapshots: s.eventInviteSnapshots || {} };
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

// Simulate an event the user is NOT invited to, using its real format.
// Returns the new state with VRS updated, news created and the date advanced.
function runBackgroundEvent(s, event, snapshot) {
  const data = { players: initialData.players, teamMapRatings: initialData.teamMapRatings };
  const field = snapshotTeams(snapshot, initialData.teams).map((team) => ({
    ...team,
    ranking: getRankingRows(s.rankings, initialData.teams).find((r) => r.teamId === team.teamId)?.currentRank || team.ranking,
  }));
  const result = simulateEventFormat({ event, teams: field, data });
  const isBreak = result.isBreak || isBreakEvent(event);

  // Apply VRS movement from the simulated matches (skipped for breaks).
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
  // Fold the format-specific news items into the inbox.
  (result.news || []).forEach((item) => { ns = addInbox(ns, item.title, item.body, item.type || 'event'); });
  return ns;
}

function teamRecordFromTournament(tournament, teamId) {
  return tournament?.swiss?.standings?.find((r) => r.teamId === teamId) || { wins: 0, losses: 0, status: 'active' };
}

function tournamentPhase(tournament) {
  if (!tournament) return 'event_ready';
  if (tournament.champion) return 'event_complete';
  if (tournament.playoffs) return 'event_active_playoffs';
  return 'event_active_swiss';
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
    const rankedTeamData = initialData.teams.map((team) => ({ ...team, ...(rankById.get(team.teamId) || {}), ranking: rankById.get(team.teamId)?.currentRank || team.ranking }));
    return ({
    ...initialData,
    teams: rankedTeamData,
    events: datedEvents(),
    ...career,
    activeTournament: career.activeTournament || null,
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
    return addInbox(
      { ...s, careerStarted: true, selectedTeamId: teamId, currentPhase: 'dashboard' },
      'Career started',
      `You have taken charge of ${team.name}.`,
      'career',
    );
  });

  const resetCareer = () => { localStorage.removeItem(STORAGE_KEY); setCareer(seedState()); };

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
      seasonYear: Number(event.startDate.slice(0,4)),
      season: Number(event.startDate.slice(0,4)),
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

  const enterEvent = () => save((s) => {
    const event = orderedEvents().find((e) => e.eventId === s.currentEventId);
    if (!event) return s;
    const snapshot = s.eventInviteSnapshots?.[event.eventId] || buildInviteSnapshot(event, s.rankings, initialData.teams);
    const invitedIds = snapshot.invitees.map((invite) => invite.teamId);
    const format = getEventFormat(event);

    // Break events and events the user is not invited to are simulated in the
    // background using their real format, then the date advances cleanly.
    if (isBreakEvent(event) || !invitedIds.includes(s.selectedTeamId)) {
      return runBackgroundEvent(s, event, snapshot);
    }

    // Invited: play the event interactively. The live hub uses the Swiss +
    // playoffs flow as the first working version; the overlay relabels stages
    // and tabs to match this event's real format.
    const teams = invitedIds.map((id) => initialData.teams.find((t) => t.teamId === id)).filter(Boolean).slice(0, 16);
    return addInbox(
      {
        ...s,
        currentDate: event.startDate,
        currentMonth: monthNameFromDate(event.startDate),
        activeEventId: event.eventId,
        currentEventId: event.eventId,
        currentPhase: 'event_active_swiss',
        activeTournament: createTournament({
          event: { ...event, formatType: format.formatType, inviteSnapshot: snapshot },
          teams: teams.map((team) => ({ ...team, ranking: getRankingRows(s.rankings, initialData.teams).find((r) => r.teamId === team.teamId)?.currentRank || team.ranking })),
        }),
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

  const updateTournament = (action, payload = {}) => save((s) => {
    let t = s.activeTournament;
    if (!t) return s;
    const data = { players: initialData.players, teamMapRatings: initialData.teamMapRatings };

    if (action === 'swiss-match') {
      t = simulateSwissMatch(t, payload.teamAId, payload.teamBId, data);
    }
    if (action === 'swiss-round') {
      const active = t.swiss.rounds.find((r) => !r.complete);
      const pairings = active?.pendingPairings || getNextSwissPairings(t.swiss);
      const completed = new Set((active?.matches || []).map((m) => [m.teamA.teamId, m.teamB.teamId].sort().join('-')));
      pairings
        .filter(([a, b]) => !completed.has([a.teamId, b.teamId].sort().join('-')) && ![a.teamId, b.teamId].includes(s.selectedTeamId))
        .forEach(([a, b]) => { t = simulateSwissMatch(t, a.teamId, b.teamId, data); });
      const stillActive = t.swiss.rounds.find((r) => !r.complete);
      if (stillActive && (stillActive.pendingPairings || []).every(([a, b]) => (stillActive.matches || []).some((m) => [m.teamA.teamId, m.teamB.teamId].sort().join('-') === [a.teamId, b.teamId].sort().join('-')))) {
        t = { ...t, swiss: { ...t.swiss, rounds: t.swiss.rounds.map((r) => (r === stillActive ? { ...r, complete: true } : r)) } };
      }
    }
    if (action === 'playoffs') t = generatePlayoffsBracket(t);
    if (action === 'playoff-match') t = simulatePlayoffMatch(t, payload.roundIndex, payload.matchIndex, data);
    if (action === 'playoff-round') {
      const ri = t.playoffs?.rounds.findIndex((r) => !r.complete && r.matches.length);
      if (ri >= 0) {
        t.playoffs.rounds[ri].matches.forEach((m, i) => { if (!m.result) t = simulatePlayoffMatch(t, ri, i, data); });
      }
    }

    let ns = {
      ...s,
      activeTournament: t,
      currentPhase: tournamentPhase(t),
      teamRecords: { ...s.teamRecords, [s.selectedTeamId]: teamRecordFromTournament(t, s.selectedTeamId) },
    };

    const latestUserMatch = [
      ...t.swiss.rounds.flatMap((r) => r.matches),
      ...(t.playoffs?.rounds || []).flatMap((r) => r.matches.map((m) => m.result).filter(Boolean)),
    ].reverse().find((m) => [m.teamA.teamId, m.teamB.teamId].includes(s.selectedTeamId));

    if (latestUserMatch && latestUserMatch.winner && latestUserMatch.loser && action.includes('match')) {
      ns = addInbox(ns, 'User match result', `${latestUserMatch.winner.shortName} beat ${latestUserMatch.loser.shortName} ${latestUserMatch.seriesScore}.`, 'result');
    }

    if (t.champion && !s.completedEvents.some((e) => e.eventId === t.event.eventId)) {
      const rankingsAfter = updateRankingsAfterEvent(s.rankings, t, initialData.teams);
      const before = getRankingRows(s.rankings, initialData.teams).find((r) => r.teamId === s.selectedTeamId);
      const after = getRankingRows(rankingsAfter, initialData.teams).find((r) => r.teamId === s.selectedTeamId);
      const summary = { ...generateEventSummary(t, s.selectedTeamId), rankBefore: before?.currentRank, rankAfter: after?.currentRank, rankMovement: after?.rankMovement || 0, vrsPointDelta: Math.round((after?.vrsPoints || 0) - (before?.vrsPoints || 0)), formChange: Math.round((after?.formRating || 0) - (before?.formRating || 0)), majorMovers: getRankingRows(rankingsAfter, initialData.teams).filter((r) => Math.abs(r.rankMovement || 0) >= 3).slice(0, 6) };
      ns = addInbox(
        {
          ...ns,
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
        },
        'Event completed',
        `${t.champion.name} won ${t.event.name}.`,
        'event',
      );
    }
    return ns;
  });

  const simUserMatch = (payload = {}) => {
    if ('roundIndex' in payload) updateTournament('playoff-match', payload);
    else updateTournament('swiss-match', payload);
  };
  const simOtherMatch = (payload = {}) => simUserMatch(payload);
  const simAiMatches = () => updateTournament('swiss-round');
  const advanceSwissRound = () => updateTournament('swiss-round');
  const generatePlayoffs = () => updateTournament('playoffs');
  const simPlayoffRound = () => updateTournament('playoff-round');
  const completeEvent = () => save((s) => {
    const t = s.activeTournament;
    if (!t?.champion || s.completedEvents.some((e) => e.eventId === t.event.eventId)) {
      return { ...s, currentPhase: t?.champion ? 'event_complete' : s.currentPhase };
    }
    const summary = generateEventSummary(t, s.selectedTeamId);
    return addInbox(
      { ...s, completedEvents: [summary, ...s.completedEvents], currentDate: t.event.endDate, currentMonth: monthNameFromDate(t.event.endDate), activeEventId: null, currentPhase: 'event_complete' },
      'Event completed',
      `${t.champion.name} won ${t.event.name}.`,
      'event',
    );
  });

  return {
    gameState,
    goToTeamSelection,
    startCareer,
    resetCareer,
    advanceToNextEvent,
    enterEvent,
    simUserMatch,
    simOtherMatch,
    simAiMatches,
    advanceSwissRound,
    generatePlayoffs,
    simPlayoffRound,
    completeEvent,
    returnToDashboard,
  };
}

export function useGameState() { return useGameStateValue(); }
export { inviteesFor, orderedEvents };
