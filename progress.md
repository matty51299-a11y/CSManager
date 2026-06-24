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

### Task 4 — Tournament Centre and Swiss Playoff Simulator (Complete)

- Added the first playable tournament simulation system using the existing generated teams, players, maps, events and Bo3 match engine.
- Added standalone tournament utilities outside React components:
  - tournament creation and diagnostics orchestration
  - Swiss pairing and advancement logic
  - playoff bracket creation and round simulation
  - tournament standings and match summary helpers
- Added 16-team PGL Masters style format:
  - Round 1 high seed vs low seed pairings
  - Swiss record-based pairings after Round 1
  - rematch avoidance where possible
  - teams qualify at 3 wins and are eliminated at 3 losses
  - Swiss continues until 8 teams qualify
  - playoff seeding uses Swiss result first, then original seed/ranking
  - quarter-finals, semi-finals and grand final are Bo3 single elimination
  - champion and runner-up are recorded when playoffs finish
- Added Tournament Centre page with:
  - event selection from imported events
  - top-16 auto-fill and manual 16-team picker
  - generate tournament action
  - upcoming Swiss pairings
  - simulate next Swiss round action
  - Swiss standings with records, maps, rounds, status and opponents played count
  - qualified and eliminated team lists
  - generate playoffs action
  - simulate playoff round action
  - compact playoff bracket
  - champion card
  - session-only tournament history with champion, runner-up, semi-finalists, qualified teams and biggest upset
- Tournament match cards now show series score, maps played, map scores, top performer and upset tags for major ranking upsets.
- Added Tournament Centre to sidebar navigation.
- Added a tournament diagnostics check that generates a 16-team tournament, simulates Swiss qualification, simulates playoffs, checks for duplicate teams and confirms exactly one champion.

#### Files Created
- src/utils/tournamentEngine.js
- src/utils/swissEngine.js
- src/utils/bracketEngine.js
- src/utils/tournamentStandings.js
- src/pages/TournamentCentre.jsx

#### Files Modified
- src/App.jsx
- src/components/Sidebar.jsx
- src/pages/Diagnostics.jsx
- src/index.css
- progress.md

#### Known Limitations
- Tournament history is session-only React state and is not saved to disk or localStorage yet.
- Swiss Buchholz/tiebreakers are simplified; standings use record, map differential, round differential and original seed.
- Pairing logic avoids rematches where possible but uses fallback pairings rather than complex floaters.
- MVP candidate is based on displayed match top performers rather than a full event-wide stat database.
- No ranking impact, prize money, full calendar progression, morale, transfers, contracts or VRS updates are applied yet.

## Rules for Future Coding Tasks

- Read README.md and progress.md before making changes.
- Keep changes focused on the requested task.
- Do not add CDL/COD-specific logic.
- Do not change unrelated systems.
- Keep code beginner-friendly.
- Add manual testing steps after every task.
- Update this progress file after every completed task.
- The generated JSON in src/data/generated/ is the primary data source. Run npm run import:csdb to regenerate from spreadsheet.

### Task 5 — Playable Career Loop and Event Hub (Complete)

- Added a career start flow with a title screen, Start New Career button and imported-database team selection table.
- Team selection now shows team name, region, country, ranking, tier, reputation, budget, average active roster overall, star player and a difficulty label.
- Added central localStorage-backed career state containing careerStarted, selectedTeamId, season, week, date label, phase, active event, active tournament, completed events, inbox, rankings, team records and recent results.
- Dashboard now behaves as the manager home screen with the selected team centered, career controls, next event context, roster, budget, reputation, star player and current season/week/month.
- Added simple calendar advancement that moves toward imported Events and creates invite/background news based on ranking-placeholder invite logic.
- Added an in-career Event Hub route for active tournaments, with user-team highlighting, Swiss standings, user match panel, other matches, playoff bracket, event results feed and event summary.
- Tournament flow now supports simulating the user's match separately from AI matches, Swiss round-by-round progression, playoff generation, playoff match simulation and champion creation.
- Match cards now present team names, series score, maps played, map scores, top performer, upset tags and a short summary sentence.
- Added Inbox page for career/news/event messages.
- Updated sidebar to better match a management career game and renamed the old Tournament Centre navigation label to Tournament Sandbox.
- Diagnostics now includes career-flow checks for career start, persistence, event generation, round progression, user match availability, AI simulation, Swiss qualification, playoff champion, event summary and eliminated-team stability.

