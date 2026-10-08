import * as Phaser from 'phaser';
import type { Translator } from '@tzg/core';
import { AI_LEVEL_IDS, type AiLevel } from '../config/ai';
import { COLORS, PICKER, TEXT_STYLE } from '../config/layout';

/** Who player 2 is: another person on the same phone, or the computer at a level. */
export type Opponent = { readonly kind: 'human' } | { readonly kind: 'computer'; readonly level: AiLevel };

const CHOICES: readonly { readonly id: string; readonly opponent: Opponent }[] = [
  { id: 'two', opponent: { kind: 'human' } },
  ...AI_LEVEL_IDS.map((level) => ({ id: level, opponent: { kind: 'computer', level } as const })),
];

/**
 * "Who are you playing?" panel shown at the start and after New game. Buttons are named
 * `opponent-<id>` for tests (two, easy, medium, hard).
 */
export class OpponentPicker {
  private readonly objects: (Phaser.GameObjects.Rectangle | Phaser.GameObjects.Text)[] = [];
  private shown = false;

  constructor(scene: Phaser.Scene, t: Translator, onPick: (opponent: Opponent) => void) {
    const text = (size: string, color: string) => ({ fontFamily: TEXT_STYLE.fontFamily, fontSize: size, color });
    const panel = scene.add.rectangle(PICKER.x, PICKER.y, PICKER.width, PICKER.height, COLORS.overlay, PICKER.alpha).setName('opponentPicker');
    // Swallows taps on the panel so they never reach the table underneath.
    panel.setInteractive();
    const title = scene.add
      .text(PICKER.x, PICKER.y + PICKER.titleOffsetY, t.t('picker.title'), text(TEXT_STYLE.statusSize, COLORS.text))
      .setOrigin(0.5);
    this.objects.push(panel, title);
    CHOICES.forEach(({ id, opponent }, i) => {
      const label = opponent.kind === 'human' ? t.t('picker.twoPlayers') : t.t('picker.computer', { level: t.t(`level.${opponent.level}`) });
      const button = scene.add
        .text(PICKER.x, PICKER.y + PICKER.firstButtonOffsetY + i * PICKER.buttonSpacing, label, {
          ...text(TEXT_STYLE.buttonSize, COLORS.buttonText),
          backgroundColor: COLORS.buttonBackground,
          padding: PICKER.buttonPadding,
          align: 'center',
          fixedWidth: PICKER.buttonWidth,
        })
        .setOrigin(0.5)
        .setName(`opponent-${id}`)
        .setInteractive({ useHandCursor: true });
      button.on('pointerup', (pointer: Phaser.Input.Pointer) => {
        if (pointer.wasCanceled || !this.shown) return;
        this.hide();
        onPick(opponent);
      });
      this.objects.push(button);
    });
    for (const o of this.objects) o.setDepth(PICKER.depth);
    this.hide();
  }

  get visible(): boolean {
    return this.shown;
  }

  show(): void {
    this.setShown(true);
  }

  hide(): void {
    this.setShown(false);
  }

  private setShown(shown: boolean): void {
    this.shown = shown;
    for (const o of this.objects) o.setVisible(shown);
  }
}
