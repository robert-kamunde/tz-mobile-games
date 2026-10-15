import type * as Phaser from 'phaser';
import type { Translator } from '@tzg/core';
import { COLORS, HUD, TEXT_STYLE } from '../config/layout';
import type { Character } from '../config/characters';
import { Face } from './Face';
import { STORY } from '../config/story';
import { panelTexture } from './art/uiArt';
import { addButton, popIn, textStyle } from './ui';

/** What the end panel says after a game. */
export interface EndSpec {
  readonly title: string;
  readonly detail: string;
  /** Story mode: stars won this time (0-3). Quick game shows none. */
  readonly stars?: number;
  /** Story mode: a new title or reward, in the accent colour. */
  readonly note?: string;
  /** Story mode: Endelea (the next stop) after a win with a stop to go. */
  readonly next?: boolean;
  /** Story mode: the last button is Ramani (the map) instead of Menyu. */
  readonly story?: boolean;
  /** The winner, whose face sits on top of the panel (0.37.0). */
  readonly winner?: Character;
}

export interface EndChoices {
  readonly next: () => void;
  readonly rematch: () => void;
  /** Menyu, or Ramani in story mode; also what the countdown does. */
  readonly leave: () => void;
}

/**
 * The panel over the table when a game ends, with the winner's face on its top edge (`gameOverFace`, data
 * `character`, in `gameOverRing`; 0.37.0). Objects are named `gameOverPanel`, `gameOverTitle`,
 * `gameOverDetail`, `gameOverNote`, `gameOverStar-<0..2>` (data `lit`) and the buttons
 * `gameOver-next`, `gameOver-rematch`, `gameOver-menu`. The last button counts down and is pressed
 * on its own after `HUD.gameOver.autoMenuMs`, unless the screen is touched first.
 */