#### Files Created
- src/state.js
- src/pages/StartCareer.jsx
- src/pages/EventHub.jsx
- src/pages/Inbox.jsx

#### Files Modified
- src/App.jsx
- src/components/Sidebar.jsx
- src/pages/Dashboard.jsx
- src/pages/Calendar.jsx
- src/pages/Diagnostics.jsx
- src/utils/tournamentEngine.js
- src/index.css
- progress.md

#### Known Limitations
- Rankings are still simplified and only lightly surfaced after events.
- Event invites are ranking-based placeholders using imported team ranking, not full VRS logic.
- Events with more than 16 invited teams currently run through the existing 16-team Swiss/playoff format for the playable hub.
- No transfers yet.
- No contracts yet.
- No morale yet.
- No full VRS system yet.
- Career state is localStorage-only and has no backend/auth/database persistence.

#### Manual Testing Steps
1. Run `npm install` if dependencies are missing.
2. Run `npm run dev`.
3. Open the app, click Start New Career, select any imported team and click Begin Career.
4. Confirm Dashboard shows your selected team, roster, next event and career controls.
5. Click Advance Week / Continue to Next Event until an invite appears, then Enter Event.
6. In Event Hub, simulate Your Match, simulate Other Matches, complete Swiss rounds, generate playoffs and simulate to a champion.
7. Open Inbox and confirm career/event news has been generated.
8. Refresh the browser and confirm the selected team/career remains loaded.
9. Use Diagnostics to reset the career if needed.

## In Progress

Nothing.

## Planned Next

1. Add richer ranking movement and persistent ranking table updates after each event.
2. Add exact event dates and better season calendar UI.
3. Add event-wide player stat aggregation and MVP awards.
4. Add VRS-style invite rules and Major qualification.
5. Transfers and free agency.
6. Contract management.
7. Morale and player dynamics.

### Task 6 — Career Loop Repair Pass (Complete)

- Repaired the central career state around explicit playable phases: `team_selection`, `dashboard`, `advancing`, `event_ready`, `event_active`, `event_complete` and `offseason_placeholder`.
- Added `src/state/GameStateContext.jsx` as the context-facing entry point for shared game state, while preserving the existing `useGameState` hook used by the app.
- Career state now exposes the required fields: career start flag, selected team, season/week/month, current phase, current/active event IDs, active tournament, completed events, inbox items, recent results, rankings and team records.
- LocalStorage persistence now uses the repaired v2 career state shape so refreshes keep the selected career and active tournament.
- Dashboard buttons now call real career actions: continue to next event, enter/sim current event, open Event Hub and reset career.
- Continue to Next Event now uses imported Events data ordered by month and sets the career into `event_ready` for the reached event.
- Event invites use the simplified ranking cut rules requested for 8/16/24/32-team events.
- Enter Event now creates `activeTournament`, moves the career to `event_active`, and the Dashboard navigates to the Event Hub.
- If the selected team is not invited, the same action simulates the event in the background, creates a champion summary and creates inbox/news items.
- Event Hub now reads the career `activeTournament`, shows pending Swiss pairings, highlights the user team, separates user match simulation from AI match simulation, supports playoff generation/simulation and provides a Return to Dashboard action after the champion is produced.
- Calendar actions now use the repaired career actions instead of disconnected placeholder handlers.
- Added darker cockpit styling for career controls, event hero, match cards, brackets, highlighted user rows and status badges.

#### Files Created
- src/state/GameStateContext.jsx

#### Files Modified
- src/state.js
- src/pages/Dashboard.jsx
- src/pages/EventHub.jsx
- src/pages/Calendar.jsx
- src/App.jsx
- src/index.css
- progress.md

