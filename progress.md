# CS Dynasty Manager Progress

## Current Status

Foundation complete. React + Vite project scaffolded with data models, seed database, validation, and all initial screens.

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

## In Progress

Nothing.

## Planned Next

1. Simple match simulation (CS round-based, BO1/BO3)
2. Tournament bracket/group stage formats
3. VRS-style ranking calculation
4. Transfers and free agency
5. Contract management
6. Advance week / season progression

## Rules for Future Coding Tasks

- Read README.md and progress.md before making changes.
- Keep changes focused on the requested task.
- Do not add CDL/COD-specific logic.
- Do not change unrelated systems.
- Keep code beginner-friendly.
- Add manual testing steps after every task.
- Update this progress file after every completed task.
