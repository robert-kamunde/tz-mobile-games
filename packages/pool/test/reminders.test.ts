import { describe, expect, it } from 'vitest';
import { REMINDERS } from '../src/config/reminders';
import { UK_7FT_TABLE } from '../src/config/table';
import { rackBalls } from '../src/physics/rack';
import { afterReturn, defaultReminderPrefs, pickReminder, reminderTime, validateReminderPrefs } from '../src/progress/reminders';
import type { SavedMatch } from '../src/progress/savedMatch';
import { defaultStory } from '../src/progress/story';
import { startMatch } from '../src/rules/blackball';

const HOUR = 3_600_000;
const game = (story?: { stop: string; fouls: number; shots: number }): SavedMatch =>
  ({
    opponent: { kind: 'computer', level: 'easy' },
    picks: ['fundi', 'mwamba'],
    match: startMatch(0),
    balls: rackBalls(UK_7FT_TABLE).map((b) => ({ id: b.id, x: b.x, y: b.y, pocketed: false })),
    shots: 0,
    ...(story ? { story } : {}),
  }) as SavedMatch;
const none = { played: { story: defaultStory(), wins: 0 }, storyGame: null, quickGame: null };

describe('play reminders', () => {
  it('shows at least a day after leaving, at the evening hour, never at night', () => {
    const left = new Date(2026, 9, 13, 22, 30);
    const at = reminderTime(left, null);
    expect(at.getHours()).toBe(REMINDERS.hour);
    expect(at.getMinutes()).toBe(0);
    expect(at.getTime() - left.getTime()).toBeGreaterThanOrEqual(REMINDERS.awayHours * HOUR);
    expect(at.getTime() - left.getTime()).toBeLessThan((REMINDERS.awayHours + 24) * HOUR);
    // Left in the morning: the evening of the next day.
    expect(reminderTime(new Date(2026, 9, 13, 9, 0), null)).toEqual(new Date(2026, 9, 14, 18, 0));
    // Left at exactly the hour: a day later, the same hour.
    expect(reminderTime(new Date(2026, 9, 13, 18, 0), null)).toEqual(new Date(2026, 9, 14, 18, 0));
  });

  it('keeps two days between reminders', () => {
    const shown = new Date(2026, 9, 14, 18, 0).getTime();
    expect(reminderTime(new Date(2026, 9, 14, 19, 0), shown)).toEqual(new Date(2026, 9, 16, 18, 0));
    expect(reminderTime(new Date(2026, 9, 20, 9, 0), shown)).toEqual(new Date(2026, 9, 21, 18, 0));
  });

  it('on return, counts a reminder whose time passed as shown, and drops one still waiting', () => {
    const at = new Date(2026, 9, 14, 18, 0).getTime();
    const waiting = { ...defaultReminderPrefs(), waiting: at };
    expect(afterReturn(waiting, new Date(2026, 9, 15, 8, 0))).toMatchObject({ waiting: null, lastShown: at });
    expect(afterReturn(waiting, new Date(2026, 9, 14, 8, 0))).toMatchObject({ waiting: null, lastShown: null });
    expect(afterReturn(defaultReminderPrefs(), new Date())).toEqual(defaultReminderPrefs());
  });

  it('picks the most useful reminder', () => {
    expect(pickReminder(none)).toEqual({ kind: 'play' });
    expect(pickReminder({ ...none, quickGame: game(), storyGame: game({ stop: 'kariakoo', fouls: 0, shots: 0 }) })).toEqual({ kind: 'storyGame', place: 'Kariakoo', rival: 'Mama Ntilie' });
    expect(pickReminder({ ...none, quickGame: game() })).toEqual({ kind: 'quickGame' });
    // Two wins, the Kitenge table opens at three.
    expect(pickReminder({ ...none, played: { story: defaultStory(), wins: 2 } })).toEqual({ kind: 'unlock', look: 'table', id: 'kitenge', wins: 1 });
    // Already earned at Kariakoo: not offered.
    const journey = { character: 'fundi', stars: { mtaani: 1, kariakoo: 1 } };
    expect(pickReminder({ ...none, played: { story: journey, wins: 2 } })).toEqual({ kind: 'nextStop', place: 'Manzese', rival: expect.any(String) as string });
    expect(pickReminder({ ...none, played: { story: { character: 'fundi', stars: {} }, wins: 0 } })).toMatchObject({ kind: 'nextStop', place: 'Mtaani' });
  });

  it('reads saved choices strictly', () => {
    expect(validateReminderPrefs(defaultReminderPrefs())).toEqual(defaultReminderPrefs());
    expect(validateReminderPrefs({ on: false, asked: true, lastShown: 5, waiting: null })).toEqual({ on: false, asked: true, lastShown: 5, waiting: null });
    expect(validateReminderPrefs({ on: 'yes', asked: true, lastShown: null, waiting: null })).toBeNull();
    expect(validateReminderPrefs({ on: true, asked: true, lastShown: -1, waiting: null })).toBeNull();
    expect(validateReminderPrefs(null)).toBeNull();
  });
});