#### Known Limitations
- Rankings are still simplified.
- Event invites use ranking placeholders.
- Non-16-team events currently use the top 16 invited teams in the existing Swiss/playoff event hub format.
- No transfers yet.
- No morale yet.
- No contracts yet.
- No full VRS yet.
- Career persistence is still localStorage-only.

#### Manual Testing Steps
1. Run `npm install` if dependencies are missing.
2. Run `npm run dev`.
3. Reset career from Diagnostics or the Dashboard control.
4. Start a new career and select MOUZ.
5. Confirm Dashboard shows MOUZ and phase `dashboard`.
6. Click Advance Week / Continue to Next Event.
7. Confirm BLAST Bounty Season 1 is reached and phase is `event_ready`.
8. Click Enter Event / Sim Background.
9. If invited, confirm Event Hub opens and MOUZ is highlighted.
10. Click Play / Sim Your Match.
11. Confirm a match result card appears with series score, maps, top performer and summary text.
12. Click Sim AI Matches.
13. Click Generate Next Round once the round is complete.
14. Repeat Swiss rounds until 8 teams qualify.
15. Generate playoffs and simulate playoff rounds until one champion is crowned.
16. Confirm the event summary appears.
17. Click Return to Dashboard.
18. Confirm Dashboard shows the completed event context and recent results.
19. Continue to the next imported event.

#### Next Recommended Task
Add richer post-event ranking movement and persistent ranking table updates while keeping the current career loop intact.

### Task 7 — Blank Screen Crash Fix and Career Loop Rebuild (Complete)

- Fixed the runtime crash that blanked the whole app when clicking Sim Match. Root cause: `summarizeMatch()` in `src/utils/tournamentStandings.js` never computed a `.loser` field on match result objects, but both the inbox message builder and `EventHub.jsx`'s match result card read `match.loser.shortName` / `match.loser.name`, throwing `Cannot read properties of undefined (reading 'shortName')` and unmounting the React tree with no boundary to catch it.
- Added `loser` (and `upset`, derived from ranking gap) computation directly inside `summarizeMatch()` so every match result object is always a complete, safe shape.
- Added `src/components/ErrorBoundary.jsx`, a class component with `getDerivedStateFromError`/`componentDidCatch` that renders a recovery panel ("Try to recover" / "Reset career & reload") instead of a blank screen for any future unexpected error. Wrapped the app in `src/main.jsx` and around both pre-career and in-career render paths in `src/App.jsx`.
- Rebuilt the career loop as a single state machine in `src/state/GameStateContext.jsx`, now the canonical game state source (previously a re-export stub). `src/state.js` is now a thin compatibility re-export of the context module.
- Career phases are now exactly: `no_career`, `team_selection`, `dashboard`, `event_ready`, `event_active_swiss`, `event_active_playoffs`, `event_complete`, `season_complete`.
- Career state exposes: careerStarted, selectedTeamId, season, week, month, currentPhase, currentEventId, activeTournament, completedEvents, inboxItems, recentResults, rankings.
- Every button across Dashboard, Calendar and Event Hub now calls one of the real named actions: startCareer, resetCareer, advanceToNextEvent, enterEvent, simUserMatch, simAiMatches/simOtherMatch, advanceSwissRound, generatePlayoffs, simPlayoffRound, completeEvent, returnToDashboard. No dead buttons remain.
- Fixed a navigation bug found while testing the full flow: clicking Return to Dashboard updated career phase state but did not leave the `/event-hub` route. Added an `EventHubRoute` wrapper in `App.jsx` that explicitly navigates to `/` in addition to calling `returnToDashboard()`.
- Rebuilt `src/pages/EventHub.jsx` as the main playable career screen: event name/type/prize pool/stage pill, user team and record, a dedicated "Your Match" panel, a separate "Other Matches" section, Swiss standings with status badges, a dedicated Qualified Teams panel and a dedicated Eliminated Teams panel, playoff bracket with user-team highlighting, an event news/results feed, and an event summary panel. The user's team is visually highlighted in match cards, standings rows, qualified/eliminated rows and the bracket.
- Updated `src/pages/Diagnostics.jsx` careerChecks to the exact required list: career can start, selected team persists, next event can be found, event invite list is generated, enterEvent creates activeTournament, user match can be found, simUserMatch returns a valid result, simAiMatches completes AI matches, Swiss advances correctly (8 qualify), playoffs generate with 8 teams, playoffs produce exactly one champion, event summary is created, returning to Dashboard works, no duplicate teams appear, no team plays itself, inbox items are generated.
- Added a `noSelfPlay` check and granular error messages to `runTournamentDiagnostics()` in `src/utils/tournamentEngine.js`.
- Verified the full 25-step MOUZ career flow (reset career → start career → pick MOUZ → dashboard → advance to next event → enter BLAST Bounty Season 1 → sim user match → sim AI matches → advance Swiss rounds → generate playoffs → sim playoff rounds → champion crowned → event summary → return to Dashboard) end-to-end with headless browser automation, including a run where MOUZ was eliminated mid-Swiss, with zero console/page errors at every step.
- Confirmed `npm run build` and `npm run lint` are clean.
- Did not touch the spreadsheet importer, transfers, morale, contracts, scouting, advanced VRS, or add any new placeholder screens, per the task's explicit constraints.

