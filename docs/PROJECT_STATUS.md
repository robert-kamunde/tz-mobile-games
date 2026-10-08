# Project Status

Last updated: 2026-10-08

## Current milestone
**Milestone 3: computer opponent. Complete** (tested in desktop Chromium with touch emulation and computer-against-computer games only; see Unverified in KNOWN_ISSUES.md).

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

## In progress
- Nothing. Waiting on Robert to play against the computer on his phone and to choose the next milestone.

### Milestone 3 scope (as delivered)
- Opponent picker when a match starts (and from New game): two players on one phone, or the computer at Easy, Medium or Hard. The player always breaks the first game against the computer; breaks then alternate as before.
- AI in `src/ai`, pure and seeded like physics and rules (no Phaser, clock or `Math.random`):
  - Finds candidate shots: ghost-ball pots of every legal ball into every pocket with clear paths, plain contacts on legal balls, and a sweep of directions as a last resort when nothing else is legal.
  - Judges each candidate by playing it out on a copy of the table with the real physics and asking the rules engine what it means (pot and continue, turn over, foul, win, loss). Medium and Hard also score where the cue ball ends up for the next shot.
  - Places the cue ball for ball in hand (behind the baulk line for the break, anywhere after a foul) on a straight line to a makeable pot.
  - Plays the chosen shot with level-dependent aim and power error, so Easy misses often and Hard rarely.
  - Thinks in small slices each frame within a time limit, so the screen never freezes; it shows the aim and power before it shoots so the player can follow.
- No spin for the computer (players have no spin control yet, TD4).
- Tests:
  - Unit: candidate finding, blocked paths skipped, ball-in-hand spots legal, finds a legal hit when its ball is hidden, plays the winning pot on the black, predicts its own shots exactly, same seed gives the same decision however the work is sliced, thinking stays within its step limit at every level.
  - Strength ladder (separate command, results recorded in TESTING.md): Hard beats Medium and Medium beats Easy over many simulated games.
  - Browser: pick the computer, it plays its turns without touch input, the player's controls are ignored while it thinks, CPU time per frame while it thinks stays within budget on a 6x slower CPU, opponent picker on New game.

## Next (order to confirm with Robert)
- Proposed Milestone 4: menus and settings (main menu, language, sound on/off placeholder, rules screen), saving a match in progress so Android closing the app loses nothing (TD6), remembering the last opponent (TD8), basic stats (games won per level).
- Later: spin control and fine aim (TD4); sound and art; Android build and device testing (blocked, B1).

## Blockers / decisions needed
1. Android build environment (KNOWN_ISSUES B1). Needed before the first phone test. Trying the game in a phone's browser over Wi-Fi with `npm run dev:pool` is possible today on Robert's own computer.

## Known bugs
None open.

## Technical debt
See KNOWN_ISSUES.md (TD1, TD2, TD4 to TD8).

## Architectural decisions
See ARCHITECTURE.md (A1 to A16).
