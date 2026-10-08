import * as Phaser from 'phaser';
import { BUTTON, COLORS, PANEL, TEXT_STYLE } from '../config/layout';

export interface ButtonSpec {
  /** Object name, used by browser tests to find it. */
  readonly name: string;
  readonly label: string;
  readonly onTap: () => void;
  /** Marks the current or last choice. */
  readonly highlighted?: boolean;
}

export const textStyle = (size: string, color: string = COLORS.text): Phaser.Types.GameObjects.Text.TextStyle => ({
  fontFamily: TEXT_STYLE.fontFamily,
  fontSize: size,
  color,
});

/**
 * A text button. Taps fire on release, never for a touch the system cancelled (call, notification
 * shade). `width` fixes the width so stacked buttons line up; without it the button fits its text.
 */
export function addButton(scene: Phaser.Scene, x: number, y: number, spec: ButtonSpec, options: { width?: number; originX?: number } = {}): Phaser.GameObjects.Text {
  const button = scene.add
    .text(x, y, spec.label, {
      ...textStyle(TEXT_STYLE.buttonSize, COLORS.buttonText),
      backgroundColor: spec.highlighted ? COLORS.buttonHighlight : COLORS.buttonBackground,
      padding: BUTTON.padding,
      align: 'center',
      ...(options.width ? { fixedWidth: options.width } : {}),
    })
    .setOrigin(options.originX ?? 0.5, 0.5)
    .setName(spec.name)
    .setData('highlighted', spec.highlighted === true)
    .setInteractive({ useHandCursor: true });
  button.on('pointerup', (pointer: Phaser.Input.Pointer) => {
    if (!pointer.wasCanceled) spec.onTap();
  });
  return button;
}

export interface PanelSpec {
  readonly name: string;
  readonly area: { readonly x: number; readonly y: number; readonly width: number; readonly height: number; readonly alpha: number };
  readonly title: string;
  readonly body?: string;
  readonly buttons?: readonly ButtonSpec[];
  /** Back button at the bottom, if the panel can be closed. */
  readonly back?: ButtonSpec;
}

/**
 * A dark box with a title, optional text and stacked buttons, drawn above everything else. It
 * swallows taps so nothing underneath reacts. Built when shown and destroyed when closed.
 */
export class Panel {
  private readonly objects: (Phaser.GameObjects.Rectangle | Phaser.GameObjects.Text)[] = [];

  constructor(scene: Phaser.Scene, spec: PanelSpec) {
    const { x, y, width, height, alpha } = spec.area;
    const top = y - height / 2;
    const box = scene.add.rectangle(x, y, width, height, COLORS.overlay, alpha).setName(spec.name).setInteractive();
    const title = scene.add.text(x, top + PANEL.titleTop, spec.title, textStyle(TEXT_STYLE.statusSize)).setOrigin(0.5, 0);
    this.objects.push(box, title);
    let nextY = title.y + title.height + PANEL.gap;
    if (spec.body) {
      const body = scene.add
        .text(x, nextY, spec.body, {
          ...textStyle(TEXT_STYLE.bodySize),
          wordWrap: { width: width - 2 * PANEL.sideMargin },
          lineSpacing: PANEL.bodyLineSpacing,
        })
        .setOrigin(0.5, 0)
        .setName(`${spec.name}-body`);
      this.objects.push(body);
      nextY = body.y + body.height + PANEL.gap;
    }
    (spec.buttons ?? []).forEach((b, i) => {
      const button = addButton(scene, x, 0, b, { width: Math.min(BUTTON.width, width - 2 * PANEL.sideMargin) });
      button.setY(nextY + button.height / 2 + i * PANEL.buttonSpacing);
      this.objects.push(button);
    });
    if (spec.back) this.objects.push(addButton(scene, x, top + height - PANEL.backBottom, spec.back));
    for (const o of this.objects) o.setDepth(PANEL.depth);
  }

  destroy(): void {
    for (const o of this.objects) o.destroy();
    this.objects.length = 0;
  }
}
