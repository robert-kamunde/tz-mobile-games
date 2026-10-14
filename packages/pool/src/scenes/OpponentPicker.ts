import * as Phaser from 'phaser';
import type { Translator } from '@tzg/core';
import { getServices } from '@tzg/shell';
import { AI_LEVEL_IDS, type AiLevel } from '../config/ai';
import { COMPUTER_CHARACTERS } from '../config/characters';
import { BUTTON, COLORS, OPPONENT_PICKER, PANEL, TEXT_STYLE } from '../config/layout';
import { SOUND_MIX } from '../config/sound';
import { opponentId, type Opponent } from '../progress/opponent';
import type { LevelRecord } from '../progress/progress';
import { cardTexture } from './art/uiArt';
import { Face } from './Face';
import { Panel, addButton, textStyle, type PanelSpec } from './ui';

type Shown = Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Depth;

/**
 * "Cheza na nani?" panel (0.34.0): a friend on the same phone, or a card per computer player with
 * their face, strength and the person's record against them. The last choice is marked. The friend
 * button is `opponent-two`, each card's touch area `opponent-<level>`, and Back `opponent-back`.
 */
export class OpponentPicker {
  private panel: Panel | null = null;
  private objects: Shown[] = [];
  private onBack: (() => void) | undefined;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly t: Translator,
    private readonly area: PanelSpec['area'],
    private readonly onPick: (opponent: Opponent) => void,
    /** The person's games against each level, shown on the cards. */
    private readonly records: () => Readonly<Record<AiLevel, LevelRecord>>,
  ) {}

  get visible(): boolean {
    return this.panel !== null;
  }

  /** `onBack` adds a Back button that closes the picker without choosing. */
  show(last: Opponent | null, onBack?: () => void): void {
    this.hide();
    this.onBack = onBack;
    const t = this.t;
    const o = OPPONENT_PICKER;
    const { x, y, width, height } = this.area;
    const top = y - height / 2;
    const lastId = last ? opponentId(last) : null;
    this.panel = new Panel(this.scene, {
      name: 'opponentPicker',
      area: this.area,
      title: t.t('picker.title'),
      ...(onBack ? { back: { name: 'opponent-back', label: t.t('ui.back'), onTap: () => this.goBack() } } : {}),
    });
    const wide = width >= o.wide.minAreaWidth;
    const m = wide ? o.wide : o.compact;
    const friend = addButton(
      this.scene,
      x,
      top + m.friendFromTop,
      { name: 'opponent-two', label: t.t('picker.friend'), highlighted: lastId === 'two', onTap: () => this.pick({ kind: 'human' }) },
      { width: Math.min(BUTTON.width, width - 2 * m.sideMargin) },
    );
    this.objects.push(friend);
    const columns = m.columns;
    const cardWidth = (width - 2 * m.sideMargin - (columns - 1) * o.gap) / columns;
    const cardHeight = m.cardHeight;
    const records = this.records();
    AI_LEVEL_IDS.forEach((level, i) => {
      const col = i % columns;
      const row = Math.floor(i / columns);
      const left = x - width / 2 + m.sideMargin + col * (cardWidth + o.gap);
      const cardTop = top + m.cardsFromTop + row * (cardHeight + o.gap);
      this.card(level, left, cardTop, cardWidth, cardHeight, wide, lastId === level, records[level]);
    });
    for (const obj of this.objects) obj.setDepth(PANEL.depth);
  }

  /** One computer player's card: face, name, strength dots, level and record, all one touch area. */
  private card(level: AiLevel, left: number, top: number, w: number, h: number, wide: boolean, chosen: boolean, record: LevelRecord): void {
    const o = OPPONENT_PICKER;
    const t = this.t;
    const character = COMPUTER_CHARACTERS[level];
    const bg = this.scene.add.image(left + w / 2, top + h / 2, cardTexture(this.scene, w, h, chosen));
    const r = wide ? o.wide.faceRadius : o.compact.faceRadius;
    const face = wide ? { x: left + w / 2, y: top + o.wide.faceFromTop } : { x: left + o.compact.faceInset + r, y: top + h / 2 };
    const portrait = new Face(this.scene, face.x, face.y, r, `opponentFace-${level}`).show(character);
    // Text: centred under the face on a wide card, left-aligned beside it on a compact one.
    const textX = wide ? left + w / 2 : face.x + r + o.compact.textGap;
    const originX = wide ? 0.5 : 0;
    let lineY = wide ? face.y + r + o.lines.underFace : top + o.lines.top;
    const name = this.scene.add.text(textX, lineY, character.name, { ...textStyle(TEXT_STYLE.playerSize), fontStyle: 'bold' }).setOrigin(originX, 0);
    lineY += name.height + o.lines.afterName;
    const strength = AI_LEVEL_IDS.indexOf(level) + 1;
    const s = o.strength;
    const dotsWidth = AI_LEVEL_IDS.length * 2 * s.radius + (AI_LEVEL_IDS.length - 1) * s.gap;
    const dotsLeft = wide ? textX - dotsWidth / 2 : textX;
    const dots = AI_LEVEL_IDS.map((_, d) =>
      this.scene.add
        .circle(dotsLeft + s.radius + d * (2 * s.radius + s.gap), lineY + s.radius, s.radius, d < strength ? s.on : s.off)
        .setStrokeStyle(1, 0x000000, 0.5),
    );
    lineY += 2 * s.radius + o.lines.afterDots;
    const levelText = this.scene.add.text(textX, lineY, t.t(`level.${level}`), textStyle(TEXT_STYLE.labelSize, COLORS.accent)).setOrigin(originX, 0).setName(`opponent-${level}-level`);
    lineY += levelText.height + (wide ? o.lines.beforeRecord.wide : o.lines.beforeRecord.compact);
    const recordText = this.scene.add
      .text(textX, lineY, record.played > 0 ? t.t('picker.record', { won: record.won, played: record.played }) : t.t('picker.notPlayed'), textStyle(TEXT_STYLE.labelSize, COLORS.textDim))
      .setOrigin(originX, 0)
      .setName(`opponent-${level}-record`);
    const hit = this.scene.add.rectangle(left + w / 2, top + h / 2, w, h).setName(`opponent-${level}`).setData('highlighted', chosen).setInteractive({ useHandCursor: true });
    hit.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (pointer.wasCanceled) return;
      getServices(this.scene).sound.play('tap', SOUND_MIX.tap);
      this.pick({ kind: 'computer', level });
    });
    this.objects.push(bg, ...portrait.objects, name, ...dots, levelText, recordText, hit);
  }

  private pick(opponent: Opponent): void {
    this.hide();
    this.onPick(opponent);
  }

  /** The phone's back button: closes the picker as its Back button would. False when not showing. */
  goBack(): boolean {
    if (!this.visible) return false;
    const onBack = this.onBack;
    this.hide();
    onBack?.();
    return true;
  }

  hide(): void {
    this.panel?.destroy();
    this.panel = null;
    for (const obj of this.objects) obj.destroy();
    this.objects = [];
  }
}
