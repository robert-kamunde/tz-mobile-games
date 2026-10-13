import { LocalNotifications } from '@capacitor/local-notifications';
import type { Logger } from '@tzg/core';
import { isNativeApp } from './nativeApp';

/** One reminder the phone shows by itself later, even with the game closed and no internet. */
export interface Reminder {
  readonly title: string;
  readonly body: string;
  readonly at: Date;
}

/**
 * Play reminders as phone notifications (0.28.0). The game keeps at most one waiting: `replace`
 * drops the old one first. A web page cannot show them, so there `available` is false and nothing
 * happens.
 */
export interface Reminders {
  readonly available: boolean;
  /** Whether the player has allowed notifications. Never asks. */
  allowed(): Promise<boolean>;
  /** Asks the player (Android 13 and later show a dialog); true when allowed. */
  ask(): Promise<boolean>;
  /** Replaces the waiting reminder; null only removes it. Does nothing unless allowed, so it never asks. */
  replace(reminder: Reminder | null): Promise<void>;
}

/** The single reminder's id: replacing it never stacks a second one. */
const REMINDER_ID = 1;
/** White-only status-bar icon in the Android project (res/drawable); Android greys out a coloured one. */
const SMALL_ICON = 'ic_stat_bongo';

class NativeReminders implements Reminders {
  readonly available = true;

  constructor(private readonly logger: Logger) {}

  async allowed(): Promise<boolean> {
    try {
      return (await LocalNotifications.checkPermissions()).display === 'granted';
    } catch (e) {
      this.logger.warn('could not check notification permission', e);
      return false;
    }
  }

  async ask(): Promise<boolean> {
    try {
      return (await LocalNotifications.requestPermissions()).display === 'granted';
    } catch (e) {
      this.logger.warn('could not ask for notification permission', e);
      return false;
    }
  }

  async replace(reminder: Reminder | null): Promise<void> {
    try {
      await LocalNotifications.cancel({ notifications: [{ id: REMINDER_ID }] });
      // schedule() would ask for permission itself; a reminder set while leaving the game must not.
      if (!reminder || !(await this.allowed())) return;
      await LocalNotifications.schedule({
        notifications: [{ id: REMINDER_ID, title: reminder.title, body: reminder.body, schedule: { at: reminder.at }, smallIcon: SMALL_ICON }],
      });
    } catch (e) {
      this.logger.warn('could not set the reminder', e);
    }
  }
}

/**
 * For browser tests: remembers what would be shown, and lets a test answer the permission
 * question (`setAnswer`). Not used in a real build.
 */
export class TestReminders implements Reminders {
  readonly available = true;
  granted = false;
  answer = true;
  asks = 0;
  waiting: Reminder | null = null;

  allowed(): Promise<boolean> {
    return Promise.resolve(this.granted);
  }

  ask(): Promise<boolean> {
    this.asks++;
    this.granted = this.answer;
    return Promise.resolve(this.granted);
  }

  replace(reminder: Reminder | null): Promise<void> {
    this.waiting = reminder && this.granted ? reminder : null;
    return Promise.resolve();
  }
}

const NO_REMINDERS: Reminders = {
  available: false,
  allowed: () => Promise.resolve(false),
  ask: () => Promise.resolve(false),
  replace: () => Promise.resolve(),
};

export function createReminders(logger: Logger, testMode: boolean): Reminders {
  if (isNativeApp()) return new NativeReminders(logger);
  return testMode ? new TestReminders() : NO_REMINDERS;
}
