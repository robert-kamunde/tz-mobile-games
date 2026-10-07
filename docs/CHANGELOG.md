# Changelog

## 0.1.0 (unreleased) - Milestone 0: foundation
- Monorepo with `@tzg/core` (logger, events, never-throwing storage, versioned saves, Kiswahili/English translator, fixed-timestep stepper, app lifecycle, settings) and `@tzg/shell` (Phaser 4 app shell: fit-to-screen scaling, services registry, settings persistence, rotate prompt, e2e-only test hooks).
- Shell halts the game loop while the app is in the background (Phaser alone does not).
- 38 unit tests, 33 browser test runs across three screen sizes.
- No gameplay yet; the shell demo is a labelled placeholder.
