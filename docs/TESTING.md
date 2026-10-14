# Testing

Nothing is called working unless a test below (automated or manual) has shown it. Results that could not be verified are listed as such.

## Automated

### Unit tests (`npm test`): 210 tests

#### Core, `packages/core/test` (53)
| Area | What is covered |
|---|---|
| Saves | Round trip; missing data; not-JSON, missing envelope, `null`, invalid payload, wrong type; newer version; step-by-step migration; missing migration step; throwing migration; failed write reported, not thrown; storage that throws or cannot be obtained; an unreadable value is copied to `<key>.backup`, a missing or good one is not. |
| Language | Kiswahili default; switching; placeholders; English then key fallback; unsupported locale ignored; missing-key finder. |
| Fixed step | Whole steps and remainder; same total steps at 30/60/144 fps; cap and drop after a long stall; negative/NaN frame times; reset; invalid config rejected. |
| Lifecycle | Pause/resume once each; starts paused when opened hidden; throwing listener isolated; dispose removes listeners. |
| Settings | Kiswahili default; per-game key; five invalid shapes rejected. |
| Backgrounds (pool) | Every background's large areas give white text a contrast of at least 7 and the grey text 4.5 (6 under the band wash); small details stay soft enough for white text over them; only known ids; progress keeps the choice, older saves and unknown values give Klasiki. |
| Random rack (pool) | Over 300 random racks: ids keep their colours, nothing overlaps, the black stays on its spot, the back corners are a red and a yellow; the colours land in different places from game to game; the same full-power break gives many different results and does not always pot a ball. Older progress without the Impossible level keeps its stats. |
| Left-handed layout (pool) | Right-handed is the layout as written; left-handed mirrors the table and the controls column exactly, keeps them on screen and apart. Progress keeps the hand; older saves and unknown values give right-handed. |
| Catchphrases (pool) | Every character (player and computer) has a line for each moment in Swahili and English, none longer than the bubble allows, and no lines for characters that do not exist; string tables match. The shooter speaks after a pot, the other player after a foul, the winner at the end, nobody after a miss or re-rack. Lines come at the configured chance, stay quiet for the set number of shots after a line (a win still speaks), do not repeat straight away; over 3000 pots the share stays within bounds. |
| Tables (pool) | Six tables, each with its own felt and rail style; every new felt differs from every ball by at least 25 (CIE76) in normal, deuteranopia and protanopia vision; the check catches a red felt; only known ids accepted. Progress keeps the table; older saves and unknown tables give Klasiki. |
| App exit | Saves, then closes; does nothing where the game cannot close itself; still closes if saving fails. |
| Sound synth | Each layer kind makes a short, non-silent sound peaking exactly at the recipe level with a silent last sample; the same seed gives the same samples; bad sample rates and lengths are refused. |
| Back button | No handler leaves the app; newest handler first, stopping at the first that handles it; a removed handler is not asked (removing twice is harmless); a throwing handler is logged and does not leave the app. |
| Random | Same seed repeats, another seed differs; values in [0, 1); normal() mean about 0 and spread about 1; non-finite seed rejected. |