export class EndPanel {
  private readonly panel: Phaser.GameObjects.Image;
  private readonly ring: Phaser.GameObjects.Arc;
  private readonly face: Face;
  private hasFace = false;
  private readonly title: Phaser.GameObjects.Text;
  private readonly detail: Phaser.GameObjects.Text;
  private readonly note: Phaser.GameObjects.Text;
  private readonly stars: Phaser.GameObjects.Star[];
  private readonly next: Phaser.GameObjects.Text;
  private readonly rematch: Phaser.GameObjects.Text;
  private readonly leave: Phaser.GameObjects.Text;
  private leaveKey = 'pool.menu';
  private shown = false;
  /** When the panel leaves on its own, or null once a touch stopped the count. */
  private leaveAt: number | null = null;
  private timer: Phaser.Time.TimerEvent | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly t: Translator,
    private readonly x: number,
    private readonly choices: EndChoices,
  ) {
    const g = HUD.gameOver;
    this.panel = scene.add.image(x, g.y, panelTexture(scene, g.width, g.height)).setAlpha(g.alpha).setName('gameOverPanel');
    const f = g.face;
    this.ring = scene.add.circle(x, 0, f.radius + f.ring, f.ringColor).setName('gameOverRing');
    this.face = new Face(scene, x, 0, f.radius, 'gameOverFace');
    this.title = scene.add.text(x, 0, '', textStyle(TEXT_STYLE.titleSize, COLORS.accent)).setOrigin(0.5, 0).setName('gameOverTitle');
    this.detail = scene.add.text(x, 0, '', { ...textStyle(TEXT_STYLE.playerSize), align: 'center', wordWrap: { width: g.width - 60 } }).setOrigin(0.5, 0).setName('gameOverDetail');
    this.note = scene.add.text(x, 0, '', { ...textStyle(TEXT_STYLE.playerSize, COLORS.accent), align: 'center', wordWrap: { width: g.width - 60 } }).setOrigin(0.5, 0).setName('gameOverNote');
    const s = g.star;
    this.stars = Array.from({ length: STORY.maxStars }, (_, i) =>
      scene.add
        .star(x + (i - (STORY.maxStars - 1) / 2) * s.spacing, 0, 5, s.inner, s.radius, s.unlit)
        .setStrokeStyle(2, s.outline)
        .setName(`gameOverStar-${i}`),
    );
    this.next = addButton(scene, x, 0, { name: 'gameOver-next', label: t.t('story.next'), highlighted: true, onTap: () => this.choose(choices.next) });
    this.rematch = addButton(scene, x, 0, { name: 'gameOver-rematch', label: t.t('over.rematch'), onTap: () => this.choose(choices.rematch) });
    this.leave = addButton(scene, x, 0, { name: 'gameOver-menu', label: t.t('pool.menu'), onTap: () => this.choose(choices.leave) });
    // Any touch while the count runs stops it: the player is still here.
    scene.input.on('pointerdown', () => this.stopCount());
    this.setVisible(false);
  }

  get objects(): (Phaser.GameObjects.Image | Phaser.GameObjects.Text | Phaser.GameObjects.Star | Phaser.GameObjects.Arc)[] {
    return [this.panel, this.ring, ...this.face.objects, this.title, ...this.stars, this.detail, this.note, this.next, this.rematch, this.leave];
  }

  get visible(): boolean {
    return this.shown;
  }

  /** The buttons showing, by name, left to right (tests). */
  get buttonNames(): string[] {
    return this.shown ? [this.next, this.rematch, this.leave].filter((b) => b.visible).map((b) => b.name) : [];
  }

  /** Seconds before the panel leaves on its own, or null when it will not (tests). */
  get leaveSeconds(): number | null {
    if (this.leaveAt === null) return null;
    // The scene clock can step back slightly between frames on a slow phone; never show more than the full count.
    const left = Math.ceil((this.leaveAt - this.scene.time.now) / 1000);
    return Math.min(Math.ceil(HUD.gameOver.autoMenuMs / 1000), Math.max(0, left));
  }

  show(spec: EndSpec): void {
    const g = HUD.gameOver;
    this.shown = true;
    this.setVisible(true);
    // The winner's face on the top edge; lines stack down below it. Stars and the note only in story mode.
    this.hasFace = Boolean(spec.winner);
    const panelTop = g.y - g.height / 2;
    if (spec.winner) this.face.show(spec.winner);
    for (const o of [this.ring, ...this.face.objects]) o.setY(panelTop).setVisible(this.hasFace);
    let y = spec.winner ? panelTop + g.face.radius + g.face.gap : panelTop + g.padTop;
    this.title.setText(spec.title).setY(y);
    y += this.title.height + g.lineGap;
    const withStars = spec.stars !== undefined;
    this.stars.forEach((star, i) => {
      const lit = withStars && i < spec.stars!;
      star.setVisible(withStars).setY(y + g.star.radius).setFillStyle(lit ? g.star.lit : g.star.unlit).setData('lit', lit);
    });
    if (withStars) y += 2 * g.star.radius + g.lineGap;
    this.detail.setText(spec.detail).setY(y);
    y += this.detail.height + g.lineGap;
    this.note.setText(spec.note ?? '').setY(y).setVisible(Boolean(spec.note));
    if (spec.note) y += this.note.height + g.lineGap;
    // Buttons sit at their usual place, lower when a long note needs the room; the panel grows to fit.
    const top = g.y - g.height / 2;
    const buttonsY = Math.max(g.y + g.buttonsDy, y + this.leave.height / 2);
    const height = buttonsY + g.height / 2 - g.buttonsDy - top;
    this.panel.setTexture(panelTexture(this.scene, g.width, height)).setY(top + height / 2).setScale(1).setAlpha(g.alpha);
    popIn(this.scene, null, [this.panel]);

    this.leaveKey = spec.story ? 'story.map' : 'pool.menu';
    const buttons = spec.next ? [this.next, this.rematch, this.leave] : [this.rematch, this.leave];
    this.next.setVisible(Boolean(spec.next));
    const width = buttons.length === 3 ? g.buttonWidths.three : g.buttonWidths.two;
    buttons.forEach((b, i) => {
      b.setFixedSize(width, 0);
      b.setPosition(this.x + (i - (buttons.length - 1) / 2) * (width + g.buttonGap), buttonsY);
    });
    // The first button is the one most players want next.
    this.next.setData('highlighted', true);
    this.rematch.setData('highlighted', !spec.next);
    this.startCount();
  }

  hide(): void {
    this.shown = false;
    this.stopCount();
    this.setVisible(false);
  }

  private setVisible(on: boolean): void {
    for (const o of [this.panel, this.ring, ...this.face.objects, this.title, this.detail, this.note, ...this.stars, this.next, this.rematch, this.leave]) o.setVisible(on);
  }

  private choose(choice: () => void): void {
    this.stopCount();
    choice();
  }

  private startCount(): void {
    const g = HUD.gameOver;
    this.stopCount();
    this.leaveAt = this.scene.time.now + g.autoMenuMs;
    this.showCount();
    this.timer = this.scene.time.addEvent({
      delay: g.tickMs,
      loop: true,
      callback: () => {
        if (this.leaveSeconds === 0) this.choose(this.choices.leave);
        else this.showCount();
      },
    });
  }

  /** Stops the count without a touch, for example while an unlock popup covers the panel. */
  holdCount(): void {
    this.stopCount();
  }

  private stopCount(): void {
    this.timer?.remove();
    this.timer = null;
    this.leaveAt = null;
    this.leave.setText(this.t.t(this.leaveKey));
  }

  private showCount(): void {
    this.leave.setText(this.t.t('over.leaveIn', { label: this.t.t(this.leaveKey), seconds: this.leaveSeconds ?? 0 }));
  }
}
