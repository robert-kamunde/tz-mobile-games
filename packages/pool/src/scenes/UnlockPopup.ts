import * as Phaser from 'phaser';
import type { Translator } from '@tzg/core';
import { getServices } from '@tzg/shell';
import { COLORS, TEXT_STYLE, UNLOCK_POPUP } from '../config/layout';
import { SOUND_MIX } from '../config/sound';
import { characterById } from '../progress/story';
import { parseUnlock, type Unlock } from '../progress/unlocks';
import { lookTexture } from './art/lookArt';
import { badgeTexture } from './art/uiArt';
import { Face } from './Face';
import { loadPoolSounds } from './poolSounds';
import { Panel, addButton, textStyle } from './ui';

type Shown = Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Depth;

export interface UnlockChoices {
  /** The popup for `key` was closed; `use` when Tumia sasa was pressed (looks only). */
  readonly closed: (key: string, use: boolean) => void;
  /** The last popup in the queue was closed. */
  readonly done?: () => void;
}

/**
 * "Imefunguliwa!" (0.35.0): one popup per new unlock, one after another, with a sparkle burst and a
 * fanfare. A table, cue or scenery has Tumia sasa (use it now) and Sawa; a character or title has
 * Sawa only. Named `unlockPopup` (the panel), `unlock-kind`, `unlock-name`, `unlock-use`, `unlock-ok`;
 * the panel's data `unlock` holds the key shown.
 */
export class UnlockPopup {
  private panel: Panel | null = null;
  private objects: Shown[] = [];
  private queue: string[] = [];
  private choices: UnlockChoices | null = null;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly t: Translator,
  ) {
    loadPoolSounds(scene);
  }

  get visible(): boolean {
    return this.panel !== null;
  }

  /** The key on screen, or null. */
  get current(): string | null {
    return this.panel ? (this.queue[0] ?? null) : null;
  }

  /** Shows each key in turn. Keys already queued are kept; new ones join the end. */
  show(keys: readonly string[], choices: UnlockChoices): void {
    if (keys.length === 0) {
      if (!this.visible) choices.done?.();
      return;
    }
    this.choices = choices;
    for (const key of keys) if (!this.queue.includes(key)) this.queue.push(key);
    if (!this.visible) this.showFirst();
  }

  /** The phone's Back button closes the popup like Sawa. False when not showing. */
  goBack(): boolean {
    if (!this.visible) return false;
    this.close(false);
    return true;
  }

  private showFirst(): void {
    const key = this.queue[0]!;
    const unlock = parseUnlock(key);
    const t = this.t;
    const p = UNLOCK_POPUP;
    const { x, y, width, height } = p.area;
    const top = y - height / 2;
    this.panel = new Panel(this.scene, { name: 'unlockPopup', area: p.area, title: t.t('unlock.title'), depth: p.depth, modal: true });
    const picY = top + p.picture.fromTop;
    const kind = this.scene.add.text(x, top + p.kindFromTop, t.t(`unlock.kind.${unlock.kind}`), textStyle(TEXT_STYLE.bodySize, COLORS.accent)).setOrigin(0.5, 0).setName('unlock-kind');
    kind.setData('unlock', key);
    this.objects.push(kind, ...this.picture(unlock, x, picY));
    const name = this.scene.add
      .text(x, top + p.nameFromTop, this.nameOf(unlock), { ...textStyle(p.nameSize, p.nameColor), fontStyle: 'bold' })
      .setOrigin(0.5, 0)
      .setName('unlock-name');
    const message = this.scene.add
      .text(x, name.y + name.height + p.messageGap, this.messageOf(unlock), { ...textStyle(TEXT_STYLE.bodySize), align: 'center', wordWrap: { width: width - 80 } })
      .setOrigin(0.5, 0)
      .setName('unlock-message');
    this.objects.push(name, message);
    const isLook = unlock.kind === 'table' || unlock.kind === 'cue' || unlock.kind === 'background';
    const b = p.buttons;
    const by = top + height - b.fromBottom;
    const ok = { name: 'unlock-ok', label: t.t('unlock.ok'), onTap: () => this.close(false) };
    if (isLook) {
      this.objects.push(
        addButton(this.scene, x - (b.width + b.gap) / 2, by, { name: 'unlock-use', label: t.t('unlock.use'), primary: true, onTap: () => this.close(true) }, { width: b.width }),
        addButton(this.scene, x + (b.width + b.gap) / 2, by, ok, { width: b.width }),
      );
    } else {
      this.objects.push(addButton(this.scene, x, by, { ...ok, primary: true }, { width: b.width }));
    }
    for (const o of this.objects) o.setDepth(p.depth);
    this.sparkles(x, picY);
    getServices(this.scene).sound.play('unlock', SOUND_MIX.unlock);
  }

  /** The look's own picture, the character's face, or a crown for a title, centred at (x, y). */
  private picture(unlock: Unlock, x: number, y: number): Shown[] {
    const p = UNLOCK_POPUP.picture;
    if (unlock.kind === 'character') {
      const character = characterById(unlock.id);
      if (!character) return [];
      return new Face(this.scene, x, y, p.faceRadius, 'unlock-face').show(character).objects;
    }
    if (unlock.kind === 'title') return [this.scene.add.image(x, y, badgeTexture(this.scene, 'crown', p.badgeSize)).setName('unlock-picture')];
    const image = this.scene.add.image(x, y, lookTexture(this.scene, unlock.kind, unlock.id)).setName('unlock-picture');
    image.setScale(Math.min(p.width / image.width, p.height / image.height));
    return [image];
  }

  private nameOf(unlock: Unlock): string {
    if (unlock.kind === 'character') return characterById(unlock.id)?.name ?? unlock.id;
    if (unlock.kind === 'title') return this.t.t(`story.title.${unlock.id}`);
    return this.t.t(`${unlock.kind}.${unlock.id}`);
  }

  private messageOf(unlock: Unlock): string {
    if (unlock.kind === 'character' || unlock.kind === 'title') return this.t.t(`unlock.body.${unlock.kind}`, { name: this.nameOf(unlock) });
    return this.t.t('unlock.body.look');
  }

  /** Gold stars bursting outwards from the picture over the popup, and fading. */
  private sparkles(x: number, y: number): void {
    const s = UNLOCK_POPUP.sparkles;
    for (let i = 0; i < s.count; i++) {
      const angle = (i / s.count) * Math.PI * 2;
      const star = this.scene.add
        .star(x + Math.cos(angle) * s.from, y + Math.sin(angle) * s.from, 5, s.inner, s.radius, s.colors[i % s.colors.length])
        .setDepth(UNLOCK_POPUP.depth + 1);
      this.scene.tweens.add({
        targets: star,
        x: x + Math.cos(angle) * s.to,
        y: y + Math.sin(angle) * s.to,
        alpha: 0,
        angle: 180,
        duration: s.ms,
        ease: 'Cubic.Out',
        onComplete: () => star.destroy(),
      });
    }
  }

  private close(use: boolean): void {
    const key = this.queue.shift();
    this.panel?.destroy();
    this.panel = null;
    for (const o of this.objects) o.destroy();
    this.objects = [];
    const choices = this.choices;
    if (key) choices?.closed(key, use);
    if (this.queue.length > 0) this.showFirst();
    else choices?.done?.();
  }

  destroy(): void {
    this.queue = [];
    this.panel?.destroy();
    this.panel = null;
    for (const o of this.objects) o.destroy();
    this.objects = [];
  }
}
