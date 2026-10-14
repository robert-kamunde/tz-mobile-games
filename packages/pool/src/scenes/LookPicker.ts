import type * as Phaser from 'phaser';
import { BUTTON, COLORS, LOOK_PICKER, NEW_MARK, PANEL, TEXT_STYLE } from '../config/layout';
import { Panel, addButton, addLockTag, addNewMark, textStyle, type PanelSpec } from './ui';

export interface LookItem {
  readonly id: string;
  readonly label: string;
  /** Texture of the item's picture, already drawn. */
  readonly texture: string;
  /** Not earned yet (story mode): what earns it. It cannot be chosen. */
  readonly locked?: string;
  /** Newly unlocked and not looked at yet: marked MPYA (0.35.0). */
  readonly fresh?: boolean;
}

export interface LookChoice {
  /**
   * Names objects: pictures `<prefix>-<id>`, buttons `<prefix>-confirm` and `<prefix>-back`, page
   * arrows `<prefix>-prevPage` and `<prefix>-nextPage`, panel `<prefix>Picker`.
   */
  readonly prefix: string;
  readonly title: string;
  readonly items: readonly LookItem[];
  readonly layout: (typeof LOOK_PICKER)['table' | 'background' | 'cue'];
  /** How many are open, shown at the top left with a bar: `label` reads like "Zimefunguliwa 4/9". */
  readonly progress?: { readonly open: number; readonly total: number; readonly label: string };
  /** The MPYA mark's text; marks are named `<prefix>-<id>-new`. */
  readonly newLabel?: string;
  readonly selected: string;
  readonly confirmLabel: string;
  readonly backLabel: string;
  readonly onConfirm: (id: string) => void;
  readonly onBack: () => void;
}

/**
 * Choosing how the game looks (tables, cues): a picture of each choice with its name, in a grid,
 * a page at a time. A tap selects one; Choose keeps it, Back leaves the choice as it was.
 */
export class LookPicker {
  private panel: Panel | null = null;
  private objects: Phaser.GameObjects.GameObject[] = [];
  private frames = new Map<string, Phaser.GameObjects.Rectangle>();
  private selectedId: string | null = null;
  private choice: LookChoice | null = null;
  private pageIndex = 0;

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

  /** The page showing, from 0. */
  get page(): number {
    return this.pageIndex;
  }

  get pages(): number {
    return this.choice ? Math.ceil(this.choice.items.length / this.perPage(this.choice)) : 0;
  }

  /** Opens on the page holding the first new look, else the current choice. */
  show(choice: LookChoice): void {
    this.hide();
    this.choice = choice;
    const start = choice.items.find((item) => item.id === choice.selected && !item.locked) ?? choice.items.find((item) => !item.locked)!;
    this.selectedId = start.id;
    const shown = choice.items.find((item) => item.fresh) ?? start;
    this.showPage(Math.floor(choice.items.indexOf(shown) / this.perPage(choice)));
  }

  private perPage(choice: LookChoice): number {
    return choice.layout.columns * choice.layout.rows;
  }

