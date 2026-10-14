import * as Phaser from 'phaser';
import type { Translator } from '@tzg/core';
import { AI_LEVEL_IDS, type AiLevel } from '../config/ai';
import { COMPUTER_CHARACTERS } from '../config/characters';
import { COLORS, PANEL, STATS_PANEL, TEXT_STYLE } from '../config/layout';
import { computerWins, type LevelRecord, type PoolProgress } from '../progress/progress';
import { MAX_STARS, totalStars, type StoryProgress } from '../progress/story';
import { badgeTexture, cardTexture } from './art/uiArt';
import { Face } from './Face';
import { Panel, textStyle, type PanelSpec } from './ui';

type Shown = Phaser.GameObjects.GameObject & Phaser.GameObjects.Components.Depth;

/** The five totals across the top, in order. Each is shown as `stats-total-<id>`. */
const TOTALS = ['games', 'wins', 'rate', 'streak', 'stars'] as const;

/**
 * Takwimu (0.34.0): big totals (games and wins against the computer, win rate, best streak, journey
 * stars), then a row per computer player with face, win bar, `won/played` and a crown once beaten,
 * then games with friends. Rows are `stats-<level>`, their record `stats-<level>-record` and crown
 * `stats-<level>-crown`; the friends line is `stats-friends`; Back is `stats-back`.
 */
export class StatsPanel {
  private readonly panel: Panel;
  private readonly objects: Shown[] = [];

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly t: Translator,
    area: PanelSpec['area'],
    progress: PoolProgress,
    story: StoryProgress,
    onBack: () => void,
  ) {
    this.panel = new Panel(scene, { name: 'statsPanel', area, title: t.t('stats.title'), back: { name: 'stats-back', label: t.t('ui.back'), onTap: onBack } });
    const { x, y, width, height } = area;
    const top = y - height / 2;
    const left = x - width / 2 + STATS_PANEL.sideMargin;
    const inner = width - 2 * STATS_PANEL.sideMargin;
    this.totals(progress, story, left, top + STATS_PANEL.totals.fromTop, inner);
    const r = STATS_PANEL.rows;
    AI_LEVEL_IDS.forEach((level, i) => this.row(level, progress.vsComputer[level], left, top + r.fromTop + i * (r.height + r.gap), inner));
    const friendsTop = top + r.fromTop + AI_LEVEL_IDS.length * (r.height + r.gap) - r.gap + STATS_PANEL.friendsGap;
    this.objects.push(
      scene.add.text(x, friendsTop, t.t('stats.friends', { n: progress.twoPlayerGames }), textStyle(TEXT_STYLE.bodySize, COLORS.textDim)).setOrigin(0.5, 0).setName('stats-friends'),
    );
    for (const o of this.objects) o.setDepth(PANEL.depth);
  }

  private totals(progress: PoolProgress, story: StoryProgress, left: number, top: number, inner: number): void {
    const c = STATS_PANEL.totals;
    const played = AI_LEVEL_IDS.reduce((sum, level) => sum + progress.vsComputer[level].played, 0);
    const wins = computerWins(progress);
    const values: Record<(typeof TOTALS)[number], string> = {
      games: String(played),
      wins: String(wins),
      // No games yet: a dash, not 0%.
      rate: played > 0 ? `${Math.round((100 * wins) / played)}%` : '–',
      streak: String(progress.streak.best),
      stars: `${totalStars(story)}/${MAX_STARS}`,
    };
    const w = (inner - (TOTALS.length - 1) * c.gap) / TOTALS.length;
    TOTALS.forEach((id, i) => {
      const cx = left + i * (w + c.gap) + w / 2;
      const bg = this.scene.add.image(cx, top + c.height / 2, cardTexture(this.scene, w, c.height, false));
      const number = this.scene.add
        .text(cx, top + c.numberTop, values[id], { ...textStyle(c.numberSize, c.numberColor), fontStyle: 'bold' })
        .setOrigin(0.5, 0)
        .setName(`stats-total-${id}`);
      const label = this.scene.add
        .text(cx, number.y + number.height + c.labelGap, this.t.t(`stats.total.${id}`, { n: progress.streak.current }), {
          ...textStyle(TEXT_STYLE.labelSize, COLORS.textDim),
          align: 'center',
          wordWrap: { width: w - 2 * c.labelPad },
        })
        .setOrigin(0.5, 0);
      this.objects.push(bg, number, label);
    });
  }

  /** One computer player: face, name and level, win bar, `won/played`, and a crown once beaten. */
  private row(level: AiLevel, record: LevelRecord, left: number, top: number, inner: number): void {
    const r = STATS_PANEL.rows;
    const t = this.t;
    const midY = top + r.height / 2;
    const character = COMPUTER_CHARACTERS[level];
    const bg = this.scene.add.image(left + inner / 2, midY, cardTexture(this.scene, inner, r.height, false)).setName(`stats-${level}`);
    const face = new Face(this.scene, left + r.faceInset + r.faceRadius, midY, r.faceRadius, `stats-${level}-face`).show(character);
    const textX = left + r.faceInset + 2 * r.faceRadius + r.nameGap;
    const name = this.scene.add.text(textX, midY, character.name, { ...textStyle(TEXT_STYLE.playerSize), fontStyle: 'bold' }).setOrigin(0, 1);
    const levelText = this.scene.add.text(textX, midY, t.t(`level.${level}`), textStyle(TEXT_STYLE.labelSize, COLORS.accent)).setOrigin(0, 0);
    const barX = left + r.barLeft;
    const barW = inner - r.barLeft - r.barRight;
    const bar = this.scene.add.graphics();
    bar.fillStyle(r.track, 1).fillRoundedRect(barX, midY - r.barHeight / 2, barW, r.barHeight, r.barHeight / 2);
    const share = record.played > 0 ? record.won / record.played : 0;
    // A sliver too short to round is left out rather than drawn as a dot.
    if (share * barW >= r.barHeight) bar.fillStyle(r.fill, 1).fillRoundedRect(barX, midY - r.barHeight / 2, share * barW, r.barHeight, r.barHeight / 2);
    const recordText = this.scene.add
      .text(barX + barW + r.recordGap, midY, `${record.won}/${record.played}`, { ...textStyle(TEXT_STYLE.playerSize), fontStyle: 'bold' })
      .setOrigin(0, 0.5)
      .setName(`stats-${level}-record`);
    this.objects.push(bg, ...face.objects, name, levelText, bar, recordText);
    if (record.won > 0) {
      this.objects.push(
        this.scene.add
          .image(left + inner - r.crownInset - r.crownSize / 2, midY, badgeTexture(this.scene, 'crown', r.crownSize))
          .setName(`stats-${level}-crown`),
      );
    }
  }

  destroy(): void {
    this.panel.destroy();
    for (const o of this.objects) o.destroy();
    this.objects.length = 0;
  }
}
