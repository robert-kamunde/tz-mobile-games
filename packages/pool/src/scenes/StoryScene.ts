import * as Phaser from 'phaser';
import type { Translator } from '@tzg/core';
import { getServices, onBackButton, registerTestProbe } from '@tzg/shell';
import { DEFAULT_PICKS } from '../config/characters';
import { COLORS, PANEL, STORY_MAP, TEXT_STYLE } from '../config/layout';
import { STORY, STORY_STOPS, type StoryStop } from '../config/story';
import { playerCharacter } from '../progress/characters';
import type { PoolSlots } from '../progress/slots';
import { MAX_STARS, characterById, isStopOpen, rewardsFor, stopRival, titleFor, totalStars, type StoryProgress } from '../progress/story';
import { drawCup } from './art/backgroundArt';
import { canvasTexture } from './art/canvasArt';
import { menuBackgroundTexture } from './art/menuArt';
import { loadPortraitFiles } from './art/portraitFiles';
import { CharacterPicker } from './CharacterPicker';
import { Face } from './Face';
import type { MenuStart } from './MenuScene';
import { getPoolSlots } from './poolSlots';
import { SCENE_KEYS } from './sceneKeys';
import type { TableStart } from './TableScene';
import { Panel, addButton, textStyle } from './ui';

/** The map opens the same way every time. */
export type StoryStart = Record<string, never>;

const M = STORY_MAP;
const CUP_KEY = 'story-cup';

/**
 * Safari ya Bingwa's map (story mode, docs/STORY_MODE.md): the eight stops on a path, each with its
 * rival's face, place and best stars; stops not yet open are faded with a padlock. Tapping an open
 * stop shows its card (rival, level, how to earn each star) with Cheza. The first visit asks for the
 * journey's character. Stops are named `stop-<id>`, the card `stopCard` with `stopCard-play` and
 * `stopCard-back`, other buttons `story-back` and `story-change`.
 */
export class StoryScene extends Phaser.Scene {
  static readonly KEY = SCENE_KEYS.story;

  private t!: Translator;
  private slots!: PoolSlots;
  private card: { stop: string; panel: Panel } | null = null;
  private picker!: CharacterPicker;
  private choosing = false;

  constructor() {
    super(StoryScene.KEY);
  }

  preload(): void {
    loadPortraitFiles(this);
  }

  create(): void {
    this.t = getServices(this).translator;
    this.slots = getPoolSlots(this);
    this.card = null;
    this.choosing = false;
    this.picker = new CharacterPicker(this, PANEL.overMenu);
    this.drawMap();

    onBackButton(this, () => {
      if (this.choosing) return this.picker.goBack();
      if (this.card) {
        this.closeCard();
        return true;
      }
      this.openMenu();
      return true;
    });
    registerTestProbe('pool.story', () => {
      const story = this.journey;
      return {
        character: story.character,
        stars: story.stars,
        total: totalStars(story),
        title: titleFor(story),
        rewards: rewardsFor(story),
        open: STORY_STOPS.filter((s) => isStopOpen(story, s.id)).map((s) => s.id),
        card: this.card?.stop ?? null,
        choosing: this.choosing,
        selectedCharacter: this.picker.selected,
      };
    });
    if (!this.journey.character) this.chooseCharacter(true);
  }

  private get journey(): StoryProgress {
    return this.slots.story.load().data;
  }

  private drawMap(): void {
    const t = this.t;
    const story = this.journey;
    this.add.image(0, 0, menuBackgroundTexture(this)).setOrigin(0);
    this.add.rectangle(0, 0, this.scale.width, this.scale.height, M.dim.color, M.dim.alpha).setOrigin(0);
    this.add.text(M.title.x, M.title.y, t.t('story.title'), textStyle(TEXT_STYLE.titleSize, COLORS.accent)).setOrigin(0.5).setName('story-title');

    // The person, their title and stars.
    const person = playerCharacter(story.character ?? DEFAULT_PICKS[0])!;
    new Face(this, M.person.x, M.person.y, M.person.faceRadius, 'story-person').show(person);
    const title = titleFor(story);
    this.add
      .text(M.person.textX, M.person.y, [person.name, title ? t.t(`story.title.${title}`) : '', t.t('story.starsTotal', { stars: totalStars(story), max: MAX_STARS })].filter(Boolean).join('\n'), {
        ...textStyle(TEXT_STYLE.bodySize),
        lineSpacing: 2,
      })
      .setOrigin(0, 0.5)
      .setName('story-personText');
    addButton(this, M.change.right, M.change.y, { name: 'story-change', label: t.t('story.change'), onTap: () => this.chooseCharacter(false) }, {}).setOrigin(1, 0.5);

    this.drawPath();
    const cup = canvasTexture(this, CUP_KEY, M.cup.size, M.cup.size, (ctx, w, h) => drawCup(ctx, w / 2, h, h * 0.95, '#ffe58a', '#9a6f1c'));
    STORY_STOPS.forEach((stop, i) => this.drawStop(stop, M.stops[i]!, story, cup));
    this.drawRewards(story);
    addButton(this, M.back.left, M.back.y, { name: 'story-back', label: t.t('ui.back'), onTap: () => this.openMenu() }).setOrigin(0, 0.5);
  }

  private drawPath(): void {
    const g = this.add.graphics().lineStyle(M.path.width, M.path.color, M.path.alpha);
    for (let i = 1; i < M.stops.length; i++) {
      const a = M.stops[i - 1]!;
      const b = M.stops[i]!;
      const length = Math.hypot(b.x - a.x, b.y - a.y);
      for (let d = 0; d < length; d += M.path.dash + M.path.gap) {
        const e = Math.min(length, d + M.path.dash);
        g.lineBetween(a.x + ((b.x - a.x) * d) / length, a.y + ((b.y - a.y) * d) / length, a.x + ((b.x - a.x) * e) / length, a.y + ((b.y - a.y) * e) / length);
      }
    }
  }

