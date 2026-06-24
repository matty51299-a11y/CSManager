// Live Event Controller
// Drives the INTERACTIVE (user-invited) event end to end using the real
// format engine. Unlike eventStageEngine.js (which simulates a whole event in
// one shot for the background/diagnostics), this controller progresses an event
// step by step so the player can sim their own match, sim the AI matches and
// advance stages.
//
// It is pure-ish: every public action takes the current activeTournament and
// returns a NEW activeTournament. React calls these through GameStateContext
// actions, never directly inside components.
//
// activeTournament shape:
//   {
//     event, formatType, userTeamId, teams (seeded field), inviteSnapshot,
//     phases: [phase], currentPhaseIndex,
//     allMatches (flat completed summarised matches),
//     eliminatedOrder (teams in the order they went out),
//     champion, runnerUp, placements, finalized,
//     userEntryStageName, trackerSteps,
//   }
//
// A phase is one progressive step (a bracket round, a Swiss stage, a group
// stage or a Play-In round). Each phase has a `kind`:
//   'bracket' -> one single-elimination round (matches list)
//   'swiss'   -> a Swiss stage (reuses swissEngine, 3 wins qualify / 3 losses out)
//   'groups'  -> round-robin groups, top N advance
// and a `role`: 'qualifier' | 'playin' | 'playoff'.

import { simulateMatch } from './matchEngine.js';
import { summarizeMatch, sortStandings } from './tournamentStandings.js';
import { createSwissTournament, getNextSwissPairings } from './swissEngine.js';
import { simulateSwissMatch } from './tournamentEngine.js';
import { getEventFormat } from './eventFormatEngine.js';
import { distributePrize } from './eventPrizeEngine.js';
import { snapshotTeams } from './eventInviteEngine.js';
import { getRankingRows } from './vrsRankingEngine.js';

// The visible stage tracker steps per format (PART 6). The last step is always
// the Champion. These are the labels shown in StageTracker.
const TRACKER_STEPS = {
  bounty32_single_elim: ['Round of 32', 'Round of 16', 'Quarter-finals', 'Semi-finals', 'Final', 'Champion'],
  swiss16_playoffs8: ['Swiss', 'Quarter-finals', 'Semi-finals', 'Final', 'Champion'],
  rivals8_groups_playoffs: ['Groups', 'Semi-finals', 'Final', 'Champion'],
  epl32_groups_playoffs: ['Groups', 'Round of 16', 'Quarter-finals', 'Semi-finals', 'Final', 'Champion'],
  iem24_playin_groups_playoffs: ['Play-In', 'Main Stage', 'Playoffs', 'Champion'],
  major32_three_stage_playoffs: ['Stage 1', 'Stage 2', 'Stage 3', 'Playoffs', 'Champion'],
};

// Which qualifying phases come before the playoff bracket, and how many teams
// reach the playoff bracket. Bounty is a pure bracket and has no qualifiers.
const PLANS = {
  bounty32_single_elim: { qualifiers: [], playoffSize: null },
  swiss16_playoffs8: { qualifiers: ['swiss'], playoffSize: 8 },
  rivals8_groups_playoffs: { qualifiers: ['groups'], playoffSize: 4 },
  epl32_groups_playoffs: { qualifiers: ['groups'], playoffSize: 16 },
  iem24_playin_groups_playoffs: { qualifiers: ['playin', 'main'], playoffSize: 8 },
  major32_three_stage_playoffs: { qualifiers: ['stage1', 'stage2', 'stage3'], playoffSize: 8 },
};

let slotCounter = 0;

// --- low level match helpers ------------------------------------------------

function makeSlot(teamA, teamB, bestOf) {
  slotCounter += 1;
  return { id: `slot-${slotCounter}`, teamA, teamB, bestOf: bestOf || 3, result: null, winner: null };
}

