import type * as Phaser from 'phaser';
import type { Translator } from '@tzg/core';
import { OPPONENTS, opponentId, type Opponent } from '../progress/opponent';
import { Panel, type PanelSpec } from './ui';

/**
 * "Unacheza na nani?" panel: two players on one phone, or the computer at a level. The last choice
 * is marked. Buttons are named `opponent-<id>` (two, easy, medium, hard) and `opponent-back`.
 */
export class OpponentPicker {
  private panel: Panel | null = null;
  private onBack: (() => void) | undefined;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly t: Translator,
    private readonly area: PanelSpec['area'],
    private readonly onPick: (opponent: Opponent) => void,
  ) {}

  get visible(): boolean {
    return this.panel !== null;
  }

  /** `onBack` adds a Back button that closes the picker without choosing. */
  show(last: Opponent | null, onBack?: () => void): void {
    this.hide();
    this.onBack = onBack;
    const t = this.t;
    const lastId = last ? opponentId(last) : null;
    this.panel = new Panel(this.scene, {
      name: 'opponentPicker',
      area: this.area,
      title: t.t('picker.title'),
      buttons: OPPONENTS.map((opponent) => ({
        name: `opponent-${opponentId(opponent)}`,
        label: opponent.kind === 'human' ? t.t('picker.twoPlayers') : t.t('picker.computer', { level: t.t(`level.${opponent.level}`) }),
        highlighted: opponentId(opponent) === lastId,
        onTap: () => {
          this.hide();
          this.onPick(opponent);
        },
      })),
      ...(onBack
        ? {
            back: {
              name: 'opponent-back',
              label: t.t('ui.back'),
              onTap: () => {
                this.hide();
                onBack();
              },
            },
          }
        : {}),
    });
  }

  /** The phone's back button: closes the picker as its Back button would. False when not showing. */
  goBack(): boolean {
    if (!this.visible) return false;
    const onBack = this.onBack;
    this.hide();
    onBack?.();
    return true;
  }

  hide(): void {
    this.panel?.destroy();
    this.panel = null;
  }
}
