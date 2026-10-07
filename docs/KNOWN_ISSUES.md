# Known Issues

Last updated: 2026-10-07

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
| U7 | Rule defaults beyond R1 (illegal break is a foul, table open after the break, both colours keep the table open) are Claude's choices from World Blackball, not confirmed against how Tanzanian bars play. |
| U5 | Physics values (friction, restitution) are starting points. The break currently spreads the rack modestly; feel needs tuning by playing on a phone. |
| U3 | Kiswahili strings not reviewed by a native speaker. |

## Bugs
None open.

## Technical debt
| ID | Item | Why it matters | When |
|---|---|---|---|
| TD1 | JS bundle is about 1.38 MB (361 kB gzipped), almost all Phaser. | Slower first load on low-end phones. Loaded from the device inside the APK, so no download cost. | Measure load time on a real device; consider a custom Phaser build only if it is a problem. |
| TD2 | A corrupt or newer-version save is replaced with defaults on the next save, without keeping a backup copy. | Fine for settings. Not acceptable once player stats/progress are saved. | Milestone 1, before Pool stats are stored: keep the unreadable value under a backup key. |
| TD3 | ~~The 6x CPU frame-rate test had a thin margin.~~ Replaced by a CPU-time-per-frame check with a wide margin (1 to 2.4 ms against an 8 ms limit). | Resolved in Milestone 1. | n/a |
| TD4 | No spin control UI and no fine-aim control yet (the physics supports spin). | MVP needs both. | A later milestone (see PROJECT_STATUS). Ball in hand and rules were done in Milestone 2. |
| TD6 | A match in progress is not saved. If Android closes the app in the background, the match is lost. | Players lose games, which feels like a bug. | Save match state and ball positions on pause and restore on start; proposed for the menus/settings milestone. |
| TD7 | The 16:9 canvas leaves bars at the sides on 20:9 phones, so the table and text are smaller than they could be. | Readability on small phones. | Consider a wider layout during the art pass. |
| TD5 | Browser tests wait for shots to settle in real time, so the suite takes about 3 minutes. | Slower feedback. | Acceptable for now; revisit if it grows. |
