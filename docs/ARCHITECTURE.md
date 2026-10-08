# Architecture

Last updated: 2026-10-08 (Milestone 4)

## Overview

One repository, npm workspaces, TypeScript everywhere. Two layers are shared by both games; each game will be its own package on top of them.

```
packages/
  core/    Engine-independent logic. No Phaser, no DOM globals. Fully unit-tested.
  shell/   Phaser app shell: boot, scaling, lifecycle wiring, settings, language, rotate prompt.
           Contains no gameplay. demo/ is a placeholder app used only by the shell's browser tests.
  pool/    The pool game. src/physics is plain TS (no Phaser); src/scenes draws and handles input.
tooling/   Shared Vite and Playwright setup and browser-test helpers (Node side only).
```

Dependency direction is strictly `game -> shell -> core`. Core never imports shell or Phaser.

## Key decisions

| # | Decision | Why | Date |
|---|---|---|---|
| A1 | Web stack: TypeScript + Phaser 4, wrapped for Android with Capacitor | Chosen by Robert. The only option that can be built and tested end to end in the development environment. | 2026-10-07 |
| A2 | Pool first, Daladala Rush second | Chosen by Robert. Smaller scope, proven demand. | 2026-10-07 |
| A3 | Game rules and physics live in plain TS, separate from rendering | Unit-testable without a browser; deterministic; renderer can change without touching rules. | 2026-10-07 |
| A4 | Fixed-timestep simulation (`FixedStepper`) | Same shot gives the same result on fast and slow phones. Caps catch-up steps per frame so a slow phone does not spiral. | 2026-10-07 |
| A5 | Versioned save envelope `{ v, data }` with validation and migrations | Updates must never crash on an old or damaged save. | 2026-10-07 |
| A6 | Kiswahili is the default language, English is the fallback | Target market. Missing Kiswahili text falls back to English, then to the key, never to a blank. | 2026-10-07 |
| A7 | The shell halts the Phaser loop itself when the app is backgrounded | Phaser 4 only resets its clock on `visibilitychange` and relies on the browser to stop `requestAnimationFrame`. Found by the backgrounding test (frames kept advancing). Halting explicitly guarantees no CPU, GPU or battery use in the background. | 2026-10-07 |
| A8 | Canvas renders at design resolution (1280x720), scaled to fit, letterboxed | Low-end GPUs. Higher device pixel ratio is not used. Revisit if text looks soft on real devices. | 2026-10-07 |
| A9 | Exact dependency versions, no `^` ranges | Reproducible builds. Playwright is pinned to 1.56.1 to match the Chromium build installed in the dev environment. | 2026-10-07 |
| A10 | Pool physics: 1 ms fixed step, discrete collisions, sliding/rolling ball model with top/back and side spin | At the 7 m/s maximum a ball moves 7 mm per step, under a third of its radius, so it cannot pass through a ball or cushion without continuous collision code. About 4 µs per step for 16 balls in tests. Spin is in the model now (MVP needs it) so adding the spin control later needs no physics rewrite. | 2026-10-07 |
| A11 | No trigonometry, `hypot`, `pow`, `exp`, `log`, `Math.random` or clock calls in `src/physics`, `src/rules` and `src/ai` | These can return different last bits on different JavaScript engines, which would make the same shot end differently on two phones (and break AI planning and any future online play). Enforced by `test/purity.test.ts`. | 2026-10-07 |
| A12 | Static art (table, balls) is drawn once into textures instead of live Phaser Graphics | Phaser rebuilds Graphics geometry on the CPU every frame; a texture is one quad. In the test browser this changed idle fps only slightly (24 to 26), because that browser's software renderer is limited by fill rate, but it removes avoidable CPU work on phones. | 2026-10-07 |
| A14 | Rules are pure functions over plain data (`resolveShot(state, summary, countsBefore)`), fed by a summary of the physics event log | Every rule is unit-testable without the physics or a browser; the AI can reuse it to judge simulated shots. Covered by the same purity test as the physics. | 2026-10-07 |
| A15 | Browser tests may set up a position through an e2e-only probe (`pool.testLayout`) | Late-game situations (on the black, ball in hand) cannot be reached reliably by playing shots in a test. The probe exists only in e2e builds; the release build is checked to contain no test hooks. | 2026-10-07 |
| A16 | The computer opponent (`src/ai`) chooses shots by playing candidates out on copies of the simulation and judging them with the rules engine, in resumable slices | Reuses the exact physics and rules, so its predictions are exact (a unit test checks this) and it cannot disagree with the referee. Slicing (`ShotPlanner.work(maxSteps)`) lets the scene spread thinking over frames within a time budget; the decision does not depend on how the work is sliced. Seeded randomness (`createRandom` in core) for its aiming error keeps tests repeatable. Same purity rules as physics and rules. | 2026-10-08 |
| A17 | A game in progress is saved as ball spots, match state, opponent and shot count (`pool.match`); kinds, sizes and masses come from the rack on load. It is saved at the start of a game, after every shot and on every pause. While balls roll, the snapshot from before the shot is saved instead. The load is checked strictly (every ball once, on the table, no overlaps, a legal unfinished match), and anything else counts as no saved game. | A shot cut off half way cannot be judged, so resuming from before it is the only result that is always legal. Saving only what cannot be derived keeps a hand-edited or buggy save from changing the balls. Strict checks mean a bad save costs the player one game, never a crash or an impossible table. | 2026-10-08 |
| A18 | `createSaveSlot` copies any unreadable stored value to `<key>.backup` before defaults replace it | Stats are the first data a player would miss. A backup lets a future fix recover them. Only the last unreadable value is kept. | 2026-10-08 |
| A13 | Physics runs in real time inside the scene (`FixedStepper`, max 100 steps per frame) with no render interpolation | 1 ms steps make interpolation error at most about 4 px at full speed. A frame slower than 100 ms makes the shot play slower; the result is unchanged. | 2026-10-07 |

