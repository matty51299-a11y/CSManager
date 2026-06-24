import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');
const INPUT = join(ROOT, 'data', 'import', 'cs_database.xlsx');
const OUTPUT_DIR = join(ROOT, 'src', 'data', 'generated');

const REQUIRED_SHEETS = ['Teams', 'Players', 'Maps', 'TeamMapRatings', 'Events'];

const REQUIRED_COLUMNS = {
  Teams: ['teamId', 'teamName', 'shortName', 'region', 'country', 'tier', 'reputation', 'budgetUsd', 'ranking'],
  Players: ['playerId', 'gamertag', 'teamId', 'nationality', 'age', 'rolePrimary', 'overall', 'potential', 'salaryUsd', 'contractYears', 'buyoutUsd', 'status'],
  Maps: ['mapId', 'mapName', 'activeDuty'],
  TeamMapRatings: ['teamId'],
  Events: ['eventId', 'eventName', 'eventType', 'tier', 'month', 'format'],
};

function log(msg) { console.log(`  ${msg}`); }
function logError(msg) { console.error(`  ERROR: ${msg}`); }
function logWarn(msg) { console.warn(`  WARN: ${msg}`); }

function readWorkbook() {
  try {
    readFileSync(INPUT);
  } catch {
    console.error(`\nFATAL: Cannot read ${INPUT}`);
    console.error('Make sure data/import/cs_database.xlsx exists.\n');
    process.exit(1);
  }
  return XLSX.readFile(INPUT);
}

function checkRequiredSheets(wb) {
  const missing = REQUIRED_SHEETS.filter((s) => !wb.SheetNames.includes(s));
  if (missing.length > 0) {
    console.error(`\nFATAL: Missing required sheets: ${missing.join(', ')}`);
    process.exit(1);
  }
}

function parseSheet(wb, sheetName) {
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName]);
  if (rows.length === 0) {
    logWarn(`Sheet "${sheetName}" has no data rows`);
    return [];
  }
  const cols = Object.keys(rows[0]);
  const required = REQUIRED_COLUMNS[sheetName] || [];
  const missingCols = required.filter((c) => !cols.includes(c));
  if (missingCols.length > 0) {
    console.error(`\nFATAL: Sheet "${sheetName}" missing required columns: ${missingCols.join(', ')}`);
    console.error(`  Found columns: ${cols.join(', ')}`);
    process.exit(1);
  }
  return rows;
}

function transformTeams(rows) {
  return rows.map((r) => ({
    teamId: r.teamId,
    name: r.teamName,
    shortName: r.shortName,
    region: r.region,
    country: r.country,
    tier: r.tier,
    reputation: Number(r.reputation) || 0,
    budget: Number(r.budgetUsd) || 0,
    ranking: Number(r.ranking) || 999,
    playStyle: r.playStyle || '',
  }));
}

function transformPlayers(rows) {
  return rows.map((r) => ({
    playerId: r.playerId,
    gamertag: r.gamertag,
    realName: r.realName || '',
    teamId: r.teamId,
    nationality: r.nationality,
    age: Number(r.age) || 0,
    rolePrimary: r.rolePrimary,
    roleSecondary: r.roleSecondary || '',
    overall: Number(r.overall) || 0,
    potential: Number(r.potential) || 0,
    aim: Number(r.aim) || 0,
    awp: Number(r.awp) || 0,
    entry: Number(r.entry) || 0,
    clutch: Number(r.clutch) || 0,
    utility: Number(r.utility) || 0,
    trading: Number(r.trading) || 0,
    anchor: Number(r.anchor) || 0,
    calling: Number(r.calling) || 0,
    discipline: Number(r.discipline) || 0,
    composure: Number(r.composure) || 0,
    consistency: Number(r.consistency) || 0,
    salary: Number(r.salaryUsd) || 0,
    contractYears: Number(r.contractYears) || 0,
    buyout: Number(r.buyoutUsd) || 0,
    status: r.status || 'active',
    rosterRole: r.rosterRole || 'Starter',
  }));
}

function transformMaps(rows) {
  return rows.map((r) => ({
    mapId: r.mapId,
    name: r.mapName,
    activeDuty: r.activeDuty === 'Yes',
    ctSided: Number(r.ctSided) || 50,
    complexity: Number(r.complexity) || 50,
    awpImpact: Number(r.awpImpact) || 50,
    utilityImportance: Number(r.utilityImportance) || 50,
  }));
}

function transformTeamMapRatings(rows) {
  return rows.map((r) => {
    const entry = { teamId: r.teamId };
    const mapKeys = ['ancient', 'anubis', 'dust2', 'inferno', 'mirage', 'nuke', 'overpass'];
    for (const k of mapKeys) {
      if (r[k] !== undefined) entry[k] = Number(r[k]) || 0;
    }
    entry.defaultBan = r.defaultBan || '';
    entry.bestMap = r.bestMap || '';
    return entry;
  });
}

function transformEvents(rows) {
  return rows.map((r) => ({
    eventId: r.eventId,
    name: r.eventName,
    eventType: r.eventType,
    tier: r.tier,
    month: r.month,
    teams: Number(r.teams) || 0,
    format: r.format,
    prizePool: Number(r.prizePoolUsd) || 0,
    rankingWeight: Number(r.rankingWeight) || 0,
    regionRestriction: r.regionRestriction || 'Global',
    inviteMethod: r.inviteMethod || '',
    notes: r.notes || '',
  }));
}