#### Files Created
- src/components/ErrorBoundary.jsx

#### Files Modified
- src/utils/tournamentStandings.js (added `loser`/`upset` to summarizeMatch)
- src/state/GameStateContext.jsx (now the canonical state machine implementation)
- src/state.js (now a thin re-export shim)
- src/main.jsx (wraps app in ErrorBoundary)
- src/App.jsx (ErrorBoundary wrapping, EventHubRoute navigation fix, renamed action props)
- src/pages/StartCareer.jsx (uses currentPhase instead of local state)
- src/pages/Dashboard.jsx (renamed action props, phase checks)
- src/pages/Calendar.jsx (renamed action props)
- src/pages/EventHub.jsx (full rewrite: defensive guards, qualified/eliminated panels, stage pill, finish-event handling)
- src/utils/tournamentEngine.js (noSelfPlay diagnostic check)
- src/pages/Diagnostics.jsx (exact required careerChecks list)
- src/index.css (.error-panel, .error-detail, .event-summary-card, .stage-pill)
- progress.md

#### Known Limitations
- Rankings are still simplified.
- Event invites are still basic ranking-based placeholders.
- Non-16-team events may still use simplified handling.
- No transfers yet.
- No contracts yet.
- No morale yet.
- No full VRS yet.
- Career persistence is still localStorage-only.
- One pre-existing duplicate player (bobeksde) remains in the spreadsheet data and is unrelated to this crash; intentionally not touched since the spreadsheet importer was not the cause of the crash.

#### Manual Testing Steps
1. Run `npm install` if dependencies are missing.
2. Run `npm run dev`.
3. From Diagnostics or Dashboard, reset career.
4. Start a new career and select MOUZ.
5. Confirm Dashboard shows MOUZ, phase `dashboard`.
6. Click Advance to Next Event until BLAST Bounty Season 1 is reached and an Enter Event control appears.
7. Click Enter Event and confirm Event Hub opens with MOUZ highlighted throughout.
8. Click Play / Sim Your Match and confirm no blank screen, console errors or crash — a match result card appears.
9. Click Sim AI Matches, then Advance Swiss Round, repeating until 8 teams qualify.
10. Click Generate Playoffs, then Sim Playoff Round (and Play / Sim Your Match when MOUZ is in a bracket match) until exactly one champion is crowned.
11. Confirm the event summary panel appears with champion, runner-up, record, prize money and biggest upset.
12. Click Return to Dashboard and confirm the route changes back to `/` and the Dashboard reflects the completed event.
13. Open Diagnostics and confirm all career-flow checks pass.