#### Pool, `packages/pool/test` (160)
| Area | What is covered |
|---|---|
| Characters | 8 player characters, 6 men and 2 women; unique ids and names, names short enough for the panel; the computer's seat shows its level's character; two players never share a character; saved picks accepted only as two different known characters; progress and a saved game from before characters load with their stats and the default characters. |
| Table and rack | 6 pockets, 18 cushion segments; 7 reds, 7 yellows, black in the middle of row 3, different back corners; cue ball behind the baulk line; nothing overlaps. |
| Rolling and sliding | Rolling distance matches v²/2a; stun shot skids for 2v/(7µg) then rolls at 5/7 speed; backspin draws back, topspin follows through. |
| Collisions | Full-ball hit matches restitution; with elastic balls a cut separates at 90°; cushion returns speed scaled by restitution; left and right side spin bend the rebound by exactly opposite amounts. |
| Pockets | Diagonal shot drops in the corner; straight shot drops in the middle; fast ball along the cushion past a middle pocket stays legal either way. |
| Robustness | Full power in 72 directions from 3 spots never tunnels or escapes; 40 random shots (seeded) on a full rack always settle with no overlaps or escapes; energy never rises during a break; a break settles within half the time limit. |
| Determinism | Same break twice is bit-for-bit identical; 30, 60, 144 fps and random frame times give identical results. |
| Input validation | Zero, NaN and infinite shots refused; no shot while balls move or with the cue ball potted; power and tip offset clamped; cue ball placement refuses balls, pockets, off-table and NaN. |
| Respawn | Practice respawn uses the start spot when free, otherwise the next free spot. |
| Aim guide | Full hit distance and zero deflection; cut gives 90° paths; empty line reaches the cushion; stops at a pocket; pocketed balls ignored; max distance; invalid direction; agrees with the simulation on the first ball hit. |
| Rules: break | Start state; one colour potted on the break gives the breaker that colour (either breaker); both colours keep the table open and the turn; a pot with a foul on the break decides nothing; legal break without pot passes; illegal break is a foul; cue ball in on the break is a foul; black on the break re-racks with the same breaker. |
| Rules: open table | One colour claims it (either player); hitting one colour and potting the other claims the potted one; both colours keep it open; black first is a foul; fouls never assign groups; no pot passes; black on an open table loses. |
| Rules: groups | Own pot continues; opponent ball first is a foul with ball in hand anywhere; potting an opponent ball is a foul; miss, no cushion, cue ball in are fouls; ball in hand passes to the right player and clears after a clean shot. |
| Rules: black | Must hit the black first when on it; legal pot wins; with the cue ball or an opponent ball it loses; last own ball and black together loses; foul on the black is only a foul; no shots after the match ends. |
| Shot summary | First contact, cushion after contact, pots in order, break cushion count; cushion before contact ignored; empty shot; unknown ball id throws. |
| Rules + physics | A real full-power break is judged legal. |
| AI: pot lines | A straight pot is found and aimed at the ghost ball and ranks easiest; a ball in the object ball's path or the cue ball's path removes the pot; only legal balls offered; longer pots need more speed; power clamped. |
| AI: planner | Pots a simple ball and expects to; same decision and step count however the thinking is sliced; each level stays within its step limit; a decision taken early (time limit) is still a valid shot; breaks from behind the baulk line with a legal break; with ball in hand places the cue ball on a legal spot and pots; when its only ball is hidden behind a wall of opponent balls, still finds a legal hit (direction sweep); on the black, plays the winning pot; its prediction of each intended shot matches what the shot really does over 8 shots of a game; refuses to plan after the match ends. |
| AI: whole game | Two Easy computers play a full game to a winner. |
| Saved game | Round trip through JSON restores the same balls (kinds from the rack, at rest); rejected: a missing, extra or repeated ball, a ball off the table, a non-number position, a potted cue ball, two balls on one spot, an unknown opponent, a negative shot count, a finished match. A damaged save loads as no game, is backed up and never throws; saving and clearing work. |
| Match state check | A fresh match and one in play pass; rejected: finished, unknown phase, bad player, the same colour twice, half-decided colours, colours during the break, the wrong breaker, baulk ball in hand after the break, not an object. |
| Stats | Games per computer level and two-player games counted, wins only for the person; round trip with the last opponent; rejected: more wins than games, a missing level, fractional counts, a bad last opponent. Opponent validation accepts only known opponents. |
| Spin and fine aim controls | Centre is a centre hit; up, down and right give topspin, backspin and right side, reaching the largest offset at the edge; touches beyond the edge are pulled onto it; bad input gives a centre hit; the dot is drawn where the touch was; the control's top and bottom give follow and draw in the simulation. Fine aim: positive angle turns clockwise on screen, exact angle there and back over 1000 small turns, unit length kept, non-number angle ignored. |
| Sound | Every recipe renders short, never clips, never silent; loudness is silent below the threshold, full at the cap and grows with speed; cue gain grows with power; the mixer drops close repeats but keeps a clearly louder one, sorts loudest first, caps sounds per frame and resets between shots; a real break gives fewer sounds than contacts; ball and cushion events carry the right impact speed. |
| Android project | One app ID in the Capacitor config, Gradle, strings and the activity's package; version from package.json in x.y.z form; landscape only; icon, round icon, adaptive foreground and splash at every density at the right pixel sizes; store icon and feature graphic sizes. One-time tips save: default unseen, only a true/false flag accepted. |
| Source rules | No Phaser, DOM, trigonometry, pow/exp/log, `Math.random` or clock calls in `src/physics`, `src/rules` and `src/ai`. |

### Browser tests (`npm run test:e2e`): 59 scenarios x 3 screen sizes = 177 runs
Runs production-like builds (`--mode e2e`) in Chromium with touch and mobile emulation at 640x360 (small phone), 915x412 (tall phone) and 1280x800 (tablet). Pool tests use real touch events (start, move, end, cancel).

#### Shell demo (11 scenarios)

| Scenario | Checks |
|---|---|
| Boot | Starts with no console errors, frames keep advancing. |
| Layout | Canvas inside the viewport, 16:9, fills one dimension, no page scroll. |
| Language | Starts in Kiswahili; a real tap switches to English; survives a reload. |
| Rapid input | 9 fast taps leave screen state and stored state in agreement. |
| Backgrounding | Hidden: paused, settings saved, no frames run. Visible again: frames resume. No errors. |
| Opened in background | Stays paused with zero frames, starts normally once shown. |
| Corrupt save | Garbage in storage: falls back to defaults, no errors. |
| Blocked storage | `localStorage` throws: game still runs and language still switches. |
| Orientation | No prompt in landscape; Kiswahili rotate prompt in portrait; clears after rotating back. |
| Slow CPU | With a 6x CPU throttle, average CPU time per frame stays under 8 ms (half a 60 fps frame). |