function simSlot(slot, data) {
  if (slot.result || !slot.teamA || !slot.teamB || slot.teamA.teamId === slot.teamB.teamId) return slot;
  const result = summarizeMatch(simulateMatch({
    teamA: slot.teamA, teamB: slot.teamB, players: data.players, teamMapRatings: data.teamMapRatings, bestOf: slot.bestOf || 3,
  }));
  return { ...slot, result, winner: result?.winner || null };
}

function roundNameForCount(n) {
  if (n <= 2) return 'Final';
  if (n <= 4) return 'Semi-finals';
  if (n <= 8) return 'Quarter-finals';
  return `Round of ${n}`;
}

// First playoff/bounty round is seeded high vs low; later rounds pair winners
// sequentially (simplified single elimination).
function seedPairs(teams) {
  const pairs = [];
  for (let i = 0; i < Math.floor(teams.length / 2); i += 1) pairs.push([teams[i], teams[teams.length - 1 - i]]);
  return pairs;
}

// --- phase builders ---------------------------------------------------------

function buildFirstBracketRound(teams, name, bestOf, trackerLabel, role, key) {
  return {
    kind: 'bracket', key: key || `bracket-${name}`, name, role: role || 'playoff', trackerLabel: trackerLabel || name,
    matches: seedPairs(teams).map(([a, b]) => makeSlot(a, b, bestOf)),
  };
}

function buildNextBracketRound(winners, name, bestOf, trackerLabel) {
  const matches = [];
  for (let i = 0; i < winners.length; i += 2) matches.push(makeSlot(winners[i], winners[i + 1], bestOf));
  return { kind: 'bracket', key: `bracket-${name}-${slotCounter}`, name, role: 'playoff', trackerLabel: trackerLabel || name, matches };
}

function buildSwissPhase(teams, name, key, trackerLabel, role) {
  return { kind: 'swiss', key, name, trackerLabel: trackerLabel || name, role: role || 'qualifier', advanceCount: 8, swiss: createSwissTournament(teams) };
}

function buildGroupsPhase(teams, groupCount, advancePerGroup, name, bestOf) {
  const groups = Array.from({ length: groupCount }, (unused, i) => ({ name: `Group ${String.fromCharCode(65 + i)}`, rows: [], matches: [] }));
  teams.forEach((team, index) => {
    const g = index % groupCount;
    groups[g].rows.push({ team, teamId: team.teamId, seed: index + 1, wins: 0, losses: 0, mapDiff: 0, status: 'active' });
  });
  groups.forEach((group) => {
    for (let i = 0; i < group.rows.length; i += 1) {
      for (let j = i + 1; j < group.rows.length; j += 1) {
        group.matches.push(makeSlot(group.rows[i].team, group.rows[j].team, bestOf));
      }
    }
  });
  return { kind: 'groups', key: 'groups', name, trackerLabel: 'Groups', role: 'qualifier', advancePerGroup, groups };
}

function playoffTrackerLabel(formatType, roundName) {
  if (formatType === 'major32_three_stage_playoffs' || formatType === 'iem24_playin_groups_playoffs') return 'Playoffs';
  return roundName;
}

// Build the very first phase a freshly-created live tournament starts on.
function buildFirstPhase(formatType, field, format) {
  switch (formatType) {
    case 'bounty32_single_elim':
      return buildFirstBracketRound(field.slice(0, 32), 'Round of 32', format.bestOf, 'Round of 32', 'playoff');
    case 'rivals8_groups_playoffs':
      return buildGroupsPhase(field.slice(0, 8), 2, 2, 'Groups', format.bestOf);
    case 'epl32_groups_playoffs':
      return buildGroupsPhase(field.slice(0, 32), 8, 2, 'Groups', format.bestOf);
    case 'iem24_playin_groups_playoffs':
      return buildFirstBracketRound(field.slice(8, 24), 'Play-In', format.bestOf, 'Play-In', 'playin', 'playin');
    case 'major32_three_stage_playoffs':
      return buildSwissPhase(field.slice(16, 32), 'Stage 1', 'stage1', 'Stage 1', 'qualifier');
    case 'swiss16_playoffs8':
    default:
      return buildSwissPhase(field.slice(0, 16), 'Swiss', 'swiss', 'Swiss', 'qualifier');
  }
}

