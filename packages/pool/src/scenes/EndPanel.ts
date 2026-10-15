import type * as Phaser from 'phaser';
import type { Translator } from '@tzg/core';
import { COLORS, DESIGN, HUD, TEXT_STYLE } from '../config/layout';
import type { Character } from '../config/characters';
import { STORY } from '../config/story';
import { portraitCardTexture } from './art/portraitArt';
import { badgeTexture, panelTexture, raysTexture } from './art/uiArt';
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
  /** MSHINDI! (0.38.0): the winner's card with the crown, VS, and the other player's card. */
  readonly cards?: EndCards;
}

/** The two face cards over the end panel, each with an optional small badge (a record, a level). */
export interface EndCards {
  readonly winner: Character;
  readonly loser: Character;
  readonly winnerBadge?: string;
  readonly loserBadge?: string;
}

type Shown = Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Visible & Phaser.GameObjects.Components.Depth;

export interface EndChoices {
  readonly next: () => void;
  readonly rematch: () => void;
  /** Menyu, or Ramani in story mode; also what the countdown does. */
  readonly leave: () => void;
}

/**
 * The panel over the table when a game ends. Above it (0.38.0, MSHINDI!) the winner's face card
 * (`gameOverFace`, data `character`) under a crown and "MSHINDI!" (`gameOverWinnerWord`), VS
 * (`gameOverVs`) and the other player's card greyed (`gameOverLoser`), with badges
 * `gameOverFace-badge` / `gameOverLoser-badge`, over turning rays. Objects are named `gameOverPanel`, `gameOverTitle`,
 * `gameOverDetail`, `gameOverNote`, `gameOverStar-<0..2>` (data `lit`) and the buttons
 * `gameOver-next`, `gameOver-rematch`, `gameOver-menu`. The last button counts down and is pressed
 * on its own after `HUD.gameOver.autoMenuMs`, unless the screen is touched first.
 */
