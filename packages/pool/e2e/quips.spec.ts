import { expect, test } from '@playwright/test';
import { bootTo, trackErrors } from '../../../tooling/e2eHelpers';
import { QUIPS } from '../src/config/quips';
import { MENU_SCENE, boot, elementCenter, menuState, playFromMenu, potTheBlack, setUpBlackPot, state, tap, waitUntilSettled } from './poolPage';

test('the winner says their catchphrase in a bubble by their name, and it goes after a moment', async ({ page }) => {
  const errors = trackErrors(page);
  await boot(page);
  expect((await state(page)).quip).toBeNull();
  await setUpBlackPot(page);
  await potTheBlack(page);
  const over = await waitUntilSettled(page);
  expect(over.verdict).toMatchObject({ kind: 'game-over', winner: 0 });
  expect(over.quip).toEqual({ speaker: 0, text: 'Kazi imekamilika!' });
  // Under player 1's panel, on screen.
  const bubble = await elementCenter(page, 'quipText');
  const name = await elementCenter(page, 'player-0');
  const view = page.viewportSize()!;
  expect(bubble.y).toBeGreaterThan(name.y);
  expect(bubble.x).toBeGreaterThan(0);
  expect(bubble.x).toBeLessThan(view.width / 2);
  await expect.poll(async () => (await state(page)).quip, { timeout: QUIPS.showMs + 3000 }).toBeNull();
  expect(errors).toEqual([]);
});

test('in English the catchphrase is in English', async ({ page }) => {
  const errors = trackErrors(page);
  await bootTo(page, MENU_SCENE);
  await tap(page, 'menu-settings', MENU_SCENE);
  await tap(page, 'language-en', MENU_SCENE);
  await expect.poll(async () => (await menuState(page)).locale).toBe('en');
  await tap(page, 'settings-back', MENU_SCENE);
  await playFromMenu(page, 'two', ['shangazi']);
  await setUpBlackPot(page);
  await potTheBlack(page);
  const over = await waitUntilSettled(page);
  expect(over.quip).toEqual({ speaker: 0, text: 'Auntie wins, sit down!' });
  expect(errors).toEqual([]);
});