// Build a later qualifying phase from the previous phase's advancers.
function buildQualifierPhase(t, key, advancers) {
  const field = t.teams;
  if (t.formatType === 'iem24_playin_groups_playoffs' && key === 'main') {
    return buildSwissPhase([...field.slice(0, 8), ...advancers].slice(0, 16), 'Main Stage', 'main', 'Main Stage', 'qualifier');
  }
  if (t.formatType === 'major32_three_stage_playoffs' && key === 'stage2') {
    return buildSwissPhase([...field.slice(8, 16), ...advancers].slice(0, 16), 'Stage 2', 'stage2', 'Stage 2', 'qualifier');
  }
  if (t.formatType === 'major32_three_stage_playoffs' && key === 'stage3') {
    return buildSwissPhase([...field.slice(0, 8), ...advancers].slice(0, 16), 'Stage 3', 'stage3', 'Stage 3', 'qualifier');
  }
  // Fallback: a plain Swiss stage on the advancers.
  return buildSwissPhase(advancers.slice(0, 16), key, key, key, 'qualifier');
}

// Which stage will the user first PLAY in (used for "Awaiting Stage X" state).
function userEntryStage(formatType, field, userId) {
  const seedIndex = field.findIndex((team) => team.teamId === userId);
  if (formatType === 'major32_three_stage_playoffs') {
    if (seedIndex < 8) return 'Stage 3';
    if (seedIndex < 16) return 'Stage 2';
    return 'Stage 1';
  }
  if (formatType === 'iem24_playin_groups_playoffs') {
    return seedIndex < 8 ? 'Main Stage' : 'Play-In';
  }
  return null;
}

// --- public: create ---------------------------------------------------------

export function createLiveTournament(event, snapshot, allTeams = [], rankings = []) {
  const format = getEventFormat(event);
  const rankRows = getRankingRows(rankings, allTeams);
  const rankById = new Map(rankRows.map((r) => [r.teamId, r]));
  const field = snapshotTeams(snapshot, allTeams).map((team) => ({
    ...team,
    ranking: rankById.get(team.teamId)?.currentRank || team.ranking,
  }));
  const userTeamId = snapshot.userTeamId || null;
  const firstPhase = buildFirstPhase(format.formatType, field, format);
  return {
    event,
    formatType: format.formatType,
    formatLabel: format.label,
    userTeamId,
    teams: field,
    inviteSnapshot: snapshot,
    phases: [firstPhase],
    currentPhaseIndex: 0,
    allMatches: [],
    eliminatedOrder: [],
    champion: null,
    runnerUp: null,
    placements: [],
    finalized: false,
    userEntryStageName: userEntryStage(format.formatType, field, userTeamId),
    trackerSteps: TRACKER_STEPS[format.formatType] || ['Stage', 'Champion'],
  };
}

// --- internal phase inspection ----------------------------------------------

export function currentPhase(t) {
  return t?.phases?.[t.currentPhaseIndex] || null;
}

function swissMatches(swiss) {
  return swiss.rounds.flatMap((r) => r.matches);
}

function currentSwissPairings(swiss) {
  const round = swiss.rounds.find((r) => !r.complete);
  const pendings = round?.pendingPairings || getNextSwissPairings(swiss);
  const done = new Set((round?.matches || []).map((m) => [m.teamA.teamId, m.teamB.teamId].sort().join('-')));
  return pendings.filter(([a, b]) => !done.has([a.teamId, b.teamId].sort().join('-')));
}

function findUserSwissPair(swiss, userId) {
  return currentSwissPairings(swiss).find(([a, b]) => [a.teamId, b.teamId].includes(userId)) || null;
}

function bracketWinners(phase) {
  return phase.matches.map((m) => m.winner || m.result?.winner).filter(Boolean);
}

