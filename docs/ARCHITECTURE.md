# Architecture

Last updated: 2026-10-07 (Milestone 2)

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
| A11 | No trigonometry, `hypot`, `pow`, `exp`, `log` or random numbers in `src/physics` | These can return different last bits on different JavaScript engines, which would make the same shot end differently on two phones (and break AI planning and any future online play). Enforced by `test/purity.test.ts`. | 2026-10-07 |
| A12 | Static art (table, balls) is drawn once into textures instead of live Phaser Graphics | Phaser rebuilds Graphics geometry on the CPU every frame; a texture is one quad. In the test browser this changed idle fps only slightly (24 to 26), because that browser's software renderer is limited by fill rate, but it removes avoidable CPU work on phones. | 2026-10-07 |
| A14 | Rules are pure functions over plain data (`resolveShot(state, summary, countsBefore)`), fed by a summary of the physics event log | Every rule is unit-testable without the physics or a browser; the AI can reuse it to judge simulated shots. Covered by the same purity test as the physics. | 2026-10-07 |
| A15 | Browser tests may set up a position through an e2e-only probe (`pool.testLayout`) | Late-game situations (on the black, ball in hand) cannot be reached reliably by playing shots in a test. The probe exists only in e2e builds; the release build is checked to contain no test hooks. | 2026-10-07 |
| A13 | Physics runs in real time inside the scene (`FixedStepper`, max 100 steps per frame) with no render interpolation | 1 ms steps make interpolation error at most about 4 px at full speed. A frame slower than 100 ms makes the shot play slower; the result is unchanged. | 2026-10-07 |

## Core modules (`packages/core/src`)

| Module | Purpose |
|---|---|
| `logger.ts` | Scoped logger with levels (`debug` to `error`) and a swappable sink. `silentLogger` for tests. |
| `events.ts` | Small typed `Emitter`. A listener that throws is logged and does not stop other listeners. |
| `storage.ts` | `KeyValueStore` interface. `createWebStore` wraps `localStorage` and never throws (blocked or full storage returns `null`/`false`). `MemoryStore` for tests. |
| `save.ts` | `createSaveSlot` reads/writes one versioned value. `load()` returns `{ data, outcome }` where outcome is `loaded`, `migrated`, `missing`, `corrupt`, `invalid` or `unsupported-version`; anything but loaded/migrated returns defaults. |
| `i18n.ts` | `createTranslator` with `{name}` placeholders and fallback; `findMissingKeys` for tests. |
| `fixedStep.ts` | `FixedStepper.advance(elapsedMs)` returns how many fixed steps to run, the interpolation alpha, and dropped time. |
| `lifecycle.ts` | `AppLifecycle` turns `visibilitychange` and `pagehide` into idempotent `pause`/`resume` events. |
| `settings.ts` | Player settings (locale, sound volume, music volume), validation, and the save slot `"<gameId>.settings"`. |

## Shell (`packages/shell/src`)

- `createShellGame(options)` creates services, the Phaser game, the rotate overlay and (e2e builds only) test hooks.
- `services.ts`: one `Services` object per game (logger, store, translator, lifecycle, settings get/update). It is put in Phaser's registry under `tzg.services` before boot; scenes read it with `getServices(scene)`, so no scene builds its own storage or translator. Settings are saved on every change and again on pause.
- `rotateOverlay.ts`: a DOM message (not canvas) asking the player to rotate the phone when the orientation is wrong.
- `testHooks.ts` / `testHooksApi.ts`: `window.__tzg`, read-only state for browser tests. Installed only when built with `--mode e2e`; the release build is checked to contain no `__tzg`.

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
| `physics/aim.ts` | `computeAimGuide`: sweeps the cue ball to the first ball, cushion or pocket; ghost ball and predicted directions. Reusable by the AI. |
| `physics/placement.ts` | Finds a free spot for a potted cue ball, before the player drags it (ball in hand). |
| `rules/shotSummary.ts` | Turns the physics event log into what the rules need: first ball hit, balls potted, cue ball potted, cushion after contact, balls to a cushion (break). |
| `rules/blackball.ts` | Blackball rules: `startMatch`, `resolveShot`, `legalFirstContacts`, `isOnBlack`. Returns the next match state and a verdict (continue, turn over, foul with reason, re-rack, game over with reason). |
| `scenes/TableScene.ts` | The match: input (aim, power, ball in hand), simulation loop, applying verdicts, new game. |
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

Pool's `gameId` is `pool`. Pool stores nothing else yet: a match in progress lives only in memory (KNOWN_ISSUES TD6).

`gameId` must never change after release or players lose their data.

## TypeScript projects

`tsc -b` from the root builds: `packages/core`, `packages/shell` and `packages/pool` (browser code, `vite/client` types), `tooling` and each package's `tsconfig.node.json` (configs, unit and browser tests, Node types). Browser code cannot see Node types.