## Core modules (`packages/core/src`)

| Module | Purpose |
|---|---|
| `logger.ts` | Scoped logger with levels (`debug` to `error`) and a swappable sink. `silentLogger` for tests. |
| `events.ts` | Small typed `Emitter`. A listener that throws is logged and does not stop other listeners. |
| `storage.ts` | `KeyValueStore` interface. `createWebStore` wraps `localStorage` and never throws (blocked or full storage returns `null`/`false`). `MemoryStore` for tests. |
| `save.ts` | `createSaveSlot` reads/writes one versioned value. `load()` returns `{ data, outcome }` where outcome is `loaded`, `migrated`, `missing`, `corrupt`, `invalid` or `unsupported-version`; anything but loaded/migrated returns defaults, and the unreadable text is copied to `backupKey(key)` (A18). |
| `i18n.ts` | `createTranslator` with `{name}` placeholders and fallback; `findMissingKeys` for tests. |
| `fixedStep.ts` | `FixedStepper.advance(elapsedMs)` returns how many fixed steps to run, the interpolation alpha, and dropped time. |
| `random.ts` | `createRandom(seed)`: seeded uniform and roughly normal random numbers (mulberry32), the same sequence on every device. Used for the computer's aiming error. |
| `lifecycle.ts` | `AppLifecycle` turns `visibilitychange` and `pagehide` into idempotent `pause`/`resume` events. |
| `settings.ts` | Player settings (locale, sound volume, music volume), validation, and the save slot `"<gameId>.settings"`. |

## Shell (`packages/shell/src`)

- `createShellGame(options)` creates services, the Phaser game, the rotate overlay and (e2e builds only) test hooks.
- `services.ts`: one `Services` object per game (logger, store, translator, lifecycle, settings get/update). It is put in Phaser's registry under `tzg.services` before boot; scenes read it with `getServices(scene)`, so no scene builds its own storage or translator. Settings are saved on every change and again on pause.
- `rotateOverlay.ts`: a DOM message (not canvas) asking the player to rotate the phone when the orientation is wrong.
- `testHooks.ts` / `testHooksApi.ts`: `window.__tzg`, read-only state for browser tests (scenes, element positions, text and data of named objects, frame stats, game probes). Installed only when built with `--mode e2e`; the release build is checked to contain no `__tzg`.

## Pool (`packages/pool/src`)

