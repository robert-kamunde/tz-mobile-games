import { expect, test, type Page } from '@playwright/test';
import { bootTo, setHidden, trackErrors } from '../../../tooling/e2eHelpers';
import { MENU_SCENE, boot, menuState, pullPower, reopen, tap, waitUntilSettled } from './poolPage';

interface SoundReport {
  state: string;
  played: { name: string; gain: number }[];
}

const sound = (page: Page) => page.evaluate(() => window.__tzg!.sound() as SoundReport);
const played = async (page: Page) => (await sound(page)).played;

/** Plays one break at the given power and returns the sounds it started. */
async function breakAndListen(page: Page, power: number): Promise<SoundReport['played']> {
  const before = (await played(page)).length;
  await pullPower(page, power);
  await waitUntilSettled(page);
  return (await played(page)).slice(before);
}

test('a break plays the cue, ball and cushion sounds, and a harder shot strikes louder', async ({ page }) => {
  const errors = trackErrors(page);
  await boot(page);
  // The taps on the menu were the first touch, which unlocks sound.
  await expect.poll(async () => (await sound(page)).state).toBe('running');

  const hard = await breakAndListen(page, 1);
  const names = new Set(hard.map((s) => s.name));
  expect(hard[0]?.name).toBe('cue');
  expect(names.has('ball')).toBe(true);
  expect(names.has('cushion')).toBe(true);
  for (const s of hard) expect(s.gain).toBeGreaterThan(0);
  for (const s of hard) expect(s.gain).toBeLessThanOrEqual(1);

  // The next player's soft shot: a quieter cue strike.
  const soft = await breakAndListen(page, 0.2);
  expect(soft[0]?.name).toBe('cue');
  expect(soft[0]!.gain).toBeLessThan(hard[0]!.gain);
  expect(errors).toEqual([]);
});

test('Sound off in Settings plays nothing, and stays off after reopening', async ({ page }) => {
  const errors = trackErrors(page);
  await bootTo(page, MENU_SCENE);
  await tap(page, 'menu-settings', MENU_SCENE);
  await expect.poll(async () => (await menuState(page)).panel).toBe('settings');
  await tap(page, 'sound-off', MENU_SCENE);
  await expect.poll(() => page.evaluate(() => window.__tzg!.dataOf('Menu', 'sound-off', 'highlighted'))).toBe(true);
  expect((await menuState(page)).panel).toBe('settings');

  await reopen(page);
  await tap(page, 'menu-settings', MENU_SCENE);
  await expect.poll(() => page.evaluate(() => window.__tzg!.dataOf('Menu', 'sound-off', 'highlighted'))).toBe(true);
  await tap(page, 'settings-back', MENU_SCENE);
  await tap(page, 'menu-play', MENU_SCENE);
  await tap(page, 'opponent-two', MENU_SCENE);
  await page.waitForFunction(() => window.__tzg!.activeScenes()[0] === 'Table');
  await expect.poll(async () => (await sound(page)).state).toBe('running');
  expect(await breakAndListen(page, 1)).toEqual([]);

  // Turning it back on brings the sounds back.
  await tap(page, 'menuButton');
  await tap(page, 'menu-settings', MENU_SCENE);
  await tap(page, 'sound-on', MENU_SCENE);
  await expect.poll(() => page.evaluate(() => window.__tzg!.dataOf('Menu', 'sound-on', 'highlighted'))).toBe(true);
  await tap(page, 'settings-back', MENU_SCENE);
  await tap(page, 'menu-continue', MENU_SCENE);
  await page.waitForFunction(() => window.__tzg!.activeScenes()[0] === 'Table');
  expect((await breakAndListen(page, 1)).length).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test('sound stops in the background and comes back when the game returns', async ({ page }) => {
  const errors = trackErrors(page);
  await boot(page);
  await expect.poll(async () => (await sound(page)).state).toBe('running');
  await setHidden(page, true);
  await expect.poll(async () => (await sound(page)).state).toBe('suspended');
  await setHidden(page, false);
  await expect.poll(async () => (await sound(page)).state).toBe('running');
  expect((await breakAndListen(page, 1)).length).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test('a phone without Web Audio plays the game silently with no errors', async ({ page }) => {
  await page.addInitScript(() => {
    // @ts-expect-error simulating a WebView with no Web Audio
    delete window.AudioContext;
  });
  const errors = trackErrors(page);
  await boot(page);
  expect((await sound(page)).state).toBe('unavailable');
  expect(await breakAndListen(page, 1)).toEqual([]);
  expect(errors).toEqual([]);
});

test('if the phone refuses to start sound, the game still plays silently', async ({ page }) => {
  await page.addInitScript(() => {
    AudioContext.prototype.resume = () => Promise.reject(new Error('blocked by the browser'));
  });
  const errors = trackErrors(page);
  await boot(page);
  const s = await breakAndListen(page, 1);
  expect((await sound(page)).state).toBe('suspended');
  expect(s).toEqual([]);
  expect((await waitUntilSettled(page)).shots).toBe(1);
  expect(errors).toEqual([]);
});
