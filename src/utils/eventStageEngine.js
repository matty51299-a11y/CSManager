// Event Stage Engine
// Simulates a whole event from start to champion using the correct format.
// This is used for:
//   - background simulation (events the user is not invited to)
//   - diagnostics (proving each format reaches a champion)
//
// It is intentionally a self-contained, beginner-friendly simulator. It does
// not drive the interactive overlay; it produces a finished result with stages,
// a champion, placements and news.

import { simulateMatch } from './matchEngine.js';
import { summarizeMatch } from './tournamentStandings.js';
import { getEventFormat } from './eventFormatEngine.js';
import { distributePrize } from './eventPrizeEngine.js';

// --- small shared helpers -------------------------------------------------

// Simulate a single Bo-N series between two teams and return a summary.
function simSeries(teamA, teamB, bestOf, data) {
  if (!teamA || !teamB || teamA.teamId === teamB.teamId) return null;
  const safeBestOf = [1, 3, 5].includes(Number(bestOf)) ? Number(bestOf) : 3;
  return summarizeMatch(simulateMatch({
    teamA, teamB, players: data.players, teamMapRatings: data.teamMapRatings, bestOf: safeBestOf,
  }));
}

function winnerLoser(result, a, b) {
  const winner = result.winner.teamId === a.teamId ? a : b;
  const loser = result.winner.teamId === a.teamId ? b : a;
  return { winner, loser };
}

// Single elimination bracket over a list of seeded teams.
// stageNames labels each round (final round is the last name).
function singleElim(teams, bestOf, finalBestOf, data, stageNames = []) {
  let alive = [...teams];
  const rounds = [];
  const allMatches = [];
  const eliminatedOrder = [];
  let roundIdx = 0;
  let guard = 0;
  while (alive.length > 1 && guard < 8) {
    const matches = [];
    const next = [];
    const half = Math.floor(alive.length / 2);
    for (let i = 0; i < half; i += 1) {
      const a = alive[i];
      const b = alive[alive.length - 1 - i];
      const isFinal = alive.length === 2;
      const res = simSeries(a, b, isFinal ? finalBestOf : bestOf, data);
      if (!res) { next.push(a); continue; }
      matches.push(res);
      allMatches.push(res);
      const { winner, loser } = winnerLoser(res, a, b);
      next.push(winner);
      eliminatedOrder.push(loser);
    }
    if (alive.length % 2 === 1) next.push(alive[half]);
    rounds.push({ key: `round-${roundIdx}`, name: stageNames[roundIdx] || `Round of ${alive.length}`, matches });
    alive = next;
    roundIdx += 1;
    guard += 1;
  }
  return {
    rounds,
    champion: alive[0] || null,
    runnerUp: eliminatedOrder[eliminatedOrder.length - 1] || null,
    allMatches,
    eliminatedOrder,
  };
}

// Simplified Swiss: pair by record, 3 wins qualify, 3 losses eliminate,
// run until enough teams have qualified. A guard prevents infinite loops.
function swissSim(teams, advanceCount, bestOf, data) {
  const rows = teams.map((team, index) => ({ team, teamId: team.teamId, wins: 0, losses: 0, seed: index + 1, opponents: [] }));
  const matches = [];
  let guard = 0;
  while (rows.filter((r) => r.wins >= 3).length < advanceCount && guard < 9) {
    const pool = rows
      .filter((r) => r.wins < 3 && r.losses < 3)
      .sort((a, b) => b.wins - a.wins || a.losses - b.losses || a.seed - b.seed);
    while (pool.length > 1) {
      const first = pool.shift();
      let idx = pool.findIndex((t) => !first.opponents.includes(t.teamId));
      if (idx < 0) idx = 0;
      const second = pool.splice(idx, 1)[0];
      const res = simSeries(first.team, second.team, bestOf, data);
      if (!res) continue;
      matches.push(res);
      first.opponents.push(second.teamId);
      second.opponents.push(first.teamId);
      if (res.winner.teamId === first.teamId) { first.wins += 1; second.losses += 1; } else { second.wins += 1; first.losses += 1; }
    }
    guard += 1;
  }
  const ranked = [...rows].sort((a, b) => b.wins - a.wins || a.losses - b.losses || a.seed - b.seed);
  const qualified = ranked.slice(0, advanceCount);
  const eliminated = ranked.slice(advanceCount);
  return { standings: rows, qualified, eliminated, matches };
}