  private drawStop(stop: StoryStop, at: { x: number; y: number }, story: StoryProgress, cup: string): void {
    const open = isStopOpen(story, stop.id);
    const stars = story.stars[stop.id] ?? 0;
    const rival = characterById(stopRival(stop, story.character ?? DEFAULT_PICKS[0]))!;
    this.add.circle(at.x, at.y, M.stopRadius + M.ring.width).setStrokeStyle(M.ring.width, stars > 0 ? M.ring.won : M.ring.open, open ? 1 : 0.3);
    const face = new Face(this, at.x, at.y, M.stopRadius, `stop-${stop.id}`).show(rival);
    face.circle.setData('open', open).setData('stars', stars);
    if (open) {
      face.circle.setInteractive({ useHandCursor: true });
      face.circle.on('pointerup', (pointer: Phaser.Input.Pointer) => {
        if (!pointer.wasCanceled && !this.card && !this.choosing) this.openCard(stop);
      });
    } else {
      face.setAlpha(M.lockedAlpha);
      this.drawPadlock(at.x, at.y);
    }
    if (stars > 0) this.add.image(at.x + M.cup.dx, at.y + M.cup.dy, cup);
    const place = this.add
      .text(at.x, at.y + M.stopRadius + M.placeGap, stop.place, textStyle(TEXT_STYLE.bodySize))
      .setOrigin(0.5, 0)
      .setAlpha(open ? 1 : M.lockedAlpha);
    const sy = place.y + M.starsGap;
    for (let i = 0; i < STORY.maxStars; i++) {
      this.add
        .star(at.x + (i - 1) * M.star.spacing, sy, 5, M.star.inner, M.star.radius, i < stars ? M.star.lit : M.star.unlit)
        .setAlpha(open ? 1 : M.lockedAlpha);
    }
  }

  private drawPadlock(x: number, y: number): void {
    const p = M.padlock;
    const g = this.add.graphics();
    g.lineStyle(4, p.color, 1).beginPath().arc(x, y - p.height / 2, p.shackle, Math.PI, 0).strokePath();
    g.fillStyle(p.color, 1).fillRoundedRect(x - p.width / 2, y - p.height / 2, p.width, p.height, 3);
    g.fillStyle(COLORS.overlay, 1).fillCircle(x, y, 3);
  }

  /** The three story rewards along the bottom, earned or with what earns them. */
  private drawRewards(story: StoryProgress): void {
    const t = this.t;
    const earned = rewardsFor(story);
    (['table', 'cue', 'background'] as const).forEach((kind, i) => {
      const x = M.title.x + (i - 1) * M.rewards.spacing;
      const r = STORY.rewards[kind];
      const how = r.needsFinal ? t.t('story.needsFinal') : t.t('story.needsStars', { stars: r.stars });
      this.add
        .text(x, M.rewards.y, `${t.t(`story.rewardName.${kind}`)}\n${earned[kind] ? t.t('story.earned') : how}`, { ...textStyle(TEXT_STYLE.bodySize, earned[kind] ? COLORS.accent : COLORS.textDim), align: 'center' })
        .setOrigin(0.5)
        .setName(`story-reward-${kind}`);
    });
  }

  private openCard(stop: StoryStop): void {
    const t = this.t;
    const story = this.journey;
    const rival = characterById(stopRival(stop, story.character ?? DEFAULT_PICKS[0]))!;
    const best = story.stars[stop.id] ?? 0;
    const body = [
      t.t('story.rival', { name: rival.name, level: t.t(`level.${stop.level}`) }),
      '',
      t.t('story.star1'),
      t.t('story.star2'),
      t.t('story.star3', { balls: STORY.cleanWinBallsLeft }),
      ...(best > 0 ? ['', t.t('story.best', { stars: best })] : []),
    ].join('\n');
    const panel = new Panel(this, {
      name: 'stopCard',
      area: M.card,
      title: stop.place,
      body,
      buttons: [{ name: 'stopCard-play', label: t.t('story.play'), highlighted: true, onTap: () => this.play(stop) }],
      back: { name: 'stopCard-back', label: t.t('ui.back'), onTap: () => this.closeCard() },
    });
    this.card = { stop: stop.id, panel };
  }

  private closeCard(): void {
    this.card?.panel.destroy();
    this.card = null;
  }

  private play(stop: StoryStop): void {
    this.scene.start(SCENE_KEYS.table, { story: stop.id } satisfies TableStart);
  }

  /** The journey's character; `first` is the first visit, where Back leaves story mode. */
  private chooseCharacter(first: boolean): void {
    const t = this.t;
    this.closeCard();
    this.choosing = true;
    const story = this.journey;
    this.picker.show({
      title: t.t('story.chooseCharacter'),
      selected: story.character ?? this.slots.progress.load().data.lastPicks?.[0] ?? DEFAULT_PICKS[0],
      confirmLabel: t.t(first ? 'story.start' : 'story.confirm'),
      backLabel: t.t('ui.back'),
      onConfirm: (id) => {
        this.slots.story.save({ ...this.journey, character: id });
        this.scene.restart();
      },
      onBack: () => {
        this.picker.hide();
        this.choosing = false;
        if (first) this.openMenu();
      },
    });
  }

  private openMenu(): void {
    this.scene.start(SCENE_KEYS.menu, {} satisfies MenuStart);
  }
}
