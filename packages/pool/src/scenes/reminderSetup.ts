import type { Translator } from '@tzg/core';
import type { Reminder, Services } from '@tzg/shell';
import { computerWins } from '../progress/progress';
import { afterReturn, pickReminder, reminderTime, type ReminderPick } from '../progress/reminders';
import type { PoolSlots } from '../progress/slots';

let attached = false;

/**
 * Sets one play reminder each time the game goes to the background, and removes it when the game
 * comes back (once per game; the menu calls this as it starts).
 */
export function setUpReminders(services: Services, slots: PoolSlots): void {
  if (attached || !services.reminders.available) return;
  attached = true;
  const back = () => {
    slots.reminders.save(afterReturn(slots.reminders.load().data, new Date()));
    void services.reminders.replace(null);
  };
  back();
  services.lifecycle.on('resume', back);
  services.lifecycle.on('pause', () => {
    const prefs = slots.reminders.load().data;
    if (!prefs.on) return;
    const at = reminderTime(new Date(), prefs.lastShown);
    slots.reminders.save({ ...prefs, waiting: at.getTime() });
    void services.reminders.replace({ ...reminderText(services.translator, pick(slots)), at });
  });
}

function pick(slots: PoolSlots): ReminderPick {
  return pickReminder({
    played: { story: slots.story.load().data, wins: computerWins(slots.progress.load().data) },
    storyGame: slots.storyMatch.load().data,
    quickGame: slots.match.load().data,
  });
}

/** The reminder's words, in the game's language when it was left. */
export function reminderText(t: Translator, p: ReminderPick): Omit<Reminder, 'at'> {
  const title = t.t('reminder.title');
  switch (p.kind) {
    case 'storyGame':
      return { title, body: t.t('reminder.storyGame', { place: p.place, rival: p.rival }) };
    case 'nextStop':
      return { title, body: t.t('reminder.nextStop', { place: p.place, rival: p.rival }) };
    case 'unlock':
      return { title, body: t.t(`reminder.unlock.${p.look}`, { wins: p.wins, name: t.t(`${p.look}.${p.id}`) }) };
    case 'quickGame':
      return { title, body: t.t('reminder.quickGame') };
    case 'play':
      return { title, body: t.t('reminder.play') };
  }
}

/**
 * After the person's first win against the computer: asks once whether reminders may be shown
 * (Android 13 and later show the question). Asking at a happy moment, not at first start.
 */
export function askForRemindersOnce(services: Services, slots: PoolSlots): void {
  const prefs = slots.reminders.load().data;
  if (!services.reminders.available || prefs.asked || !prefs.on) return;
  slots.reminders.save({ ...prefs, asked: true });
  void services.reminders.ask();
}
