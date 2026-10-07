# Project Status

Last updated: 2026-10-07

## Current milestone
**Milestone 2: Blackball rules and pass-and-play. Complete** (tested in desktop Chromium with touch emulation only; see Unverified in KNOWN_ISSUES.md).

## Completed
- Market research (project folder `/research/`).
- Game design draft v0.2 (`GAME_DESIGN.md`).
- Decisions: pool foul penalty is ball in hand (R1, 2026-10-07); Web stack (TypeScript + Phaser 4, Capacitor for Android); Pool first; GitHub repo `robert-kamunde/tz-mobile-games`.
- Milestone 0: shared core and Phaser shell.
- Milestone 1: deterministic pool physics with spin, touch aiming, guide line, power bar.
- Milestone 1 build published as a private web page for Robert to try on his phone (2026-10-07).
- Milestone 2: full Blackball rules engine, ball in hand, two-player pass-and-play with fouls, colours, win/loss and New game. 112 unit tests and 72 browser test runs pass.

## In progress
- Nothing. Waiting on Robert to confirm the Milestone 3 scope and for his feedback from playing on a phone.

## Next: Milestone 3, computer opponent (scope draft, to confirm)
- AI in plain TS that picks shots by simulating candidates with the real physics and judging them with the rules engine; three levels (easy, medium, hard) differing in aim error, power error and how many shots it considers.
- Places the cue ball sensibly when it has ball in hand. Thinks within a time budget so low-end phones never freeze.
- Tests: AI never plays an illegal-by-construction shot on purpose, always finishes thinking within budget, harder levels win more often against easier ones over many simulated games.
- After that (order to confirm): menus, settings, rules screen, stats and saving a match in progress (TD6); spin control and fine aim (TD4); sound and art; Android build and device testing.

## Blockers / decisions needed
1. Android build environment (KNOWN_ISSUES B1). Needed before the first phone test. Trying the game in a phone's browser over Wi-Fi with `npm run dev:pool` is possible today on Robert's own computer.

## Known bugs
None open.

## Technical debt
See KNOWN_ISSUES.md (TD1, TD2, TD4 to TD7).

## Architectural decisions
See ARCHITECTURE.md (A1 to A15).
