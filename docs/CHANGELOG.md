# Changelog

## 0.19.0 (unreleased) - Art Part C: icon, splash, store pictures and better sounds
- **App icon:** a shiny 8-ball in front of a red and a yellow ball on green felt, at every Android size (square, round, and the adaptive icon's foreground inside its safe area).
- **Splash screen:** the menu's pool bar, a little darker, with the Bongo Pool Table logo, landscape and portrait at every size.
- **Store pictures:** a new 512 px icon; a feature graphic with the bar, the logo, "Pool ya bar, mfukoni mwako" and Malkia, Fundi and Bingwa; four new 1920x1080 screenshots (menu, how to play, the break, a match with balls in the tube). All are drawn by the game's own art code (`scripts/makeAppIcons.mjs` runs `scenes/art/storeArt.ts` in a browser), so they always match the game.
- **Sounds, version 2:** still synthesised, now built like the real sounds: the cue is a dull "tock" with the ball's ring; a ball hitting a ball is the bright, glassy click of resin balls; a cushion is a soft rubber thump with a knock from the wooden rail; a pocket is a hollow knock, the ball rolling down to the tube, and a click as it lands on the others. The synthesiser gained delays, soft starts, high-pass noise and a rattle. Not checked by ear by Claude (it cannot listen): Robert's ears decide.
- The "MICHORO YA MUDA" / "PLACEHOLDER ART" labels on the menu and the table are gone: every picture in the game is now drawn art.

## 0.18.0 (unreleased) - The potted-ball tube
- Robert's idea (2026-10-11): a see-through glass tube beside the table, on the side away from the power bar (left edge normally, right edge in left-handed mode), joined to the table by a short pipe near the top corner pocket. Every potted ball (not the cue ball) rolls in along the pipe and drops onto the stack with a small bounce, so the tube shows the balls in the order they went down. The name trays stay as they were.
- To make room the table is about 4% smaller (539 pixels per metre instead of 560) and sits a little further right; the status line, hint, fine-aim strip and panels over the table moved with it.
- A saved game shows its potted balls in the tube straight away, in ball-number order, because the save does not record the order they were potted.
- The 8-ball game type (striped and solid balls) was discussed and dropped by Robert.

## 0.17.0 (unreleased) - Art Part B: portraits, buttons, panels, logo and the menu bar
- **Portraits** for all 12 characters, replacing the coloured circles with a letter. Simple friendly faces drawn by the game, each with something to recognise them by: Fundi's orange cap and moustache, Malkia's gold headwrap, Mwamba's bald head, Bonge's round face and grin, Shangazi's kitenge wrap and glasses, Mjanja's cap turned back and chain, Bishoo's dark glasses and white collar, Kichwa's afro and glasses, Dogo Mbishi's big cap, Mama Ntilie's red headwrap and apron, Mzee Kobe's white kofia and grey beard, Bingwa's cornrows, dark glasses and gold chain. They show on the character picker and in the player panels (a little bigger there than before).
- **Buttons** are rounded and raised, white, or gold for the current choice. **Panels** (Settings, Stats, Rules, pickers, game over) are rounded with a thin gold edge.
- **Title logo:** "BONGO" in gold letters with an 8-ball as its first O, over a red "POOL TABLE" banner.
- **Menu background:** a neighbourhood pool bar at night: a two-tone painted wall, a barred window with the moon, a cue rack, coloured string lights, a lamp glowing behind the buttons, a chalk scoreboard, a counter with a radio, and the edge of a pool table along the bottom. No drinks anywhere (Robert).
- **Potted-ball trays** show the same shaded balls as the table.
## 0.16.0 (unreleased) - A stronger computer, Impossible, and a different break every game
- Robert found Hard easy to beat (2026-10-11). Every level now aims and judges power more accurately and looks at more shots; Medium also checks its best shots hold up if slightly mishit. In 20 to 30 games each, the new level beat the old one of the same name: Easy 23/30, Medium 18/20, Hard 15/20.
- New fifth opponent: **Bingwa (Haiwezekani / Impossible)**, almost no aiming or power error and the widest search. It beat the new Hard 24/30, potting about three shots in four and fouling on 2% of its shots. Bingwa has its own catchphrases. The name is Claude's choice, for Robert to confirm.
- Stats show Bingwa too; older saves keep their stats and start Bingwa at zero.
- The opponent picker on the table is taller so five choices and Back fit.
- A different rack every game (Robert: the same full-power break always potted a ball): the reds and yellows are placed in a random order (the black stays in the middle, the back corners are always one of each), and each ball sits a hair off its exact spot, as in a real rack. In 24 identical full-power breaks this gave 14 different results, and 7 potted nothing. Saved games are unaffected: a ball's number always has the same colour.

## 0.15.0 (unreleased) - Backgrounds behind the table
- From the personalisation list Robert approved (2026-10-11). A third button, "Mandhari" / "Scenery", joins Meza and Fimbo on one menu row and opens a picker of six backgrounds, all free: **Klasiki** (the plain dark screen, as before), **Mbao** (a wall of wooden planks), **Kanga** (an indigo kanga with printed borders above and below the table), **Bahari** (the sea at night with a crescent moon and dhow sails), **Nyota** (a starry sky with acacia trees), **Makuti** (woven palm leaves, like a beach bar's roof).
- The table covers most of the screen, so each design puts its detail in the bands above and below the table and in the controls column. Those bands get a dark wash so names, status and hint stay easy to read; a unit test checks every background colour against the text colours.
- The choice is saved (`background` in `pool.progress`) and used from the next time the table opens. Older saves get Klasiki.
- Performance: the background and the table are combined into one screen-sized picture when the table opens, so the screen is still drawn once per frame. Drawing them as two pictures doubled the drawing work, which slowed the test browser's software renderer enough to time out tests; a slow phone's graphics chip would feel it too. Klasiki draws only the table, exactly as before.

## 0.14.0 (unreleased) - Left-handed mode
- From the personalisation list Robert approved (2026-10-11). Settings has a new row, "Mkono wa kuchezea" / "Playing hand": Kulia (Right, as before) or Kushoto (Left).
- Left turns the table screen into a mirror image: the spin control and power bar move to the left edge, the table and everything on it (player panels, status, hint, fine-aim strip, game over, panels over the table) moves right by the same gap, and the Menu and New game buttons swap corners. Nothing changes in how the game plays.
- The choice is saved with the pool progress (`hand`) and used from the next time the table opens. Older saves are right-handed.
- The power bar, spin control and fine-aim strip are now drawn above the cue, which can reach across them when aiming towards them (in either hand).
- Tests: a `boundsOf` test hook gives an element's box, so the tests can check that the controls, buttons and table never overlap, in both languages and with New game's wide "Gusa tena kuanza upya" label showing.

## 0.13.0 (unreleased) - Catchphrases
- Robert asked for character catchphrases in Swahili or English to match the game's language (2026-10-11). Every character, the computer's three included, has lines for three moments: potting one of theirs and playing on, the other player fouling (a friendly tease), and winning. Examples: Fundi "Kazi ya fundi hiyo!" / "That's a craftsman's work!", Mama Ntilie "Moto kama chapati!" / "Hot like a fresh chapati!", Mzee Kobe "Haraka haraka haina baraka." / "Haste brings no blessing."
- The line shows in a white speech bubble under the speaker's name, pointing at their face, for about 3 seconds.
- Not every shot gets a line: about 4 in 10 pots and 6 in 10 fouls do, then the characters stay quiet for at least two shots, and the same line is never said twice in a row. A win always gets one.
- All lines are in `config/quips.ts`, Swahili and English side by side, so they are easy to change.
- Your own name (built earlier the same day, never released) was left out at Robert's request; players use the character names.

## 0.12.0 (unreleased) - Choose your cue
- Robert's idea (2026-10-11): pick the cue too. "Fimbo" (Cue) sits next to "Meza" on one menu row and opens a picker of six cues, one to match each table, all free and looks only (every cue plays the same): **Klasiki** (wood with a black wrap), **Zanzibar** (dark wood with brass rings), **Kitenge** (a kitenge-print grip), **Maasai** (red check butt with a beaded grip), **Tingatinga** (painted colour bands with dots), **Makonde** (ebony with bone-white inlays).
- The chosen cue is saved (`cue` in `pool.progress`) and shown for every shot on this phone, the computer's included. Older saves get Klasiki.
- The table picker became a general `LookPicker`, used for tables and cues.

## 0.11.0 (unreleased) - Choose your table
- Robert asked for different tables with African and local designs (2026-10-11). A new "Meza" (Tables) button on the main menu shows a small picture of each table; tap one, then "Chagua" (Choose). Back, or the phone's back button, leaves the choice as it was.
- Six tables, all free: **Klasiki** (wood, green felt), **Zanzibar** (dark carved wood with a rope border and brass studs like the Zanzibar doors, teal felt), **Kitenge** (a kitenge print of rings and dots, blue felt), **Maasai** (red shuka check with a line of beads, slate-blue felt), **Tingatinga** (bold painted sections with dots and waves, purple felt), **Makonde** (ebony with carved zigzags, sage felt).
- Patterns are on the rails only; the felt is plain. Every new felt keeps all four balls clearly visible, also for red-green colour blindness (checked by a unit test). Classic green is the hardest felt for that, which is why red balls carry a white spot.
- The choice is saved (`table` in `pool.progress`) and used from the next time the table opens, a game in progress included. Older saves play on Klasiki.
- Only the chosen table is kept in video memory at full size; the others are freed.
- Menu buttons moved up a little so seven fit (`MENU`).
- Tests: the frame-time checks on a 6x slower CPU (titles tagged `@timing`) now run in their own `timing` project, after all other tests and one at a time. With four tests sharing four CPUs, another browser could take the CPU in the middle of a measurement window, and the "computer thinking" check failed by a fraction of a millisecond. Run alone it passed 9 out of 9.

## 0.10.1 (unreleased) - Exit button
- Robert asked for an Exit button on the main menu (2026-10-11). "Toka" / "Exit" is the last menu button and closes the game.
- With a game in progress it asks first: "Toka kwenye mchezo?" and says the game is saved and "Endelea na mchezo" brings it back (Robert chose "Keep it saved"). Back, or the phone's back button, closes the popup. With no game in progress Exit closes at once.
- Settings are saved before closing. Exit shows only in the Android app: a web page cannot close itself, so the phone-browser build has no Exit button.
- The menu buttons sit a little closer together (`MENU.firstButtonY` 225, `buttonSpacing` 78) so six fit.

## 0.10.0 (unreleased) - Milestone 9 Part A: table art
- Robert chose "Claude now, designer later" for the art (2026-10-11). This is the first of three parts: the table and its controls.
- Table: wooden rails with grain and diamond markers, a cushion strip, felt with a soft sheen and speckle, pockets with depth and cushion jaws, a shadow under the table.
- Balls are shaded with a highlight and shine, and cast a soft shadow on the felt.
- Colour-blind help: red balls carry a white spot, so red and yellow can be told apart without colour. Checked on a simulation of the two common kinds of red-green colour blindness.
- The cue is a tapered wooden cue (blue tip, white ferrule, light shaft, dark butt with a grip wrap) with a shadow, instead of a line.
- Power bar: a rounded track, a green-to-red fill and a ridged handle. Spin control: a shaded cue-ball face with a red tip marker. Fine-aim strip: a darker track with a border.
- All of it is drawn by the game when it starts (Canvas 2D textures, A24); no image files were added, so the download size is unchanged. A designer can later replace any of these with an image.

## 0.9.1 (unreleased) - No ball count next to the names
- The player panels show only the character's name. The number of balls left is gone (Robert, 2026-10-11): the tray under each name already shows it.
- Robert approved the character names.

## 0.9.0 (unreleased) - Milestone 8: characters
- Characters, for looks only (Robert, 2026-10-11): they change how a player is shown and named, never how the game plays.
- 8 characters to play as, with fun Tanzanian street nicknames (Robert: nothing vulgar; 6 men, 2 women): Fundi, Malkia, Mwamba, Bonge, Shangazi, Mjanja, Bishoo, Kichwa.
- The computer plays as one character per level: Dogo Mbishi (Easy), Mama Ntilie (Medium), Mzee Kobe (Hard). The opponent picker and Stats use these names.
- New game flow: opponent, then "Chagua mhusika" (choose your character) with last time's choice selected, then Start. Two players choose in turn ("Mchezaji 1", "Mchezaji 2") and cannot take the same character. Back and the phone's back button step back through the choices.
- The table shows each player's face and name in the player panel (the face sits inside the ball-colour chip, which now shows as a ring) and in every message ("Bonge: zamu yako", "Mzee Kobe anacheza…", "Malkia ameshinda!").
- Faces are placeholders: a coloured circle with an initial (ASSETS.md).
- Saves: the chosen characters are kept with the game in progress and remembered for the next game (`picks` in `pool.match`, `lastPicks` in `pool.progress`). Games and stats saved by older versions load as before, with the default characters.

## 0.8.1 (unreleased) - Fix: no splash screen on Android 12 and newer
- Robert saw no splash screen on his ZTE Blade A35 (Android 14). Android 12 and newer ignore the splash image and show the app icon on a background colour from the theme, which was unset. The launch theme now sets that background to the game's dark colour (`splash_background`) and the icon to the app icon. The game's web view also loads on the same colour (`backgroundColor` in `capacitor.config.ts`) instead of white. Android 11 and older still show the splash image.
- The Android splash still lasts only until the game's first frame, so on a fast start it is brief.
- Checked by Robert on his ZTE Blade A35 (Android 14), 2026-10-11.

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