#### Next Recommended Task
Add richer post-event ranking movement and persistent ranking table updates while keeping the current career loop intact (still the top recommended next step from Task 6, now unblocked since the loop itself is verified stable end-to-end).

### Task 8 — Date Calendar, Tournament Overlay and Match Stats Upgrade (Complete)

- Replaced the career's visible week-first progression with a date-based season calendar.
- Career state now starts on `2026-01-07` and exposes `currentDate`, `seasonYear`, `currentMonth`, `currentPhase`, `currentEventId`, `activeTournament`, `completedEvents` and `nextEventId` as part of the central state shape.
- Added fallback/static game-calendar start and end dates for the 2026 event season, including BLAST Bounty Season 1 on `2026-01-13` to `2026-01-25` and IEM Katowice on `2026-01-28` to `2026-02-08`.
- Continue/advance career actions now move to real event `startDate` values, set `event_ready`, enter playable events at the event start date and move completed events to their `endDate`.
- Dashboard and sidebar now emphasize the selected team and readable calendar date instead of Season 1 / Week 1.
- Calendar was upgraded into a month-grouped season calendar with event dates, type, tier, teams, prize pool, status, invited/not invited state, champion and user finish when available.
- Event Hub was rebuilt into a darker overlay-style tournament hub with a large event header, event logo placeholder, stage tabs, user's match focus, current round cards, standings/bracket panels, event leaders, team stats, recent results feed, qualified/eliminated teams and timeline panels.
- Match simulation now generates deeper map and player stat data: assists, ADR, opening kills, clutches, headshot percentage, half-score, overtime flag, map winner/loser and richer series summaries.
- Series summaries now include series player totals, top performer, loser, upset flag and generated summary text.
- Added event cumulative player/team stat aggregation for maps played, kills, deaths, assists, average rating, ADR, clutches and opening kills, surfaced in Event Hub leader and stats panels.
- Diagnostics now includes date/calendar checks for the 2026-01-07 career start, dated first/second event progression, event-ready phase, Event Hub entry, match stat generation, cumulative stat updates, event end-date completion and calendar status data.

#### Files Created
- src/utils/calendarDates.js

#### Files Modified
- src/state/GameStateContext.jsx
- src/utils/matchEngine.js
- src/utils/tournamentStandings.js
- src/utils/tournamentEngine.js
- src/pages/Dashboard.jsx
- src/pages/Calendar.jsx
- src/pages/EventHub.jsx
- src/pages/Diagnostics.jsx
- src/pages/Inbox.jsx
- src/components/Sidebar.jsx
- src/index.css
- progress.md

#### Known Limitations
- Event dates are currently fallback/static game calendar dates if not imported from the spreadsheet.
- Rankings are still simplified.
- Non-16-team event handling may still be simplified through the existing 16-team Swiss/playoff career hub.
- No transfers yet.
- No contracts yet.
- No morale yet.
- No full VRS yet.
- Tournament Sandbox remains separate as a development/testing tool.

#### Manual Testing Steps
1. Run `npm install` if dependencies are missing.
2. Run `npm run dev`.
3. Reset career from Diagnostics or Dashboard.
4. Start a new career and select MOUZ.
5. Confirm Dashboard and sidebar show MOUZ with `7 January 2026` instead of Season 1 / Week 1 as the main time context.
6. Click Advance to Next Event and confirm the date moves to `13 January 2026` with BLAST Bounty Season 1 in `event_ready`.
7. Click Enter Event and confirm the Event Hub overlay opens with BLAST Bounty Season 1 dates, stage tabs and MOUZ highlighted.
8. Click Sim Your Match and confirm the match summary, map scores and player stat table appear.
9. Continue simming AI matches/rounds, generate playoffs and finish the event.
10. Confirm completing the event moves the career date to `25 January 2026`.
11. Continue again and confirm the next event advances to IEM Katowice on `28 January 2026`.
12. Open Calendar and confirm events are grouped by month with statuses, invite state and dates.

#### Next Recommended Task
Add post-event ranking movement and persistent ranking table updates using the new dated calendar/event summary foundation.

