import { expect, test, type Page } from '@playwright/test';
import { bootTo, trackErrors } from '../../../tooling/e2eHelpers';
import { DESIGN, FINE_AIM, TABLE_LAYOUT } from '../src/config/layout';
import {
  MENU_SCENE,
  SCENE,
  aimAngle,
  dragFineAim,
  dragOnTable,
  dragSpin,
  layout,
  menuState,
  playFromMenu,
  pullPower,
  state,
  tap,
} from './poolPage';

type Box = { left: number; top: number; right: number; bottom: number };
const boundsOf = async (page: Page, name: string, scene = SCENE): Promise<Box> => {
  const b = await page.evaluate(([s, n]) => window.__tzg!.boundsOf(s, n), [scene, name] as const);
  expect(b, name).not.toBeNull();
  return b!;
};
const overlaps = (a: Box, b: Box) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;

async function chooseHand(page: Page, hand: 'left' | 'right', locale: 'sw' | 'en' = 'sw'): Promise<void> {
  await bootTo(page, MENU_SCENE);
  await tap(page, 'menu-settings', MENU_SCENE);
  if (locale === 'en') {
    await tap(page, 'language-en', MENU_SCENE);
    await expect.poll(async () => (await menuState(page)).locale).toBe('en');
  }
  await tap(page, `hand-${hand}`, MENU_SCENE);
  await expect.poll(async () => (await menuState(page)).hand).toBe(hand);
  expect(await page.evaluate(() => window.__tzg!.dataOf('Menu', 'hand-left', 'highlighted'))).toBe(hand === 'left');
  await tap(page, 'settings-back', MENU_SCENE);
}

/** Everything on the table screen sits on the screen, and the controls, buttons and table never overlap. */
async function expectClearLayout(page: Page): Promise<void> {
  const s = await state(page);
  const rail = TABLE_LAYOUT.railWidth;
  const playLeft = s.controls.tableLeft;
  const controls = [await boundsOf(page, 'spinControl'), await boundsOf(page, 'powerTrack'), await boundsOf(page, 'powerHandle')];
  const strip: Box = {
    left: s.controls.fineAim.x - FINE_AIM.width / 2,
    right: s.controls.fineAim.x + FINE_AIM.width / 2,
    top: s.controls.fineAim.y - FINE_AIM.height / 2,
    bottom: s.controls.fineAim.y + FINE_AIM.height / 2,
  };
  const buttons = [await boundsOf(page, 'menuButton'), await boundsOf(page, 'newGameButton')];
  // The rails, not the shadow margin, are what must stay clear (the controls column is beside the table).
  const rails = { left: playLeft - rail, right: s.controls.tableRight + rail };
  for (const c of controls) {
    expect(c.right <= rails.left || c.left >= rails.right, 'control over the table').toBe(true);
    expect(c.left).toBeGreaterThanOrEqual(0);
    expect(c.right).toBeLessThanOrEqual(DESIGN.width);
  }
  // The potted-ball tube: on screen, on the side away from the controls, clear of every control and button.
  const tube = await boundsOf(page, 'tube');
  expect(tube.left).toBeGreaterThanOrEqual(0);
  expect(tube.right).toBeLessThanOrEqual(DESIGN.width);
  const controlsLeft = Math.min(...controls.map((c) => c.left));
  expect(tube.right < controlsLeft || tube.left > Math.max(...controls.map((c) => c.right)), 'tube beside the controls').toBe(true);
  expect(controlsLeft < DESIGN.width / 2, 'controls and tube on opposite sides').toBe(tube.left > DESIGN.width / 2);
  for (const o of [...controls, ...buttons, strip]) expect(overlaps(tube, o), 'tube over a control').toBe(false);
  for (const b of buttons) {
    expect(overlaps(b, strip), 'button over the fine-aim strip').toBe(false);
    expect(b.left).toBeGreaterThanOrEqual(0);
    expect(b.right).toBeLessThanOrEqual(DESIGN.width);
  }
  for (const name of ['player-0', 'player-1', 'status']) {
    const b = await boundsOf(page, name);
    expect(b.left, name).toBeGreaterThanOrEqual(playLeft - rail);
  }
}

test('left-handed: the controls move to the left, the table to the right, and everything still works', async ({ page }) => {
  const errors = trackErrors(page);
  await chooseHand(page, 'left');
  await playFromMenu(page, 'two');
  const s = await state(page);
  expect(s.hand).toBe('left');
  expect(s.controls.spin.x).toBeLessThan(DESIGN.width / 4);
  expect(s.controls.tableLeft).toBeGreaterThan(TABLE_LAYOUT.originX);
  expect((await boundsOf(page, 'menuButton')).left).toBeGreaterThan(DESIGN.width / 2);
  expect((await boundsOf(page, 'newGameButton')).right).toBeLessThan(DESIGN.width / 2);
  await expectClearLayout(page);
  // New game's confirm label is the widest it gets.
  await tap(page, 'newGameButton');
  await expectClearLayout(page);

  // Ball in hand, aim, fine aim and spin all respond where they now are, then a shot is played.
  await dragOnTable(page, s.balls[0]!, { x: 0.3, y: 0.4 });
  expect((await state(page)).balls[0]!.x).toBeCloseTo(0.3, 1);
  await dragOnTable(page, { x: 1.2, y: 0.4 }, { x: 1.4, y: 0.45 });
  const before = aimAngle((await state(page)).aim);
  await dragFineAim(page, 200);
  expect(aimAngle((await state(page)).aim)).toBeGreaterThan(before);
  await dragSpin(page, 0, -0.8);
  const spin = (await state(page)).spin;
  expect(spin.height).toBeGreaterThan(0);
  expect(spin.side).toBeCloseTo(0, 2);
  await pullPower(page, 0.4);
  await expect.poll(async () => (await state(page)).shots).toBe(1);
  expect((await state(page)).lastShot!.height).toBeCloseTo(spin.height, 6);
  expect(errors).toEqual([]);
});

test('left-handed in English, with a catchphrase showing; switching back to right restores the layout', async ({ page }) => {
  const errors = trackErrors(page);
  await chooseHand(page, 'left', 'en');
  await playFromMenu(page, 'two');
  await tap(page, 'newGameButton');
  await expectClearLayout(page);
  // A foul by player 1 may get player 2's tease; either way the layout holds.
  await layout(page, [], { phase: 'play', ballInHand: null });
  await expectClearLayout(page);

  await tap(page, 'menuButton');
  await chooseHand(page, 'right');
  await playFromMenu(page, 'two');
  const s = await state(page);
  expect(s.hand).toBe('right');
  expect(s.controls.tableLeft).toBe(TABLE_LAYOUT.originX);
  expect(s.controls.spin.x).toBeGreaterThan(DESIGN.width * 0.75);
  await expectClearLayout(page);
  expect(errors).toEqual([]);
});