function phaseTeams(phase) {
  if (!phase) return [];
  if (phase.kind === 'swiss') return phase.swiss.standings.map((r) => r.team);
  if (phase.kind === 'groups') return phase.groups.flatMap((g) => g.rows.map((r) => r.team));
  return phase.matches.flatMap((m) => [m.teamA, m.teamB]).filter(Boolean);
}

function computeGroupAdvancers(phase) {
  return phase.groups.flatMap((group) => {
    const sorted = [...group.rows].sort((a, b) => b.wins - a.wins || b.mapDiff - a.mapDiff || a.seed - b.seed);
    return sorted.slice(0, phase.advancePerGroup).map((r) => r.team);
  });
}

function phaseAdvancers(phase) {
  if (phase.kind === 'swiss') return phase.swiss.qualified.map((r) => r.team);
  if (phase.kind === 'groups') return computeGroupAdvancers(phase);
  return bracketWinners(phase);
}

export function isPhaseComplete(phase) {
  if (!phase) return false;
  if (phase.kind === 'swiss') return Boolean(phase.swiss.complete);
  if (phase.kind === 'groups') return phase.groups.every((g) => g.matches.every((m) => m.result));
  return phase.matches.length > 0 && phase.matches.every((m) => m.result);
}

export function getPendingMatches(t) {
  const phase = currentPhase(t);
  if (!phase || t.champion) return [];
  if (phase.kind === 'swiss') return phase.swiss.complete ? [] : currentSwissPairings(phase.swiss).map(([a, b]) => ({ teamA: a.team, teamB: b.team, id: `${a.teamId}-${b.teamId}` }));
  if (phase.kind === 'groups') return phase.groups.flatMap((g) => g.matches).filter((m) => !m.result).map((m) => ({ teamA: m.teamA, teamB: m.teamB, id: m.id }));
  return phase.matches.filter((m) => !m.result).map((m) => ({ teamA: m.teamA, teamB: m.teamB, id: m.id }));
}

function pendingUserSlot(phase, userId) {
  if (phase.kind === 'bracket') return phase.matches.find((m) => !m.result && [m.teamA?.teamId, m.teamB?.teamId].includes(userId)) || null;
  if (phase.kind === 'groups') return phase.groups.flatMap((g) => g.matches).find((m) => !m.result && [m.teamA.teamId, m.teamB.teamId].includes(userId)) || null;
  return null;
}

export function getCurrentUserMatch(t, userId) {
  const phase = currentPhase(t);
  if (!phase || t.champion) return null;
  if (phase.kind === 'swiss') {
    if (phase.swiss.complete) return null;
    const pair = findUserSwissPair(phase.swiss, userId);
    return pair ? { teamA: pair[0].team, teamB: pair[1].team, kind: 'swiss' } : null;
  }
  return pendingUserSlot(phase, userId);
}

export function isUserEliminated(t, userId) {
  if (t.champion) return t.champion.teamId !== userId && t.eliminatedOrder.some((team) => team.teamId === userId);
  if (t.eliminatedOrder.some((team) => team.teamId === userId)) return true;
  const phase = currentPhase(t);
  if (phase?.kind === 'swiss') {
    const row = phase.swiss.standings.find((r) => r.teamId === userId);
    if (row?.status === 'eliminated') return true;
  }
  return false;
}

export function isEventComplete(t) {
  return Boolean(t?.champion);
}

// --- cloning ----------------------------------------------------------------

function cloneSwissState(s) {
  return {
    ...s,
    standings: s.standings.map((r) => ({ ...r, opponents: [...r.opponents] })),
    rounds: s.rounds.map((r) => ({ ...r, matches: [...r.matches] })),
    qualified: [...s.qualified],
    eliminated: [...s.eliminated],
  };
}

function clonePhase(p) {
  if (p.kind === 'bracket') return { ...p, matches: p.matches.map((m) => ({ ...m })) };
  if (p.kind === 'groups') return { ...p, groups: p.groups.map((g) => ({ ...g, rows: g.rows.map((r) => ({ ...r })), matches: g.matches.map((m) => ({ ...m })) })) };
  if (p.kind === 'swiss') return { ...p, swiss: cloneSwissState(p.swiss) };
  return { ...p };
}

