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
| U2 | Performance measured only in headless desktop Chromium with 6x CPU throttle (28.5 to 32 fps). Real low-end phone numbers unknown. |
| U3 | Kiswahili strings not reviewed by a native speaker. |

## Bugs
None open.

## Technical debt
| ID | Item | Why it matters | When |
|---|---|---|---|
| TD1 | JS bundle is about 1.38 MB (361 kB gzipped), almost all Phaser. | Slower first load on low-end phones. Loaded from the device inside the APK, so no download cost. | Measure load time on a real device; consider a custom Phaser build only if it is a problem. |
| TD2 | A corrupt or newer-version save is replaced with defaults on the next save, without keeping a backup copy. | Fine for settings. Not acceptable once player stats/progress are saved. | Milestone 1, before Pool stats are stored: keep the unreadable value under a backup key. |
| TD3 | The 6x CPU frame-rate test has a 25 fps threshold with about 3 to 7 fps of margin. | Could become flaky on a slower CI machine. | Revisit when CI is set up. |
