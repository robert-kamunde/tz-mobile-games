import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Android app settings. `appId` identifies the app on Google Play and can never change after the
 * first upload (RELEASE.md). The web game is built into `dist` and copied into the Android project
 * by `npm run android:sync`.
 */
const config: CapacitorConfig = {
  appId: 'com.fardatasolutions.bongopooltable',
  appName: 'Bongo Pool Table',
  webDir: 'dist',
  // Shown while the game loads, instead of a white flash. Same colour as the game (src/config/layout.ts).
  backgroundColor: '#101418',
  android: {
    // The game makes no network requests (offline test); mixed content and remote debugging stay off.
    allowMixedContent: false,
    webContentsDebuggingEnabled: false,
  },
};

export default config;