#### Pool table (8 scenarios, `pool.spec.ts`)
| Scenario | Checks |
|---|---|
| Opens | 16 balls racked, Kiswahili, nothing moving, no errors. |
| Aiming | Dragging on the table points the cue at the finger (within about 1°). |
| Shooting | Pulling the power bar shoots; balls settle; the rack moved; no overlaps, escapes, timeouts or errors. |
| Tiny pull | Below 4% power, letting go cancels. |
| Cancelled touch | A system touch cancel on the power bar does not shoot; the bar works afterwards. |
| Busy table | Power bar and aiming are ignored while balls move. |
| Background mid-shot | Hidden: the simulation stops advancing. Shown again: the shot finishes with exactly the same ball positions as an uninterrupted shot. |
| Slow CPU | A full break at 6x CPU throttle: average CPU time per frame under 8 ms; balls settle without overlapping. |

#### Pool match (7 scenarios, `match.spec.ts`)
| Scenario | Checks |
|---|---|
| Break placement | Player 1 breaks; dragging the cue ball past the baulk line keeps it behind the line. |
| Foul and ball in hand | A break into a pocket without contact is a "no ball hit" foul; player 2 gets ball in hand; the cue ball is back on the table and can be dragged to a new spot; the status line shows the foul. |
| Blocked placement | The cue ball cannot be dropped onto another ball. |
| Winning | Set up on the black (test-only layout), aim and shoot by touch: the black drops, player 1 wins, the game-over panel shows, shooting is disabled, New game starts a match with player 2 breaking. |
| New game confirm | One tap mid-match changes nothing; a second tap restarts. |
| Potted-ball trays | No trays while the table is open; once colours are set, each player's tray shows 7 slots with their potted balls filled (checked with 1 and 3 potted). |
| First pot fills the tray | On an open table, a real shot that pots one red gives the shooter reds and their tray shows 1 of 7 at once. |

#### Computer opponent (5 scenarios, `computer.spec.ts`)
| Scenario | Checks |
|---|---|
| Play from the menu | Play, then Easy, starts a match with the player to break and the computer idle. |
| Computer's turn | It thinks and shoots with no input; a power-bar pull during its turn does not shoot (the shot log shows only player 1's break and the computer's shot); balls settle with no overlaps or escapes. |
| Ball in hand | With ball in hand anywhere, Medium places the cue ball and shoots; the table is sound afterwards. |
| New game | Mid-match (two taps) New game stops a thinking computer and opens the picker; pulling the power bar meanwhile does nothing; choosing two players restores "Mchezaji" names. |
| Frame budget | 6x CPU throttle: average CPU per frame while Hard thinks minus the same table while the player aims stays under the 6 ms thinking budget plus 6 ms; Hard still shoots (time limit). |

#### Tables and cues (5 scenarios, `tables.spec.ts`)
| Scenario | Checks |
|---|---|
| Choose a table | The picker opens with Klasiki selected; Back closes it; choosing Zanzibar saves it, the next game is drawn on it, and after reopening it is still chosen and selected on the picker. |
| Back keeps the table | Selecting another table then Back, or the phone's back button, leaves the saved table unchanged and does not leave the app. |
| Continue on a new table | A game in progress continues on a table chosen meanwhile, with the balls where they were. |
| Every table | Each of the six tables draws and plays a break with no errors. |
| Mandhari | Under Mapambo, Meza, Fimbo and Mandhari stand in a column without overlapping, each with its count (2 open at first). Each of the six backgrounds can be chosen and is drawn on the table screen; the picker marks the saved one; Back keeps it; it survives reopening. |
| Choose a cue | Fimbo opens with Klasiki selected; choosing Maasai saves it; selecting another then the phone's back button keeps Maasai (and the table unchanged); the table scene draws the Maasai cue; kept after reopening. |

#### Spin and fine aim (4 scenarios, `controls.spec.ts`)
| Scenario | Checks |
|---|---|
| Spin | Dragging the dot to the top and bottom sets topspin and backspin, and the shot is played with it; the dot is back at the centre as soon as the shot is played. On the same pot, topspin makes the cue ball follow the red into the pocket (foul) and backspin brings it back past where it started. |
| Spin while rolling | During a full-power break, a spin drag changes nothing; the balls are checked to still be moving after the drag, so the touch really landed mid-roll. |
| Fine aim | 200 design pixels turn the aim clockwise by 190 to 210 times the per-pixel angle; dragging back returns it; a cancelled touch never shoots and the strip still works after it. |
| Computer's turn | Spin and fine aim drags change nothing while the computer thinks, and it plays a centre-ball shot. |