  /** Draws one page; the selection stays as it is, even when it is on another page. */
  private showPage(page: number): void {
    const choice = this.choice!;
    this.clear();
    this.pageIndex = page;
    const c = choice.layout;
    const { x, y, width, height } = this.area;
    const top = y - height / 2;
    const pages = this.pages;
    const title = pages > 1 ? `${choice.title}  ${page + 1}/${pages}` : choice.title;
    this.panel = new Panel(this.scene, { name: `${choice.prefix}Picker`, area: this.area, title });
    if (choice.progress) this.objects.push(...this.progressBar(choice.prefix, choice.progress));
    const perPage = this.perPage(choice);
    for (const [i, item] of choice.items.slice(page * perPage, (page + 1) * perPage).entries()) {
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
      const label = this.scene.add
        .text(px, py + frame.height / 2 + c.nameGap, item.label, { ...textStyle(TEXT_STYLE.bodySize, item.locked ? COLORS.textDim : COLORS.text), align: 'center' })
        .setOrigin(0.5, 0)
        .setName(`${choice.prefix}-${item.id}-label`);
      hit.setData('locked', Boolean(item.locked));
      this.objects.push(hit, frame, image, label);
      if (item.locked) {
        // What earns it, in a tag: under the name, or beside it where rows are low (cues).
        const tag = addLockTag(this.scene, `${choice.prefix}-${item.id}-lock`, item.locked.replace(/\n/g, ' '), c.columnSpacing - c.lockTagGap);
        if (c.lockOnOneLine) {
          const span = label.width + c.lockTagGap + tag.width;
          label.setX(px - span / 2 + label.width / 2);
          tag.place(px + span / 2 - tag.width / 2, label.y + (label.height - tag.height) / 2);
        } else {
          tag.place(px, label.y + label.height + c.lockTagGap);
        }
        this.objects.push(...tag.objects);
        image.setAlpha(LOOK_PICKER.locked.alpha);
        this.objects.push(padlock(this.scene, px, py));
        continue;
      }
      if (item.fresh && choice.newLabel) {
        this.objects.push(...addNewMark(this.scene, `${choice.prefix}-${item.id}-new`, choice.newLabel, px + image.width / 2 + c.selectedFrame.gap, py - frame.height / 2 - NEW_MARK.inset));
      }
      hit.setInteractive({ useHandCursor: true });
      hit.on('pointerup', (pointer: Phaser.Input.Pointer) => {
        if (!pointer.wasCanceled) this.select(item.id);
      });
      this.frames.set(item.id, frame);
    }
    const buttonY = top + height - c.buttonsFromBottom;
    const buttonWidth = Math.min(BUTTON.rowWidth, width / 2 - PANEL.sideMargin);
    this.objects.push(
      addButton(this.scene, x - c.buttonOffsetX, buttonY, { name: `${choice.prefix}-back`, label: choice.backLabel, onTap: () => this.goBack() }, { width: buttonWidth }),
      addButton(this.scene, x + c.buttonOffsetX, buttonY, { name: `${choice.prefix}-confirm`, label: choice.confirmLabel, primary: true, onTap: () => this.selectedId && choice.onConfirm(this.selectedId) }, { width: buttonWidth }),
    );
    const nav = c.pageNav;
    if (page > 0) this.objects.push(addButton(this.scene, x - nav.arrowDx, buttonY, { name: `${choice.prefix}-prevPage`, label: '‹', onTap: () => this.showPage(page - 1) }, { width: nav.arrowWidth }));
    if (page < pages - 1) this.objects.push(addButton(this.scene, x + nav.arrowDx, buttonY, { name: `${choice.prefix}-nextPage`, label: '›', onTap: () => this.showPage(page + 1) }, { width: nav.arrowWidth }));
    for (const o of this.objects) (o as unknown as Phaser.GameObjects.Components.Depth).setDepth(PANEL.depth);
    if (this.selectedId) this.select(this.selectedId);
  }

  /** "Zimefunguliwa 4/9" and a thin gold bar, at the panel's top left beside the title. */
  private progressBar(prefix: string, progress: NonNullable<LookChoice['progress']>): Phaser.GameObjects.GameObject[] {
    const p = LOOK_PICKER.progress;
    const left = this.area.x - this.area.width / 2 + p.left;
    const top = this.area.y - this.area.height / 2 + p.top;
    const label = this.scene.add.text(left, top, progress.label, textStyle(TEXT_STYLE.labelSize, COLORS.text)).setName(`${prefix}-open`);
    const barY = top + label.height + p.gap;
    const track = this.scene.add.rectangle(left, barY, p.width, p.height, p.track).setOrigin(0, 0);
    const fill = this.scene.add.rectangle(left, barY, Math.max(p.height, (p.width * progress.open) / Math.max(1, progress.total)), p.height, p.fill).setOrigin(0, 0);
    return [label, track, fill];
  }

  private select(id: string): void {
    this.selectedId = id;
    for (const [fid, frame] of this.frames) frame.setVisible(fid === id);
  }

  hide(): void {
    this.clear();
    this.selectedId = null;
    this.choice = null;
    this.pageIndex = 0;
  }

  private clear(): void {
    this.panel?.destroy();
    this.panel = null;
    for (const o of this.objects) o.destroy();
    this.objects = [];
    this.frames.clear();
  }

  /** Back, or the phone's back button: closes without changing the choice. False when not showing. */
  goBack(): boolean {
    if (!this.choice) return false;
    this.choice.onBack();
    return true;
  }
}

/** A padlock over a locked picture or face. */
export function padlock(scene: Phaser.Scene, x: number, y: number): Phaser.GameObjects.Graphics {
  const p = LOOK_PICKER.locked.padlock;
  const g = scene.add.graphics();
  g.lineStyle(4, p.color, 1).beginPath().arc(x, y - p.height / 2, p.shackle, Math.PI, 0).strokePath();
  g.fillStyle(p.color, 1).fillRoundedRect(x - p.width / 2, y - p.height / 2, p.width, p.height, 3);
  g.fillStyle(COLORS.overlay, 1).fillCircle(x, y, 3);
  return g;
}