export class EndPanel {
  private readonly panel: Phaser.GameObjects.Image;
  /** MSHINDI! objects, made for each ending and removed with the panel. */
  private showcase: Shown[] = [];
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
    // Made now, not in the busy frame a game ends in (0.38.0: a crown made then could stay blank).
    badgeTexture(scene, 'crown', g.showcase.crown.size);
    // Any touch while the count runs stops it: the player is still here.
    scene.input.on('pointerdown', () => this.stopCount());
    this.setVisible(false);
  }

  get objects(): (Phaser.GameObjects.Image | Phaser.GameObjects.Text | Phaser.GameObjects.Star)[] {
    return [this.panel, this.title, ...this.stars, this.detail, this.note, this.next, this.rematch, this.leave];
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
    // MSHINDI! above; the panel's lines stack down from its top. Stars and the note only in story mode.
    this.clearShowcase();
    if (spec.cards) this.showShowcase(spec.cards);
    const top = spec.cards ? g.showcase.panelTop : g.y - g.height / 2;
    let y = top + g.padTop;
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
    // Without the cards, buttons sit at their usual place, lower when a long note needs the room. Under
    // the cards they follow the lines. The panel grows to fit.
    const buttonsY = spec.cards ? y + this.leave.height / 2 : Math.max(g.y + g.buttonsDy, y + this.leave.height / 2);
    const height = spec.cards ? buttonsY + this.leave.height / 2 + g.showcase.bottomPad - top : buttonsY + g.height / 2 - g.buttonsDy - top;
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
    this.clearShowcase();
    this.setVisible(false);
  }

  /** Makes the players' cards when the game starts, so the frame a game ends in only shows them. */
  prepare(characters: readonly Character[]): void {
    const c = HUD.gameOver.showcase.card;
    for (const character of characters) {
      portraitCardTexture(this.scene, character.id, c.size, c.edge);
      portraitCardTexture(this.scene, character.id, c.size, { ...c.edge, color: c.loserEdge, muted: c.loserFilter });
    }
  }

  /** Whose cards are showing (tests): the winner's and the other player's character ids. */
  get cardIds(): { winner: string; loser: string } | null {
    const winner = this.showcase.find((o) => o.name === 'gameOverFace');
    const loser = this.showcase.find((o) => o.name === 'gameOverLoser');
    return winner && loser ? { winner: winner.getData('character') as string, loser: loser.getData('character') as string } : null;
  }

  /** Rays, both cards with VS, the crown and MSHINDI!, and a few twinkling stars round the word. */
  private showShowcase(cards: EndCards): void {
    const c = HUD.gameOver.showcase;
    const scene = this.scene;
    const x = this.x;
    const depth = this.panel.depth;
    const dim = scene.add.rectangle(DESIGN.width / 2, DESIGN.height / 2, DESIGN.width, DESIGN.height, c.dim.color, c.dim.alpha);
    const winnerX = x - c.card.dx;
    const rays = scene.add.image(winnerX, c.rays.y, raysTexture(scene, c.rays.size, c.rays.count, c.rays.color)).setName('gameOverRays');
    scene.tweens.add({ targets: rays, angle: 360, duration: c.rays.spinMs, repeat: -1 });
    const card = (character: Character, cx: number, name: string, edge: { color: string; muted?: string }, badge?: string): Shown[] => {
      const image = scene.add
        .image(cx, c.card.y, portraitCardTexture(scene, character.id, c.card.size, { ...c.card.edge, ...edge }))
        .setDisplaySize(c.card.size, c.card.size)
        .setName(name)
        .setData('character', character.id);
      if (!badge) return [image];
      const b = c.badge;
      const label = scene.add
        .text(cx + c.card.size / 2 - b.inset, c.card.y - c.card.size / 2 + b.inset, badge, { ...textStyle(b.size, b.text), fontStyle: 'bold', backgroundColor: b.fill, padding: { x: b.padX, y: b.padY } })
        .setOrigin(0.5)
        .setName(`${name}-badge`);
      return [image, label];
    };
    const winner = card(cards.winner, winnerX, 'gameOverFace', { color: c.card.edge.color }, cards.winnerBadge);
    const loser = card(cards.loser, x + c.card.dx, 'gameOverLoser', { color: c.card.loserEdge, muted: c.card.loserFilter }, cards.loserBadge);
    const vs = scene.add
      .text(x, c.card.y, 'VS', { ...textStyle(c.vs.size, c.vs.color), fontStyle: 'bold', stroke: c.vs.stroke, strokeThickness: c.vs.strokeWidth })
      .setOrigin(0.5)
      .setName('gameOverVs');
    const word = scene.add
      .text(winnerX, c.word.y, this.t.t('over.winnerWord'), { ...textStyle(c.word.size, c.word.color), fontStyle: 'bold', stroke: c.word.stroke, strokeThickness: c.word.strokeWidth })
      .setOrigin(0.5)
      .setName('gameOverWinnerWord');
    const crown = scene.add.image(winnerX, c.word.y + c.crown.dy, badgeTexture(scene, 'crown', c.crown.size)).setAngle(c.crown.angle).setName('gameOverCrown');
    const tw = c.twinkle;
    const twinkles = Array.from({ length: tw.count }, (_, i) => {
      const angle = (i / tw.count) * Math.PI * 2;
      const star = scene.add.star(winnerX + Math.cos(angle) * tw.spread, c.word.y + Math.sin(angle) * tw.spread * 0.6, 5, tw.inner, tw.radius, tw.colors[i % tw.colors.length]);
      scene.tweens.add({ targets: star, alpha: 0.15, yoyo: true, repeat: -1, duration: tw.minMs + ((tw.maxMs - tw.minMs) * i) / tw.count });
      return star;
    });
    this.showcase = [dim, rays, ...twinkles, ...winner, ...loser, vs, word, crown];
    for (const o of this.showcase) o.setDepth(depth);
    // Under the panel and everything on it, over the table.
    dim.setDepth(depth - c.underPanel * 2);
    rays.setDepth(depth - c.underPanel);
    for (const star of twinkles) star.setDepth(depth - c.underPanel);
    // The cards, VS and the word pop in; the panel follows as before.
    for (const o of [...winner, ...loser, vs, word, crown]) {
      const target = o as Phaser.GameObjects.Image;
      const scaleX = target.scaleX;
      const scaleY = target.scaleY;
      target.setScale(scaleX * c.pop.fromScale, scaleY * c.pop.fromScale);
      scene.tweens.add({ targets: target, scaleX, scaleY, duration: c.pop.ms, ease: 'Back.Out' });
    }
  }

  private clearShowcase(): void {
    for (const o of this.showcase) {
      this.scene.tweens.killTweensOf(o);
      o.destroy();
    }
    this.showcase = [];
  }

  private setVisible(on: boolean): void {
    for (const o of [this.panel, this.title, this.detail, this.note, ...this.stars, this.next, this.rematch, this.leave]) o.setVisible(on);
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