function cloneTournament(t) {
  return { ...t, phases: t.phases.map(clonePhase), allMatches: [...t.allMatches], eliminatedOrder: [...t.eliminatedOrder] };
}

// --- result application -----------------------------------------------------

function applyGroupResult(rows, result) {
  const aId = result.teamA.teamId; const bId = result.teamB.teamId;
  return rows.map((r) => {
    if (r.teamId === aId) { const w = result.winner.teamId === aId; return { ...r, wins: r.wins + (w ? 1 : 0), losses: r.losses + (w ? 0 : 1), mapDiff: r.mapDiff + (result.mapsWonA - result.mapsWonB) }; }
    if (r.teamId === bId) { const w = result.winner.teamId === bId; return { ...r, wins: r.wins + (w ? 1 : 0), losses: r.losses + (w ? 0 : 1), mapDiff: r.mapDiff + (result.mapsWonB - result.mapsWonA) }; }
    return r;
  });
}

function simSlotInPhase(t, phase, slot, data) {
  const done = simSlot(slot, data);
  if (!done.result) return;
  if (phase.kind === 'bracket') {
    phase.matches = phase.matches.map((m) => (m.id === slot.id ? done : m));
    t.allMatches.push(done.result);
    t.eliminatedOrder.push(done.result.loser);
  } else if (phase.kind === 'groups') {
    phase.groups = phase.groups.map((g) => {
      if (!g.matches.some((m) => m.id === slot.id)) return g;
      return { ...g, matches: g.matches.map((m) => (m.id === slot.id ? done : m)), rows: applyGroupResult(g.rows, done.result) };
    });
    t.allMatches.push(done.result);
  }
}

function pushNewSwissMatches(t, phase, beforeCount) {
  const after = swissMatches(phase.swiss);
  after.slice(beforeCount).forEach((m) => t.allMatches.push(m));
}

// When the final playoff match is done, crown the champion and lock placements.
function maybeSetChampion(t) {
  if (t.champion) return;
  const phase = currentPhase(t);
  if (!phase || phase.role !== 'playoff' || !isPhaseComplete(phase)) return;
  const winners = bracketWinners(phase);
  if (winners.length === 1) {
    t.champion = winners[0];
    t.runnerUp = phase.matches[0]?.result?.loser || null;
    finalizePlacements(t);
  }
}

function finalizePlacements(t) {
  const ordered = [];
  if (t.champion) ordered.push(t.champion);
  [...t.eliminatedOrder].reverse().forEach((team) => { if (!ordered.some((x) => x.teamId === team.teamId)) ordered.push(team); });
  t.teams.forEach((team) => { if (!ordered.some((x) => x.teamId === team.teamId)) ordered.push(team); });
  const placements = ordered.map((team, index) => ({ teamId: team.teamId, name: team.name, shortName: team.shortName, place: index + 1 }));
  t.placements = distributePrize(t.event, placements);
  t.finalized = true;
}

// --- public: simulate -------------------------------------------------------

export function simulateUserMatch(prev, userId, data) {
  const t = cloneTournament(prev);
  const phase = currentPhase(t);
  if (!phase || t.champion) return prev;
  if (phase.kind === 'swiss') {
    const pair = findUserSwissPair(phase.swiss, userId);
    if (!pair) return prev;
    const before = swissMatches(phase.swiss).length;
    phase.swiss = simulateSwissMatch({ swiss: phase.swiss }, pair[0].teamId, pair[1].teamId, data).swiss;
    pushNewSwissMatches(t, phase, before);
  } else {
    const slot = pendingUserSlot(phase, userId);
    if (!slot) return prev;
    simSlotInPhase(t, phase, slot, data);
  }
  maybeSetChampion(t);
  return t;
}

