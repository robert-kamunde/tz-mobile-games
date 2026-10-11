import type * as Phaser from 'phaser';
import type { Translator } from '@tzg/core';
import { DEFAULT_PICKS } from '../config/characters';
import { withDistinctPicks, type CharacterPicks } from '../progress/characters';
import type { Opponent } from '../progress/opponent';
import { CharacterPicker } from './CharacterPicker';
import { OpponentPicker } from './OpponentPicker';
import type { PanelSpec } from './ui';

/** What a new game needs: who the opponent is and which characters play. */
export interface MatchChoice {
  readonly opponent: Opponent;
  readonly picks: CharacterPicks;
}

export type SetupStep = 'opponent' | 'characters';

/**
 * Choosing a new game: the opponent, then player 1's character, then (two players only) player 2's,
 * who cannot take player 1's. The last choices are selected, so a repeat game is one tap per step.
 * Back steps back; from the opponent step it calls `onCancel`.
 */
export class MatchSetup {
  private readonly opponents: OpponentPicker;
  private readonly characters: CharacterPicker;
  private stepNow: SetupStep | null = null;
  private last: { opponent: Opponent | null; picks: CharacterPicks } = { opponent: null, picks: DEFAULT_PICKS };
  private onCancel: (() => void) | undefined;

  constructor(
    scene: Phaser.Scene,
    private readonly t: Translator,
    area: PanelSpec['area'],
    private readonly onDone: (choice: MatchChoice) => void,
  ) {
    this.opponents = new OpponentPicker(scene, t, area, (opponent) => this.chooseCharacter(opponent, 0, this.last.picks));
    this.characters = new CharacterPicker(scene, area);
  }

  get visible(): boolean {
    return this.stepNow !== null;
  }

  get step(): SetupStep | null {
    return this.stepNow;
  }

  /** The character currently selected on the picker (tests). */
  get selectedCharacter(): string | null {
    return this.characters.selected;
  }

  /** `onCancel` adds Back on the opponent step. */
  show(lastOpponent: Opponent | null, lastPicks: CharacterPicks | null, onCancel?: () => void): void {
    this.last = { opponent: lastOpponent, picks: lastPicks ?? DEFAULT_PICKS };
    this.onCancel = onCancel;
    this.showOpponents();
  }

  private showOpponents(): void {
    this.characters.hide();
    this.stepNow = 'opponent';
    const cancel = this.onCancel;
    this.opponents.show(
      this.last.opponent,
      cancel
        ? () => {
            this.stepNow = null;
            cancel();
          }
        : undefined,
    );
  }

  /** Character step for one seat; `picks` holds what is selected so far. */
  private chooseCharacter(opponent: Opponent, seat: 0 | 1, picks: CharacterPicks): void {
    this.stepNow = 'characters';
    const twoPlayers = opponent.kind === 'human';
    const lastSeat = !twoPlayers || seat === 1;
    const t = this.t;
    this.characters.show({
      title: t.t('characters.title'),
      ...(twoPlayers ? { subtitle: t.t('player.name', { n: seat + 1 }) } : {}),
      selected: picks[seat],
      ...(seat === 1 ? { taken: picks[0] } : {}),
      confirmLabel: t.t(lastSeat ? 'characters.start' : 'characters.next'),
      backLabel: t.t('ui.back'),
      onConfirm: (id) => {
        const next = seat === 0 ? withDistinctPicks(id, picks[1]) : ([picks[0], id] as const);
        if (lastSeat) this.finish({ opponent, picks: next });
        else this.chooseCharacter(opponent, 1, next);
      },
      onBack: () => (seat === 1 ? this.chooseCharacter(opponent, 0, picks) : this.showOpponents()),
    });
  }

  private finish(choice: MatchChoice): void {
    this.hide();
    this.onDone(choice);
  }

  /** The phone's back button. False when nothing is showing. */
  goBack(): boolean {
    if (this.stepNow === 'characters') return this.characters.goBack();
    if (this.stepNow === 'opponent') {
      this.opponents.goBack();
      this.stepNow = null;
      return true;
    }
    return false;
  }

  hide(): void {
    this.opponents.hide();
    this.characters.hide();
    this.stepNow = null;
  }
}