#### Menu and saving (10 scenarios, `menu.spec.ts`)
| Scenario | Checks |
|---|---|
| Menu first | The game opens on the main page in Kiswahili with CHEZA, Mapambo, Stats, Rules, Settings, no dot and no Continue; CHEZA holds Quick game, the journey and Rudi; Mapambo holds the looks and the phone's Back returns to the main page; Rules opens with the rules text and Back closes it; Back on the picker returns to the menu without starting a game. |
| Menu and Continue | After a break, Menu then Continue brings back the same balls, match and opponent; after reopening the page the same again. |
| Exit, no game | Exit ("Toka") closes the game at once with no popup. |
| Exit during a game | The popup says the game is saved; its Back button and the phone's back button close it without closing the game; Exit then closes; after reopening, Continue brings back the same balls. |
| Closed mid-shot | Reopening while balls roll, then Continue, gives the table, match and shot count from just before that shot. |
| Finished game | Winning on the black against Easy removes the saved game; the menu shows no Continue; Stats reads "Kompyuta (Rahisi): umeshinda 1 kati ya 1" and zero for the others; the picker marks Easy. |
| Language | Settings, English: the menu redraws in English with Settings still open and English marked; kept after reopening; the table is in English too. |
| Damaged save | A broken saved game and unreadable stats in storage: the menu opens with no Continue, the stats show zero, both values are in `.backup` keys, a new game saves over them, no errors. |
| Menu after a language change | Change to English, play, tap Menu: the main menu opens with no panel (failed before the fix). |
| Computer resumes | A game saved on the computer's turn: after reopening and Continue, the computer plays its shot by itself. |

All pool scenarios start from the menu: CHEZA, Quick game, then the opponent, with real taps (`tapMenu` opens CHEZA or Mapambo first).

#### Sound (7 scenarios, `sound.spec.ts`)
Sounds are read through the `sound()` test hook (sound state and the sounds actually started, with their level); the headless browser has no speakers.
- A full break starts with the cue strike and plays ball and cushion sounds, all at levels in (0, 1]; a soft shot's cue strike is quieter.
- Sound off in Settings is marked, kept after reopening, and a break then plays nothing; turning it on again brings the sounds back.
- In the background the sound is suspended; back in the foreground it runs and plays again.
- With no Web Audio at all, the game plays silently with no errors.
- If the browser refuses to start sound, the game plays silently with no errors.
- On a browser that only allows sound when the finger lifts (as iPhone does), sound still starts and the break is heard.
- If the system will not restart sound when the game comes back from the background, the next touch restarts it.

#### Release readiness (4 scenarios, `release.spec.ts`)
- The first game shows "how to play" (Kiswahili text), the power bar does nothing meanwhile, OK closes it and the break works; it is not shown on a new game or after reopening.
- Back on the menu closes Stats, then the picker, then leaves the app (counted through the test hook), with the menu still there.
- Back on the table closes the help, is ignored while balls roll, closes the New game picker without changing the game, then goes to the menu with Continue offered and the app not left.
- With every request outside the game's own server blocked and the browser set offline after loading, a shot, Menu and Continue all work and no outside request is attempted.

#### Characters (6 scenarios, `characters.spec.ts`)
- Against the computer: Fundi is selected first, another face is tapped and started; the panels and status show that character and the computer's (Mzee Kobe); Continue after reopening, twice, keeps them; the next game opens with that character selected.
- Two players: "Mchezaji 1" picks and taps Endelea; for "Mchezaji 2" that character is faded, not selected and cannot be tapped; Anza starts with both names and picks.
- Back on player 2 returns to player 1 with the choice kept, Back again to the opponents, and the phone's back button closes the picker without leaving the app.
- New game on the table: Back from the characters returns to the opponents, then to the same game; a new choice starts with the chosen character and Mama Ntilie.
- In English the computer is "Dogo Mbishi (Easy)" and the picker says "Player 1" and "Next".
- A saved game with its characters removed (as an older version wrote it) continues with the default characters.

#### Potted-ball tube (2 scenarios, `tube.spec.ts`)
- Balls potted by a test layout show in the tube at once; a newly potted black rolls in and rests on top of the reds; balls put back on the table leave the tube.
- Each pocket's time to the tube: under 0.15 s from the corner by the tube, longest (over 1.2 s, at most `TUBE.underTable.maxMs`) from the far corner. A black potted in the far corner is first under the table and not in the tube, then lands on top of the reds; the pocket, under-table rumble, pipe roll and landing sounds are all played. Left-handed (`hand.spec.ts`): the top-right pocket is nearest and the bottom-left farthest.

#### Left-handed mode (2 scenarios, `hand.spec.ts`)
- Kushoto in Settings is highlighted and saved; on the table the spin control is on the left quarter, the table moved right, Menu at the right and New game at the left. Controls never overlap the rails, buttons never overlap the fine-aim strip, everything is on screen, also with New game's confirm label. Ball in hand, aiming, fine aim, spin and the power bar all work where they now are, and the shot carries the spin.
- In English the layout holds too; switching back to Kulia puts everything back where it was.

