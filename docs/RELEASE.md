# Release

Status: no release yet. Nothing in this file has been carried out.

## Plan: Android via Capacitor
1. Add Capacitor 8 to the game package; `webDir` is the game's Vite `dist`.
2. `npx cap add android`, then build a debug APK for device testing.
3. App id (to be decided with Robert before the first build; it can never change after publishing), name, icon, splash.
4. Release build: signed Android App Bundle (AAB). The signing key must be backed up outside this project; losing it means the app can never be updated.
5. Google Play: developer account (Robert), store listing in Kiswahili and English, content rating, data safety form (no data collected at first launch), internal testing track before production.

## Blockers
- **Android SDK cannot be downloaded in the cloud dev environment** (`dl.google.com` returns 403). APKs cannot be built here yet. Options: allow that host in the environment's network settings, or build on Robert's computer. Decide when Pool reaches a playable build.
- Google Play developer account (needs Robert).

## Release checklist (per version)
- `npm run check` passes.
- Manual device checklist in TESTING.md passes on at least one low-end phone.
- CHANGELOG, KNOWN_ISSUES, PROJECT_STATUS updated; version number bumped.
- Release build contains no test hooks or debug logging.
