# Testing

Nothing is called working unless a test below (automated or manual) has shown it. Results that could not be verified are listed as such.

## Automated

### Unit tests (`npm test`): 177 tests

#### Core, `packages/core/test` (42)
| Area | What is covered |
|---|---|
| Saves | Round trip; missing data; not-JSON, missing envelope, `null`, invalid payload, wrong type; newer version; step-by-step migration; missing migration step; throwing migration; failed write reported, not thrown; storage that throws or cannot be obtained; an unreadable value is copied to `<key>.backup`, a missing or good one is not. |
| Language | Kiswahili default; switching; placeholders; English then key fallback; unsupported locale ignored; missing-key finder. |
| Fixed step | Whole steps and remainder; same total steps at 30/60/144 fps; cap and drop after a long stall; negative/NaN frame times; reset; invalid config rejected. |
| Lifecycle | Pause/resume once each; starts paused when opened hidden; throwing listener isolated; dispose removes listeners. |
| Settings | Kiswahili default; per-game key; five invalid shapes rejected. |
| Random | Same seed repeats, another seed differs; values in [0, 1); normal() mean about 0 and spread about 1; non-finite seed rejected. |

#### Pool, `packages/pool/test` (135)
| Area | What is covered |
|---|---|
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
| Source rules | No Phaser, DOM, trigonometry, pow/exp/log, `Math.random` or clock calls in `src/physics`, `src/rules` and `src/ai`. |

### Browser tests (`npm run test:e2e`): 42 scenarios x 3 screen sizes = 126 runs
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

#### Spin and fine aim (3 scenarios, `controls.spec.ts`)
| Scenario | Checks |
|---|---|
| Spin | Dragging the dot to the top and bottom sets topspin and backspin, and the shot is played with it; the dot is back at the centre as soon as the shot is played and ignores touches while balls roll. On the same pot, topspin makes the cue ball follow the red into the pocket (foul) and backspin brings it back past where it started. |
| Fine aim | 200 design pixels turn the aim clockwise by 190 to 210 times the per-pixel angle; dragging back returns it; a cancelled touch never shoots and the strip still works after it. |
| Computer's turn | Spin and fine aim drags change nothing while the computer thinks, and it plays a centre-ball shot. |

#### Menu and saving (8 scenarios, `menu.spec.ts`)
| Scenario | Checks |
|---|---|
| Menu first | The game opens on the menu in Kiswahili with Play, Stats, Rules, Settings and the placeholder label, and no Continue; Rules opens with the rules text and Back closes it; Back on the picker returns to the menu without starting a game. |
| Menu and Continue | After a break, Menu then Continue brings back the same balls, match and opponent; after reopening the page the same again. |
| Closed mid-shot | Reopening while balls roll, then Continue, gives the table, match and shot count from just before that shot. |
| Finished game | Winning on the black against Easy removes the saved game; the menu shows no Continue; Stats reads "Kompyuta (Rahisi): umeshinda 1 kati ya 1" and zero for the others; the picker marks Easy. |
| Language | Settings, English: the menu redraws in English with Settings still open and English marked; kept after reopening; the table is in English too. |
| Damaged save | A broken saved game and unreadable stats in storage: the menu opens with no Continue, the stats show zero, both values are in `.backup` keys, a new game saves over them, no errors. |
| Menu after a language change | Change to English, play, tap Menu: the main menu opens with no panel (failed before the fix). |
| Computer resumes | A game saved on the computer's turn: after reopening and Continue, the computer plays its shot by itself. |

All pool scenarios start from the menu: Play, then the opponent, with real taps.

### Strength ladder (`npm run ai:ladder -w @tzg/pool`, not part of `npm test`)
Each level plays the level below it over 40 games (set `AI_LADDER_GAMES`), breaking alternately, with fixed seeds. Passes if every game finishes and the stronger level wins more than half. Takes several minutes.

### Release build check
`npm run build -w @tzg/shell` and `npm run build -w @tzg/pool`, then confirm `__tzg` (and, for pool, `testLayout` and `continueShown`) do not appear in `dist/assets/*.js`.

## Results log

