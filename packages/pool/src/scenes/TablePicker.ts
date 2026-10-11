import type * as Phaser from 'phaser';
import type { Translator } from '@tzg/core';
import { TABLE_ART } from '../config/art';
import { BUTTON, PANEL, TABLE_PICKER, TEXT_STYLE } from '../config/layout';
import type { TableConfig } from '../config/table';
import { TABLE_IDS, TABLE_THEMES, type TableId } from '../config/tables';
import type { TableGeometry } from '../physics/types';
import { tableTexture } from './art/tableTexture';
import { Panel, addButton, textStyle, type PanelSpec } from './ui';

/**
 * "Chagua meza": a small picture of each table with its name. A tap selects one; "Chagua" keeps it,
 * Back leaves the choice as it was. Pictures are named `table-<id>`, the buttons `table-confirm` and
 * `table-back`.
 */
export class TablePicker {
  private panel: Panel | null = null;
  private objects: Phaser.GameObjects.GameObject[] = [];
  private frames = new Map<TableId, Phaser.GameObjects.Rectangle>();
  private selectedId: TableId | null = null;
  private onBack: (() => void) | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly t: Translator,
    private readonly area: PanelSpec['area'],
    private readonly geometry: TableGeometry,
    private readonly config: TableConfig,
  ) {}

  get visible(): boolean {
    return this.panel !== null;
  }

  get selected(): TableId | null {
    return this.selectedId;
  }

  show(current: TableId, onConfirm: (id: TableId) => void, onBack: () => void): void {
    this.hide();
    this.onBack = onBack;
    const c = TABLE_PICKER;
    const { x, y, width, height } = this.area;
    const top = y - height / 2;
    this.panel = new Panel(this.scene, { name: 'tablePicker', area: this.area, title: this.t.t('tables.title') });
    TABLE_IDS.forEach((id, i) => {
      const col = i % c.columns;
      const row = Math.floor(i / c.columns);
      const px = x + (col - (c.columns - 1) / 2) * c.columnSpacing;
      const py = top + c.firstRowFromTop + row * c.rowSpacing;
      const texture = tableTexture(this.scene, this.geometry, this.config, TABLE_THEMES[id], TABLE_ART.previewScale);
      const image = this.scene.add.image(px, py, texture.key).setName(`table-${id}`);
      const frame = this.scene.add
        .rectangle(px, py, image.width + 2 * c.selectedFrame.gap, image.height + 2 * c.selectedFrame.gap)
        .setStrokeStyle(c.selectedFrame.width, c.selectedFrame.color)
        .setVisible(false);
      const label = this.scene.add.text(px, py + image.height / 2 + c.nameGap, this.t.t(`table.${id}`), textStyle(TEXT_STYLE.bodySize)).setOrigin(0.5, 0);
      image.setInteractive({ useHandCursor: true });
      image.on('pointerup', (pointer: Phaser.Input.Pointer) => {
        if (!pointer.wasCanceled) this.select(id);
      });
      this.frames.set(id, frame);
      this.objects.push(frame, image, label);
    });
    const buttonY = top + height - c.buttonsFromBottom;
    const buttonWidth = Math.min(BUTTON.rowWidth, width / 2 - PANEL.sideMargin);
    this.objects.push(
      addButton(this.scene, x - c.buttonOffsetX, buttonY, { name: 'table-back', label: this.t.t('ui.back'), onTap: () => this.goBack() }, { width: buttonWidth }),
      addButton(this.scene, x + c.buttonOffsetX, buttonY, { name: 'table-confirm', label: this.t.t('tables.choose'), onTap: () => this.selectedId && onConfirm(this.selectedId) }, { width: buttonWidth }),
    );
    for (const o of this.objects) (o as unknown as Phaser.GameObjects.Components.Depth).setDepth(PANEL.depth);
    this.select(current);
  }

  private select(id: TableId): void {
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
    this.onBack = null;
  }

  /** Back, or the phone's back button: closes without changing the table. False when not showing. */
  goBack(): boolean {
    if (!this.onBack) return false;
    this.onBack();
    return true;
  }
}
