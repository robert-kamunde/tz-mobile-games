# Release

Status: no release yet. The Android project exists (Milestone 7) but has never been built: the Android SDK cannot be downloaded in the cloud development environment (B1). The steps below are written for Robert's computer and have not been run.

## What is ready
- Android project (Capacitor 8.5) in `packages/pool/android`.
  - App ID `com.fardatasolutions.bongopooltable`.
  - Landscape only, full screen, minimum Android 7.0 (API 24), target API 36.
- Version: taken from `packages/pool/package.json` (`0.8.0` gives versionName "0.8.0", versionCode 800). Bump it there for every upload; Play refuses a versionCode it has seen.
- Back button, offline play, placeholder icon and splash screen, store listing and privacy policy drafts (`STORE_LISTING.md`, `PRIVACY_POLICY.md`).

## First debug build on a phone (Robert's computer)
1. Install Node 22, Git and Android Studio (it installs the Android SDK and Java).
2. Get the code and install:
   ```
   git clone https://github.com/robert-kamunde/tz-mobile-games.git
   cd tz-mobile-games
   npm install
   ```
3. Build the game and copy it into the Android project: `npm run android:sync -w @tzg/pool`
4. Open it in Android Studio: `npm run android:open -w @tzg/pool` (or open the folder `packages/pool/android`). Let Gradle finish syncing.
5. On the phone: Settings > About phone > tap "Build number" 7 times, then Developer options > USB debugging on. Connect by USB and allow the computer.
6. In Android Studio pick the phone and press Run. The app installs as "Bongo Pool Table".
7. Go through the manual device checklist in TESTING.md and send back what you see (phone model, Android version, anything odd).

After any code change: repeat step 3, then Run again.

## Release build (later, before the first Play upload)
1. **Upload key.** Create it once and keep it forever:
   ```
   keytool -genkeypair -v -keystore pool-upload.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000
   ```
   - Store the `.jks` file and its passwords in two safe places outside the repository (never commit them).
   - Use Play App Signing (the default), so Google holds the app signing key and a lost upload key can be reset through Play support.
2. In Android Studio: Build > Generate Signed App Bundle > Android App Bundle, with the upload key. The result is an `.aab` file.
3. Play Console:
   - create the app with the details in STORE_LISTING.md;
   - fill in the content rating, target audience and data safety forms;
   - upload the `.aab` to Internal testing.

## Blockers
- **B1:** the Android SDK cannot be downloaded here (`dl.google.com` returns 403, and so does Google's Maven repository through it). The Android project cannot be built or checked here.
  - Option 1: build on Robert's computer (above).
  - Option 2: allow `dl.google.com` in the environment's network settings.
- **Google Play developer account** (Robert): one-time fee; identity verification.
- **Before production:**
  - real art and sounds (ASSETS.md);
  - Kiswahili review (U3);
  - at least one low-end phone through the manual checklist;
  - a public privacy policy URL.

## Release checklist (per version)
- `npm run check` passes.
- Version bumped in `packages/pool/package.json`; CHANGELOG entry written.
- `npm run android:sync -w @tzg/pool`, then a signed bundle from Android Studio.
- Manual device checklist in TESTING.md passes on at least one low-end phone.
- KNOWN_ISSUES and PROJECT_STATUS updated.
- Release build contains no test hooks: `grep -c __tzg packages/pool/dist/assets/*.js` gives 0 for every file.