export function simulateOtherMatches(prev, userId, data) {
  const t = cloneTournament(prev);
  const phase = currentPhase(t);
  if (!phase || t.champion) return prev;
  if (phase.kind === 'swiss') {
    const pairs = currentSwissPairings(phase.swiss).filter(([a, b]) => ![a.teamId, b.teamId].includes(userId));
    pairs.forEach(([a, b]) => {
      const before = swissMatches(phase.swiss).length;
      phase.swiss = simulateSwissMatch({ swiss: phase.swiss }, a.teamId, b.teamId, data).swiss;
      pushNewSwissMatches(t, phase, before);
    });
  } else if (phase.kind === 'groups') {
    const slots = phase.groups.flatMap((g) => g.matches).filter((m) => !m.result && ![m.teamA.teamId, m.teamB.teamId].includes(userId));
    slots.forEach((slot) => simSlotInPhase(t, phase, slot, data));
  } else {
    const slots = phase.matches.filter((m) => !m.result && ![m.teamA.teamId, m.teamB.teamId].includes(userId));
    slots.forEach((slot) => simSlotInPhase(t, phase, slot, data));
  }
  maybeSetChampion(t);
  return t;
}

// --- public: advance --------------------------------------------------------

export function canAdvanceStage(t) {
  if (!t || t.champion) return false;
  const phase = currentPhase(t);
  if (!isPhaseComplete(phase)) return false;
  // A complete final playoff round produces a champion instead of a new stage.
  if (phase.role === 'playoff' && bracketWinners(phase).length <= 1) return false;
  return true;
}

function appendPhase(t, phase) {
  t.phases = [...t.phases, phase];
  t.currentPhaseIndex = t.phases.length - 1;
}

export function advanceStage(prev) {
  if (!canAdvanceStage(prev)) return prev;
  const t = cloneTournament(prev);
  const format = getEventFormat(t.event);
  const phase = currentPhase(t);
  const plan = PLANS[t.formatType] || { qualifiers: [], playoffSize: null };

  if (phase.role === 'playoff') {
    const winners = bracketWinners(phase);
    const isFinalNext = winners.length === 2;
    const name = roundNameForCount(winners.length);
    appendPhase(t, buildNextBracketRound(winners, name, isFinalNext ? format.finalBestOf : format.bestOf, playoffTrackerLabel(t.formatType, name)));
    return t;
  }

  // Qualifier or Play-In completed: record the teams that went out, then build
  // either the next qualifying phase or the playoff bracket.
  const advancers = phaseAdvancers(phase);
  phaseTeams(phase)
    .filter((team) => !advancers.some((a) => a.teamId === team.teamId))
    .filter((team) => !t.eliminatedOrder.some((e) => e.teamId === team.teamId))
    .forEach((team) => t.eliminatedOrder.push(team));

  const qi = plan.qualifiers.indexOf(phase.key);
  const nextKey = plan.qualifiers[qi + 1];
  if (nextKey) {
    appendPhase(t, buildQualifierPhase(t, nextKey, advancers));
    return t;
  }
  const seeded = advancers.slice(0, plan.playoffSize || advancers.length);
  const name = roundNameForCount(seeded.length);
  appendPhase(t, buildFirstBracketRound(seeded, name, format.bestOf, playoffTrackerLabel(t.formatType, name), 'playoff'));
  return t;
}

// --- public: completion / summary ------------------------------------------

export function completeLiveEvent(prev) {
  if (!prev.champion) return prev;
  if (prev.finalized) return prev;
  const t = cloneTournament(prev);
  finalizePlacements(t);
  return t;
}

