# Architecture

Last updated: 2026-10-10 (Milestone 7)

## Overview

One repository, npm workspaces, TypeScript everywhere. Two layers are shared by both games; each game will be its own package on top of them.

```
packages/
  core/    Engine-independent logic. No Phaser, no DOM globals. Fully unit-tested.
  shell/   Phaser app shell: boot, scaling, lifecycle wiring, settings, language, rotate prompt.
           Contains no gameplay. demo/ is a placeholder app used only by the shell's browser tests.
  pool/    The pool game. src/physics is plain TS (no Phaser); src/scenes draws and handles input.
           android/ is the Capacitor Android project (A21); scripts/ draws the placeholder icons.
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
| A19 | Sound effects go through the shell's `SoundBoard` on raw Web Audio, with Phaser's audio turned off (`audio: { noAudio: true }`). Placeholder sounds are synthesised at start-up by core's `renderSound` from recipes in config, not loaded from files. | One small class covers what the game needs (unlock on first touch, suspend in the background, a voice limit, silent fallback) and is testable through the e2e hook; Phaser's sound manager would add a second unlock and pause path to keep in step with A7. Synthesised placeholders need no asset pipeline or download and are deterministic; recorded sounds can replace a recipe later without touching callers (`add(name, samples)`). | 2026-10-09 |
| A20 | Sounds are chosen from the physics event log, which now carries the impact speed of each ball and cushion contact. `ShotSoundMixer` (pure) turns each frame's new events into at most 4 cues, dropping a repeat of the same sound within 25 ms unless it is clearly louder. | Sound follows exactly what the physics did, with no second collision detector in the scene. Thinning keeps a break from turning into noise or using too many voices on a slow phone. | 2026-10-09 |
| A21 | Android app through Capacitor 8.5; the Android project (`packages/pool/android`) is committed, with the copied web build and generated plugin files ignored. App ID in `capacitor.config.ts`; version only in `packages/pool/package.json`, read by Gradle (versionCode = major*10000 + minor*100 + patch). | One place for each value that must agree, checked by `test/android.test.ts`. Committing the project keeps the manifest, activity and icon changes reviewable. | 2026-10-10 |
| A22 | Android's back button goes to a core `BackButton`: scenes add a handler while showing (`onBackButton`), newest first; when none handles it the app is minimised, not closed. The shell connects the phone's button only inside the app (`@capacitor/app`). | Without a listener, Capacitor's default closes the app from any screen, losing the player's place. Minimising matches Android 12+ behaviour for an app's first screen and keeps the game warm. Routing through core keeps it testable in the browser (`__tzg.back()`). | 2026-10-10 |
| A23 | Characters are data in `config/characters.ts`; a game stores only the two player picks (`picks`), and the computer's seat always shows its level's character (`seatCharacter`). Missing or bad picks in a save fall back to the defaults instead of discarding the game or the stats. `MatchSetup` runs the whole new-game choice (your character, then the opponent, then player 2's character; since 0.22.0) for both the menu and the table. | Characters never touch physics, rules or AI, so they stay out of those folders. Deriving the computer's character means a save cannot pair a level with the wrong face. Older saves need no version bump. One setup flow for every new game (0.36.0: only from the menu, since Acha mchezo replaced New game). | 2026-10-11 |
| A24 | Art is drawn by the game at start-up with the Canvas 2D API into Phaser canvas textures (`scenes/art/`, settings in `config/art.ts`), not shipped as image files | Gradients, shading and grain look far better than flat shapes; no download, licence or file pipeline (art sites are unreachable from the dev environment); each texture is drawn once and then costs one quad, as A12. Grain and speckle use the seeded `createRandom`, so the table looks the same every time. A designer can replace any texture key with an image later. | 2026-10-11 |
| A25 | Closing the game goes through core's `AppExit` (shell service `exit`): `available` only in the Android app (and in e2e builds, where closing just counts), settings saved before `App.exitApp()`. | A web page cannot close itself, so the button is hidden there rather than doing nothing. Saving first means a close never loses a setting; a game in progress is already saved after every shot (A17). | 2026-10-11 |
| A26 | Tables are data (`config/tables.ts`): a rail style (one drawing routine per kind in `art/tableArt.ts`, each drawn along every rail through `eachRail`), felt, cushion and marker colours. The chosen one is drawn at full size (`tableTexture`) and the others freed; the picker uses small copies (`TABLE_ART.previewScale`). | Adding a table is a data entry plus, for a new pattern, one drawing function. One full-size table texture is several megabytes of video memory, too much to keep six on a low-end phone. | 2026-10-11 |
| A27 | Catchphrases are data (`config/quips.ts`, Swahili and English side by side, turned into `quip.<character>.<moment>.<n>` strings); when to speak is decided by `rules/quips.ts` (`QuipChooser`) from the shot verdict with a seeded `Random`, and shown by `MatchHud.say`. | Keeping both languages of a line together makes them easy to review and change. The decision is pure and unit-tested; the scene only draws. Lines never touch play. | 2026-10-11 |
| A28 | Left-handed mode is one `ScreenSides` value (`screenSides(hand, length)` in `config/layout.ts`), passed to every object with a screen position: a table offset (`tableDx`) and a mirror for the controls column and bottom corners (`controlX`, `controlOriginX`). Layout constants stay written for the right hand. | One mirror rule instead of a second set of positions; a unit test checks the mirror is exact and nothing overlaps, and the e2e tests read positions from the scene instead of the constants. | 2026-10-11 |
| A30 | A button is still the plain `Text` that screens and tests use; its drawn face (`art/uiArt.ts`) is a separate image that follows the label's position, size, visibility, alpha and depth before every frame (`followButton` in `ui.ts`) and is destroyed with it. Panels draw a rounded image over an almost invisible box that still catches taps. | Every screen moves, hides and destroys buttons through the `Text`; making the button a container would have changed every caller and test. Following costs a few property copies per button per frame. | 2026-10-11 |
| A31 | The potted-ball tube (`scenes/PottedTube.ts`) is looks only. It follows the balls' `pocketed` flags each time `TableView.syncBalls` runs: new potted balls roll in, and if a ball in the tube is back on the table (new game, test layout) the tube is rebuilt without animation. It is placed for the right hand and mirrored with `ScreenSides.controlX` and a flipped texture. A ball rolling in is moved each frame from the scene clock, not with tweens. | The rules and saves stay untouched; the tube can never disagree with the table. The potting order is not saved, so a resumed game shows ball-number order. | 2026-10-11 |
| A33 | Story mode (0.24.0; chapters and twists 0.25.0) is data in `config/story.ts` (chapters of stops, twists, star rules, titles, rewards with what each needs: a finished chapter and/or a star total) and pure functions in `progress/story.ts`, saved in its own slot `pool.story`. It reuses the table scene: `TableStart` gains `{ story: stopId }`, the saved game carries an optional `story: { stop, fouls }`, and the end panel (`EndPanel`) is shared with Quick game. Rewards are ordinary table, cue and background ids, locked by `isTableLocked` etc. where they are chosen and where a game starts. From 0.26.0 a need is met by any one of its parts (chapter, stop, stars, or wins against the computer, from the stats in `pool.progress`), so looks and characters can be earned by story or by Quick game with no new save data; the checks take a `Played` (journey plus wins). | No second game loop or save format to keep in step; an older save without `story` is a Quick game, and a missing `pool.story` is an empty journey. | 2026-10-12 |
| A34 | Play reminders (0.28.0) are local notifications (`@capacitor/local-notifications`, shell `Reminders` service; a recording stand-in in e2e builds, nothing on a web page). The pool game picks one reminder (`progress/reminders.ts`, pure: an unfinished story game, an unfinished Quick game, a look one win away, the next stop, else an invitation) when the app goes to the background and removes it when the app comes back; at most one waits (one fixed id). Timing in `config/reminders.ts`: at least 24 h away and 48 h after the last one shown, at 18:00 local time. The player is asked once, after the first win against the computer; Settings has an on/off switch. Choices and times are saved in `pool.reminders`. Scheduling never asks for permission by itself (the plugin would). | Brings players back without a server, account or personal data, so the game stays offline and the data safety answers stay "no data collected". | 2026-10-13 |
| A32 | Character faces are picture files (`packages/pool/portraits/<id>.png` or `.jpg`, 512 px square), bundled by Vite through `import.meta.glob` in `scenes/art/portraitFiles.ts` and loaded in the menu's and table's `preload`. `portraitTexture` crops the loaded picture to the round, framed texture at each size (key ends `-file`); without a loaded picture it draws the face as before. `npm run portraits` squares, resizes and shrinks files. | Robert wants faces he can replace at any time without code changes. Bundled files keep play offline; the drawn faces stay as the fallback and the starting set. | 2026-10-12 |
| A35 | Robert's logo, menu background and icon are picture files in `packages/pool/art/`, handled like the faces (A32): `scenes/art/artFiles.ts` bundles only `logo` and `menu-background` and loads them in the menu's and story map's `preload`; `menuBackgroundTexture` scales the picture to cover the screen and `logoTexture` returns it with its display size (`ART_FILES.logoWidth`). Without a file the drawn art is used. `npm run icons` hands all three to `storeArt.ts` for the launcher icons, splash and store pictures. | Robert makes the art with an image tool and wants to swap it without code; the drawn art stays as a fallback. The icon is not bundled because only the script needs it. | 2026-10-14 |
| A36 | A red ball is drawn in three layers at the same depth (base, white spot, shading) so the spot can move under the light; `scenes/rollingSpot.ts` turns it by the distance the ball moved, as if rolling without slipping, only while `syncBalls` runs `live` (during a shot). Buttons: `primary` or `highlighted` gives the gold face and a press scales the label (the face follows, A30); `popIn` animates only a panel's frame, ribbon and dim, never its buttons. | The physics does not track turning, and placements must not spin the dot. A press-in or pop-in that moved buttons would make early taps miss. | 2026-10-14 (0.32.0) |
| A29 | Backgrounds are data (`config/backgrounds.ts`: a kind and a five-colour palette) drawn by `art/backgroundArt.ts`. On the table screen the chosen background and table are combined into one screen-sized texture (`sceneTexture`), and the separate ones freed; the plain background draws only the table. | Two overlapping full-screen pictures double the pixels drawn every frame, which matters on a fill-rate-limited phone GPU and in the software renderer the tests use. One combined texture also uses less video memory than a table plus a background. | 2026-10-11 |
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
| `synth.ts` | `renderSound(recipe, sampleRate, seed)`: mixes decaying tone sweeps and filtered noise into a mono sample buffer, normalised to the recipe's peak with a short fade-out. Seeded, so the same on every device. |
| `backButton.ts` | `BackButton` (A22): handlers newest first, `leave` when none handles a press; a throwing handler is logged and never leaves the app. |
| `settings.ts` | Player settings (locale, sound volume, music volume), validation, and the save slot `"<gameId>.settings"`. |

## Shell (`packages/shell/src`)

- `createShellGame(options)` creates services, the Phaser game, the rotate overlay and (e2e builds only) test hooks.
- `services.ts`: one `Services` object per game (logger, store, translator, lifecycle, settings get/update). It is put in Phaser's registry under `tzg.services` before boot; scenes read it with `getServices(scene)`, so no scene builds its own storage or translator. Settings are saved on every change and again on pause.
- `sound.ts`: `SoundBoard` (A19). Tries to start sound on every gesture (pointer down and up, touch end, click, key) until it is running, because browsers differ on which one counts (iPhone: the finger lifting); after a resume from the background it listens again in case the system took sound away. It suspends on pause and resumes on resume, plays at most 8 sounds at once, scales by the sound setting, skips (never queues) sounds while locked or paused, and logs instead of throwing when Web Audio is missing or fails. Exposed as `Services.sound`.
- `nativeApp.ts`: inside the Android app only, routes the back button to `Services.back` and minimises the app on leave (A22). `onBackButton(scene, handler)` in `services.ts` adds a handler for as long as the scene runs.
- `rotateOverlay.ts`: a DOM message (not canvas) asking the player to rotate the phone when the orientation is wrong.
- `testHooks.ts` / `testHooksApi.ts`: `window.__tzg`, read-only state for browser tests (scenes, element positions, text and data of named objects, frame stats, game probes). Installed only when built with `--mode e2e`; the release build is checked to contain no `__tzg`.

## Pool (`packages/pool/src`)

| Path | Purpose |
|---|---|
| `config/table.ts` | UK 7 ft table and ball sizes, in metres. |
| `config/physics.ts` | Friction, restitution, step size, shot speed range, safety limits. Starting values, to be tuned in play-testing. |
| `config/layout.ts` | Screen layout, colours (placeholders), power bar, aim guide, cue stick. |
| `physics/types.ts` | Ball, table, shot and shot-event types. Ball and cushion events carry the impact speed (m/s) for sound. |
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
| `config/characters.ts` | The player characters (6 men, 2 women), the computer's character per level, default picks and the longest name allowed. |
| `progress/characters.ts` | `CharacterPicks`, `seatCharacter`, `withDistinctPicks`, `validatePicks`. Pure. |
| `progress/opponent.ts` | `Opponent` (two players or the computer at a level), its short id and validation. |
| `progress/savedMatch.ts` | The saved game in progress (A17): `toSavedBalls`, `restoreBalls`, `validateSavedMatch`. |
| `progress/progress.ts` | Stats, winning streak (0.34.0, optional in saves) and the last opponent: `recordGame`, `validateProgress`. |
| `progress/tips.ts` | One-time help already shown (`howToPlaySeen`). |
| `progress/slots.ts` | The save slots `pool.match`, `pool.storyMatch`, `pool.progress`, `pool.tips` and `pool.story`; `moveStoryGame` moves a story game saved before 0.27.0 out of `pool.match`. |
| `config/story.ts`, `progress/story.ts` | Story mode (A33): the eight stops and their rivals, stand-ins, levels, tables and backgrounds; star rules, titles and rewards. `starsFor`, `recordStop` (keeps the best), `isStopOpen`, `nextStop`, `titleFor`, `earnedRewards`, the `is…Locked` checks, `characterNeed` and validation. Pure. |
| `scenes/StoryScene.ts`, `scenes/storyText.ts` | The story map, one chapter per page: stops, stars, cups and padlocks, the stop card with its twist, the journey's character picker, the chapter's rewards, Back. `storyText` words a reward's need and a twist. |
| `scenes/EndPanel.ts` | The end-of-game panel: title, stars (story), detail, note, and Endelea / Rudia / Menyu or Ramani, with the 10 s countdown that any touch stops. |
| `progress/unlocks.ts` | Unlocks announced so far (`pool.unlocks`: `known`, null before the first run so older phones start with what they had; `fresh` for MPYA): `earnedUnlocks`, `unannounced`, `announce`, `seenKind`. |
| `scenes/UnlockPopup.ts`, `scenes/unlockFlow.ts` | The "Imefunguliwa!" popup queue, and the glue that shows the unannounced unlocks (table end, menu start), saves each as it closes and puts a look on for Tumia sasa. |
| `scenes/StatsPanel.ts` | Takwimu (0.34.0): totals, a row per computer player, games with friends. |
| `scenes/art/lookArt.ts` | `lookTexture`: the picture of a table, cue or scenery, for the Mapambo pickers and the journey's reward cards. |
| `scenes/MenuScene.ts` | Main menu (first scene). Three pages, each a scene restart with `MenuStart.page`: main (CHEZA, Mapambo, Stats, Rules, Settings, Exit), `play` (Continue, Quick game, journey) and `looks` (table, cue and scenery pickers). Panels open over any page. |
| `scenes/TableScene.ts` | The match: starting a new game or resuming the saved one, input (aim, power, ball in hand), simulation loop, applying verdicts, saving, counting stats, starting computer turns, Acha mchezo (quit) and Menu, the Kimbunga check at a game's end. |
| `controls/spin.ts` | Spin control maths: a point on the cue-ball face to a tip offset (clamped to the physics' largest offset) and back. |
| `controls/fineAim.ts` | `rotateAim`: turns the aim by a small angle (clockwise on screen for a positive angle). |
| `scenes/SpinControl.ts`, `scenes/FineAim.ts` | The spin face with its dot, and the fine-aim strip with sliding ticks. The scene routes touches to them, each on its own finger. |
| `scenes/ui.ts` | `addButton` (fires on release, never on a cancelled touch; press-in and tap sound since 0.32.0) and `Panel` (title on a ribbon, text, labelled rows of choices, buttons, Back, dim and pop-in), shared by the menu, picker and HUD. |
| `config/sound.ts` | Placeholder sound recipes, loudness curves for ball and cushion hits, and the mix limits. |
| `audio/shotSounds.ts` | `loudness(speed)`, `cueGain(power)` and `ShotSoundMixer` (A20). Pure. |
| `scenes/poolSounds.ts` | Renders the recipes once per app and adds them to the sound board. |
| `scenes/poolSlots.ts`, `sceneKeys.ts` | The save slots shared through the registry, and the scene keys. |
| `scenes/ComputerTurn.ts` | Paces a computer turn on screen: thinking in slices within the frame budget and time limits, then placing, aiming and power animation, then the shot. |
| `scenes/MatchSetup.ts`, `scenes/CharacterPicker.ts`, `scenes/Face.ts` | The new-game choice (player 1's character, the opponent, then player 2's character for two players, with Back stepping back), the face grid, and the face shown in the picker and the player panels. |
| `scenes/OpponentPicker.ts` | "Unacheza na nani?" panel: two players or the computer at one of four levels, with the last choice marked. Used on the menu. |
| `scenes/MatchHud.ts` | Player panels, status line, controls hint, Acha mchezo button (hidden once the game is over), game-over panel. |
| `scenes/Confetti.ts` | Confetti burst when a person wins (0.37.0): tweened paper pieces that remove themselves; `active` counts those still falling. |
| `scenes/KimbungaBanner.ts`, `rules/kimbunga.ts` | The "KIMBUNGA!" banner (word, line, sparkles, fanfare; `KIMBUNGA_BANNER`), and the pure rule for when a win is a Kimbunga. |
| `scenes/LookPicker.ts` | "Chagua meza" and "Chagua fimbo": a grid of pictures with names, the selection frame, Choose and Back. Cue styles are data in `config/cues.ts`, drawn by `art/cueArt.ts`. |
| `scenes/art/` | Canvas 2D drawing of the table (in each table style; `tableTexture.ts` makes the full-size and preview textures), balls and shadows, cue and its shadow, and the control parts (`canvasTexture` makes a texture once per key). |
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
| `pool.match` | pool | 1 | The game in progress (A17): `{ opponent, picks: [id, id], match, balls: [{ id, x, y, pocketed }], shots }`. Removed when the game ends. `picks` is new in 0.9.0 and may be missing (A23). |
| `pool.progress` | pool | 1 | `{ vsComputer: { easy, medium, hard: { played, won } }, twoPlayerGames, lastOpponent, lastPicks, table, cue, hand, background }` (`lastPicks` new in 0.9.0, `table` 0.11.0, `cue` 0.12.0, `hand` 0.14.0, `background` 0.15.0; each may be missing and falls back to its default) |
| `pool.tips` | pool | 1 | `{ howToPlaySeen }` |
| `pool.story` | pool | 1 | Story mode (0.24.0): `{ character, stars: { <stopId>: 1..3 } }`. Titles and rewards are worked out from the stars. A story game in progress is saved like `pool.match` with `story: { stop, fouls, shots }` (`shots`, the person's shots for a shot limit, is new in 0.25.0 and counts from 0 when missing); from 0.27.0 it has its own slot, `pool.storyMatch`, below. |
| `pool.reminders` | pool | 1 | Play reminders (0.28.0): `{ on, asked, lastShown, waiting }` (times in ms or null). |
| `pool.storyMatch` | pool | 1 | The story game in progress (0.27.0), as `pool.match` and always with `story`, so a Quick game never replaces it. Before 0.27.0 it lived in `pool.match`; the menu moves it on start. |
| `<key>.backup` | core | n/a | The last unreadable value of that key, as stored (A18). |

Pool's `gameId` is `pool`.

`gameId` must never change after release or players lose their data.

## TypeScript projects

`tsc -b` from the root builds: `packages/core`, `packages/shell` and `packages/pool` (browser code, `vite/client` types), `tooling` and each package's `tsconfig.node.json` (configs, unit and browser tests, Node types). Browser code cannot see Node types.