| Date | Milestone | Typecheck | Unit | Browser | Notes |
|---|---|---|---|---|---|
| 2026-10-07 | 0 | pass | 38/38 | 33/33 | fps at 6x CPU throttle: 28.5 to 32.0 across runs (headless Chromium, software rendering in a cloud container, not a phone). Release build has no test hooks. First browser run failed 3/30: frames kept running in the background (fixed, see ARCHITECTURE A7). |
| 2026-10-07 | 2 | pass | 112/112 | shell 33/33, pool 39/39 | All new tests passed on the first full run. Layout reviewed on 640x360 screenshots: text sizes raised so nothing renders under 10 CSS px on a 360-px-tall phone; status line overlapped a player panel at first (fixed); the aim guide ran off the table through a pocket (fixed: it now stops at pockets). |
| 2026-10-07 | 2.1 | pass | 113/113 | pool 42/42 | Potted-ball trays. Checked on a 640x360 screenshot: the trays fit between the player names and the top rail. |
| 2026-10-08 | 3 | pass | 136/136 (+2 ladder tests skipped) | shell 33/33, pool 57/57 | Ladder, 40 games each: Medium beat Easy 32/40, Hard beat Medium 36/40, every game finished (average 39 and 21 shots). Fouls per shot: Easy 14%, Medium 9 to 10%, Hard 4% (9% before the robustness check was added). Hard's longest decision: 213 824 physics steps. 6x throttle: frames while Hard thinks cost 1 to 9 ms more than frames while the player aims (12 to 25 ms, software renderer). Found and fixed: Phaser's frame delta undercounts on slow frames, so the thinking time limit now uses the clock (capped per frame for backgrounding); the controls hint showed during the computer's turn (now hidden); a slow background test hit the 30 s limit with more tests running alongside (limit raised for that test). |
| 2026-10-08 | 5 | pass | 177/177 (+2 ladder tests skipped) | pool 90/90 (shell unchanged) | A planted bug that ignored the spin setting was caught by the spin browser test. The first follow-and-draw check failed for real reasons: on a 0.4 m straight shot backspin wears off before contact and follow carries the cue ball to the far cushion and back, so the test now uses a short pot into a pocket. Chrome logs a notice for a cancelled touch it cannot stop; the fine-aim test ignores that one message. Screenshot at 640x360 checked: spin face, shorter power bar, hint and strip all fit. |
| 2026-10-08 | 4 | pass | 166/166 (+2 ladder tests skipped) | shell 33/33, pool 78/78 | All new browser tests passed on their first run, so two bugs were planted to check them: saving the moving table mid-shot and keeping the save after a finished game. The tests caught both. Screenshots at 640x360 and 915x412: the menu showed through the Stats, Rules and Settings panels and made them hard to read (those panels are now opaque). The pool suite took 3.6 minutes. Release build has no test hooks. |
| 2026-10-07 | 1 | pass | 76/76 | 63/63 | Break at 6x CPU throttle: 0.8 to 1.0 ms average CPU per frame (max 4.4 ms). Shell idle at 6x: 2.2 to 2.4 ms. Frame rate in the test browser is 16 to 20 fps during a 6x-throttled break and 26 fps idle unthrottled, limited by the software renderer's fill rate (a full-table rectangle alone halves it), so it says nothing about phones; see KNOWN_ISSUES U2. Found and fixed: a system touch cancel on the power bar fired a shot (test failed before the fix, passes after). |

## Not yet verified (needs a real device)
- Any Android phone or Android WebView. All browser tests use desktop Chromium emulating touch.
- Real GPU performance, memory use, battery drain, thermal throttling. The test browser has no GPU, so frame rate cannot be judged here.
- How the physics feels (speed, friction, break spread) to real players.
- Real app backgrounding (home button, incoming call, screen lock) inside the Capacitor wrapper.
- Kiswahili wording reviewed by a native speaker.

## Manual device checklist (run on each release candidate)
Target: at least one low-end Android phone (2-3 GB RAM). Record device, Android version and result in the results log.
1. Install, open with no internet. Game reaches its first screen; note load time.
2. Language defaults to Kiswahili; switch to English, close the app fully, reopen: English kept.
3. Press home mid-game, wait 1 minute, return: game resumes, nothing lost. Then press home, swipe the app away from recent apps, reopen: Continue on the menu brings the game back.
4. Lock screen and unlock; take an incoming call: same as 3.
5. Rotate to portrait: rotate prompt shows; back to landscape: prompt clears.
6. Play 10 minutes: no stutter worth noting, phone not hot, no crash. Note the frame rate during a full-power break.
6a. Pool: aim with one finger, pull power with another; aim lands where the finger is; a pull-and-swipe-down of the notification shade does not shoot.
6c. Pool: set spin with a thumb (top, back, each side) and check the dot is easy to place and returns to the centre after the shot; turn the aim with the fine-aim strip onto a thin cut and check it is precise enough without being slow.
6b. Pool: play a full two-player game to the black; check every foul message reads correctly in Kiswahili; ball in hand drag is easy with a thumb; all text is readable without squinting.
7. Turn on airplane mode mid-session: nothing changes.
8. Clear app data, reopen: starts fresh without errors.
