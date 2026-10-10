# Changelog

## 0.8.0 (unreleased) - Milestone 7: release readiness
- The game is now called **Bongo Pool Table** (Robert, 2026-10-10; was "Pool ya Mtaani"). Saves are unaffected: their key prefix stays `pool`.
- Android project (Capacitor 8.5) in `packages/pool/android`: app ID `com.fardatasolutions.bongopooltable`, landscape only, full screen with the system bars hidden, version taken from `package.json`. Not built yet (B1); build steps for Robert's computer in RELEASE.md.
- Android back button: closes a panel or the picker, takes the table to the menu (not while balls roll), and on the main menu sends the app to the background. Shared `BackButton` in core, routed from the phone by the shell.
- First game: a one-time "how to play" panel (aim, power, spin, fine aim). It is not shown again once closed (`pool.tips`).
- Placeholder app icon (all densities, adaptive and round), splash screens, 512 px store icon and feature graphic, drawn by `npm run icons -w @tzg/pool`.
- Store listing, privacy policy (Kiswahili and English) and store screenshots, as drafts.
- Offline check: a browser test plays with outside network blocked and the network off.

## 0.7.1 (unreleased) - Fix: no sound on iPhone
- Sound never started on iPhone (reported by Robert). The game tried to start sound only once, when the finger first touched the screen, but iPhones only allow it when the finger lifts. It now tries on every touch (down, up, tap or key) until sound is running, and plays one silent sample inside the touch, which older iPhones need.
- If the phone takes sound away while the game is in the background (a call, another app), the next touch brings it back.

## 0.7.0 (unreleased) - Milestone 6: sound
- Sounds for the cue strike, ball on ball, ball on cushion and a ball dropping into a pocket. Loudness follows how hard the hit was; a burst of contacts (the break) is thinned to at most 4 sounds per frame and 8 playing at once.
- Placeholder sounds are synthesised by the game at start-up (no audio files); see ASSETS.md.
- Settings: Sauti (Sound) Washa / Zima, kept between sessions.
- Sound starts on the first touch, stops in the background and comes back with the game. A phone with no Web Audio, or one that refuses to start it, plays silently.
- Physics: ball and cushion contact events carry the impact speed.
- Core: `renderSound` (seeded, deterministic synth). Shell: `SoundBoard` (Web Audio), Phaser's own audio turned off.
- Panels can hold labelled rows of choices (`scenes/ui.ts`).

## 0.6.1 (unreleased) - Fix: Menu reopened Settings
- After changing the language, tapping Menu on the table opened the Settings panel instead of the main menu (reported by Robert). Phaser reuses a scene's last start data when none is given; the table now always passes it.

## 0.6.0 (unreleased) - Milestone 5: spin and fine aim
- Spin control above the power bar: drag the dot on the cue-ball face for topspin, backspin or side spin. Resets after every shot; off during the computer's turn.
- Fine-aim strip under the table: drag along it to turn the aim slowly.
- With top or back spin set, the guide hides the cue ball's path after contact (it would be wrong; TD9).
- The power bar is shorter to make room for the spin control, and the controls hint sits just under the table.

## 0.5.1 (unreleased) - Break pot decides colours
- Rule change (Robert, 2026-10-08): potting only one colour on the break gives the breaker that colour, so their tray fills straight away. Before, the table stayed open after the break and the tray stayed empty until the next pot, which looked like a bug. Potting both colours on the break still leaves the table open.
- Rules screen text updated in both languages.

## 0.5.0 (unreleased) - Milestone 4: menus, saving and stats
- Main menu when the game opens: Continue (only when a game is saved), Play, Stats, Rules, Settings.
- A Menu button on the table goes back to the menu and keeps the game.
- The game in progress is saved at the start, after every shot and when the app goes to the background. If the app is closed mid-shot, it resumes from just before that shot. A finished game is removed. A damaged save is ignored (and backed up), so the menu opens normally.
- Stats: games played and won against each computer level, and two-player games.
- The opponent picker marks the last choice (also after New game, which now has Back).
- Settings: Kiswahili or English, kept between sessions.
- Rules screen in both languages.
- Core: an unreadable save is copied to `<key>.backup` before defaults replace it (TD2).
- The placeholder label moved under the power bar to make room for the Menu button. Shared button and panel helpers (`scenes/ui.ts`).
- Shell test hooks can read the text and data of named objects (e2e builds only).

## 0.4.0 (unreleased) - Milestone 3: computer opponent
- Opponent picker when the game opens and after New game: two players on one phone, or the computer at Easy, Medium or Hard.
- Computer opponent (`src/ai`): finds pots, plain hits and escape shots, plays them out on a copy of the table with the real physics and rules, places the cue ball for ball in hand, breaks, and shoots with level-dependent aim and power error. Hard double-checks its best shots against small aiming errors.
- Computer turns are paced on screen (thinking, placing, aiming, power) and its thinking runs in small slices each frame within a time limit. The player's controls are off during its turn.
- Core: seeded random numbers (`createRandom`).
- Strength ladder command: `npm run ai:ladder -w @tzg/pool`.

## 0.3.1 (unreleased) - Potted-ball trays
- Under each player's name, a row of 7 slots fills with their colour as their balls are potted (Robert's request). Hidden while the table is open.

## 0.3.0 (unreleased) - Milestone 2: Blackball rules and pass-and-play
- Rules engine (`src/rules`): break, open table, colours, fouls with ball in hand anywhere (R1), the black (any pocket, R2), re-rack on a black potted on the break (R3), win and loss.
- Two players on one phone: player panels with colour and balls left, status line with fouls and whose turn it is, game-over panel, New game (second tap needed mid-match), breaks alternate.
- Ball in hand: drag the cue ball to free cloth; held behind the baulk line before the break.
- Aim guide now stops at pockets. Larger text for small phones. Re-rack button replaced by New game.

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
