# Architecture

Last updated: 2026-10-07 (Milestone 0)

## Overview

One repository, npm workspaces, TypeScript everywhere. Two layers are shared by both games; each game will be its own package on top of them.

```
packages/
  core/    Engine-independent logic. No Phaser, no DOM globals. Fully unit-tested.
  shell/   Phaser app shell: boot, scaling, lifecycle wiring, settings, language, rotate prompt.
           Contains no gameplay. demo/ is a placeholder app used only by the shell's browser tests.
  pool/    (Milestone 1) The pool game: rules + physics in plain TS, Phaser only for drawing and input.
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

## Data stored on the device

| Key | Owner | Schema version | Contents |
|---|---|---|---|
| `<gameId>.settings` | shell | 1 | `{ locale, soundVolume, musicVolume }` |

`gameId` must never change after release or players lose their data.

## TypeScript projects

`tsc -b` from the root builds three projects: `packages/core`, `packages/shell` (browser code, `vite/client` types) and `packages/shell/tsconfig.node.json` (configs and Playwright tests, Node types). Browser code cannot see Node types.
