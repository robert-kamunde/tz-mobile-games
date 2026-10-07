# Testing

Nothing is called working unless a test below (automated or manual) has shown it. Results that could not be verified are listed as such.

## Automated

### Unit tests (`npm test`): 38 tests, `packages/core/test`
| Area | What is covered |
|---|---|
| Saves | Round trip; missing data; not-JSON, missing envelope, `null`, invalid payload, wrong type; newer version; step-by-step migration; missing migration step; throwing migration; failed write reported, not thrown; storage that throws or cannot be obtained. |
| Language | Kiswahili default; switching; placeholders; English then key fallback; unsupported locale ignored; missing-key finder. |
| Fixed step | Whole steps and remainder; same total steps at 30/60/144 fps; cap and drop after a long stall; negative/NaN frame times; reset; invalid config rejected. |
| Lifecycle | Pause/resume once each; starts paused when opened hidden; throwing listener isolated; dispose removes listeners. |
| Settings | Kiswahili default; per-game key; five invalid shapes rejected. |

### Browser tests (`npm run test:e2e`): 11 scenarios x 3 screen sizes = 33 runs
Runs a production-like build (`--mode e2e`) in Chromium with touch and mobile emulation at 640x360 (small phone), 915x412 (tall phone) and 1280x800 (tablet).

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
| Slow CPU | 6x CPU throttle keeps more than 25 fps (logged; see results). |

### Release build check
`npm run build -w @tzg/shell`, then confirm `__tzg` does not appear in `packages/shell/dist/assets/*.js`.

## Results log

| Date | Milestone | Typecheck | Unit | Browser | Notes |
|---|---|---|---|---|---|
| 2026-10-07 | 0 | pass | 38/38 | 33/33 | fps at 6x CPU throttle: 28.5 to 32.0 across runs (headless Chromium, software rendering in a cloud container, not a phone). Release build has no test hooks. First browser run failed 3/30: frames kept running in the background (fixed, see ARCHITECTURE A7). |

## Not yet verified (needs a real device)
- Any Android phone or Android WebView. All browser tests use desktop Chromium emulating touch.
- Real GPU performance, memory use, battery drain, thermal throttling.
- Real app backgrounding (home button, incoming call, screen lock) inside the Capacitor wrapper.
- Kiswahili wording reviewed by a native speaker.

## Manual device checklist (run on each release candidate)
Target: at least one low-end Android phone (2-3 GB RAM). Record device, Android version and result in the results log.
1. Install, open with no internet. Game reaches its first screen; note load time.
2. Language defaults to Kiswahili; switch to English, close the app fully, reopen: English kept.
3. Press home mid-game, wait 1 minute, return: game resumes, nothing lost.
4. Lock screen and unlock; take an incoming call: same as 3.
5. Rotate to portrait: rotate prompt shows; back to landscape: prompt clears.
6. Play 10 minutes: no stutter worth noting, phone not hot, no crash.
7. Turn on airplane mode mid-session: nothing changes.
8. Clear app data, reopen: starts fresh without errors.
