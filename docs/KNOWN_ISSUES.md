# Known Issues

Last updated: 2026-10-09

## Blockers
| ID | Issue | Impact | Plan |
|---|---|---|---|
| B1 | Android SDK download blocked in the cloud dev environment (`dl.google.com` 403). | No APK can be built or tested on a phone from here. | Network allowlist change or a build on Robert's computer, before the first playable Pool build goes to a device. |

## Unverified
| ID | Item |
|---|---|
| U1 | Nothing has run on a real Android phone or Android WebView yet. |
| U2 | GPU performance is unknown. The test browser renders in software: pool runs at 26 fps idle there even unthrottled, because drawing one table-sized rectangle costs that renderer half a frame. CPU cost is measured and small (about 1 ms per frame during a break at 6x throttle). Needs a real low-end phone. |
| U4 | Table and pocket sizes are standard published UK 7 ft figures, not measured on a table in Tanzania. |
| U6 | Text sizes were chosen from screenshots (nothing under 10 CSS px on a 360-px-tall phone), not checked on a real phone. |
| U7 | Rule defaults beyond R1 (illegal break is a foul, both colours keep the table open) are Claude's choices from World Blackball, not confirmed against how Tanzanian bars play. |
| U5 | Physics values (friction, restitution) are starting points. The break currently spreads the rack modestly; feel needs tuning by playing on a phone. |
| U3 | Kiswahili strings not reviewed by a native speaker. This includes the Milestone 3 picker and computer wording ("Unacheza na nani?", "Kompyuta inacheza…", Rahisi/Wastani/Ngumu) and the Milestone 4 menu, stats and the Kiswahili rules text. |
| U8 | Computer levels are tuned only by computer-against-computer games (TESTING.md ladder), not against people. Whether Easy is easy enough for a beginner and Hard is a challenge for a good bar player is unknown. |
| U10 | Spin and fine aim have not been tried by a player. Whether the spin face is big enough for a thumb (88 design px, about 44 CSS px on a 360-px-tall phone), whether fine aim turns at a useful speed, and whether players find the strip without a label are unknown. Side spin only changes cushion rebounds; there is no swerve or squirt in the physics (U5). |
| U11 | Sound has not been heard. The tests check which sounds start and how loud, through a test hook, in a headless browser with no speakers. Whether the placeholder sounds are pleasant, whether the loudness balance is right, how sound behaves on a real Android WebView (first-touch unlock, phone calls, Bluetooth headsets, the phone's silent mode) and its CPU cost on a slow phone are unknown. The placeholders are synthesised and will sound artificial. |
| U9 | Computer thinking time on a phone is unknown. Hard spends up to about 210 000 physics steps on a decision (about 1 s of desktop CPU at full speed); at 6 ms of thinking per frame a slow phone may reach the 4 s limit, after which Hard plays the best shot found so far and is weaker. In the 6x-throttled test browser, frames while the player aims already cost 12 to 21 ms (software renderer); thinking added 1 to 9 ms on top. |

## Bugs
None open.

## Limits of the Milestone 4 save
| ID | Item |
|---|---|
| L1 | Closing the app mid-shot loses that shot: the game resumes from just before it (by design, A17). |
| L2 | The aim direction is not saved; a resumed game starts aimed straight up the table. |
| L3 | If the phone's storage is full or blocked (some private-browsing modes), nothing is saved and nothing is shown to the player; the game still plays. |

## Technical debt
| ID | Item | Why it matters | When |
|---|---|---|---|
| TD1 | JS bundle is about 1.38 MB (361 kB gzipped), almost all Phaser. | Slower first load on low-end phones. Loaded from the device inside the APK, so no download cost. | Measure load time on a real device; consider a custom Phaser build only if it is a problem. |
| TD2 | ~~A corrupt or newer-version save is replaced with defaults without a backup.~~ The unreadable value is now copied to `<key>.backup` (ARCHITECTURE A18). Only the last one is kept. | Resolved in Milestone 4. | n/a |
| TD3 | ~~The 6x CPU frame-rate test had a thin margin.~~ Replaced by a CPU-time-per-frame check with a wide margin (1 to 2.4 ms against an 8 ms limit). | Resolved in Milestone 1. | n/a |
| TD4 | ~~No spin control UI and no fine-aim control.~~ Both built in Milestone 5. | Resolved. | n/a |
| TD6 | ~~A match in progress is not saved.~~ Saved after every shot and on pause; Continue on the menu resumes it (ARCHITECTURE A17). | Resolved in Milestone 4. | n/a |
| TD7 | The 16:9 canvas leaves bars at the sides on 20:9 phones, so the table and text are smaller than they could be. | Readability on small phones. | Consider a wider layout during the art pass. |
| TD8 | The computer always plays player 2's side. (The picker now marks the last choice, done in Milestone 4.) | Small: the player always breaks the first game against the computer. | Revisit if players ask to let the computer break. |
| TD5 | Browser tests wait for shots and computer turns in real time, so the pool suite takes 4 to 10 minutes (9.5 in the Milestone 6 run, with 2 workers). | Slower feedback. | Acceptable for now; revisit if it grows. |
| TD9 | With top or back spin set, the guide hides the cue ball's path after contact instead of showing where it will go. | Players lose that hint exactly when it would help most. | Backlog: a spin-aware path, computed from the physics model. |