// --- Validation ---

function validateEveryTeamHasFivePlayers(teams, players) {
  const errors = [];
  for (const team of teams) {
    const active = players.filter((p) => p.teamId === team.teamId && p.status === 'active');
    if (active.length !== 5) {
      errors.push(`${team.shortName} (${team.teamId}) has ${active.length} active players, expected 5`);
    }
  }
  return errors;
}

function validateNoDuplicateActivePlayers(players) {
  const errors = [];
  const seen = new Set();
  for (const p of players) {
    if (p.status !== 'active') continue;
    if (seen.has(p.playerId)) {
      errors.push(`Duplicate active player: ${p.gamertag} (${p.playerId})`);
    }
    seen.add(p.playerId);
  }
  return errors;
}

function validatePlayersHaveValidTeamIds(teams, players) {
  const errors = [];
  const teamIds = new Set(teams.map((t) => t.teamId));
  for (const p of players) {
    if (p.status !== 'active') continue;
    if (!teamIds.has(p.teamId)) {
      errors.push(`${p.gamertag} (${p.playerId}) has invalid teamId "${p.teamId}"`);
    }
  }
  return errors;
}

function validateTeamMapRatingsExist(teams, teamMapRatings) {
  const errors = [];
  const ratingTeamIds = new Set(teamMapRatings.map((r) => r.teamId));
  for (const team of teams) {
    if (!ratingTeamIds.has(team.teamId)) {
      errors.push(`${team.shortName} (${team.teamId}) has no map ratings`);
    }
  }
  return errors;
}

function validateEventsHaveValidFormats(events) {
  const errors = [];
  for (const e of events) {
    if (!e.eventId) errors.push(`Event missing eventId: "${e.name}"`);
    if (!e.name) errors.push(`Event ${e.eventId} missing name`);
    if (!e.tier) errors.push(`Event "${e.name}" missing tier`);
    if (!e.month) errors.push(`Event "${e.name}" missing month`);
    if (!e.format) errors.push(`Event "${e.name}" missing format`);
  }
  return errors;
}

// --- Main ---

function main() {
  console.log('\n=== CS Dynasty Manager — Database Import ===\n');

  console.log('Reading workbook...');
  const wb = readWorkbook();
  checkRequiredSheets(wb);
  log(`Found sheets: ${wb.SheetNames.join(', ')}`);

  console.log('\nParsing sheets...');
  const rawTeams = parseSheet(wb, 'Teams');
  const rawPlayers = parseSheet(wb, 'Players');
  const rawMaps = parseSheet(wb, 'Maps');
  const rawTMR = parseSheet(wb, 'TeamMapRatings');
  const rawEvents = parseSheet(wb, 'Events');

  log(`Teams: ${rawTeams.length} rows`);
  log(`Players: ${rawPlayers.length} rows`);
  log(`Maps: ${rawMaps.length} rows`);
  log(`TeamMapRatings: ${rawTMR.length} rows`);
  log(`Events: ${rawEvents.length} rows`);

  console.log('\nTransforming data...');
  const teams = transformTeams(rawTeams);
  const players = transformPlayers(rawPlayers);
  const maps = transformMaps(rawMaps);
  const teamMapRatings = transformTeamMapRatings(rawTMR);
  const events = transformEvents(rawEvents);

  console.log('\nValidating...');
  let hasErrors = false;

  const checks = [
    { name: 'Every team has 5 active players', errors: validateEveryTeamHasFivePlayers(teams, players) },
    { name: 'No duplicate active players', errors: validateNoDuplicateActivePlayers(players) },
    { name: 'Players have valid team IDs', errors: validatePlayersHaveValidTeamIds(teams, players) },
    { name: 'Team map ratings exist', errors: validateTeamMapRatingsExist(teams, teamMapRatings) },
    { name: 'Events have valid formats', errors: validateEventsHaveValidFormats(events) },
  ];

  for (const check of checks) {
    if (check.errors.length === 0) {
      log(`PASS  ${check.name}`);
    } else {
      log(`FAIL  ${check.name}`);
      for (const err of check.errors) {
        logError(err);
      }
      hasErrors = true;
    }
  }

  if (hasErrors) {
    console.warn('\nWARNING: Validation issues found. Data will still be written.\n');
  } else {
    console.log('\nAll validations passed.\n');
  }

  console.log('Writing output files...');
  mkdirSync(OUTPUT_DIR, { recursive: true });

  const outputs = [
    { name: 'teams.json', data: teams },
    { name: 'players.json', data: players },
    { name: 'maps.json', data: maps },
    { name: 'teamMapRatings.json', data: teamMapRatings },
    { name: 'events.json', data: events },
  ];

  for (const { name, data } of outputs) {
    const path = join(OUTPUT_DIR, name);
    writeFileSync(path, JSON.stringify(data, null, 2));
    log(`${name} — ${data.length} records`);
  }

  console.log('\nDone. Generated files in src/data/generated/\n');

  console.log('Summary:');
  log(`Teams:          ${teams.length}`);
  log(`Players:        ${players.length}`);
  log(`Maps:           ${maps.length}`);
  log(`Map Ratings:    ${teamMapRatings.length}`);
  log(`Events:         ${events.length}`);
  console.log('');
}

main();