// Group stage: snake-seed teams into groups, round robin, top N advance.
function groupSim(teams, groupCount, advancePerGroup, bestOf, data) {
  const groups = Array.from({ length: groupCount }, (unused, i) => ({ name: `Group ${String.fromCharCode(65 + i)}`, rows: [] }));
  teams.forEach((team, index) => {
    const row = Math.floor(index / groupCount);
    const pos = index % groupCount;
    const g = row % 2 === 0 ? pos : groupCount - 1 - pos;
    groups[g].rows.push({ team, teamId: team.teamId, wins: 0, losses: 0, seed: index + 1, mapDiff: 0 });
  });
  const matches = [];
  groups.forEach((group) => {
    for (let i = 0; i < group.rows.length; i += 1) {
      for (let j = i + 1; j < group.rows.length; j += 1) {
        const a = group.rows[i];
        const b = group.rows[j];
        const res = simSeries(a.team, b.team, bestOf, data);
        if (!res) continue;
        matches.push(res);
        if (res.winner.teamId === a.teamId) { a.wins += 1; b.losses += 1; } else { b.wins += 1; a.losses += 1; }
        const aDiff = a.teamId === res.teamA.teamId ? res.mapsWonA - res.mapsWonB : res.mapsWonB - res.mapsWonA;
        a.mapDiff += aDiff;
        b.mapDiff -= aDiff;
      }
    }
    group.rows.sort((a, b) => b.wins - a.wins || b.mapDiff - a.mapDiff || a.seed - b.seed);
    group.advancing = group.rows.slice(0, advancePerGroup);
  });
  const advancing = groups.flatMap((group) => group.advancing.map((r) => r.team));
  return { groups, advancing, matches };
}

// Give every team a bounty value (top-ranked teams are worth more).
function assignBounties(teams) {
  const count = teams.length;
  const map = {};
  teams.forEach((team, index) => {
    const seed = index + 1;
    map[team.teamId] = Math.round((count - seed + 1) * 2500 + 5000);
  });
  return map;
}

// Order the field into final placements (champion first).
function buildPlacements(champion, eliminatedOrder, fieldTeams) {
  const ordered = [];
  if (champion) ordered.push(champion);
  [...eliminatedOrder].reverse().forEach((team) => { if (!ordered.some((t) => t.teamId === team.teamId)) ordered.push(team); });
  fieldTeams.forEach((team) => { if (!ordered.some((t) => t.teamId === team.teamId)) ordered.push(team); });
  return ordered.map((team, index) => ({ teamId: team.teamId, name: team.name, shortName: team.shortName, place: index + 1 }));
}

// --- news --------------------------------------------------------------------

function biggestUpset(matches) {
  return matches
    .filter((m) => m && m.winner && m.loser && Number(m.winner.ranking || 99) > Number(m.loser.ranking || 99))
    .sort((a, b) => (Number(b.winner.ranking || 0) - Number(b.loser.ranking || 0)) - (Number(a.winner.ranking || 0) - Number(a.loser.ranking || 0)))[0] || null;
}

function buildFormatNews(event, format, result) {
  const news = [];
  const champ = result.champion;
  const name = event.name;
  if (format.kind === 'break') {
    news.push({ type: 'calendar', title: `${name}`, body: `${name} is a scheduled break. No matches were played and the calendar moves on.` });
    return news;
  }
  if (format.kind === 'single_elim') {
    const upset = biggestUpset(result.allMatches);
    if (upset) news.push({ type: 'event', title: 'Bounty claimed', body: `${upset.winner.name} claimed a bounty by eliminating ${upset.loser.name} at ${name}.` });
  }
  if (format.kind === 'playin') {
    const survivor = result.playInWinners?.[0];
    if (survivor) news.push({ type: 'event', title: 'Play-In survived', body: `${survivor.name} survived the Play-In and reached the main stage of ${name}.` });
  }
  if (format.kind === 'groups') {
    const topGroup = result.groups?.find((g) => g.advancing?.[0]);
    const winnerRow = topGroup?.advancing?.[0];
    if (winnerRow) news.push({ type: 'event', title: 'Group topped', body: `${winnerRow.team.name} topped ${topGroup.name} with a ${winnerRow.wins}-${winnerRow.losses} record at ${name}.` });
  }
  if (format.kind === 'major') {
    const stage3Team = result.stage3Advancers?.[0];
    if (stage3Team) news.push({ type: 'event', title: 'Advanced to Stage 3', body: `${stage3Team.name} advanced to Stage 3 of ${name}.` });
    if (result.runnerUp) news.push({ type: 'event', title: 'Reached the final', body: `${result.runnerUp.name} reached the Grand Final of ${name}.` });
  }
  if (champ) {
    const trophyLine = format.kind === 'groups' && format.teamCount === 8
      ? `${champ.name} won the elite eight-team invitational ${name}.`
      : `${champ.name} won ${name}.`;
    news.push({ type: 'event', title: 'Champion crowned', body: trophyLine });
  }
  return news;
}