### Task 9 — Full-Screen Tournament Overlay Rebuild (Complete)

- Replaced the Event Hub implementation with a dedicated full-screen tournament overlay entry point in `src/pages/EventOverlay.jsx`, while keeping `src/pages/EventHub.jsx` as the route-compatible export.
- Added clean event overlay components for the live control header, event tabs, left match rail, center tournament hero panel, right sidebar, Swiss view, bracket view, map pool preview, results feed and placements/prize panel.
- Reworked the tournament screen into a broadcast-style event mode with a thin top event bar, live event tabs, stacked current-round match rail, central Swiss/playoff hero content and dense right-side team/match/results/prize panels.
- Added CS-specific matchup context using existing roster, team strength and map-rating logic: overall, AWP, entry, clutch, IGL/calling and map pool comparisons plus projected map edge/veto style previews.
- Preserved the existing career/event state actions for simming the user match, simming other Swiss matches, advancing Swiss rounds, generating playoffs, simming playoff rounds and finishing the event.
- Kept date-based event context visible in the overlay header and did not change transfers, morale, contracts, scouting, advanced VRS or the spreadsheet importer.
- Added dedicated overlay CSS with navy/blue-black grid background, glass panels, compact broadcast typography, cyan/green user-team highlighting and responsive full-screen layout rules.

#### Files Created
- src/components/event/EventHeader.jsx
- src/components/event/EventTabs.jsx
- src/components/event/EventMatchRail.jsx
- src/components/event/EventMainPanel.jsx
- src/components/event/EventSidebar.jsx
- src/components/event/EventResultsFeed.jsx
- src/components/event/EventPlacementsPanel.jsx
- src/components/event/EventBracketView.jsx
- src/components/event/EventSwissView.jsx
- src/components/event/EventMapPoolPreview.jsx
- src/components/event/eventOverlayUtils.js

#### Files Modified
- src/pages/EventHub.jsx
- src/index.css
- progress.md

#### Known Limitations
- The overlay uses the existing simplified Swiss/playoff tournament engine and simplified invite/ranking logic.
- Map veto/pick preview is projected from team map ratings and strength breakdowns rather than a fully persistent veto history system.
- Event-wide player stats still come from simulated match summaries and are not yet persisted to individual player career histories.

#### Manual Testing Steps
1. Run `npm run build`.
2. Run `npm run lint`.
3. Run `npm run dev`.
4. Reset career if needed, start a career and select MOUZ.
5. Advance to the next event, enter the event and confirm the Event Hub opens as a full-screen tournament overlay.
6. Confirm the top header bar shows event dates, status, record, teams alive, best finish and action buttons.
7. Confirm the event tabs, left match rail, central Swiss/playoff hero area and right sidebar are visible.
8. Click Sim This Match from the right sidebar and confirm the user result appears in the overlay.
9. Click Sim Other Matches / Sim Round and Advance Round until Swiss completes.
10. Generate playoffs, sim playoff rounds and confirm the bracket, results feed, placements panel and champion state update.

### Task 10 — Full-Screen Career Event Mode and Dynamic VRS v1 (Complete)

- Added a true career event mode that hides the normal app sidebar/navigation while an event is active and lets the tournament overlay occupy the full viewport.
- Added fixed-position full-screen overlay styling with `inset: 0`, `100vw`/`100vh`, dark broadcast background and a high z-index so the event no longer feels like a normal dashboard page.
- Added an Event Ready modal that appears when the career reaches an event start date in `event_ready`, showing event dates, prize pool, team count, selected team, invite status, VRS rank, cutoff, seed/reason and entry/background simulation actions.
- Added a first-version dynamic VRS-style ranking engine with points, current rank, last rank, movement, form, records, map record, strength of schedule, recent event results and seasonal prize-money fields.
- Dynamic rankings now initialize from imported ranking/reputation, but imported ranking is only the initial seed after career creation.
- Added dynamic event invite snapshots at event start using the current VRS standings and top-8/top-16/top-24/top-32 style cutoffs based on event size.
- Event fields now use the stored invite snapshot, so invites do not change after an event begins.
- Event completion now applies approximate VRS point/form updates using event weight, placement/champion bonus, wins/losses, opponent rank and upset logic, then re-sorts ranks and calculates movement.
- Added team form as a 0-100 value that initializes from reputation/rank and changes after match results and event wins.
- Improved match simulation variance by mixing live randomness into the existing strength-based seeded noise and by varying chaos by series length, making Bo1s more upset-prone than longer series while keeping better teams favored.
- Updated the Rankings page to show dynamic VRS standings with movement, VRS points, form, record, last event, prize money and reputation.
- Updated the Dashboard to surface the selected team's current VRS rank, points, movement, form and projected/dynamic invite cutoff information for upcoming events.
- Updated Diagnostics with checks for event-ready modal state, full-screen event mode, dynamic VRS initialization, dynamic invite snapshots, rank/form updates and simulation variance.

