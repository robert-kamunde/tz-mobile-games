import * as Phaser from 'phaser';
import { getServices } from '@tzg/shell';
import { UI_ART } from '../config/art';
import { BUTTON, COLORS, DESIGN, PANEL, TEXT_STYLE } from '../config/layout';
import { SOUND_MIX } from '../config/sound';
import { buttonTexture, lockTagTexture, panelTexture, ribbonTexture } from './art/uiArt';
import { loadPoolSounds } from './poolSounds';

export interface ButtonSpec {
  /** Object name, used by browser tests to find it. */
  readonly name: string;
  readonly label: string;
  readonly onTap: () => void;
  /** Marks the current or last choice. */
  readonly highlighted?: boolean;
  /** A main action (CHEZA, Start): gold like a highlighted button. */
  readonly primary?: boolean;
}

export const textStyle = (size: string, color: string = COLORS.text): Phaser.Types.GameObjects.Text.TextStyle => ({
  fontFamily: TEXT_STYLE.fontFamily,
  fontSize: size,
  color,
});

/** Gives a button label the look of its face: cream on teal, dark on gold. */
function styleLabel(label: Phaser.GameObjects.Text, gold: boolean): void {
  const b = UI_ART.button;
  const shadow = b.textShadow;
  label
    .setColor(gold ? b.text.goldColor : b.text.color)
    .setShadow(0, shadow.dy, gold ? shadow.goldColor : shadow.color, shadow.blur, false, true);
}

/**
 * A button: a label over a drawn face (scenes/art/uiArt.ts). Taps fire on release, never for a touch the system cancelled (call, notification
 * shade). `width` fixes the width so stacked buttons line up; without it the button fits its text.
 * It sinks in while pressed and ticks when tapped (0.32.0).
 */
export function addButton(scene: Phaser.Scene, x: number, y: number, spec: ButtonSpec, options: { width?: number; originX?: number; fontSize?: string } = {}): Phaser.GameObjects.Text {
  const face = scene.add.image(x, y, '__DEFAULT');
  // Made before the label so it draws underneath at the same depth.
  const button = scene.add
    .text(x, y, spec.label, {
      ...textStyle(options.fontSize ?? TEXT_STYLE.buttonSize, COLORS.buttonText),
      fontStyle: UI_ART.button.text.bold ? 'bold' : 'normal',
      padding: BUTTON.padding,
      align: 'center',
      ...(options.width ? { fixedWidth: options.width } : {}),
    })
    .setOrigin(options.originX ?? 0.5, 0.5)
    .setName(spec.name)
    .setData('highlighted', spec.highlighted === true)
    .setData('primary', spec.primary === true)
    .setInteractive({ useHandCursor: true });
  followButton(scene, button, face);
  loadPoolSounds(scene);
  // Pressed: drawn a little smaller until the finger lifts or slides off.
  let restScale: number | null = null;
  const release = () => {
    if (restScale !== null) button.setScale(restScale);
    restScale = null;
  };
  button.on('pointerdown', () => {
    restScale ??= button.scaleX;
    button.setScale(restScale * UI_ART.button.pressScale);
  });
  button.on('pointerout', release);
  button.on('pointerup', (pointer: Phaser.Input.Pointer) => {
    release();
    if (pointer.wasCanceled) return;
    getServices(scene).sound.play('tap', SOUND_MIX.tap);
    spec.onTap();
  });
  return button;
}

/**
 * Keeps a button's face under its label: callers move, hide, fade, re-layer and destroy the label
 * (a plain Text, which tests and screens already use), and the face follows before every frame.
 */