#### Catchphrases (2 scenarios, `quips.spec.ts`)
- Fundi wins: "Kazi imekamilika!" shows in a bubble below player 1's name, on the left half of the screen, and is gone after `QUIPS.showMs`.
- In English, Shangazi wins and says "Auntie wins, sit down!".

### Strength ladder (`npm run ai:ladder -w @tzg/pool`, not part of `npm test`)
Each level plays the level below it over 40 games (set `AI_LADDER_GAMES`), breaking alternately, with fixed seeds. Passes if every game finishes and the stronger level wins more than half. Takes several minutes.

Results 2026-10-11 (0.16.0, 30 games each): Medium beat Easy 28/30, Hard beat Medium 24/30, Impossible beat Hard 24/30, every game finished (average 30, 19 and 14 shots). Fouls per shot: Easy 9%, Medium 5%, Hard 3 to 6%, Impossible 2%. Impossible potted on 74% of its shots; its longest decision was 313 000 physics steps. Each new level also played its old self (a temporary comparison, not kept): new Easy won 23/30, Medium 18/20, Hard 15/20.

### Release build check
`npm run build -w @tzg/shell` and `npm run build -w @tzg/pool`, then confirm `__tzg` (and, for pool, `testLayout` and `continueShown`) do not appear in `dist/assets/*.js`.

Frame-time checks on a 6x slower CPU have `@timing` in their titles and run in the `timing` project: after all other tests, one at a time, on the small phone. Run just them with `npx playwright test --project=timing --no-deps`.

## Results log