#### Files Created
- src/utils/vrsRankingEngine.js
- src/components/EventReadyModal.jsx

#### Files Modified
- src/App.jsx
- src/state/GameStateContext.jsx
- src/utils/matchEngine.js
- src/pages/Dashboard.jsx
- src/pages/Rankings.jsx
- src/pages/Diagnostics.jsx
- src/index.css
- progress.md

#### Known Limitations
- The VRS formula is an approximation, not the exact real Valve formula.
- No transfers yet.
- No contracts yet.
- No morale yet.
- No detailed sponsorship economy yet.
- Event formats are still simplified for some event types, with the playable career hub still using the existing Swiss/playoff structure.
- Event invite snapshots are dynamic from VRS rankings, but regional qualifiers, partner invites and Major-specific qualification rules are not modeled yet.

#### Manual Testing Steps
1. Run `npm run build`.
2. Run `npm run dev`.
3. Reset career.
4. Select MOUZ.
5. Confirm Dashboard shows MOUZ, 7 January 2026, current VRS rank, VRS points and form.
6. Advance to BLAST Bounty Season 1.
7. Confirm the Event Ready modal appears with invited/not invited status, seed or cutoff reason.
8. Click Enter Event if invited.
9. Confirm the event screen becomes a full-screen tournament overlay and the normal sidebar is hidden.
10. Sim MOUZ's match and sim other matches.
11. Progress Swiss rounds, generate playoffs, sim playoffs and finish the event.
12. Confirm Event Summary includes VRS point delta, rank before/after, rank movement and form change.
13. Return to Dashboard and confirm the dynamic VRS rank/form have updated.
14. Advance to IEM Katowice and confirm the invite field is based on the updated dynamic VRS rankings rather than the original imported ranking.

#### Next Recommended Task
Add richer event-format support for non-16-team events and persist deeper player/team career histories from event stats without adding transfers, contracts or morale yet.

### Task 11 — COD-Reference Event Overlay Clarity Pass (Complete)

- Redesigned the career event overlay around the attached COD Manager screenshot's visual hierarchy: clean top event bar, tabs near the top, focused left current-match rail, large central tournament state area and simplified right information sidebar.
- Reduced Overview clutter by removing repeated action areas and moving deeper placement/map/stat detail away from the primary right sidebar emphasis.
- Improved the top event bar with one obvious action zone, event date range, current stage, teams alive, user team tag, status, record, best possible finish, next opponent and a persistent next-action strip.
- Improved Swiss clarity with a central qualification board, record/pool sections, qualified/eliminated sections, clear Swiss rules and a “Your Path” strip showing the user team's current record and what a win/loss means.
- Improved playoff bracket clarity with larger horizontal bracket columns, clearer user-team highlighting, next user match emphasis and a Champion column.
- Simplified the right sidebar to focus on My Team, Current Match, Key Matchup, Latest User Result, recent results and My Path.
- Kept the event entry modal, full-screen event mode, user-team highlighting, sim controls, date-based calendar logic and dynamic VRS invite/ranking systems intact.
- Verified the build with `npm run build`.

