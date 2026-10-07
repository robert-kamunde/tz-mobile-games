# Project Status

Last updated: 2026-10-07

## Current milestone
**Milestone 1: Pool table and physics. Complete** (tested in desktop Chromium with touch emulation only; see Unverified in KNOWN_ISSUES.md).

## Completed
- Market research (project folder `/research/`).
- Game design draft v0.2 (`GAME_DESIGN.md`).
- Decisions: pool foul penalty is ball in hand (R1, 2026-10-07); Web stack (TypeScript + Phaser 4, Capacitor for Android); Pool first; GitHub repo `robert-kamunde/tz-mobile-games`.
- Milestone 0: shared core and Phaser shell.
- Milestone 1: deterministic pool physics with spin, practice table with touch aiming, guide line, power bar and re-rack. 76 unit tests and 63 browser test runs pass.

## In progress
- Nothing. Waiting on Robert to confirm the Milestone 2 scope.

## Next: Milestone 2, Blackball rules and two-player games (scope draft, to confirm)
- Rules engine in plain TS reading the physics shot events: break, open table, group assignment, legal shots, fouls, ball in hand (player places the cue ball by dragging), black-ball win and loss, re-rack when the black goes in on the break.
- Pass-and-play for two players on one phone: turn indicator, groups shown, foul and win messages.
- Tests: rules unit tests for every rule and foul in GAME_DESIGN.md, scripted shot sequences, browser tests for a full game and for ball in hand.
- Later milestones (order to confirm): AI with three levels; menus, settings, rules screen and stats; spin control and fine aim; sound and art; Android build and device testing.

## Blockers / decisions needed
1. Android build environment (KNOWN_ISSUES B1). Needed before the first phone test. Trying the game in a phone's browser over Wi-Fi with `npm run dev:pool` is possible today on Robert's own computer.

## Known bugs
None open.

## Technical debt
See KNOWN_ISSUES.md (TD1, TD2, TD4, TD5).

## Architectural decisions
See ARCHITECTURE.md (A1 to A13).