// --- per-format orchestration -----------------------------------------------

function runSwiss16(event, format, teams, data) {
  const swiss = swissSim(teams.slice(0, 16), 8, format.bestOf, data);
  const playoffs = singleElim(swiss.qualified.map((r) => r.team), format.bestOf, format.finalBestOf, data, ['Quarter-finals', 'Semi-finals', 'Final']);
  const stages = [
    { key: 'swiss', name: 'Swiss', matches: swiss.matches },
    { key: 'playoffs', name: 'Playoffs', matches: playoffs.allMatches, rounds: playoffs.rounds },
  ];
  return finalize(event, format, stages, playoffs.allMatches.concat(swiss.matches), playoffs, teams);
}

function runBounty32(event, format, teams, data) {
  const bounties = assignBounties(teams.slice(0, 32));
  const bracket = singleElim(teams.slice(0, 32), format.bestOf, format.finalBestOf, data, format.stageNames);
  const stages = bracket.rounds.map((round) => ({ ...round, matches: round.matches }));
  const result = finalize(event, format, stages, bracket.allMatches, bracket, teams);
  result.bounties = bounties;
  return result;
}

function runIem24(event, format, teams, data) {
  const topSeeds = teams.slice(0, 8);
  const lower = teams.slice(8, 24);
  // Play-In: 16 teams, one elimination round, 8 winners.
  const playIn = singleElim(lower, format.bestOf, format.bestOf, data, ['Play-In']);
  const playInWinners = playIn.rounds[0] ? lower.filter((t) => !playIn.eliminatedOrder.some((e) => e.teamId === t.teamId)) : lower.slice(0, 8);
  const mainField = [...topSeeds, ...playInWinners].slice(0, 16);
  const main = swissSim(mainField, 8, format.bestOf, data);
  const playoffs = singleElim(main.qualified.map((r) => r.team), format.bestOf, format.finalBestOf, data, ['Quarter-finals', 'Semi-finals', 'Final']);
  const allMatches = [...playIn.allMatches, ...main.matches, ...playoffs.allMatches];
  const stages = [
    { key: 'playin', name: 'Play-In', matches: playIn.allMatches },
    { key: 'main', name: 'Main Stage', matches: main.matches },
    { key: 'playoffs', name: 'Playoffs', matches: playoffs.allMatches, rounds: playoffs.rounds },
  ];
  const result = finalize(event, format, stages, allMatches, playoffs, teams);
  result.playInWinners = playInWinners;
  return result;
}

function runEpl32(event, format, teams, data) {
  const groupStage = groupSim(teams.slice(0, 32), 8, 2, format.bestOf, data);
  const playoffs = singleElim(groupStage.advancing, format.bestOf, format.finalBestOf, data, ['Round of 16', 'Quarter-finals', 'Semi-finals', 'Final']);
  const allMatches = [...groupStage.matches, ...playoffs.allMatches];
  const stages = [
    { key: 'groups', name: 'Groups', matches: groupStage.matches, groups: groupStage.groups },
    { key: 'playoffs', name: 'Playoffs', matches: playoffs.allMatches, rounds: playoffs.rounds },
  ];
  const result = finalize(event, format, stages, allMatches, playoffs, teams);
  result.groups = groupStage.groups;
  return result;
}

function runRivals8(event, format, teams, data) {
  const groupStage = groupSim(teams.slice(0, 8), 2, 2, format.bestOf, data);
  const playoffs = singleElim(groupStage.advancing, format.bestOf, format.finalBestOf, data, ['Semi-finals', 'Final']);
  const allMatches = [...groupStage.matches, ...playoffs.allMatches];
  const stages = [
    { key: 'groups', name: 'Groups', matches: groupStage.matches, groups: groupStage.groups },
    { key: 'playoffs', name: 'Playoffs', matches: playoffs.allMatches, rounds: playoffs.rounds },
  ];
  const result = finalize(event, format, stages, allMatches, playoffs, teams);
  result.groups = groupStage.groups;
  return result;
}