#### Files Modified
- src/components/event/EventHeader.jsx
- src/components/event/EventSwissView.jsx
- src/components/event/EventBracketView.jsx
- src/components/event/EventSidebar.jsx
- src/components/event/EventMatchRail.jsx
- src/components/event/EventMapPoolPreview.jsx
- src/components/event/eventOverlayUtils.js
- src/index.css
- progress.md

#### Known Limitations
- The layout has been rebuilt to match the COD screenshot's structure and readability, but exact visual parity depends on live career state and team/event data.
- Playable event formats still use the existing simplified Swiss into single-elimination playoffs structure for the career hub.
- Dynamic VRS is preserved as the existing approximation rather than an exact Valve formula.
- Detailed map-pool and player-stat history are still event-generated summaries rather than full long-term player career histories.

#### Manual Testing Steps
1. Run `npm run build`.
2. Run `npm run dev`.
3. Reset career.
4. Select MOUZ.
5. Advance to BLAST Bounty Season 1.
6. Confirm the event entry modal appears and still shows invite/cutoff context.
7. Enter the event and confirm the full-screen overlay opens with no normal sidebar.
8. Confirm Swiss Round 1 has the COD-style structure: left match rail, central Swiss board and simplified right sidebar.
9. Click Sim Your Match and confirm the result, record and next action update clearly.
10. Click Sim Other Matches, then Advance Round when available.
11. Continue until playoffs or elimination and confirm the playoff bracket is readable if reached.
12. Finish the event, return to dashboard and confirm Rankings/VRS movement still updates.

#### Next Recommended Task
Add richer event-format support for non-16-team events and persist deeper player/team career histories from event stats while keeping the cleaned full-screen event mode intact.

### Task 7 — COD-Reference Event Overlay Rebuild (Complete)

- Event Overlay restyled to closely match the supplied COD Manager reference while keeping Counter-Strike event logic, teams, maps and Swiss/playoff systems intact.
- Overview clutter removed: the large central Swiss qualification race board, record pool blocks and dashboard-style standings/stat panels no longer render on the Overview tab.
- Centre canvas opened up for bracket/path presentation with a dark grid/glow background, a minimal user Swiss path lane at event start and a spacious playoff bracket area once playoffs begin.
- Swiss details moved to the Swiss tab, including record pools, qualified teams, eliminated teams and full Swiss status context.
- Stats moved to the Stats tab, with event player leaders and performance lines kept out of the Overview layout.
- Placements moved to the Placements tab, keeping prize/finish information out of the main event canvas.
- Colour theme updated with event-specific CSS variables for dark navy background, slate panels, blue-grey borders, cyan/teal accents, green user-team highlights, warning and danger colours.
- Left match rail was rebuilt visually around compact COD-style stacked match cards, with seed/rank, team names, user highlight, YOU badge, status text and completed scores.
- Right sidebar was kept as compact stacked cards for My Team, Current Match, Map Pool Preview, latest results and path/prize context.
- Map Pool Preview now uses compact Counter-Strike-specific edge rows for overall, map pool, AWP, entry and form, plus projected maps.
- User path made clearer through a dedicated path component showing current record, next opponent, latest result and win/loss implications.
- Top action strip remains the single primary action area for simming user match, simming other matches, advancing rounds, generating playoffs and finishing events.

#### Files Modified
- src/components/event/EventMainPanel.jsx
- src/components/event/EventMapPoolPreview.jsx
- src/components/event/EventCanvas.jsx
- src/components/event/EventUserPath.jsx
- src/index.css
- progress.md

#### Known Limitations
- The manual visual path was validated through build/static inspection in this environment; an interactive browser run is still recommended to verify exact pixel spacing against the screenshots.
- Playoff bracket connectors remain card-column based rather than fully drawn connector lines.
- Event-wide stats are still based on existing simulated match aggregation and are not yet a deeper persistent event stat database.

#### Next Recommended Task
- Run a browser/manual pass through the specified MOUZ BLAST Bounty path, then tune exact spacing and bracket connector lines from live screenshots if needed.
