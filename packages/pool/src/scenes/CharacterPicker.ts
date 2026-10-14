import type * as Phaser from 'phaser';
import { PLAYER_CHARACTERS } from '../config/characters';
import { BUTTON, CHARACTER_PICKER, COLORS, PANEL, TEXT_STYLE } from '../config/layout';
import { padlock } from './LookPicker';
import { Face } from './Face';
import { Panel, addButton, addLockTag, addNewMark, textStyle, type PanelSpec } from './ui';

export interface CharacterChoice {
  readonly title: string;
  /** Whose turn to choose, in a two-player game. */
  readonly subtitle?: string;
  /** Selected when the picker opens. */
  readonly selected: string;
  /** A character player 1 already took: faded and cannot be chosen. */
  readonly taken?: string;
  /** Characters not earned yet, with what earns them: faded, padlocked, and cannot be chosen. */
  readonly locked?: ReadonlyMap<string, string>;
  /** Newly unlocked characters, marked MPYA with `newLabel` (0.35.0); marks are `character-<id>-new`. */
  readonly fresh?: ReadonlySet<string>;
  readonly newLabel?: string;
  /** "Next" for player 1 of two, otherwise "Start". */
  readonly confirmLabel: string;
  readonly backLabel: string;
  readonly onConfirm: (id: string) => void;
  readonly onBack: () => void;
}

/**
 * "Chagua mhusika": the player characters as a grid of faces with names. A tap selects a face;
 * Next/Start confirms. Faces are named `character-<id>`, the buttons `character-confirm` and
 * `character-back`.
 */
export class CharacterPicker {
  private panel: Panel | null = null;
  private objects: Phaser.GameObjects.GameObject[] = [];
  private rings = new Map<string, Phaser.GameObjects.Arc>();
  private selectedId: string | null = null;
  private choice: CharacterChoice | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly area: PanelSpec['area'],
  ) {}

  get visible(): boolean {
    return this.panel !== null;
  }

  get selected(): string | null {
    return this.selectedId;
  }

  show(choice: CharacterChoice): void {
    this.hide();
    this.choice = choice;
    const c = CHARACTER_PICKER;
    const { x, y, width, height } = this.area;
    const top = y - height / 2;
    this.panel = new Panel(this.scene, { name: 'characterPicker', area: this.area, title: choice.title, ...(choice.subtitle ? { body: choice.subtitle } : {}) });
    const rows = Math.ceil(PLAYER_CHARACTERS.length / c.columns);
    PLAYER_CHARACTERS.forEach((character, i) => {
      const col = i % c.columns;
      const row = Math.floor(i / c.columns);
      const inRow = row === rows - 1 ? PLAYER_CHARACTERS.length - row * c.columns : c.columns;
      const fx = x + (col - (inRow - 1) / 2) * c.columnSpacing;
      const fy = top + c.firstRowFromTop + row * c.rowSpacing;
      const taken = character.id === choice.taken;
      const need = choice.locked?.get(character.id);
      const ring = this.scene.add
        .circle(fx, fy, c.faceRadius + c.selectedRing.width)
        .setStrokeStyle(c.selectedRing.width, c.selectedRing.color)
        .setVisible(false);
      const face = new Face(this.scene, fx, fy, c.faceRadius, `character-${character.id}`).show(character);
      const label = this.scene.add
        .text(fx, fy + c.faceRadius + c.nameGap, character.name, { ...textStyle(TEXT_STYLE.bodySize, need ? COLORS.textDim : COLORS.text), align: 'center', wordWrap: { width: c.columnSpacing - c.labelGap } })
        .setOrigin(0.5, 0)
        .setName(`character-${character.id}-label`);
      if (need) {
        face.setAlpha(c.takenAlpha);
        // What earns it, in its own tag under the name so it does not read as part of the name.
        const tag = addLockTag(this.scene, `character-${character.id}-lock`, need.replace(/\n/g, ' '), c.columnSpacing - c.labelGap);
        tag.place(fx, label.y + label.height + c.lockTagGap);
        this.objects.push(padlock(this.scene, fx, fy), ...tag.objects);
      } else if (taken) {
        face.setAlpha(c.takenAlpha);
        label.setAlpha(c.takenAlpha);
      } else {
        face.circle.setInteractive({ useHandCursor: true });
        face.circle.on('pointerup', (pointer: Phaser.Input.Pointer) => {
          if (!pointer.wasCanceled) this.select(character.id);
        });
      }
      face.circle.setData('taken', taken).setData('locked', Boolean(need));
      if (!need && choice.fresh?.has(character.id) && choice.newLabel) {
        this.objects.push(...addNewMark(this.scene, `character-${character.id}-new`, choice.newLabel, fx + c.faceRadius + c.newMark.dx, fy - c.faceRadius - c.newMark.dy));
      }
      this.rings.set(character.id, ring);
      this.objects.push(ring, ...face.objects, label);
    });
    const buttonY = top + height - c.buttonsFromBottom;
    const buttonWidth = Math.min(BUTTON.rowWidth, width / 2 - PANEL.sideMargin);
    this.objects.push(
      addButton(this.scene, x - c.buttonOffsetX, buttonY, { name: 'character-back', label: choice.backLabel, onTap: () => choice.onBack() }, { width: buttonWidth }),
      addButton(this.scene, x + c.buttonOffsetX, buttonY, { name: 'character-confirm', label: choice.confirmLabel, primary: true, onTap: () => this.confirm() }, { width: buttonWidth }),
    );
    for (const o of this.objects) (o as unknown as Phaser.GameObjects.Components.Depth).setDepth(PANEL.depth);
    const usable = (id: string) => id !== choice.taken && !choice.locked?.has(id) && this.rings.has(id);
    this.select(usable(choice.selected) ? choice.selected : PLAYER_CHARACTERS.find((ch) => usable(ch.id))!.id);
  }

  private select(id: string): void {
    this.selectedId = id;
    for (const [rid, ring] of this.rings) ring.setVisible(rid === id);
  }

  private confirm(): void {
    if (this.choice && this.selectedId) this.choice.onConfirm(this.selectedId);
  }

  hide(): void {
    this.panel?.destroy();
    this.panel = null;
    for (const o of this.objects) o.destroy();
    this.objects = [];
    this.rings.clear();
    this.selectedId = null;
    this.choice = null;
  }

  /** The phone's back button: as the picker's own Back. False when not showing. */
  goBack(): boolean {
    if (!this.choice) return false;
    this.choice.onBack();
    return true;
  }
}
