# Game Design

Status: **Draft v0.2** (2026-10-07). Engine: Web (TypeScript + Phaser), wrapped for Android. **Pool ships first**; Daladala Rush starts after Pool reaches its release milestone. Only the shared foundation (Milestone 0) is implemented.

This repository holds two games that share a small common core (input, audio, save data, localisation, screens). Each game has its own section below.

Research behind these designs lives in the project folder under `/research/` (global top games, Tanzanian games, pool in Tanzania).

## Shared principles (both games)

| Principle | Requirement |
|---|---|
| Target device | Low-end Android phones (2–3 GB RAM, older Mali/Adreno GPUs). Android only at first launch. |
| Offline | The full first-launch game must be playable with no internet connection. |
| Language | Kiswahili by default, English selectable. All player-facing text comes from string tables, never hardcoded. |
| Sessions | One match or run takes 1–5 minutes. The game can be backgrounded at any moment without losing progress beyond the current shot or run. |
| Orientation | See each game. Locked per game, never switches mid-play. |
| Monetization | **None at first launch.** Architecture must leave room for rewarded ads and small purchases later, without real-money wagering of any kind. |
| Data collection | First launch: none beyond local save data. Analytics is a later, separate decision (see backlog). |

---

## Game A: Pool, "Bongo Pool Table" (name chosen by Robert 2026-10-10; was "Pool ya Mtaani")

### Concept
Bar pool as Tanzanians actually play it: **Blackball rules** (7 reds, 7 yellows, 1 black) on a **small bar-size table**, in recognisable local venues.

### First-launch scope (MVP)
1. One table, one venue (a neighbourhood bar).
2. Player vs AI (three difficulty levels) and pass-and-play (two players, one phone).
3. Full Blackball rules: break, open table, group assignment, fouls, black-ball win and loss conditions.
4. Touch controls: drag to aim with a guide line, power control, cue-ball spin control (top, back, side).
5. Basic menus: play, settings (language, sound, music), rules screen.
6. Local save: settings plus simple stats (games played and won per difficulty).

### Out of scope for first launch
Online multiplayer, extra venues, cues or cosmetics, ads, purchases, leaderboards, tournaments. See backlog.

### Rules as built (Milestone 2)
Decided by Robert: R1 ball in hand anywhere after a foul. Defaults (R2-R4 and the rest below) were chosen by Claude from World/WPA Blackball and can be changed on request; each is one place in `src/rules/blackball.ts`.

| Situation | Rule |
|---|---|
| Break | Player 1 breaks the first game, then breaks alternate. The cue ball starts anywhere behind the baulk line. Legal break: an object ball potted, or at least 2 object balls reach a cushion. Otherwise it is a foul. |
| After the break | A pot on the break keeps the breaker at the table. Potting only one colour on the break gives the breaker that colour (decided by Robert 2026-10-08); potting both, or nothing, leaves the table open. |
| Open table | Any red or yellow may be hit first; hitting the black first is a foul. Potting only one colour claims it (the opponent gets the other). Potting both keeps the table open and the turn. |
| Groups decided | Must hit an own ball first. Potting an opponent's ball is a foul, even alongside an own ball. |
| Fouls | No ball hit; wrong ball first; cue ball potted; opponent's ball potted; no ball potted and no ball reaching a cushion after contact; illegal break. Penalty: opponent has ball in hand anywhere for one visit (R1). |
| Turn | Continues after legally potting an own ball (or any colour on an open table); otherwise passes. |
| The black | On the black once all own balls are down; must hit it first. Legally potting it in any pocket wins (R2). Potting it at any other time, or with a foul, loses. Potting the last own ball and the black in one shot loses. A foul while on the black is only a foul. |
| Black on the break | Re-rack; the same player breaks again (R3). |