function followButton(scene: Phaser.Scene, label: Phaser.GameObjects.Text, face: Phaser.GameObjects.Image): void {
  let look = '';
  const sync = () => {
    // A label can change (New game asks "sure?"), so the face is redrawn to its new size.
    const gold = label.getData('highlighted') === true || label.getData('primary') === true;
    const now = `${label.width}x${label.height}-${gold}`;
    if (now !== look) {
      look = now;
      face.setTexture(buttonTexture(scene, label.width, label.height, gold));
      styleLabel(label, gold);
    }
    face
      .setPosition(label.x + (0.5 - label.originX) * label.displayWidth, label.y + (0.5 - label.originY) * label.displayHeight)
      .setScale(label.scaleX, label.scaleY)
      .setVisible(label.visible)
      .setAlpha(label.alpha);
    if (face.depth !== label.depth) face.setDepth(label.depth);
  };
  sync();
  scene.events.on(Phaser.Scenes.Events.POST_UPDATE, sync);
  scene.events.on(Phaser.Scenes.Events.PRE_RENDER, sync);
  label.once(Phaser.GameObjects.Events.DESTROY, () => {
    scene.events.off(Phaser.Scenes.Events.POST_UPDATE, sync);
    scene.events.off(Phaser.Scenes.Events.PRE_RENDER, sync);
    face.destroy();
  });
}

export interface PanelSpec {
  readonly name: string;
  readonly area: { readonly x: number; readonly y: number; readonly width: number; readonly height: number; readonly alpha: number };
  readonly title: string;
  readonly body?: string;
  readonly buttons?: readonly ButtonSpec[];
  /** Labelled rows of side-by-side choices (e.g. Language: Kiswahili | English), after the buttons. */
  readonly rows?: readonly { readonly label: string; readonly choices: readonly ButtonSpec[] }[];
  /** Back button at the bottom, if the panel can be closed. */
  readonly back?: ButtonSpec;
}

/** What earns a locked character or look: a gold-edged tag with a padlock, made by `addLockTag`. */
export interface LockTag {
  readonly objects: readonly (Phaser.GameObjects.Image | Phaser.GameObjects.Text)[];
  readonly width: number;
  readonly height: number;
  /** Puts the tag with its top centre at (x, top). */
  place(x: number, top: number): void;
}

/** A lock tag for `text` (wrapped to `maxWidth`); its text is named `name`. */
export function addLockTag(scene: Phaser.Scene, name: string, text: string, maxWidth: number): LockTag {
  const t = UI_ART.panel.lockTag;
  const label = scene.add
    .text(0, 0, text, { ...textStyle(TEXT_STYLE.labelSize, t.text), align: 'center', wordWrap: { width: maxWidth - 2 * t.padX - t.iconWidth } })
    .setOrigin(0, 0)
    .setName(name);
  const width = label.width + 2 * t.padX + t.iconWidth;
  const height = label.height + 2 * t.padY;
  const pill = scene.add.image(0, 0, lockTagTexture(scene, width, height)).setOrigin(0, 0);
  scene.children.bringToTop(label);
  return {
    objects: [pill, label],
    width,
    height,
    place(x, top) {
      pill.setPosition(x - width / 2, top);
      label.setPosition(x - width / 2 + t.padX + t.iconWidth, top + t.padY);
    },
  };
}

/**
 * A title on a red ribbon, its top at `y`: the ribbon image and the text, both centred on `x`.
 */
export function addRibbonTitle(scene: Phaser.Scene, x: number, y: number, text: string, size: string = TEXT_STYLE.statusSize): [Phaser.GameObjects.Image, Phaser.GameObjects.Text] {
  const r = UI_ART.panel.ribbon;
  const b = UI_ART.button;
  const title = scene.add
    .text(x, y, text, { ...textStyle(size, b.text.color), fontStyle: 'bold' })
    .setOrigin(0.5, 0)
    .setShadow(0, b.textShadow.dy, b.textShadow.color, b.textShadow.blur, false, true);
  const front = { width: title.width + 2 * r.padX, height: title.height + 2 * r.padY };
  const ribbon = ribbonTexture(scene, front.width, front.height);
  // The texture's front starts at its top; the folds hang below.
  const image = scene.add.image(x, y - r.padY + ribbon.height / 2, ribbon.key);
  // The text was made first to measure it; it draws over the ribbon.
  scene.children.bringToTop(title);
  return [image, title];
}

