# Project Status

Last updated: 2026-10-08

## Current milestone
**None in progress.** Milestone 4 (menus, saving and stats) is complete and waits for Robert's review. Next milestone to be agreed with Robert.

## Completed
- Market research (project folder `/research/`).
- Game design draft v0.2 (`GAME_DESIGN.md`).
- Decisions: pool foul penalty is ball in hand (R1, 2026-10-07); Web stack (TypeScript + Phaser 4, Capacitor for Android); Pool first; GitHub repo `robert-kamunde/tz-mobile-games`.
- Milestone 0: shared core and Phaser shell.
- Milestone 1: deterministic pool physics with spin, touch aiming, guide line, power bar.
- Milestone 1 build published as a private web page for Robert to try on his phone (2026-10-07).
- Milestone 2: full Blackball rules engine, ball in hand, two-player pass-and-play with fouls, colours, win/loss and New game. 112 unit tests and 72 browser test runs pass.
- Potted-ball trays under each player's name (Robert's request after playing M2 on his phone). 113 unit tests and 75 browser test runs pass.
- Milestone 3 (2026-10-08): computer opponent at three levels, opponent picker. 136 unit tests and 90 browser test runs pass; ladder Hard 36/40 over Medium, Medium 32/40 over Easy.
- Milestone 4 (2026-10-08): main menu (Continue, Play, Stats, Rules, Settings), Menu button on the table, game in progress saved and resumed (TD6), stats per computer level, last opponent marked (TD8), language setting, rules screen, save backups (TD2). 166 unit tests and 111 browser test runs pass. Report: project folder `reports/milestone-4-report.md`.

## Next (order to confirm with Robert)
- Proposed Milestone 5: spin control and fine aim (TD4), the last missing MVP controls.
- Later: spin control and fine aim (TD4); sound and art; Android build and device testing (blocked, B1).

## Blockers / decisions needed
1. Android build environment (KNOWN_ISSUES B1). Needed before the first phone test. Trying the game in a phone's browser over Wi-Fi with `npm run dev:pool` is possible today on Robert's own computer.

## Known bugs
None open.

## Technical debt
See KNOWN_ISSUES.md (TD1, TD4, TD5, TD7, TD8; TD2 and TD6 resolved in Milestone 4).

## Architectural decisions
See ARCHITECTURE.md (A1 to A18).
