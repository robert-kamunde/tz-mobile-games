# Development

## Requirements
- Node 22 or newer (developed on 22.22.0).
- For browser tests: Chromium. In the cloud dev environment it is preinstalled at `/opt/pw-browsers`; locally run `npx playwright install chromium` once.

## Commands (from the repository root)

| Command | What it does |
|---|---|
| `npm install` | Install all workspaces. |
| `npm run typecheck` | `tsc -b` over core, shell and the test/config project. |
| `npm test` | Unit tests (Vitest), `packages/*/test/**/*.test.ts`. |
| `npm run test:e2e` | Builds the shell demo and the pool game in e2e mode and runs their Playwright browser tests on three phone/tablet sizes. Takes about 3 minutes, mostly waiting for shots to settle in real time. |
| `npm run check` | All of the above. Run before every commit. |
| `npm run dev:pool` | Dev server for the pool game (open the printed URL on a phone on the same Wi-Fi to try it). |
| `npm run dev:shell` | Dev server for the shell demo. |
| `npm run build -w @tzg/shell` | Release build of the shell demo into `packages/shell/dist`. |

## Pinned versions
TypeScript 7.0.2, Phaser 4.2.1, Vite 8.3.3, Vitest 5.0.3, @playwright/test 1.56.1, @types/node 22.20.5. Versions are exact (no `^`). Playwright is pinned to match the Chromium build available in the dev environment; upgrading it needs a matching browser.

## Conventions
- Gameplay rules and physics: plain TypeScript in the game package, unit-tested, no Phaser imports. In `src/physics` use only `+ - * /` and `Math.sqrt` (see ARCHITECTURE A11); the purity test fails otherwise.
- Browser tests read game state through `registerTestProbe` (e2e builds only) and drive the game with real touch events (`tooling/e2eHelpers.ts`).
- Tuning values (sizes, speeds, timings, colours) go in config objects, not inline numbers.
- Every user-visible string goes through the translator and needs both `sw` and `en` entries.
- Scenes get shared services through `getServices(this)`.
- Placeholders are labelled `PLACEHOLDER` on screen and listed in `docs/ASSETS.md`.
- Each milestone updates `docs/PROJECT_STATUS.md`, `docs/CHANGELOG.md` and `docs/KNOWN_ISSUES.md`.

## Shared project folder
The project chat's shared folder holds a copy of the source at `games/` (no `node_modules` or build output) so it can be read without GitHub. GitHub (`robert-kamunde/tz-mobile-games`) is the source of truth.