| Date | Milestone | Typecheck | Unit | Browser | Notes |
|---|---|---|---|---|---|
| 2026-10-07 | 0 | pass | 38/38 | 33/33 | fps at 6x CPU throttle: 28.5 to 32.0 across runs (headless Chromium, software rendering in a cloud container, not a phone). Release build has no test hooks. First browser run failed 3/30: frames kept running in the background (fixed, see ARCHITECTURE A7). |
| 2026-10-07 | 2 | pass | 112/112 | shell 33/33, pool 39/39 | All new tests passed on the first full run. Layout reviewed on 640x360 screenshots: text sizes raised so nothing renders under 10 CSS px on a 360-px-tall phone; status line overlapped a player panel at first (fixed); the aim guide ran off the table through a pocket (fixed: it now stops at pockets). |
| 2026-10-07 | 2.1 | pass | 113/113 | pool 42/42 | Potted-ball trays. Checked on a 640x360 screenshot: the trays fit between the player names and the top rail. |
| 2026-10-08 | 3 | pass | 136/136 (+2 ladder tests skipped) | shell 33/33, pool 57/57 | Ladder, 40 games each: Medium beat Easy 32/40, Hard beat Medium 36/40, every game finished (average 39 and 21 shots). Fouls per shot: Easy 14%, Medium 9 to 10%, Hard 4% (9% before the robustness check was added). Hard's longest decision: 213 824 physics steps. 6x throttle: frames while Hard thinks cost 1 to 9 ms more than frames while the player aims (12 to 25 ms, software renderer). Found and fixed: Phaser's frame delta undercounts on slow frames, so the thinking time limit now uses the clock (capped per frame for backgrounding); the controls hint showed during the computer's turn (now hidden); a slow background test hit the 30 s limit with more tests running alongside (limit raised for that test). |
| 2026-10-08 | 5 | pass | 177/177 (+2 ladder tests skipped) | pool 90/90 (shell unchanged) | A planted bug that ignored the spin setting was caught by the spin browser test. The first follow-and-draw check failed for real reasons: on a 0.4 m straight shot backspin wears off before contact and follow carries the cue ball to the far cushion and back, so the test now uses a short pot into a pocket. Chrome logs a notice for a cancelled touch it cannot stop; the fine-aim test ignores that one message. Screenshot at 640x360 checked: spin face, shorter power bar, hint and strip all fit. |
| 2026-10-08 | 4 | pass | 166/166 (+2 ladder tests skipped) | shell 33/33, pool 78/78 | All new browser tests passed on their first run, so two bugs were planted to check them: saving the moving table mid-shot and keeping the save after a finished game. The tests caught both. Screenshots at 640x360 and 915x412: the menu showed through the Stats, Rules and Settings panels and made them hard to read (those panels are now opaque). The pool suite took 3.6 minutes. Release build has no test hooks. |
| 2026-10-09 | 6 | pass | 192/192 (+2 ladder tests skipped) | shell 33/33, pool 108/108 | The new sound tests passed first time, so two bugs were planted: ignoring the Sound setting, and not suspending sound in the background. The tests caught both. Settings panel checked on screenshots at 640x360 and 915x412 in both languages. The pool suite took 9.5 minutes in this run (TD5). Sound itself was not heard (U11). |
| 2026-10-09 | 6.1 | pass | 192/192 | shell 33/33, pool 114/114 | Robert heard no sound on an iPhone 15. Cause: sound was only started on the first finger-down, which iPhones do not accept. The two new tests fail on the old code and pass on the fix. Not verified on an iPhone here (U11). |
| 2026-10-10 | 7 | pass | 201/201 (+2 ladder tests skipped) | shell 33/33, pool 126/126 | Two bugs planted in the new code (the help not remembered as seen; back on the menu ignoring the picker and panels) were caught by the new tests. After the rename to Bongo Pool Table the menu and release tests were rerun (36/36). The Android project was synced (`cap sync`) but not built: Gradle cannot fetch the Android plugin here (B1). Splash, icons and store graphics checked by eye. Pool suite took 11.4 minutes. |
| 2026-10-10 | 7 (device) | n/a | n/a | n/a | First Android build: Robert built the app on his Windows PC with Android Studio (RELEASE.md) and ran it on a ZTE Blade A35 (Z2453), Android 14. "Runs really well." 6e: full screen yes; icon and name yes; splash not seen; back button and landscape lock not reported. Saving (3): works. Sound (6d): heard when opened from the phone, not heard while started from Android Studio over USB. |
| 2026-10-10 | 0.8.1 | pass | 202/202 (+2 ladder tests skipped) | not rerun (no web code changed) | Launch theme for Android 12+ (splash background and icon) and the web view's load colour. The new unit test fails when the splash colour drifts from the game's (planted). Not built here (B1); Robert to rebuild and check the splash. |
| 2026-10-11 | 0.8.1 (device) | n/a | n/a | n/a | Robert rebuilt 0.8.1 and checked it on the ZTE Blade A35 (Android 14): "all looks good". Splash, back button and landscape lock now confirmed alongside full screen, icon, saves and sound. |
| 2026-10-11 | 8 | pass | 210/210 (+2 ladder tests skipped) | pool 141/144, then the menu tests 24/24 and screenshots rerun (shell unchanged) | Characters. The first full run failed one menu test on all three sizes: its expected menu probe lacked the new `selectedCharacter` field (test updated; rerun of the menu tests passed). Two planted bugs: player 2 allowed to take player 1's character (caught); characters shown but not saved after Continue (missed at first because the names on screen were right, so a second reopen was added to the test, which then caught it). Screenshots of the picker and table at three sizes checked: grid, names and buttons fit; the computer's name fits the right-hand panel. |
| 2026-10-11 | 8.1 | pass | 210/210 | pool match and characters tests 39/39 | Ball count removed from the player names. The tray test now checks the names have no count; it fails on 0.9.0 and passes on 0.9.1. |
| 2026-10-11 | 9A | pass | 210/210 (+2 ladder tests skipped) | pool 147/147 + shell 33/33 on the second run | Table art. First full run: 141/144; the spin test failed on all three sizes because its touch "while balls roll" came after a short shot had already stopped. It fails the same way on 0.9.1 under load, so a test timing fault, not the art; that check now runs on a full-power break and proves the balls are still moving. Break at 6x CPU throttle: 1.7 to 2.6 ms average CPU per frame (max 5.1 ms). Power-bar fill checked on a mid-pull screenshot; red/yellow checked on deuteranopia and protanopia simulations. |
| 2026-10-11 | 0.10.1 | pass | 213/213 (+2 ladder tests skipped) | menu, release and characters tests 60/60 (3 sizes) | Exit button. Screenshots of the menu with six buttons and the popup checked on the small phone. Not testable here: that `App.exitApp()` really closes the Android app (device checklist 6f). |
| 2026-10-11 | 0.11.0 | pass | 218/218 (+2 ladder tests skipped) | pool 161/161 + shell 31/31 (timing checks now once, in the `timing` project) | Tables and Exit together. Before the timing project, the 0.10.1 full run failed the "computer thinking" frame check on two sizes (12.3 and 12.2 ms against 12); run alone it passed 9/9 (gap -0.4 to 6.7 ms), so the cause was tests sharing the CPU. In the timing project: thinking gap 8.2 ms, break 1.44 ms average. Screenshots of every table and the picker checked; felt colours pass the colour-blind check. |
| 2026-10-07 | 1 | pass | 76/76 | 63/63 | Break at 6x CPU throttle: 0.8 to 1.0 ms average CPU per frame (max 4.4 ms). Shell idle at 6x: 2.2 to 2.4 ms. Frame rate in the test browser is 16 to 20 fps during a 6x-throttled break and 26 fps idle unthrottled, limited by the software renderer's fill rate (a full-table rectangle alone halves it), so it says nothing about phones; see KNOWN_ISSUES U2. Found and fixed: a system touch cancel on the power bar fired a shot (test failed before the fix, passes after). |
| 2026-10-11 | 0.19.0 | pass | 264/264 (+3 skipped) | pool 185/185 + shell 31/31 | Art Part C. New unit tests: the synthesiser's delay, soft start, high-pass and rattle; the adaptive icon background matches the icon felt; sound lengths (pocket up to 0.5 s, the others 0.15 s). Icon, splash, feature graphic and the four store screenshots checked by eye. The sounds were checked only by numbers (length, peak, no clipping, same every time): Claude cannot listen, so how they sound is for Robert to judge. |
| 2026-10-12 | 0.25.0 | pass | 294/294 (+3 skipped) | pool 236/236 + shell 31/31 | Story mode in three chapters (0.24.0 and 0.25.0). New tests: unit (27 stops in three chapters, every rival has a face and catchphrases, levels never drop inside a chapter, chapter and star rewards, titles over 81 stars, saved story games with and without shots, every label the code uses exists in both languages); browser (story.spec: first visit and character change, chapter pages, clean win, Endelea, a loss and Rudia, fouls and best stars kept, auto-return to the map, Continue, stand-in rivals, locked and earned rewards, English, and each twist: rival breaks, one foul, no spin, shot limit after Continue). The 0.24.0 full run was stopped part way because source files changed during it; this run is the clean one. Map, stop cards, end panel, pickers and the new tables and backgrounds checked by eye on two sizes. |
| 2026-10-12 | 0.26.0 | pass | 295/295 (+3 skipped) | pool 246/249 then 249/249 + shell 31/31 | Picker pages, earned looks and characters. The full run failed only menu.spec's first test on all three sizes (its exact probe check lacked the new page fields); fixed, and menu.spec re-run on all sizes: 33/33. New tests: unit (two free per kind, stop-or-wins unlocks in journey order, locked characters both men and never the defaults); browser (pages and arrows, locked looks can't be chosen, the choice is kept across pages, the picker opens on the saved choice's page, wins and stops unlock, locked characters for both players, ten wins open Kichwa, a story win's unlock note, the stop card's reward). Pickers, character picker and stop card checked by eye. |
| 2026-10-13 | 0.27.0 | pass | 296/296 (+3 skipped) | pool 257/257 + shell 31/31 | Quick game and story game saved apart. New tests: unit (a story game goes to its own slot, an old-style save moves, a Quick game stays); browser (both games kept with a Continue each, side by side, each resumes its own balls; an old-style story save shows as Endelea na safari). Menu with both buttons checked by eye. |
| 2026-10-13 | 0.28.0 | pass | 301/301 (+3 skipped) | pool 266/266 + shell 31/31 | Play reminders. New tests: unit (reminder time: a day away, two days apart, 18:00; return drops a waiting reminder or counts it shown; which reminder is picked; saved choices read strictly); browser with a recording stand-in for the phone (not asked at first, asked once after the first win, leaving sets one evening reminder and returning removes it, an unfinished game is the reminder, a player who says no gets none, the Settings switch). Settings panel with four rows checked by eye. Real notifications on a phone not checked (KNOWN_ISSUES U13). |
| 2026-10-12 | 0.20.0 | pass | 267/267 (+3 skipped) | pool 185/185 + shell 31/31 | Faces from picture files. New unit tests: one picture per character and none for anyone else, all bundled, each 512 px square and under 300 KB. The characters test checks the picker's faces come from the files. Script checked on a 1200x900 noisy picture (cut, resized, saved as JPEG) and on a re-run (changes nothing). |
| 2026-10-12 | 0.21.0 | pass | 267/267 (+3 skipped) | characters, menu, release, match 84/84 | Robert's ChatGPT faces. Picker and player panel checked by eye on the small phone; phone build checked to load all 12 pictures with no failed requests. |
| 2026-10-11 | 0.18.0 | pass | 262/262 (+3 skipped) | pool 181/183 on the full run (the 2 failures were in the new tube test), then tube, hand and pool specs 30/30 on three sizes and the tube test 9/9 repeated with four browsers at once; timing 2/2 | Potted-ball tube. New tests: unit (tube fits between the screen edge and the rail for both hands; 15 balls fit), browser (already-potted balls show at once, a newly potted black rolls in and rests on the reds, balls back on the table leave the tube; the tube is clear of every control and button in both hands). The new test first failed because the black shot can also sink a yellow, and because it compared padded image edges; it now compares ball centres. Break at 6x CPU throttle 1.21 ms average, 21 fps in the software renderer. |
| 2026-10-11 | 0.17.0 | pass | 260/260 (+3 skipped) | pool 182/182 + shell 31/31; timing 2/2 | Art Part B. New unit test: every character has a portrait and no portrait lacks a character. Screenshots of the menu, Settings, opponent and character pickers and the table on two sizes checked by eye. The first full run had 9 tests time out at 30 s; the same tests on the 0.16.0 code took 22 to 29 s with four running at once, so the limit had no room since the random rack. Per-test limit raised to 60 s (frame time stays checked by @timing: break at 6x CPU throttle 1.2 to 1.5 ms average, 20 fps in the software renderer, same as before). |
| 2026-10-11 | 0.16.0 | pass | 259/259 (+3 skipped: ladder and an unrelated skip) | pool 176/180 + shell 31/31 on the full run; the 4 failures fixed and rerun 24/24 on three sizes, timing 2/2 | The random rack broke two tests that assumed the same break every game: the background test compared two breaks (now the second game is given the first game's rack), and the sound test plays two full breaks, which with random racks roll for up to 8 s of game time instead of about 5 s (test limit raised to 60 s, like its neighbour). Opponent picker with five choices: a new test checks the buttons do not overlap on the menu and the table (the table panel was too short; made taller). Break at 6x CPU throttle 1.24 ms average. |

| 2026-10-14 | 0.32.0 | pass | 315/315 (+3 skipped) | pool 272/272 + shell 31/31 | Polish. New tests: unit (the rolling dot: a quarter turn brings it to the edge, half a turn hides it, a full turn brings it back, it follows the direction rolled, ignores jumps and placements, stays on the ball over 20 000 small rolls; the tap sound's length); browser (the dots start on top and turn on the break, and stay on the ball). Menu, Settings, table, tube opening, rolling dots mid-break and the end panel checked by eye on the small phone. Sounds checked only by numbers; Robert to listen. |
| 2026-10-14 | 0.33.0 | pass | 315/315 (+3 skipped) | pool 265/270 on the full run, then match, menu and sound specs 56/56 on tablet and tall phone | Tables with depth. New browser check: a ball potted in the far corner is shown sinking, then gone, before it reaches the tube. Pockets, cushions and rails checked by eye on the small phone; the sink checked frame by frame with the sink slowed to 3 s in a test build (the ball shrinks and darkens into the hole). Full run failures: the sound test's second break heard a tube rumble left over from a ball potted on the first break (possible since the 0.30.0 tube delays with a random rack); the test now ignores tube sounds. Four tablet tests timed out waiting for menu taps to register; they passed when rerun and nothing in this change touches the menu, so the cause is unproven (likely load with four browsers at once). |
| 2026-10-14 | 0.33.1 | pass | 315/315 (+3 skipped) | tube, hand and tables specs 26/26 on small phone and tablet | Collar and pocket cups checked by eye; the pipe roll checked frame by frame slowed to 2.4 s in a test build (the ball comes out from under the collar, never over the rail). |

## Not yet verified (needs a real device)
- Android in detail. The app has run on one Android phone (Robert, 2026-10-10, "runs really well"); the phone model and the device checklist results are not yet reported. All automated browser tests use desktop Chromium emulating touch.
- Real GPU performance, memory use, battery drain, thermal throttling. The test browser has no GPU, so frame rate cannot be judged here.
- How the physics feels (speed, friction, break spread) to real players.
- Real app backgrounding (home button, incoming call, screen lock) inside the Capacitor wrapper.
- Kiswahili wording reviewed by a native speaker.
- Sound as heard on a phone: quality, balance and behaviour in the Android WebView (U11).

## Manual device checklist (run on each release candidate)
Target: at least one low-end Android phone (2-3 GB RAM). Record device, Android version and result in the results log.
1. Install, open with no internet. Game reaches its first screen; note load time.
2. Language defaults to Kiswahili; switch to English, close the app fully, reopen: English kept.
3. Press home mid-game, wait 1 minute, return: game resumes, nothing lost. Then press home, swipe the app away from recent apps, reopen: Continue on the menu brings the game back.
4. Lock screen and unlock; take an incoming call: same as 3.
5. Rotate to portrait: rotate prompt shows; back to landscape: prompt clears.
6. Play 10 minutes: no stutter worth noting, phone not hot, no crash. Note the frame rate during a full-power break.
6a. Pool: aim with one finger, pull power with another; aim lands where the finger is; a pull-and-swipe-down of the notification shade does not shoot.
6d. Pool: sound. The first shot after opening is heard; harder shots are louder; Sound off in Settings silences it; the phone's own volume and silent mode behave as expected; press home mid-shot, no sound continues; a phone call stops it.
6e. Android app (Milestone 7): the icon and name on the home screen; the splash at start; the game fills the screen with no status or navigation bar (a swipe from the edge shows them briefly); it stays landscape when the phone turns; the back button closes panels, goes from the table to the menu, and on the menu sends the app away; reopening from recent apps returns to the same screen.
6f. Android app (0.10.1): Exit on the menu closes the game; during a game it asks first, and after opening the app again "Endelea na mchezo" brings the game back.
6f. First install: the "how to play" panel appears on the first game only.
6c. Pool: set spin with a thumb (top, back, each side) and check the dot is easy to place and returns to the centre after the shot; turn the aim with the fine-aim strip onto a thin cut and check it is precise enough without being slow.
6b. Pool: play a full two-player game to the black; check every foul message reads correctly in Kiswahili; ball in hand drag is easy with a thumb; all text is readable without squinting.
7. Turn on airplane mode mid-session: nothing changes.
8. Clear app data, reopen: starts fresh without errors.
