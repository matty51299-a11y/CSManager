# CS Dynasty Manager Progress

## Current Status

Foundation complete with spreadsheet import pipeline. The game reads from a 64-team, 320-player database imported from Excel.

## Source of Truth

This file should be updated after every coding task.

Any coding agent must read this file before making changes.

## Implemented

### Task 1 — Foundation (Complete)

- React + Vite project initialized
- Data models created for teams, players, maps, tournaments, season state, game settings
- 8 teams with full attributes (name, shortName, region, country, reputation, budget, ranking, roster, coach, mapRatings)
- 40 players with full attributes (gamertag, realName, nationality, age, teamId, roles, 11 skill ratings, contract details, status)
- 7 active duty maps (Ancient, Anubis, Dust II, Inferno, Mirage, Nuke, Overpass)
- 10 tournament templates (Major, IEM Championship, IEM Masters, ESL Pro League, BLAST Bounty, BLAST Open, BLAST Rivals, PGL Masters, StarSeries, Regional Challenger)
- 4 scheduled season tournaments
- Roster rules enforced: 5 active players per team, no duplicates, valid team IDs
- Validation utilities: validateEveryTeamHasFivePlayers, validateNoDuplicateActivePlayers, validatePlayersHaveValidTeamIds, validateTeamMapRatingsExist
- Diagnostics page showing all validation results and database summary
- Dark football-manager style UI with dense tables and compact panels
- Pages: Dashboard, Teams, Team Detail, Players (sortable), Player Detail, Rankings, Calendar, Tournament Detail, Roster Management, Diagnostics
- Sidebar navigation with season/week display
- react-router-dom for routing


### Task 3 — Simple Match Simulation and Match Centre (Complete)

- Added standalone match simulation utilities outside React components.
- Match engine supports Bo1, Bo3 and Bo5 series.
- Added active map pool aware veto/pick logic for Ancient, Anubis, Dust II, Inferno, Mirage, Nuke and Overpass.
- Added team strength calculation using average overall, role balance, selected map rating, IGL/calling, AWPer, entry, clutch, consistency and reputation pressure.
- Added compact Counter-Strike-style score generation with rare overtime scorelines.
- Added per-map estimated player stats and top performer summaries: top fragger, highest rated player, clutch player and underperformer.
- Added Match Centre page where the user can select any two database teams, choose Bo1/Bo3/Bo5 and view vetoes, scores, winner, performers and strength breakdowns.
- Added Match Centre to sidebar navigation.
- Match simulation has fallbacks for missing map ratings and unusual/missing roles so it returns diagnostics instead of crashing.

#### Files Created
- src/utils/teamStrength.js
- src/utils/mapVetoEngine.js
- src/utils/matchEngine.js
- src/pages/MatchCentre.jsx

#### Files Modified
- src/App.jsx
- src/components/Sidebar.jsx
- src/index.css
- progress.md

#### Known Limitations
- Match results are single-click deterministic estimates for now, not persistent fixtures.
- Player map stats are generated estimates and are not saved to player history.
- Veto logic is intentionally simple and does not yet model team tendencies beyond map ratings.
- No tournament automation, morale, transfers or ranking impact has been added.

### Task 2 — Spreadsheet Import Pipeline (Complete)

- Created import script: scripts/importCsDatabase.mjs
- Reads from data/import/cs_database.xlsx (64 teams, 320 players, 7 maps, 64 team map ratings, 16 events)
- Parses tabs: Teams, Players, Maps, TeamMapRatings, Events
- Generates JSON to src/data/generated/ (teams.json, players.json, maps.json, teamMapRatings.json, events.json)
- npm script: npm run import:csdb
- Data loader (src/data/loadData.js) uses import.meta.glob to prefer generated JSON, falls back to src/data/fallback/
- Fallback seed data in src/data/fallback/ (4 teams, 20 players, 7 maps, 4 team map ratings, 4 events)
- Validation utilities added: validateEventsHaveValidFormats (in addition to existing 4 validators)
- Import script prints clear errors for: missing sheets, missing columns, roster count issues, invalid teamIds, duplicate players, missing map ratings, missing event fields
- All pages updated to work with new data structure:
  - TeamMapRatings are now a separate data array (not embedded in teams)
  - Events replace the old tournamentTemplates/seasonTournaments system
  - Teams now have tier, playStyle fields
  - Dashboard shows total teams/players/events/maps, top 10 rankings, next events
  - Teams screen shows tier column
  - Team Detail shows roster derived from players, separate map ratings with defaultBan/bestMap
  - Players screen shows salary, contractYears, buyout columns
  - Calendar shows full event data (type, tier, month, format, prize pool, region, invite method)
  - Tournament Detail shows complete event info including ranking weight and notes
  - Diagnostics shows all 5 validations plus data source indicator
- Old hardcoded data files (src/data/teams.js, players.js, maps.js, tournaments.js) still exist but are no longer imported by anything

#### Files Created
- scripts/importCsDatabase.mjs
- src/data/loadData.js
- src/data/fallback/teams.js
- src/data/fallback/players.js
- src/data/fallback/maps.js
- src/data/fallback/teamMapRatings.js
- src/data/fallback/events.js
- src/data/generated/teams.json (generated by import)
- src/data/generated/players.json (generated by import)
- src/data/generated/maps.json (generated by import)
- src/data/generated/teamMapRatings.json (generated by import)
- src/data/generated/events.json (generated by import)

#### Files Modified
- package.json (added import:csdb script, xlsx devDep)
- src/data/gameState.js (uses loadData.js, includes teamMapRatings + events)
- src/utils/validation.js (added validateEventsHaveValidFormats, updated runAllValidations signature)
- src/utils/helpers.js (added getTeamMapRatings, monthIndex, updated tierBadgeClass for S+)
- src/index.css (added .badge-splus style)
- src/pages/Dashboard.jsx (complete rewrite for new data)
- src/pages/Teams.jsx (added tier column, removed coach)
- src/pages/TeamDetail.jsx (uses separate teamMapRatings, shows avgOvr, playStyle)
- src/pages/Players.jsx (added contract, buyout columns)
- src/pages/Rankings.jsx (added tier column)
- src/pages/Calendar.jsx (uses events instead of tournaments)
- src/pages/TournamentDetail.jsx (uses event data, shows ranking weight, notes)
- src/pages/Roster.jsx (uses separate teamMapRatings)
- src/pages/Diagnostics.jsx (5 validations, data source display)
- src/App.jsx (minor cleanup)

#### Known Limitations
- One duplicate player (bobeksde) exists in the spreadsheet data — flagged by validation
- Old hardcoded data files (src/data/teams.js etc.) are orphaned — safe to delete
- Player detail page still works but PlayerDetail.jsx was not modified (still compatible)
- No search/filter on Teams or Players pages yet
- Events use month names instead of exact dates — no week-based scheduling yet

## In Progress

Nothing.

## Planned Next

1. Add tournament bracket/group stage formats powered by the match engine
2. Add VRS-style ranking calculation after simulated matches
3. Transfers and free agency
4. Contract management
5. Advance week / season progression
6. Search/filter on Teams and Players pages
7. Delete orphaned old data files (src/data/teams.js, players.js, maps.js, tournaments.js)

## Rules for Future Coding Tasks

- Read README.md and progress.md before making changes.
- Keep changes focused on the requested task.
- Do not add CDL/COD-specific logic.
- Do not change unrelated systems.
- Keep code beginner-friendly.
- Add manual testing steps after every task.
- Update this progress file after every completed task.
- The generated JSON in src/data/generated/ is the primary data source. Run npm run import:csdb to regenerate from spreadsheet.
