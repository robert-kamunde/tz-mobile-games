import type * as Phaser from 'phaser';
import type { Translator } from '@tzg/core';
import { DEFAULT_PICKS } from '../config/characters';
import { withDistinctPicks, type CharacterPicks } from '../progress/characters';
import type { AiLevel } from '../config/ai';
import type { Opponent } from '../progress/opponent';
import type { LevelRecord } from '../progress/progress';
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
 * Choosing a new game (Robert, 2026-10-12: your character first): player 1's character, then the
 * opponent, then (two players only) player 2's character, who cannot take player 1's. Against the
 * computer, tapping a level starts the game. The last choices are selected, so a repeat game is one
 * tap per step. Back steps back; from the first step it calls `onCancel`.
 */
export class MatchSetup {
  private readonly opponents: OpponentPicker;
  private readonly characters: CharacterPicker;
  private stepNow: SetupStep | null = null;
  private last: { opponent: Opponent | null; picks: CharacterPicks } = { opponent: null, picks: DEFAULT_PICKS };
  /** The characters chosen so far in this setup. */
  private picks: CharacterPicks = DEFAULT_PICKS;
  private onCancel: (() => void) | undefined;

  constructor(
    scene: Phaser.Scene,
    private readonly t: Translator,
    area: PanelSpec['area'],
    private readonly onDone: (choice: MatchChoice) => void,
    /** Characters not earned yet, with what earns them. */
    private readonly lockedCharacters: () => ReadonlyMap<string, string>,
    /** The person's games against each computer level, shown on the opponent cards. */
    records: () => Readonly<Record<AiLevel, LevelRecord>>,
  ) {
    this.opponents = new OpponentPicker(
      scene,
      t,
      area,
      (opponent) => {
        if (opponent.kind === 'human') this.chooseSecondCharacter(opponent);
        else this.finish({ opponent, picks: this.picks });
      },
      records,
    );
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

  /** `onCancel` is what Back does on the first step. */
  show(lastOpponent: Opponent | null, lastPicks: CharacterPicks | null, onCancel?: () => void): void {
    this.last = { opponent: lastOpponent, picks: lastPicks ?? DEFAULT_PICKS };
    this.picks = this.last.picks;
    this.onCancel = onCancel;
    this.chooseFirstCharacter();
  }

  private chooseFirstCharacter(): void {
    this.opponents.hide();
    this.stepNow = 'characters';
    const t = this.t;
    this.characters.show({
      title: t.t('characters.title'),
      selected: this.picks[0],
      locked: this.lockedCharacters(),
      confirmLabel: t.t('characters.next'),
      backLabel: t.t('ui.back'),
      onConfirm: (id) => {
        this.picks = withDistinctPicks(id, this.picks[1]);
        this.showOpponents();
      },
      onBack: () => this.cancel(),
    });
  }

  private showOpponents(): void {
    this.characters.hide();
    this.stepNow = 'opponent';
    this.opponents.show(this.last.opponent, () => this.chooseFirstCharacter());
  }

  /** Two players: player 2 chooses, and cannot take player 1's character. */
  private chooseSecondCharacter(opponent: Opponent): void {
    this.stepNow = 'characters';
    const t = this.t;
    this.characters.show({
      title: t.t('characters.title'),
      subtitle: t.t('player.name', { n: 2 }),
      selected: this.picks[1],
      taken: this.picks[0],
      locked: this.lockedCharacters(),
      confirmLabel: t.t('characters.start'),
      backLabel: t.t('ui.back'),
      onConfirm: (id) => this.finish({ opponent, picks: [this.picks[0], id] }),
      onBack: () => this.showOpponents(),
    });
  }

  private cancel(): void {
    this.hide();
    this.onCancel?.();
  }

  private finish(choice: MatchChoice): void {
    this.hide();
    this.onDone(choice);
  }

  /** The phone's back button. False when nothing is showing. */
  goBack(): boolean {
    if (this.stepNow === 'characters') return this.characters.goBack();
    if (this.stepNow === 'opponent') return this.opponents.goBack();
    return false;
  }

  hide(): void {
    this.opponents.hide();
    this.characters.hide();
    this.stepNow = null;
  }
}