| Path | Purpose |
|---|---|
| `config/table.ts` | UK 7 ft table and ball sizes, in metres. |
| `config/physics.ts` | Friction, restitution, step size, shot speed range, safety limits. Starting values, to be tuned in play-testing. |
| `config/layout.ts` | Screen layout, colours (placeholders), power bar, aim guide, cue stick. |
| `physics/types.ts` | Ball, table, shot and shot-event types. |
| `physics/geometry.ts` | Builds cushion segments and pocket jaws from the table config. Pocket ids 0-5 clockwise from top-left. |
| `physics/rack.ts` | Blackball rack (black in the middle of row 3, different colours on the back corners). Cue ball is id 0. |
| `physics/simulation.ts` | `PoolSimulation`: `strike`, `step`, `runUntilSettled`, `placeCueBall`, `shotEvents`. Shot events (ball contacts in order, cushions, pockets) are what the Milestone 2 rules engine will read. |
| `physics/aim.ts` | `computeAimGuide`: sweeps the cue ball to the first ball, cushion or pocket; ghost ball and predicted directions. Also used by the AI to check the cue ball reaches the intended ball first. |
| `physics/placement.ts` | Finds a free spot for a potted cue ball, before the player drags it (ball in hand). |
| `rules/shotSummary.ts` | Turns the physics event log into what the rules need: first ball hit, balls potted, cue ball potted, cushion after contact, balls to a cushion (break). |
| `rules/blackball.ts` | Blackball rules: `startMatch`, `resolveShot`, `legalFirstContacts`, `isOnBlack`. Returns the next match state and a verdict (continue, turn over, foul with reason, re-rack, game over with reason). |
| `ai/potLines.ts` | Straight-line pot geometry: which pots are on from a cue ball spot (clear paths, cut angle), how easy each looks, and the strike speed that reaches the pocket. |
| `ai/candidates.ts` | Candidate shots: pots at each level's speeds, plain contacts, a sweep of directions, break shots, and ball-in-hand spots. |
| `ai/planner.ts` | `ShotPlanner`: plays candidates out on copies of the table, scores outcomes (win, pot and position, miss and what it leaves, foul, loss), Hard's robustness check, then applies the level's aim and power error. |
| `config/ai.ts` | Levels, search settings, outcome scores and on-screen pacing of a computer turn. |
| `progress/opponent.ts` | `Opponent` (two players or the computer at a level), its short id and validation. |
| `progress/savedMatch.ts` | The saved game in progress (A17): `toSavedBalls`, `restoreBalls`, `validateSavedMatch`. |
| `progress/progress.ts` | Stats and the last opponent: `recordGame`, `validateProgress`. |
| `progress/slots.ts` | The two save slots, `pool.match` and `pool.progress`. |
| `scenes/MenuScene.ts` | Main menu (first scene): Continue, Play (picker), Stats, Rules and Settings (language) panels. |
| `scenes/TableScene.ts` | The match: starting a new game or resuming the saved one, input (aim, power, ball in hand), simulation loop, applying verdicts, saving, counting stats, starting computer turns, New game and Menu. |
| `scenes/ui.ts` | `addButton` (fires on release, never on a cancelled touch) and `Panel` (title, text, buttons, Back), shared by the menu, picker and HUD. |
| `scenes/poolSlots.ts`, `sceneKeys.ts` | The save slots shared through the registry, and the scene keys. |
| `scenes/ComputerTurn.ts` | Paces a computer turn on screen: thinking in slices within the frame budget and time limits, then placing, aiming and power animation, then the shot. |
| `scenes/OpponentPicker.ts` | "Unacheza na nani?" panel: two players or the computer at one of three levels, with the last choice marked. Used on the menu and after New game. |
| `scenes/MatchHud.ts` | Player panels, status line, controls hint, New game button (two-tap confirm mid-match), game-over panel. |
| `scenes/TableView.ts`, `AimView.ts`, `PowerBar.ts` | Drawing (table, balls, aim guide, cue stick, ball-in-hand ring) and the power control. |

### Physics model
- Each ball has velocity, top/back spin stored as contact-point velocity (`sx, sy`; rolling means `s = -v`) and side spin `wz`.
- Skidding: cloth friction opposes the slip; the slip shrinks 3.5x faster than the velocity changes, so a stun shot rolls at 5/7 of its speed. Rolling: constant rolling resistance.
- Ball-ball: impulse along the line of centres with restitution; spin is unchanged, which produces follow and draw. No throw.
- Cushion: restitution on the speed into the cushion; friction removes part of the contact slip, trading tangential speed and side spin (this is how side spin bends rebounds). Energy never increases (tested).
- Pockets: a ball drops when its centre comes within the drop radius of the pocket point; jaws make a channel to it. A ball can hang in the jaws.
- Safety: a ball found far outside the table is removed and logged as `escaped`; a shot still moving after 60 s is stopped and logged as `timeout`. Tests require that neither ever happens.

## Data stored on the device

| Key | Owner | Schema version | Contents |
|---|---|---|---|
| `<gameId>.settings` | shell | 1 | `{ locale, soundVolume, musicVolume }` |
| `pool.match` | pool | 1 | The game in progress (A17): `{ opponent, match, balls: [{ id, x, y, pocketed }], shots }`. Removed when the game ends. |
| `pool.progress` | pool | 1 | `{ vsComputer: { easy, medium, hard: { played, won } }, twoPlayerGames, lastOpponent }` |
| `<key>.backup` | core | n/a | The last unreadable value of that key, as stored (A18). |

Pool's `gameId` is `pool`.

`gameId` must never change after release or players lose their data.

## TypeScript projects

`tsc -b` from the root builds: `packages/core`, `packages/shell` and `packages/pool` (browser code, `vite/client` types), `tooling` and each package's `tsconfig.node.json` (configs, unit and browser tests, Node types). Browser code cannot see Node types.
