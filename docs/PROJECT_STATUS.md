# Project Status

Last updated: 2026-10-14

## Current milestone
- **Kimbunga! and Acha mchezo (built, 0.36.0, 2026-10-14; Robert chose "Build both"):** a gold banner when the breaker wins before the other player shoots (counted in Takwimu); Acha mchezo replaces Mchezo mpya, asks first, and counts as a loss (0 stars on the journey). Wording checked (four small capital fixes).
Milestone 9: art and sound, in three parts, each sent to Robert as a phone build. Robert chose "Claude now, designer later" (2026-10-11): Claude draws the art in code, a designer may replace it later.
- **Part A, the table (done, 0.10.0, 2026-10-11):** rails, felt, pockets, shaded balls with shadows, a wooden cue, styled power bar, spin control and fine-aim strip; a white spot on red balls for colour-blind players. Drawn at start-up (A24), no image files.
- **Exit button (done, 0.10.1, 2026-10-11):** Robert's request; the game stays saved (his choice).
- **Tables (done, 0.11.0, 2026-10-11; Robert's request):** six tables to choose from on a new "Meza" menu button: Classic, Zanzibar, Kitenge, Maasai, Tingatinga, Makonde. Patterns on the rails only, plain felt, each felt checked for colour blindness. All free.
- **Personal touches (Robert, 2026-10-11, "proceed with them"):** cue choice (done, 0.12.0), character catchphrases in Swahili or English (done, 0.13.0), left-handed mode in Settings (done, 0.14.0) and backgrounds behind the table (done, 0.15.0). All personal touches are built.
- **Stronger computer, Impossible level, random rack (done, 0.16.0, 2026-10-11; Robert's request):** every level stronger, Bingwa (Haiwezekani) added, a different rack every game. Your own name was dropped at Robert's request (2026-10-11): players use the character names. Tables and cues are all free (Robert's choice on the card).
- **Part B, the screens (done, 0.17.0, 2026-10-11):** a portrait for each of the 12 characters, styled buttons and panels, a title logo, a menu background of a local bar (no drinks shown), shaded balls in the trays.
- **Potted-ball tube (done, 0.18.0, 2026-10-11; Robert's idea):** a glass tube beside the table that potted balls roll into; table about 4% smaller to fit it. Robert dropped the 8-ball (stripes and solids) game type.
- **Part C, store and sound (done, 0.19.0, 2026-10-11):** icon, splash, feature graphic and store screenshots redone in the new style; better synthesised sounds.
- **Faces from picture files (done, 0.20.0, 2026-10-12; Robert's request):** each face is a replaceable file in `packages/pool/portraits/`, starting with the drawn faces; `docs/PORTRAIT_PROMPTS.md` has a prompt per character for an image tool. Bingwa's name confirmed.
- **New faces (done, 0.21.0, 2026-10-12):** Robert's ChatGPT faces for all 12 characters, cut from his sheet. The store screenshots still show the old drawn faces in the small player panels; redo before release.
- **Your character first (done, 0.22.0, 2026-10-12; Robert's request):** New game asks for your character, then the opponent, then player 2's character.
- **Rematch and auto-menu (done, 0.23.0, 2026-10-12; Robert's request):** Rudia and Menyu on the end panel; back to the menu after 10 seconds unless the screen is touched.
- **Story mode, Safari ya Bingwa (done, 0.24.0, 2026-10-12; Robert's idea, "launch can wait"):** a map of eight stops, three stars per stop, titles and three story-only rewards (gold table, champion cue, trophy wall). Plan in `STORY_MODE.md`.
- **Story mode in three chapters (done, 0.25.0, 2026-10-12; Robert chose "3 chapters now"):** 27 stops, four twists, ten new rivals with Robert's ChatGPT faces, Kilimanjaro and lake tables and backgrounds as chapter rewards.
- **Unlock popup (done, 0.35.0, 2026-10-14; Robert chose "Popup with extras"):** "Imefunguliwa!" after the game that earned something, with sparkles and a fanfare, Tumia sasa for looks, MPYA marks and red dots until seen, shown on the menu if the app closed first. The fanfare is not yet heard on a phone.
- **Clearer menu screens (done, 0.34.0, 2026-10-14; Robert chose "Build all five"):** unlock progress inside the Mapambo pickers, gold padlock tags for what opens a locked item, face cards on "Cheza na nani?", a richer Takwimu with totals, win bars, crowns and a winning streak, and picture cards for the journey's rewards.
- **Tables with depth (done, 0.33.0, 2026-10-14; Robert chose "Whole table"):** pockets with an inside wall and lit rim, balls sinking into the hole, rounded cushions and rails, lamp light on the cloth.
- **Polish (done, 0.32.0, 2026-10-14; Robert chose "Build all four"):** quieter, deeper rumble; the tube's pipe ends in a dark opening at the rail with a soft shadow; red balls' dots roll with the ball; teal-green and gold buttons with a tap sound, wood-framed popups with a ribbon title. The store screenshots need redoing for the new buttons too.
- **Robert's art (done, 0.31.0, 2026-10-14):** his ChatGPT logo, menu background and app icon are in the game (files in `packages/pool/art/`); the splash and feature graphic are built from them. The store screenshots still show the old menu and faces; redo before release.
- **Balls take the long way to the tube (done, 0.30.0, 2026-10-14; Robert chose "Build it"):** a potted ball waits under the table for longer the farther its pocket is from the tube (near corner at once, far corners about 1.4 s), with a rumble, a pipe roll and a landing click. The new sounds are not yet heard on a phone.
- **Shorter main menu (done, 0.29.0, 2026-10-13; Robert chose "Build both"):** four rows: a big CHEZA (Continue, Quick game, journey inside, dot when a game waits), Mapambo (Meza, Fimbo, Mandhari with counts) and Takwimu, Sheria and Mipangilio, Toka.
- **Play reminders (built, 0.28.0, 2026-10-13; Robert chose "Build now"):** local phone notifications, at most one, after a day away, 18:00; asked after the first win; Settings switch. Not yet seen on a phone (KNOWN_ISSUES U13).
- **Quick game and journey game saved apart (done, 0.27.0, 2026-10-13):** two Continue buttons when both are waiting.
- **Picker pages and earned looks (done, 0.26.0, 2026-10-12):** pickers page 8 at a time (fixes the hidden Ziwa table); only two of each look free, the rest earned by story stops or wins; Bishoo and Kichwa start locked.
- Waiting on Robert: confirming ChatGPT's terms allow the faces and the art pictures in a commercial app, the email domain (farddatasolutions.net, double d, vs the app ID's fardatasolutions), a public link for the privacy policy, a Google Play developer account.

### Milestone 8 scope (done)
Robert's request (2026-10-11): character selection before playing, looks only, Tanzanian street nicknames (nothing vulgar), 75% men and 25% women.
- 8 player characters (6 men, 2 women) and one computer character per level, all in `config/characters.ts`.
- New game: opponent, then "Chagua mhusika" for each person (player 2 cannot take player 1's character), last choice selected. Back steps back.
- Faces (placeholder) and names in the player panels and all messages; computer names on the picker and in Stats.
- Choices saved with the game and remembered; older saves load with default characters.
- Not in scope: real portraits (Milestone 9), stats per player character, unlockable characters.
- Tests: unit (roster split, unique short names, picks validation, older saves); browser (computer and two-player picking, the taken character, Back and the phone's back button, New game on the table, English, Continue keeping the characters, an older save); screenshots at three screen sizes.

### Milestone 7 scope (done)
Everything needed for the first Android build that can be done without a phone or the Android SDK (B1):
- **Android project** (Capacitor 8) in `packages/pool/android`, with scripts to build the web game and copy it in. Landscape only, full screen, version numbers from one place. Built on Robert's computer with Android Studio while B1 holds; steps in RELEASE.md.
- **Name and app ID** (Robert, 2026-10-10): "Bongo Pool Table", `com.fardatasolutions.bongopooltable`. The internal save prefix stays `pool`.
- **Android back button:** on the table it opens the menu (ignored while balls roll); on a menu panel or picker it goes back; on the main menu it closes the app. Without this the back button would exit the game from anywhere.
- **App icon and splash screen:** clearly marked placeholders, generated by a script at every Android size.
- **Offline check:** a browser test that blocks all network access except the game's own files and plays a game; the game must make no outside requests.
- **First launch:** a one-time "how to play" panel on the first game (aim, power, spin, fine aim), dismissed with one tap and not shown again. Nothing else new.
- **Store listing and privacy policy drafts** in Kiswahili and English, with Play's data-safety and content-rating answers, and store screenshots taken from the game.
- Not in scope: signing keys and uploads (need Robert's Play account), real art, iOS.
- Tests:
  - Unit: back-button routing (most recent handler wins, exit when none); icon files present at the right pixel sizes; app ID and version agree between the web and Android projects; the first-launch flag save and validation.
  - Browser: back on the table, a menu panel, the picker and the main menu; back ignored while balls roll; first-launch panel shown once and not after reopening; a full game with all outside network blocked and no outside requests.
  - Not testable here: the Android build itself, the real back button, full screen and the splash (need the SDK and a phone).

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
- Break pot decides colours (Robert's rule, 2026-10-08, 0.5.1).
- Milestone 5 (2026-10-08): spin control and fine aim (TD4). 177 unit tests and 123 browser test runs pass. Report: project folder `reports/milestone-5-report.md`.
- Milestone 8 (2026-10-11): characters (looks only, street nicknames). 210 unit tests and 177 browser test runs pass (pool 144, shell 33). Report: project folder `reports/milestone-8-report.md`.
- Milestone 7 (2026-10-10): release readiness. Android project (not yet built, B1), back button, first-game help, placeholder icon and splash, store listing and privacy policy drafts, offline test; renamed Bongo Pool Table. 201 unit tests and 159 browser test runs pass. Report: project folder `reports/milestone-7-report.md`.
- Milestone 6 (2026-10-09): sound. Cue, ball, cushion and pocket sounds that follow impact speed, synthesised placeholders, Sound on/off in Settings, first-touch unlock, silent in the background, silent fallback. 192 unit tests and 141 browser test runs pass. Report: project folder `reports/milestone-6-report.md`.
- Milestone 4 (2026-10-08): main menu (Continue, Play, Stats, Rules, Settings), Menu button on the table, game in progress saved and resumed (TD6), stats per computer level, last opponent marked (TD8), language setting, rules screen, save backups (TD2). 166 unit tests and 111 browser test runs pass. Report: project folder `reports/milestone-4-report.md`.

## Next (order to confirm with Robert)
- First device build: done and checked on a ZTE Blade A35 (Android 14), 2026-10-10 and 11.
- Milestone 9 Parts B and C (above).

## Blockers / decisions needed
1. Android build environment (KNOWN_ISSUES B1). Needed before the first phone test. Trying the game in a phone's browser over Wi-Fi with `npm run dev:pool` is possible today on Robert's own computer.

## Known bugs
None open.

## Technical debt
See KNOWN_ISSUES.md (TD1, TD5, TD7, TD8, TD9; TD2, TD4 and TD6 resolved).

## Architectural decisions
See ARCHITECTURE.md (A1 to A23).