export function buildLiveSummary(t, userId) {
  if (!t.finalized && t.champion) finalizePlacements(t);
  const placements = t.placements || [];
  const userMatches = t.allMatches.filter((m) => [m.teamA.teamId, m.teamB.teamId].includes(userId));
  const userRecord = userMatches.reduce((r, m) => ({ wins: r.wins + (m.winner.teamId === userId ? 1 : 0), losses: r.losses + (m.winner.teamId !== userId ? 1 : 0) }), { wins: 0, losses: 0 });
  const place = placements.find((p) => p.teamId === userId);
  const biggestUpset = t.allMatches.filter((m) => m.upset).sort((a, b) => Math.abs((b.winner.ranking || 0) - (b.loser.ranking || 0)) - Math.abs((a.winner.ranking || 0) - (a.loser.ranking || 0)))[0] || null;
  return {
    eventId: t.event.eventId,
    eventName: t.event.name,
    formatType: t.formatType,
    champion: t.champion,
    runnerUp: t.runnerUp,
    placements: placements.slice(0, 8),
    userRecord,
    userResults: userMatches,
    userPlacement: place?.place || null,
    prizeMoneyEarned: place?.prize || 0,
    biggestUpset,
    mvp: userMatches[userMatches.length - 1]?.topPerformer || t.allMatches[0]?.topPerformer || null,
    reputationChange: t.champion?.teamId === userId ? 5 : 0,
  };
}

// --- public: news from new results ------------------------------------------

// Build format-aware news items from a set of newly completed matches.
export function buildNewsForMatches(matches = [], event = {}) {
  const format = getEventFormat(event);
  const news = [];
  matches.forEach((m) => {
    if (!m?.winner || !m?.loser) return;
    const gap = Number(m.winner.ranking || 99) - Number(m.loser.ranking || 99);
    if (format.kind === 'single_elim' && gap >= 3) {
      news.push({ type: 'event', title: 'Bounty claimed', body: `${m.winner.name} claimed a bounty by eliminating ${m.loser.name} (#${m.loser.ranking}) at ${event.name}.` });
    } else if (gap >= 8) {
      news.push({ type: 'event', title: 'Upset', body: `${m.winner.name} upset ${m.loser.name} at ${event.name}.` });
    }
  });
  return news.slice(0, 3);
}

// --- public: overlay model --------------------------------------------------

function findLastPhase(t, kind) {
  for (let i = t.currentPhaseIndex; i >= 0; i -= 1) {
    if (t.phases[i].kind === kind) return t.phases[i];
  }
  return null;
}

