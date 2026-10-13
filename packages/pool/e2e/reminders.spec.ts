import { expect, test, type Page } from '@playwright/test';
import { bootTo, setHidden, trackErrors } from '../../../tooling/e2eHelpers';
import { REMINDERS } from '../src/config/reminders';
import { MENU_SCENE, menuState, playFromMenu, potTheBlack, pullPower, setUpBlackPot, state, tap, waitForScene, waitUntilSettled } from './poolPage';

const reminders = (page: Page) => page.evaluate(() => window.__tzg!.reminders());
const answer = (page: Page, allow: boolean) => page.evaluate((a) => window.__tzg!.answerReminders(a), allow);
const HOUR = 3_600_000;

/** Against the easy computer: a win with the black, then back to the menu. */
async function winAgainstComputer(page: Page): Promise<void> {
  await playFromMenu(page, 'easy');
  await setUpBlackPot(page);
  await potTheBlack(page);
  expect((await waitUntilSettled(page)).gameOverShown).toBe(true);
  await tap(page, 'gameOver-menu');
  await waitForScene(page, MENU_SCENE);
}

/** The game goes to the background and comes back; what was waiting meanwhile. */
async function leaveAndReturn(page: Page) {
  const before = Date.now();
  await setHidden(page, true);
  await expect.poll(async () => (await reminders(page)).waiting !== null).toBe(true);
  const waiting = (await reminders(page)).waiting!;
  await setHidden(page, false);
  await expect.poll(async () => (await reminders(page)).waiting).toBeNull();
  return { waiting, before };
}

test('nothing is asked at first; the first win asks once, then leaving sets one evening reminder and coming back removes it', async ({ page }) => {
  const errors = trackErrors(page);
  await bootTo(page, MENU_SCENE);
  expect(await reminders(page)).toEqual({ allowed: false, asks: 0, waiting: null });
  // Not allowed yet: leaving sets nothing.
  await setHidden(page, true);
  await page.waitForTimeout(200);
  expect((await reminders(page)).waiting).toBeNull();
  await setHidden(page, false);

  await winAgainstComputer(page);
  await expect.poll(async () => (await reminders(page)).asks).toBe(1);
  expect((await reminders(page)).allowed).toBe(true);

  const { waiting, before } = await leaveAndReturn(page);
  expect(waiting.title).toBe('Bongo Pool Table');
  expect(waiting.body).toBe('Meza iko tayari. Njoo ucheze!');
  expect(new Date(waiting.at).getHours()).toBe(REMINDERS.hour);
  expect(waiting.at - before).toBeGreaterThanOrEqual(REMINDERS.awayHours * HOUR);

  // A second win does not ask again.
  await winAgainstComputer(page);
  await page.waitForTimeout(300);
  expect((await reminders(page)).asks).toBe(1);
  expect(errors).toEqual([]);
});

test('an unfinished game is what the reminder is about', async ({ page }) => {
  const errors = trackErrors(page);
  await bootTo(page, MENU_SCENE);
  await winAgainstComputer(page);
  await playFromMenu(page, 'two');
  await pullPower(page, 0.3);
  await waitUntilSettled(page);
  const { waiting } = await leaveAndReturn(page);
  expect(waiting.body).toBe('Mchezo wako bado haujaisha. Njoo uumalize!');
  expect((await state(page)).gameOverShown).toBe(false);
  expect(errors).toEqual([]);
});

test('a player who says no gets no reminders; Vikumbusho in Settings turns them off and on again', async ({ page }) => {
  const errors = trackErrors(page);
  await bootTo(page, MENU_SCENE);
  await answer(page, false);
  await winAgainstComputer(page);
  await expect.poll(async () => (await reminders(page)).asks).toBe(1);
  await setHidden(page, true);
  await page.waitForTimeout(200);
  expect((await reminders(page)).waiting).toBeNull();
  await setHidden(page, false);

  await tap(page, 'menu-settings', MENU_SCENE);
  await expect.poll(async () => (await menuState(page)).panel).toBe('settings');
  expect(await page.evaluate(() => window.__tzg!.elementCenter('Menu', 'reminders-on'))).not.toBeNull();
  await tap(page, 'reminders-off', MENU_SCENE);
  await expect.poll(async () => page.evaluate(() => (JSON.parse(window.localStorage.getItem('pool.reminders')!) as { data: { on: boolean } }).data.on)).toBe(false);
  // Turning them on again asks once more, as the phone has not allowed them.
  await answer(page, true);
  await tap(page, 'reminders-on', MENU_SCENE);
  await expect.poll(async () => (await reminders(page)).asks).toBe(2);
  expect((await reminders(page)).allowed).toBe(true);
  // Off: leaving sets nothing even when allowed.
  await tap(page, 'reminders-off', MENU_SCENE);
  await expect.poll(async () => page.evaluate(() => (JSON.parse(window.localStorage.getItem('pool.reminders')!) as { data: { on: boolean } }).data.on)).toBe(false);
  await setHidden(page, true);
  await page.waitForTimeout(200);
  expect((await reminders(page)).waiting).toBeNull();
  expect(errors).toEqual([]);
});
