import type * as Phaser from 'phaser';
import { BUTTON, PANEL, TEXT_STYLE, type LOOK_PICKER } from '../config/layout';
import { Panel, addButton, textStyle, type PanelSpec } from './ui';

export interface LookItem {
  readonly id: string;
  readonly label: string;
  /** Texture of the item's picture, already drawn. */
  readonly texture: string;
}

export interface LookChoice {
  /** Names objects: pictures `<prefix>-<id>`, buttons `<prefix>-confirm` and `<prefix>-back`, panel `<prefix>Picker`. */
  readonly prefix: string;
  readonly title: string;
  readonly items: readonly LookItem[];
  readonly layout: (typeof LOOK_PICKER)[keyof typeof LOOK_PICKER];
  readonly selected: string;
  readonly confirmLabel: string;
  readonly backLabel: string;
  readonly onConfirm: (id: string) => void;
  readonly onBack: () => void;
}

/**
 * Choosing how the game looks (tables, cues): a picture of each choice with its name, in a grid.
 * A tap selects one; Choose keeps it, Back leaves the choice as it was.
 */
export class LookPicker {
  private panel: Panel | null = null;
  private objects: Phaser.GameObjects.GameObject[] = [];
  private frames = new Map<string, Phaser.GameObjects.Rectangle>();
  private selectedId: string | null = null;
  private choice: LookChoice | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly area: PanelSpec['area'],
  ) {}

  /** The open picker's prefix ('table', 'cue'), or null. */
  get showing(): string | null {
    return this.choice?.prefix ?? null;
  }

  get selected(): string | null {
    return this.selectedId;
  }

  show(choice: LookChoice): void {
    this.hide();
    this.choice = choice;
    const c = choice.layout;
    const { x, y, width, height } = this.area;
    const top = y - height / 2;
    this.panel = new Panel(this.scene, { name: `${choice.prefix}Picker`, area: this.area, title: choice.title });
    choice.items.forEach((item, i) => {
      const col = i % c.columns;
      const row = Math.floor(i / c.columns);
      const px = x + (col - (c.columns - 1) / 2) * c.columnSpacing;
      const py = top + c.firstRowFromTop + row * c.rowSpacing;
      const image = this.scene.add.image(px, py, item.texture).setName(`${choice.prefix}-${item.id}`);
      // A thin picture (a cue) still gets a comfortable touch area.
      const hit = this.scene.add.rectangle(px, py, image.width + 2 * c.selectedFrame.gap, Math.max(image.height, c.minTouchHeight)).setName(`${choice.prefix}-${item.id}-touch`);
      const frame = this.scene.add
        .rectangle(px, py, hit.width, hit.height + 2 * c.selectedFrame.gap)
        .setStrokeStyle(c.selectedFrame.width, c.selectedFrame.color)
        .setVisible(false);
      const label = this.scene.add.text(px, py + frame.height / 2 + c.nameGap, item.label, textStyle(TEXT_STYLE.bodySize)).setOrigin(0.5, 0);
      hit.setInteractive({ useHandCursor: true });
      hit.on('pointerup', (pointer: Phaser.Input.Pointer) => {
        if (!pointer.wasCanceled) this.select(item.id);
      });
      this.frames.set(item.id, frame);
      this.objects.push(hit, frame, image, label);
    });
    const buttonY = top + height - c.buttonsFromBottom;
    const buttonWidth = Math.min(BUTTON.rowWidth, width / 2 - PANEL.sideMargin);
    this.objects.push(
      addButton(this.scene, x - c.buttonOffsetX, buttonY, { name: `${choice.prefix}-back`, label: choice.backLabel, onTap: () => this.goBack() }, { width: buttonWidth }),
      addButton(this.scene, x + c.buttonOffsetX, buttonY, { name: `${choice.prefix}-confirm`, label: choice.confirmLabel, onTap: () => this.selectedId && choice.onConfirm(this.selectedId) }, { width: buttonWidth }),
    );
    for (const o of this.objects) (o as unknown as Phaser.GameObjects.Components.Depth).setDepth(PANEL.depth);
    this.select(choice.items.some((item) => item.id === choice.selected) ? choice.selected : choice.items[0]!.id);
  }

  private select(id: string): void {
    this.selectedId = id;
    for (const [fid, frame] of this.frames) frame.setVisible(fid === id);
  }

  hide(): void {
    this.panel?.destroy();
    this.panel = null;
    for (const o of this.objects) o.destroy();
    this.objects = [];
    this.frames.clear();
    this.selectedId = null;
    this.choice = null;
  }

  /** Back, or the phone's back button: closes without changing the choice. False when not showing. */
  goBack(): boolean {
    if (!this.choice) return false;
    this.choice.onBack();
    return true;
  }
}
