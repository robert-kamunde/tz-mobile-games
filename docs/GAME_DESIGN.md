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

## Game A: Pool (working title "Pool ya Mtaani")

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
| After the break | The table is always open after the break, whatever was potted. A pot on the break keeps the breaker at the table. |
| Open table | Any red or yellow may be hit first; hitting the black first is a foul. Potting only one colour claims it (the opponent gets the other). Potting both keeps the table open and the turn. |
| Groups decided | Must hit an own ball first. Potting an opponent's ball is a foul, even alongside an own ball. |
| Fouls | No ball hit; wrong ball first; cue ball potted; opponent's ball potted; no ball potted and no ball reaching a cushion after contact; illegal break. Penalty: opponent has ball in hand anywhere for one visit (R1). |
| Turn | Continues after legally potting an own ball (or any colour on an open table); otherwise passes. |
| The black | On the black once all own balls are down; must hit it first. Legally potting it in any pocket wins (R2). Potting it at any other time, or with a foul, loses. Potting the last own ball and the black in one shot loses. A foul while on the black is only a foul. |
| Black on the break | Re-rack; the same player breaks again (R3). |

### Controls as built (Milestones 1-2)
- Drag anywhere on the table: the cue points from the cue ball towards the finger. A guide line shows the path, the ghost ball at first contact, and the predicted object-ball and cue-ball directions.
- Power: touch the bar on the right, drag down, let go to shoot. Letting go below 4% cancels; a system touch cancel never shoots.
- Aiming and power can use two fingers at once. Controls are disabled while balls move.
- Ball in hand: a ring shows round the cue ball; drag it to place it. It follows the finger only over free cloth (never onto a ball, cushion or pocket) and stays behind the baulk line before the break.
- Pass-and-play: two players share the phone; the panel of the player to shoot is highlighted, with their colour chip and balls left, and a tray under each name that fills with that player's potted balls once colours are decided. The status line says what happened (foul, colours decided) and who plays next.
- New game: bottom right. During a match it needs a second tap within 3 seconds.
- Not yet built: AI, menus, settings screen, stats, rules screen, spin control, fine aim adjustment, sound.

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

## Future improvements backlog (not approved, not scheduled)
- Pool: online 1v1, more venues (Sinza, Kariakoo, Zanzibar beach), cosmetic cues and cloths, weekly tournaments, rewarded ad for an extra aiming guide, Pyramid mode.
- Daladala: new cities, upgradeable daladala, custom paint and slogans, daily events, city leaderboards, rewarded ad for a revive.
- Both: optional analytics (retention), carrier-billing and mobile-money purchases, iOS build.
