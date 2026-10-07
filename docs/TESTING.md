# Testing

Nothing is called working unless a test below (automated or manual) has shown it. Results that could not be verified are listed as such.

## Automated

### Unit tests (`npm test`): 113 tests

#### Core, `packages/core/test` (38)
| Area | What is covered |
|---|---|
| Saves | Round trip; missing data; not-JSON, missing envelope, `null`, invalid payload, wrong type; newer version; step-by-step migration; missing migration step; throwing migration; failed write reported, not thrown; storage that throws or cannot be obtained. |
| Language | Kiswahili default; switching; placeholders; English then key fallback; unsupported locale ignored; missing-key finder. |
| Fixed step | Whole steps and remainder; same total steps at 30/60/144 fps; cap and drop after a long stall; negative/NaN frame times; reset; invalid config rejected. |
| Lifecycle | Pause/resume once each; starts paused when opened hidden; throwing listener isolated; dispose removes listeners. |
| Settings | Kiswahili default; per-game key; five invalid shapes rejected. |

#### Pool, `packages/pool/test` (74)
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
| Rules: break | Start state; pot on the break continues with open table; legal break without pot passes; illegal break is a foul; cue ball in on the break is a foul; black on the break re-racks with the same breaker. |
| Rules: open table | One colour claims it (either player); hitting one colour and potting the other claims the potted one; both colours keep it open; black first is a foul; fouls never assign groups; no pot passes; black on an open table loses. |
| Rules: groups | Own pot continues; opponent ball first is a foul with ball in hand anywhere; potting an opponent ball is a foul; miss, no cushion, cue ball in are fouls; ball in hand passes to the right player and clears after a clean shot. |
| Rules: black | Must hit the black first when on it; legal pot wins; with the cue ball or an opponent ball it loses; last own ball and black together loses; foul on the black is only a foul; no shots after the match ends. |
| Shot summary | First contact, cushion after contact, pots in order, break cushion count; cushion before contact ignored; empty shot; unknown ball id throws. |
| Rules + physics | A real full-power break is judged legal. |
| Source rules | No Phaser, DOM, trigonometry, pow/exp/log, random or clock calls in `src/physics` and `src/rules`. |

### Browser tests (`npm run test:e2e`): 25 scenarios x 3 screen sizes = 75 runs
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

#### Pool match (6 scenarios, `match.spec.ts`)
| Scenario | Checks |
|---|---|
| Break placement | Player 1 breaks; dragging the cue ball past the baulk line keeps it behind the line. |
| Foul and ball in hand | A break into a pocket without contact is a "no ball hit" foul; player 2 gets ball in hand; the cue ball is back on the table and can be dragged to a new spot; the status line shows the foul. |
| Blocked placement | The cue ball cannot be dropped onto another ball. |
| Winning | Set up on the black (test-only layout), aim and shoot by touch: the black drops, player 1 wins, the game-over panel shows, shooting is disabled, New game starts a match with player 2 breaking. |
| New game confirm | One tap mid-match changes nothing; a second tap restarts. |
| Potted-ball trays | No trays while the table is open; once colours are set, each player's tray shows 7 slots with their potted balls filled (checked with 1 and 3 potted). |

### Release build check
`npm run build -w @tzg/shell`, then confirm `__tzg` does not appear in `packages/shell/dist/assets/*.js`.

## Results log

| Date | Milestone | Typecheck | Unit | Browser | Notes |
|---|---|---|---|---|---|
| 2026-10-07 | 0 | pass | 38/38 | 33/33 | fps at 6x CPU throttle: 28.5 to 32.0 across runs (headless Chromium, software rendering in a cloud container, not a phone). Release build has no test hooks. First browser run failed 3/30: frames kept running in the background (fixed, see ARCHITECTURE A7). |
| 2026-10-07 | 2 | pass | 112/112 | shell 33/33, pool 39/39 | All new tests passed on the first full run. Layout reviewed on 640x360 screenshots: text sizes raised so nothing renders under 10 CSS px on a 360-px-tall phone; status line overlapped a player panel at first (fixed); the aim guide ran off the table through a pocket (fixed: it now stops at pockets). |
| 2026-10-07 | 2.1 | pass | 113/113 | pool 42/42 | Potted-ball trays. Checked on a 640x360 screenshot: the trays fit between the player names and the top rail. |
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
3. Press home mid-game, wait 1 minute, return: game resumes, nothing lost.
4. Lock screen and unlock; take an incoming call: same as 3.
5. Rotate to portrait: rotate prompt shows; back to landscape: prompt clears.
6. Play 10 minutes: no stutter worth noting, phone not hot, no crash. Note the frame rate during a full-power break.
6a. Pool: aim with one finger, pull power with another; aim lands where the finger is; a pull-and-swipe-down of the notification shade does not shoot.
6b. Pool: play a full two-player game to the black; check every foul message reads correctly in Kiswahili; ball in hand drag is easy with a thumb; all text is readable without squinting.
7. Turn on airplane mode mid-session: nothing changes.
8. Clear app data, reopen: starts fresh without errors.