### Controls as built (Milestones 1-7)
- Drag anywhere on the table: the cue points from the cue ball towards the finger. A guide line shows the path, the ghost ball at first contact, and the predicted object-ball and cue-ball directions.
- Power: touch the bar on the right, drag down, let go to shoot. Letting go below 4% cancels; a system touch cancel never shoots.
- Aiming and power can use two fingers at once. Controls are disabled while balls move.
- Ball in hand: a ring shows round the cue ball; drag it to place it. It follows the finger only over free cloth (never onto a ball, cushion or pocket) and stays behind the baulk line before the break.
- Pass-and-play: two players share the phone; the panel of the player to shoot is highlighted, with their colour chip, and a tray under each name that fills with that player's potted balls once colours are decided. The status line says what happened (foul, colours decided) and who plays next.
- Main menu (Milestone 4; laid out again in 0.29.0, Robert 2026-10-13): the first screen. It shows a big CHEZA (Play) button, Mapambo and Takwimu, Sheria and Mipangilio, and Toka. CHEZA opens Continue, Quick game and the journey (an orange dot on CHEZA when a game is waiting); Mapambo opens Meza, Fimbo and Mandhari (0.34.0: each picker shows "Zimefunguliwa 4/9" with a bar; the buttons have no counts). Rudi or the phone's Back returns to the main page. Continue appears only when a game is saved and brings it back as it was after its last finished shot. Play opens the opponent picker (0.34.0 "Cheza na nani?": "Cheza na rafiki (simu moja)", then a card per computer player with face, strength as 1-4 dots, level and your record). Stats (0.34.0) shows six totals (games and wins against the computer, win rate, best winning streak with the current one, Kimbunga wins (0.36.0), journey stars), a row per computer player with a win bar, won/played and a crown once beaten, and games with friends. A locked look or character shows its name and, separately, a gold padlock tag saying what opens it. When a game unlocks something (0.35.0), an "Imefunguliwa!" popup shows it over the end panel (Tumia sasa / Sawa for looks); new looks and characters are marked MPYA in their pickers, with a red dot on Mapambo and on the kind's button, until seen. Rules shows the rules as built. Settings switches between Kiswahili and English, turns sound on or off, and (0.14.0) sets the playing hand: Kushoto (left) mirrors the table screen so the power bar and spin are on the left. In the Android app (0.28.0) Settings also has Vikumbusho: gentle play reminders as phone notifications (one at a time, after a day away, 18:00, asked once after the first win; see ARCHITECTURE A34). Meza (0.11.0) chooses one of six tables and Fimbo (0.12.0) one of six cues, for looks only: Klasiki, Zanzibar, Kitenge, Maasai, Tingatinga, Makonde. Mandhari (0.15.0) chooses the background behind the table: Klasiki, Mbao, Kanga, Bahari, Nyota, Makuti. From 0.26.0 only two of each are free (Robert, 2026-10-12); the rest open by playing (see Story mode). The pickers show eight items a page with ‹ › arrows. Exit (Android app only, 0.10.1) closes the game; with a game in progress it first says the game is saved and can be continued later.
- Menu: bottom left of the table. Goes back to the main menu and keeps the game (ignored while balls roll).
- Saving: the game is saved at the start, after every shot and when the app goes to the background. A game closed mid-shot resumes from before that shot. A finished game is not kept.
- Opponent picker: shown from Play on the menu and after New game (with Back to return to the current game). The last choice is marked in yellow. Choices: two players on one phone, or the computer at Easy (Rahisi), Medium (Wastani) or Hard (Ngumu), each shown by its character's name. Since 0.22.0 it comes after your own character (Robert, 2026-10-12). The player breaks the first game against a new opponent; a rematch against the same opponent alternates the break.
- Acha mchezo (quit game, 0.36.0, replaced New game; Robert 2026-10-14): bottom right. It asks "Acha mchezo?" ("Ukiacha, {opponent} atashinda.", Acha / Endelea kucheza). Quitting is a loss for the quitter: against the computer the person, in two-player games the player whose turn it is. It counts in the stats, ends the streak, and on the journey is a loss at the stop (0 stars). The normal end panel follows. Pausing is Menyu or closing the app. Hidden once the game is over.
- End panel (0.37.0, Robert 2026-10-15; 0.38.0 MSHINDI!): above it, over dimmed table and turning gold rays, the winner's face card with a crown and "MSHINDI!", VS, and the other player's card greyed (`HUD.gameOver.showcase`). Against the computer its card shows its level and, in Quick game, the person's card their record against it. When a person wins (against the computer, or either player with two players), confetti falls for about 3 s with a short ta-da (`CONFETTI`, sound `win`); none when the computer wins.
- First launch (0.37.0): a new install asks "Chagua lugha / Choose language" once, before the menu (`Settings.languageChosen`, false only on a new install; older saved settings count as chosen).
- Kimbunga! (0.36.0, Robert's idea): the breaker wins before the other player has taken a shot. A gold "KIMBUNGA!" banner with sparkles and a fanfare shows before the end panel (about 2.6 s, a tap skips it). For a person only: against the computer when the person does it, and for either player in two-player games. Counted in Takwimu. The rule is `rules/kimbunga.ts`; a saved game keeps each player's shot count (`shotsBy`).
- End of a game (0.23.0, Robert): a panel says who won and why, with Rudia (rematch: same opponent and characters, the break alternates) and Menyu. Untouched, it goes to the menu after 10 seconds, counting down on Menyu; any touch stops the count.
- Computer's turn: the status line names the computer's character, e.g. "Mzee Kobe anacheza…", the controls hint disappears and the power bar is dimmed; the player's touches do nothing. The computer thinks briefly, places the cue ball if it has ball in hand, swings the cue to its line and fills the power bar before shooting, so the player can follow what it does.
- Spin (Milestone 5): a cue-ball face labelled "Mzunguko" above the power bar. Drag the red dot to where the cue should strike: up for topspin (follow), down for backspin (draw), left or right for side spin (bends cushion rebounds). The edge of the face is the largest offset allowed. The dot goes back to the centre after every shot. With top or back spin set, the guide does not draw the cue ball's path after contact, because that line assumes no spin.
- Fine aim (Milestone 5): a strip under the table. Dragging along it turns the aim slowly, about 0.03 degrees per design pixel (the whole strip is about 17 degrees); right turns clockwise. Tick marks slide with the finger.
- First game (Milestone 7): a "how to play" panel explains aiming, power, spin and fine aim, and closes with "Sawa, tucheze". It shows once per install.
- Table depth (0.33.0, Robert 2026-10-14): pockets show their inside wall and a lit rim, potted balls sink into the hole, cushions and rails are rounded by light, and a lamp lights the middle of the cloth. Looks only.
- Look and feel of buttons and popups (0.32.0, Robert 2026-10-14): buttons are teal-green with a gold border and cream text; main actions (CHEZA, Chagua, Anza) and the current choice are gold. A button sinks in while pressed and ticks softly when tapped. Popups have a wooden frame, the title on a red ribbon, and dim the screen around them. On the table, red balls' white dots roll with the balls during a shot.
- Android back button (Milestone 7): closes the help, the picker or a menu panel; on the table it goes to the menu like the Menu button (not while balls roll); on the main menu it sends the app to the background.
- Potted-ball tube (0.18.0; timing 0.30.0, Robert 2026-10-14): a potted ball rolls unseen under the table for a time that grows with its pocket's distance from the tube (`TUBE.underTable`: near corner at once, far corners about 1.4 s), then along the pipe and into the tube, in the order balls arrive. Looks and sound only; play goes on meanwhile.
- Sound (Milestone 6): the cue strike, ball clicks, cushion hits and pocket drops, louder for harder hits; from 0.30.0 also the rumble of a ball rolling to the tube, its roll along the pipe and its landing click. Sound starts after the first touch and stops while the app is in the background. Settings: Sauti Washa / Zima. Placeholder sounds until recorded ones exist. No music yet.

### Characters as built (Milestone 8)
- Asked for by Robert (2026-10-11): looks only, Tanzanian context, about 75% men and 25% women, fun street nicknames with nothing vulgar.
- A person plays as one of 8 characters: Fundi (the expert), Mwamba (the rock), Bonge (the big guy), Mjanja (the clever one), Bishoo (the sharp dresser), Kichwa (the brain), Malkia (the queen) and Shangazi (auntie). Names are not translated.
- The computer is a character per level: Dogo Mbishi (Easy, the stubborn youngster), Mama Ntilie (Medium, the street food seller) and Mzee Kobe (Hard, the old tortoise). Its strength is still only its level.
- Choosing (0.22.0, Robert: your character first): "Chagua mhusika" shows the 8 faces with last time's choice selected, then the opponent picker. Against the computer, the level tap starts the game. With two players, player 2 chooses next and cannot take player 1's character (shown faded).
- Shown in the player panels (face and name) and in all status and game-over messages. Stats count results per computer character, not per player character.
- Names are kept in one config file (`config/characters.ts`) so Robert can change them. Robert approved them on 2026-10-11.
- Players use the character names; typing your own name was built and then left out at Robert's request (2026-10-11).
- Catchphrases (0.13.0, Robert's request): each character says a short line in a speech bubble under their name when they pot one of theirs and play on, when the other player fouls (a tease), and when they win, in the game's language. About 4 in 10 pots and 6 in 10 fouls get a line, then at least two quiet shots; a win always does. Lines are in `config/quips.ts`.

### Computer opponent as built (Milestone 3)
- One computer opponent with three levels (four since 0.16.0). It plays by the same rules and physics as the player, with no spin (players have no spin control yet, TD4) and no knowledge the player lacks: it sees the table, tries shots on a copy of it, and judges each with the rules engine.
- What it looks for: pots of each legal ball into each pocket with clear paths, plain hits on a legal ball as a fallback, and, when nothing legal is found, shots in every direction (to escape snookers). Hard also replays its best few shots with the aim slightly off either way and prefers shots that still work, which cut its fouls from about 9% to 4% of its shots.
- Ball in hand: it puts the cue ball straight behind a ball it can pot. On the break it breaks hard from behind the baulk line.
- Levels differ in aiming error, power error, how many shots it considers, and whether it plans where the cue ball stops:

| Level | Aim error (1 sd) | Power error | Shots considered | Cue ball position | Robustness check |
|---|---|---|---|---|---|
| Easy (Rahisi) | about 1.1° | 15% | 12 | no | no |
| Medium (Wastani) | about 0.34° | 7% | 24 | yes | best 3 |
| Hard (Ngumu) | about 0.13° | 3.5% | 36 | yes | best 6 |
| Impossible (Haiwezekani, 0.16.0) | about 0.02° | 1% | 48 | yes | best 8 |

- 0.16.0 (Robert, 2026-10-11): every level made stronger and Impossible added, played by Bingwa, the champion of the street tables.

- Pacing: it thinks for at least 0.7 s (so the turn change is readable) and at most 4 s on screen; on a slow phone the time limit ends the thinking and it plays the best shot found so far.

### Core loop
Aim, set power and spin, shoot, balls settle, rules engine decides the outcome (continue, change turn, foul, win, loss), repeat. A match ends on a legal or illegal pot of the black.

### Rules decisions
Bar rules in Tanzania vary. These choices change gameplay and code, so they must be confirmed:

| # | Question | Options | Draft default |
|---|---|---|---|
| R1 | Penalty after a foul | (a) Opponent gets two visits ("two shots") (b) Ball in hand anywhere, one visit (World Blackball / WPA) | **Decided 2026-10-07 by Robert: (b) ball in hand, one visit.** |
| R2 | Black ball pocket | Any pocket, or must be nominated | Default: any pocket (unchanged unless Robert objects) |
| R3 | Potting the black on the break | Re-rack, or win | Default: re-rack |
| R4 | Ball sizes / table | Standard UK 7 ft bar table, 2" object balls, smaller cue ball | Default: UK 7 ft dimensions |

### Physics requirements
Deterministic, frame-rate-independent simulation (fixed timestep) so shots behave the same on every phone and AI shot planning can simulate ahead. Ball–ball and ball–cushion collisions, rolling friction, spin effects, pocket capture. Must stay smooth on a low-end phone with 15 moving balls.

---

## Game B: Daladala Rush

### Concept
A 2D arcade driving game. You drive a daladala through Dar es Salaam traffic, stop at stations to pick up passengers, and avoid crashes. Short endless runs.

### First-launch scope (MVP)
1. One route in Dar (e.g. Kariakoo to Ubungo), endless with rising difficulty.
2. Controls: swipe or tap to change lane; tap and hold to brake and stop at a station.
3. Stopping at a station within the stop zone collects passengers; fares form the score.
4. Crash ends the run. Results screen with score and best score.
5. Basic menus and local save (settings, best score).

### Out of scope for first launch
More routes, vehicle upgrades, paint and slogan customisation, events, leaderboards, ads, purchases. See backlog.

### OPEN QUESTIONS
| # | Question | Options | Draft default |
|---|---|---|---|
| D1 | Camera view | Top-down, or behind-the-bus pseudo-3D | Top-down (simplest, clearest on small screens) |
| D2 | Orientation | Portrait or landscape | Portrait (one-handed play) |
| D3 | Fail condition besides crashing | None, or passengers leave if you skip too many stations | Crash only |

---

## Pool story mode: Safari ya Bingwa (0.24.0)
Robert's idea, approved 2026-10-12. Full design in `STORY_MODE.md`. Quick game (Mchezo wa haraka) is the game as before; Safari ya Bingwa is three chapters of nine stops (0.25.0: Dar es Salaam, Kaskazini, Hadi Visiwani) from Mtaani to the final against Bingwa, each one game against one rival on its own table and background, some with a twist (the rival breaks, a shot limit, one foul loses, no spin). Up to three stars per stop (win; no foul; and 3 of the rival's balls left), best kept. Titles by total stars, and story-only rewards for finishing chapters and for stars (a cue, two tables with matching backgrounds, the gold table, the trophy wall). From 0.26.0 only two tables, two cues and two backgrounds are free; the other twelve open at a story stop or after enough wins against the computer (every 3 wins, in journey order), and two player characters start locked (Bishoo: finish chapter 1; Kichwa: 10 wins). The list is `PLAY_UNLOCKS` and `STORY.characters` in `config/story.ts`. No coins, no purchases.

## Future improvements backlog (not approved, not scheduled)
- Pool: guide line that shows the cue ball's path with top or back spin; computer that uses spin and plays safeties on purpose; music, menu click sounds and bar ambience, a volume slider; named computer opponents with personalities; online 1v1, more venues (Sinza, Kariakoo, Zanzibar beach), cosmetic cues and cloths, weekly tournaments, rewarded ad for an extra aiming guide, Pyramid mode.
- Pool: an American 8-ball game type (striped and solid numbered balls) was raised and DROPPED by Robert (2026-10-11). The potted-ball tube he raised is approved and being built (keeps the name trays).
- Daladala: new cities, upgradeable daladala, custom paint and slogans, daily events, city leaderboards, rewarded ad for a revive.
- Both: optional analytics (retention), carrier-billing and mobile-money purchases, iOS build.
