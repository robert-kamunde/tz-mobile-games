# Project Status

Last updated: 2026-10-07

## Current milestone
**Milestone 0: Foundation. Complete** (tested in desktop Chromium only; see Unverified in KNOWN_ISSUES.md).

## Completed
- Market research (project folder `/research/`).
- Game design draft v0.2 (`GAME_DESIGN.md`).
- Decisions: pool foul penalty is ball in hand (R1, 2026-10-07); Web stack (TypeScript + Phaser 4, Capacitor for Android); Pool first; GitHub repo `robert-kamunde/tz-mobile-games`.
- Shared core and Phaser shell with 38 unit tests and 33 browser test runs, all passing.

## In progress
- Milestone 1 (scope below).

## Next: Milestone 1, Pool table and physics (scope draft, to confirm)
- One 7 ft UK table, 15 object balls + cue ball, pockets, cushions.
- Deterministic ball physics in plain TS on the fixed stepper: rolling, friction, ball-ball and cushion collisions, pocketing.
- Drag-to-aim with aim line, power control, shoot. No rules engine, AI or menus yet (Milestone 2+).
- Tests: physics unit tests (energy loss, collision angles, no tunnelling at max power, determinism across frame rates, balls always come to rest), browser tests for aiming by touch on three screen sizes, frame-rate check under CPU throttle.

## Blockers / decisions needed
1. Android build environment (KNOWN_ISSUES B1). Needed before the first phone test.

## Known bugs
None open.

## Technical debt
See KNOWN_ISSUES.md (TD1 to TD3).

## Architectural decisions
See ARCHITECTURE.md (A1 to A9).