function runMajor32(event, format, teams, data) {
  const stage1 = swissSim(teams.slice(16, 32), 8, format.bestOf, data);
  const stage1Adv = stage1.qualified.map((r) => r.team);
  const stage2Field = [...teams.slice(8, 16), ...stage1Adv].slice(0, 16);
  const stage2 = swissSim(stage2Field, 8, format.bestOf, data);
  const stage2Adv = stage2.qualified.map((r) => r.team);
  const stage3Field = [...teams.slice(0, 8), ...stage2Adv].slice(0, 16);
  const stage3 = swissSim(stage3Field, 8, format.bestOf, data);
  const stage3Adv = stage3.qualified.map((r) => r.team);
  const playoffs = singleElim(stage3Adv, format.bestOf, format.finalBestOf, data, ['Quarter-finals', 'Semi-finals', 'Final']);
  const allMatches = [...stage1.matches, ...stage2.matches, ...stage3.matches, ...playoffs.allMatches];
  const stages = [
    { key: 'stage1', name: 'Stage 1', matches: stage1.matches },
    { key: 'stage2', name: 'Stage 2', matches: stage2.matches },
    { key: 'stage3', name: 'Stage 3', matches: stage3.matches },
    { key: 'playoffs', name: 'Playoffs', matches: playoffs.allMatches, rounds: playoffs.rounds },
  ];
  const result = finalize(event, format, stages, allMatches, playoffs, teams);
  result.stage3Advancers = stage3Adv;
  return result;
}

function runBreak(event, format) {
  return {
    formatType: format.formatType,
    event,
    stages: [{ key: 'break', name: 'Break', matches: [] }],
    champion: null,
    runnerUp: null,
    placements: [],
    allMatches: [],
    news: buildFormatNews(event, format, {}),
    isBreak: true,
  };
}

// Shared finishing step: placements and prizes. News is added later, after
// each format attaches its extra fields (groups, play-in winners, etc.).
function finalize(event, format, stages, allMatches, bracket, fieldTeams) {
  const placements = buildPlacements(bracket.champion, bracket.eliminatedOrder || [], fieldTeams);
  const placementsWithPrize = distributePrize(event, placements);
  return {
    formatType: format.formatType,
    event,
    stages,
    champion: bracket.champion,
    runnerUp: bracket.runnerUp,
    placements: placementsWithPrize,
    allMatches,
  };
}

// Public entry point: simulate any event end to end using its real format.
export function simulateEventFormat({ event, teams = [], data = {} }) {
  const format = getEventFormat(event);
  const safeData = { players: data.players || [], teamMapRatings: data.teamMapRatings || [] };
  if (format.kind === 'break') return runBreak(event, format);
  if (!teams.length) return runBreak(event, format);
  let result;
  switch (format.formatType) {
    case 'bounty32_single_elim': result = runBounty32(event, format, teams, safeData); break;
    case 'iem24_playin_groups_playoffs': result = runIem24(event, format, teams, safeData); break;
    case 'epl32_groups_playoffs': result = runEpl32(event, format, teams, safeData); break;
    case 'major32_three_stage_playoffs': result = runMajor32(event, format, teams, safeData); break;
    case 'rivals8_groups_playoffs': result = runRivals8(event, format, teams, safeData); break;
    case 'swiss16_playoffs8':
    default:
      result = runSwiss16(event, format, teams, safeData);
  }
  // Build news now that the format has attached its extra fields.
  result.news = buildFormatNews(event, format, result);
  return result;
}

// Diagnostics helper: run a format and report whether it is well-formed.
export function diagnoseEventFormat(event, teams, data) {
  const format = getEventFormat(event);
  const result = simulateEventFormat({ event, teams, data });
  const errors = [];
  const ids = teams.map((t) => t.teamId);
  if (new Set(ids).size !== ids.length) errors.push('Duplicate teams in the field');
  const selfPlay = result.allMatches.some((m) => m.teamA.teamId === m.teamB.teamId);
  if (selfPlay) errors.push('A team played itself');
  if (format.kind !== 'break' && !result.champion) errors.push('No champion was produced');
  return {
    name: `${event.name} (${format.formatType})`,
    valid: errors.length === 0,
    errors,
    champion: result.champion,
    teamCount: teams.length,
    result,
  };
}