/**
 * The opening of a popup: the screen around it dims, and the frame and title grow into place. The
 * buttons and text stay where they are, so a quick tap still lands on them.
 */
export function popIn(scene: Phaser.Scene, dim: Phaser.GameObjects.Rectangle | null, grow: readonly (Phaser.GameObjects.Image | Phaser.GameObjects.Text)[]): void {
  const pop = UI_ART.panel.pop;
  const targets = grow.map((o) => ({ o, alpha: o.alpha, scale: o.scaleX }));
  const dimAlpha = dim?.fillAlpha ?? 0;
  const apply = (t: number) => {
    const scale = pop.fromScale + (1 - pop.fromScale) * t;
    for (const g of targets) if (g.o.active) g.o.setScale(g.scale * scale).setAlpha(g.alpha * Math.min(1, t));
    if (dim?.active) dim.setFillStyle(dim.fillColor, dimAlpha * Math.min(1, t));
  };
  apply(0);
  scene.tweens.addCounter({ from: 0, to: 1, duration: pop.ms, ease: pop.ease, onUpdate: (tween) => apply(tween.getValue() ?? 1), onComplete: () => apply(1) });
}

/**
 * A wood-framed box with a title on a ribbon, optional text and stacked buttons, drawn above
 * everything else, with the screen around it dimmed. It swallows taps so nothing underneath reacts.
 * Built when shown and destroyed when closed.
 */
export class Panel {
  private readonly objects: (Phaser.GameObjects.Rectangle | Phaser.GameObjects.Image | Phaser.GameObjects.Text)[] = [];

  constructor(scene: Phaser.Scene, spec: PanelSpec) {
    const { x, y, width, height, alpha } = spec.area;
    const top = y - height / 2;
    const d = UI_ART.panel.dim;
    const dim = scene.add.rectangle(DESIGN.width / 2, DESIGN.height / 2, DESIGN.width, DESIGN.height, d.color, d.alpha);
    // The box swallows taps; the drawn panel over it is what shows.
    const box = scene.add.rectangle(x, y, width, height, COLORS.overlay, PANEL.hitAlpha).setName(spec.name).setInteractive();
    const look = scene.add.image(x, y, panelTexture(scene, width, height)).setAlpha(alpha);
    const [ribbon, title] = addRibbonTitle(scene, x, top + PANEL.titleTop, spec.title);
    title.setName(`${spec.name}-title`);
    this.objects.push(dim, box, look, ribbon, title);
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
      if (i === (spec.buttons ?? []).length - 1) nextY = button.y + button.height / 2 + PANEL.gap;
    });
    for (const row of spec.rows ?? []) {
      const label = scene.add.text(x, nextY, row.label, textStyle(TEXT_STYLE.bodySize)).setOrigin(0.5, 0);
      this.objects.push(label);
      const n = row.choices.length;
      const span = n * BUTTON.rowWidth + (n - 1) * BUTTON.rowGap;
      let bottom = label.y + label.height;
      row.choices.forEach((c, i) => {
        const button = addButton(scene, x - span / 2 + BUTTON.rowWidth / 2 + i * (BUTTON.rowWidth + BUTTON.rowGap), 0, c, { width: BUTTON.rowWidth });
        button.setY(label.y + label.height + PANEL.rowLabelGap + button.height / 2);
        bottom = button.y + button.height / 2;
        this.objects.push(button);
      });
      nextY = bottom + PANEL.gap;
    }
    if (spec.back) this.objects.push(addButton(scene, x, top + height - PANEL.backBottom, spec.back));
    for (const o of this.objects) o.setDepth(PANEL.depth);
    popIn(scene, dim, [look, ribbon, title]);
  }

  destroy(): void {
    for (const o of this.objects) o.destroy();
    this.objects.length = 0;
  }
}