// Build the uniform model the overlay components render from. This replaces the
// old Swiss-only model so every format renders through one shape.
export function getLiveModel(t, gameState) {
  const userTeamId = gameState.selectedTeamId;
  const userTeam = gameState.teams.find((team) => team.teamId === userTeamId);
  const phase = currentPhase(t);
  const userMatch = getCurrentUserMatch(t, userTeamId);
  const pendingMatches = getPendingMatches(t);
  const otherPending = pendingMatches.filter((p) => ![p.teamA.teamId, p.teamB.teamId].includes(userTeamId));
  const allMatches = t.allMatches;
  const userMatches = allMatches.filter((m) => [m.teamA.teamId, m.teamB.teamId].includes(userTeamId));
  const userRecord = userMatches.reduce((r, m) => ({ wins: r.wins + (m.winner.teamId === userTeamId ? 1 : 0), losses: r.losses + (m.winner.teamId !== userTeamId ? 1 : 0) }), { wins: 0, losses: 0 });
  const latestUserMatch = userMatches[userMatches.length - 1] || null;
  const userEliminated = isUserEliminated(t, userTeamId);
  const userInPhase = phaseTeams(phase).some((team) => team.teamId === userTeamId);
  const userWaiting = !t.champion && !userEliminated && !userInPhase;
  const nextOpponent = userMatch ? (userMatch.teamA.teamId === userTeamId ? userMatch.teamB : userMatch.teamA) : null;

  const status = t.champion
    ? (t.champion.teamId === userTeamId ? 'Champion' : 'Finished')
    : userEliminated ? 'Eliminated' : userWaiting ? 'Waiting' : 'Alive';

  const trackerSteps = t.trackerSteps || [];
  const activeTrackerIndex = t.champion ? trackerSteps.length - 1 : Math.max(0, trackerSteps.indexOf(phase?.trackerLabel));

  const swissPhase = phase?.kind === 'swiss' ? phase : findLastPhase(t, 'swiss');
  const groupsPhase = phase?.kind === 'groups' ? phase : findLastPhase(t, 'groups');
  const swissStandings = swissPhase ? sortStandings(swissPhase.swiss.standings) : [];
  const groups = groupsPhase ? groupsPhase.groups : [];
  const bracketRounds = t.phases.filter((p) => p.kind === 'bracket' && p.role === 'playoff').map((p) => ({ name: p.name, matches: p.matches.map((m) => ({ teamA: m.teamA, teamB: m.teamB, result: m.result, winner: m.winner })) }));

  const canAdvance = canAdvanceStage(t);
  const isComplete = isEventComplete(t);
  const aliveCount = Math.max(0, t.teams.length - t.eliminatedOrder.length);
  const summaryExists = (gameState.completedEvents || []).some((e) => e.eventId === t.event.eventId);

  const nextStepName = trackerSteps[activeTrackerIndex + 1] || 'Champion';
  let nextAction;
  if (t.champion && summaryExists) nextAction = { label: 'Return to Dashboard', kind: 'return' };
  else if (t.champion) nextAction = { label: 'Finish Event', kind: 'finish' };
  else if (userMatch) nextAction = { label: 'Sim Your Match', kind: 'user' };
  else if (otherPending.length) nextAction = { label: userWaiting ? `Sim ${phase?.name || 'Stage'} Matches` : 'Sim Other Matches', kind: 'other' };
  else if (canAdvance) nextAction = { label: `Advance to ${nextStepName}`, kind: 'advance' };
  else nextAction = { label: 'Review Event', kind: 'none' };

  return {
    userTeamId,
    userTeam,
    phase,
    phaseName: phase?.name || 'Event',
    formatType: t.formatType,
    trackerSteps,
    activeTrackerIndex,
    userMatch,
    pendingMatches,
    otherPending,
    allMatches,
    latestUserMatch,
    userRecord,
    userMatches,
    nextOpponent,
    status,
    userEliminated,
    userWaiting,
    userEntryStageName: t.userEntryStageName,
    champion: t.champion,
    runnerUp: t.runnerUp,
    swissStandings,
    groups,
    bracketRounds,
    canAdvance,
    isComplete,
    aliveCount,
    nextAction,
    summaryExists,
  };
}

// --- diagnostics ------------------------------------------------------------

// Drive a whole interactive event programmatically (user prefers their own
// match, then sims the AI, then advances) and report whether it is well-formed.
export function runLiveEventDiagnostics(event, snapshot, allTeams, rankings, data, userId) {
  let t = createLiveTournament(event, { ...snapshot, userTeamId: userId }, allTeams, rankings);
  const errors = [];
  let foundUserMatch = false;
  let simmedAi = false;
  let sawWaiting = false;
  let guard = 0;
  while (!isEventComplete(t) && guard < 600) {
    guard += 1;
    if (getCurrentUserMatch(t, userId)) {
      foundUserMatch = true;
      t = simulateUserMatch(t, userId, data);
      continue;
    }
    if (isUserEliminated(t, userId) === false && phaseTeams(currentPhase(t)).every((tm) => tm.teamId !== userId) && !t.champion) sawWaiting = true;
    const pending = getPendingMatches(t);
    if (pending.length) {
      const before = t.allMatches.length;
      t = simulateOtherMatches(t, userId, data);
      if (t.allMatches.length > before) simmedAi = true;
      continue;
    }
    if (canAdvanceStage(t)) { t = advanceStage(t); continue; }
    break;
  }
  if (!t.champion) errors.push('No champion was produced');
  if (t.allMatches.some((m) => m.teamA.teamId === m.teamB.teamId)) errors.push('A team played itself');
  const ids = t.teams.map((x) => x.teamId);
  if (new Set(ids).size !== ids.length) errors.push('Duplicate teams in the field');
  if (!foundUserMatch) errors.push('User match was never found');
  return { name: `${event.name} interactive`, valid: errors.length === 0 && Boolean(t.champion), errors, champion: t.champion, foundUserMatch, simmedAi, sawWaiting, matches: t.allMatches.length, tournament: t };
}
