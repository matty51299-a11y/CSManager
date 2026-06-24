# CSManager
# CS Dynasty Manager

A standalone Counter-Strike management simulation game built with React + Vite.

This is a fresh project and is not a reskin of CDL Manager. The game should be built around Counter-Strike-specific systems including global rankings, tournament invites, Major qualification, 5-player rosters, map pools, transfers, contracts, team reputation and long-term dynasty management.

## Core Design

The player manages a professional Counter-Strike team in a global open circuit.

The main progression loop is:

1. Build and manage a 5-player roster
2. Compete in regional and international events
3. Improve ranking and reputation
4. Earn invites to bigger tournaments
5. Qualify for Majors
6. Manage contracts, transfers, morale and long-term team development

## Important Rules

- Do not import CDL-specific logic.
- Do not use CDL teams, CDL points, Champs phases, Challengers logic or COD match simulation.
- This game needs its own Counter-Strike-specific structure.
- Every active team must have exactly 5 active players.
- Every active player can only belong to one team.
- The game should be built cleanly and simply before adding complex features.
- Prefer clear, beginner-friendly code.
- Do not overbuild early systems.

## Planned Core Systems

- Teams
- Players
- 5-player roster rules
- CS roles
- Active Duty map pool
- Tournament calendar
- VRS-style rankings
- Major qualification
- Match simulation
- Transfers and free agency
- Contracts and buyouts
- Staff and scouting
- Inbox/news centre
- Player morale and dynamics

## CS Roles

Player roles should include:

- IGL
- AWPer
- Entry
- Star Rifler
- Lurker
- Anchor
- Support
- Clutcher

## Active Map Pool

Initial maps:

- Ancient
- Anubis
- Dust II
- Inferno
- Mirage
- Nuke
- Overpass

## Development Order

1. Build clean React + Vite foundation
2. Add teams, players, maps and tournaments data models
3. Add small seed database
4. Add roster validation
5. Add rankings screen
6. Add calendar screen
7. Add simple match simulation
8. Add tournament formats
9. Add VRS-style ranking logic
10. Add Excel/CSV database import
11. Add transfers and contracts
12. Add morale, staff and inbox systems

## Tech Stack

- React
- Vite
- JavaScript
- Local state first
- No backend yet
