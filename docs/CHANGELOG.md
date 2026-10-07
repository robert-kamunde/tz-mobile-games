# Changelog

## 0.2.0 (unreleased) - Milestone 1: pool table and physics
- New `@tzg/pool` package: UK 7 ft table, Blackball rack, deterministic physics with skid/roll, top/back and side spin, ball and cushion collisions, pocket jaws and drops.
- Practice table: drag on the table to aim with a guide line (ghost ball and predicted paths), pull the power bar to shoot, re-rack button. Potted cue ball comes back automatically (placeholder for ball in hand).
- Shell: test probes for game state, design-to-page conversion, CPU-time-per-frame stats (e2e builds only).
- Fixed: a system touch cancel on the power bar fired a shot.
- Shared `tooling/` for Vite and Playwright setup and browser-test helpers.
- Frame-budget tests now measure CPU time per frame instead of fps in a software-rendered browser.

## 0.1.0 (unreleased) - Milestone 0: foundation
- Monorepo with `@tzg/core` (logger, events, never-throwing storage, versioned saves, Kiswahili/English translator, fixed-timestep stepper, app lifecycle, settings) and `@tzg/shell` (Phaser 4 app shell: fit-to-screen scaling, services registry, settings persistence, rotate prompt, e2e-only test hooks).
- Shell halts the game loop while the app is in the background (Phaser alone does not).
- 38 unit tests, 33 browser test runs across three screen sizes.
- No gameplay yet; the shell demo is a labelled placeholder.
