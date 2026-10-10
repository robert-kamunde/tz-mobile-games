import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import type { BackButton, Logger } from '@tzg/core';

/** True inside the Android app; false in a browser (and in tests). */
export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Inside the Android app, routes the system back button to the game's `BackButton` (registering a
 * listener also turns off Capacitor's default, which would close the app from any screen).
 * In a browser this does nothing: the page has no back button of its own to route.
 */
export function routeNativeBackButton(back: BackButton, logger: Logger): void {
  if (!isNativeApp()) return;
  App.addListener('backButton', () => back.press()).catch((e: unknown) => logger.warn('could not listen for the back button', e));
}

/** Sends the app to the background, as back does on an app's first screen. Nothing in a browser. */
export function leaveApp(logger: Logger): void {
  if (!isNativeApp()) return;
  App.minimizeApp().catch((e: unknown) => logger.warn('could not leave the app', e));
}
