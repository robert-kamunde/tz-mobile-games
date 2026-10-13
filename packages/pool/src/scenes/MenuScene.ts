import * as Phaser from 'phaser';
import { SUPPORTED_LOCALES, type Translator } from '@tzg/core';
import { getServices, onBackButton, registerTestProbe } from '@tzg/shell';
import { AI_LEVEL_IDS } from '../config/ai';
import { COMPUTER_CHARACTERS } from '../config/characters';
import { BUTTON, COLORS, HANDS, LOOK_PICKER, MENU, PANEL, TABLE_LAYOUT, TEXT_STYLE } from '../config/layout';
import { moveStoryGame, type PoolSlots } from '../progress/slots';
import { CUE_ART, TABLE_ART } from '../config/art';
import { BACKGROUNDS, BACKGROUND_IDS, isBackgroundId } from '../config/backgrounds';
import { CUE_IDS, CUE_STYLES, isCueId } from '../config/cues';
import { UK_7FT_TABLE } from '../config/table';
import { TABLE_IDS, TABLE_THEMES, isTableId } from '../config/tables';
import { buildTableGeometry } from '../physics/geometry';
import { MatchSetup } from './MatchSetup';
import { LookPicker } from './LookPicker';
import { backgroundTexture, type PreviewTable } from './art/backgroundArt';
import { cueTexture } from './art/cueArt';
import { logoTexture, menuBackgroundTexture } from './art/menuArt';
import { tableTexture } from './art/tableTexture';
import { getPoolSlots } from './poolSlots';
import { SCENE_KEYS } from './sceneKeys';
import type { StoryStart } from './StoryScene';
import { computerWins } from '../progress/progress';
import { lockedBy } from '../progress/story';
import { lockedCharacters, needText } from './storyText';
import { setUpReminders } from './reminderSetup';
import type { TableStart } from './TableScene';
import { Panel, addButton, textStyle } from './ui';
import { loadPortraitFiles } from './art/portraitFiles';

/** Which menu panel is open, if any. Settings reopens itself after a language change. */
/** Sound is on or off for now; a volume slider can come with real sounds. */
const SOUND_ON_VOLUME = 1;

type MenuPanel = 'stats' | 'rules' | 'settings' | 'exit';
/** The main page, CHEZA (ways to play) or Mapambo (tables, cues, scenery). */
export type MenuPage = 'main' | 'play' | 'looks';

export interface MenuStart {
  readonly panel?: MenuPanel;
  readonly page?: MenuPage;
}

type Item = { id: string; label?: string; onTap: () => void };

/**
 * The first screen: CHEZA (Continue, Quick game, journey), Mapambo (tables, cues, scenery), Stats, Rules,
 * Settings, and Exit in the Android app. Buttons are named `menu-<item>`; Rudi on a sub page is `menu-back`.
 */
export class MenuScene extends Phaser.Scene {
  static readonly KEY = SCENE_KEYS.menu;

  private t!: Translator;
  private slots!: PoolSlots;
  private setup!: MatchSetup;
  private looks!: LookPicker;
  private panel: Panel | null = null;
  private openPanel: MenuPanel | null = null;
  private hasSavedGame = false;
  private page: MenuPage = 'main';

  constructor() {
    super(MenuScene.KEY);
  }

  preload(): void {
    loadPortraitFiles(this);
  }

  create(data: MenuStart = {}): void {
    const services = getServices(this);
    this.t = services.translator;
    this.slots = getPoolSlots(this);
    this.panel = null;
    this.openPanel = null;
    this.page = data.page ?? 'main';
    // Loading also checks the saves: a damaged one is backed up and no Continue is offered.
    moveStoryGame(this.slots);
    setUpReminders(getServices(this), this.slots);
    const savedQuick = this.slots.match.load().data !== null;
    const savedStory = this.slots.storyMatch.load().data !== null;
    this.hasSavedGame = savedQuick || savedStory;

    const t = this.t;
    this.add.image(0, 0, menuBackgroundTexture(this)).setOrigin(0).setName('menu-background');
    this.add.image(MENU.x, MENU.titleY, logoTexture(this, t.t('menu.title'))).setName('menu-title');
    if (this.page === 'main') this.mainPage(services.exit, savedQuick || savedStory);
    else this.subPage(this.page === 'play' ? this.playItems(savedQuick, savedStory) : this.looksItems());

    this.setup = new MatchSetup(this, t, PANEL.overMenu, (choice) => this.startTable(choice), () =>
      lockedCharacters(t, { story: this.slots.story.load().data, wins: computerWins(this.slots.progress.load().data) }),
    );
    this.looks = new LookPicker(this, PANEL.overMenu);
    if (data.panel) this.showPanel(data.panel);
    // Back steps back through choosing a game or closes a panel; on the menu itself it leaves the app.
    onBackButton(this, () => {
      if (this.setup.goBack()) return true;
      if (this.looks.goBack()) return true;
      if (!this.panel && this.page !== 'main') {
        this.showPage('main');
        return true;
      }
      if (!this.panel) return false;
      this.closePanel();
      return true;
    });

    registerTestProbe('pool.menu', () => ({
      continueShown: savedQuick,
      continueStoryShown: savedStory,
      page: this.page,
      savedDot: this.page === 'main' && this.hasSavedGame,
      panel: this.setup.step === 'opponent' ? 'picker' : this.setup.step === 'characters' ? 'characters' : this.looks.showing ? `${this.looks.showing}s` : this.openPanel,
      selectedTable: this.looks.showing === 'table' ? this.looks.selected : null,
      selectedCue: this.looks.showing === 'cue' ? this.looks.selected : null,
      selectedBackground: this.looks.showing === 'background' ? this.looks.selected : null,
      lookPage: this.looks.page,
      lookPages: this.looks.pages,
      table: this.slots.progress.load().data.table,
      cue: this.slots.progress.load().data.cue,
      hand: this.slots.progress.load().data.hand,
      background: this.slots.progress.load().data.background,
      selectedCharacter: this.setup.selectedCharacter,
      locale: this.t.locale,
    }));
  }

  /** CHEZA big on top, then pairs; a dot on CHEZA says a game or journey is waiting inside. */
  private mainPage(exit: { available: boolean; exit: () => void }, saved: boolean): void {
    const t = this.t;
    const m = MENU.main;
    const play = addButton(
      this,
      MENU.x,
      m.playY,
      { name: 'menu-playMenu', label: t.t('menu.playMenu'), onTap: () => this.showPage('play') },
      { width: m.playWidth, fontSize: m.playFontSize },
    );
    if (saved) {
      const d = MENU.savedDot;
      this.add
        .circle(MENU.x + m.playWidth / 2 - d.inset, m.playY - play.height / 2 + d.inset, d.radius, d.color)
        .setStrokeStyle(d.outlineWidth, d.outline)
        .setName('menu-savedDot');
    }
    const rows: Item[][] = [
      [
        { id: 'looks', onTap: () => this.showPage('looks') },
        { id: 'stats', onTap: () => this.showPanel('stats') },
      ],
      [
        { id: 'rules', onTap: () => this.showPanel('rules') },
        { id: 'settings', onTap: () => this.showPanel('settings') },
      ],
      // A web page cannot close itself, so Exit is only offered in the app. A game in progress is
      // already saved, so the popup only reassures; with none, Exit closes at once.
      ...(exit.available ? [[{ id: 'exit', onTap: () => (this.hasSavedGame ? this.showPanel('exit') : exit.exit()) }]] : []),
    ];
    this.addRows(rows, m.firstRowY, m.rowSpacing);
  }

  /** A sub page: its buttons in a column (Continue may share a row), then Rudi to the main page. */
  private subPage(rows: Item[][]): void {
    this.addRows([...rows, [{ id: 'back', label: this.t.t('ui.back'), onTap: () => this.showPage('main') }]], MENU.sub.firstButtonY, MENU.sub.buttonSpacing);
  }

  private playItems(savedQuick: boolean, savedStory: boolean): Item[][] {
    return [
      // A Quick game and a story game can both be waiting; each has its own Continue.
      ...(savedQuick || savedStory
        ? [
            [
              ...(savedQuick ? [{ id: 'continue', onTap: () => this.startTable({ resume: 'quick' }) }] : []),
              ...(savedStory ? [{ id: 'continueStory', onTap: () => this.startTable({ resume: 'story' }) }] : []),
            ],
          ]
        : []),
      [
        {
          id: 'play',
          onTap: () => {
            const progress = this.slots.progress.load().data;
            this.setup.show(progress.lastOpponent, progress.lastPicks, () => undefined);
          },
        },
      ],
      [{ id: 'story', onTap: () => this.scene.start(SCENE_KEYS.story, {} satisfies StoryStart) }],
    ];
  }

  /** Each kind shows how many of its looks are open, e.g. "Meza  3/14". */
  private looksItems(): Item[][] {
    const t = this.t;
    const played = { story: this.slots.story.load().data, wins: computerWins(this.slots.progress.load().data) };
    const kinds = [
      { id: 'tables', kind: 'table', ids: TABLE_IDS },
      { id: 'cues', kind: 'cue', ids: CUE_IDS },
      { id: 'backgrounds', kind: 'background', ids: BACKGROUND_IDS },
    ] as const;
    return kinds.map(({ id, kind, ids }) => [
      {
        id,
        label: t.t('menu.count', { name: t.t(`menu.${id}`), n: ids.filter((look) => !lockedBy(kind, look, played)).length, total: ids.length }),
        onTap: () => this.showLooks(kind),
      },
    ]);
  }

  private addRows(rows: Item[][], firstY: number, spacing: number): void {
    rows.forEach((row, i) => {
      const rowWidth = row.length > 1 ? MENU.pairRowWidth : BUTTON.width;
      const width = (rowWidth - (row.length - 1) * MENU.pairGap) / row.length;
      row.forEach((item, j) => {
        const x = MENU.x - rowWidth / 2 + width / 2 + j * (width + MENU.pairGap);
        addButton(this, x, firstY + i * spacing, { name: `menu-${item.id}`, label: item.label ?? this.t.t(`menu.${item.id}`), onTap: item.onTap }, { width });
      });
    });
  }

  private showPage(page: MenuPage): void {
    this.scene.restart({ page } satisfies MenuStart);
  }

  /**
   * Meza or Fimbo: the choice is saved at once and used from the next time the table opens (a game
   * in progress included). Pictures are drawn on first open; a scene restart reuses them.
   */
  private showLooks(kind: 'table' | 'cue' | 'background'): void {
    const t = this.t;
    const progress = this.slots.progress.load().data;
    const played = { story: this.slots.story.load().data, wins: computerWins(progress) };
    const geometry = buildTableGeometry(UK_7FT_TABLE);
    // Locked looks show with what earns them, until earned.
    const locked = (kind: 'table' | 'cue' | 'background', id: string) => {
      const reward = lockedBy(kind, id, played);
      return reward ? { locked: needText(t, reward.need) } : {};
    };
    const items =
      kind === 'table'
        ? TABLE_IDS.map((id) => ({
            id,
            label: t.t(`table.${id}`),
            texture: tableTexture(this, geometry, UK_7FT_TABLE, TABLE_THEMES[id], TABLE_ART.previewScale).key,
            ...locked('table', id),
          }))
        : kind === 'cue'
          ? CUE_IDS.map((id) => ({ id, label: t.t(`cue.${id}`), texture: cueTexture(this, CUE_STYLES[id], CUE_ART.previewScale), ...locked('cue', id) }))
          : BACKGROUND_IDS.map((id) => ({
              id,
              label: t.t(`background.${id}`),
              texture: backgroundTexture(this, BACKGROUNDS[id], previewTable(geometry.length)),
              ...locked('background', id),
            }));
    this.looks.show({
      prefix: kind,
      title: t.t(`${kind}s.title`),
      items,
      layout: LOOK_PICKER[kind],
      selected: kind === 'table' ? progress.table : kind === 'cue' ? progress.cue : progress.background,
      confirmLabel: t.t('looks.choose'),
      backLabel: t.t('ui.back'),
      onConfirm: (id) => {
        const latest = this.slots.progress.load().data;
        if (kind === 'table' && isTableId(id)) this.slots.progress.save({ ...latest, table: id });
        if (kind === 'cue' && isCueId(id)) this.slots.progress.save({ ...latest, cue: id });
        if (kind === 'background' && isBackgroundId(id)) this.slots.progress.save({ ...latest, background: id });
        this.looks.hide();
      },
      onBack: () => this.looks.hide(),
    });
  }

  private startTable(start: TableStart): void {
    this.scene.start(SCENE_KEYS.table, start);
  }

  private showPanel(kind: MenuPanel): void {
    this.closePanel();
    const t = this.t;
    const back = { name: `${kind}-back`, label: t.t('ui.back'), onTap: () => this.closePanel() };
    const common = { name: `${kind}Panel`, area: PANEL.overMenu, title: t.t(`${kind}.title`), back };
    if (kind === 'stats') {
      const progress = this.slots.progress.load().data;
      const lines = AI_LEVEL_IDS.map((level) => t.t('stats.vsComputer', { name: COMPUTER_CHARACTERS[level].name, level: t.t(`level.${level}`), ...progress.vsComputer[level] }));
      lines.push(t.t('stats.twoPlayers', { n: progress.twoPlayerGames }));
      this.panel = new Panel(this, { ...common, body: lines.join('\n') });
    } else if (kind === 'exit') {
      const exit = getServices(this).exit;
      this.panel = new Panel(this, { ...common, body: t.t('exit.body'), buttons: [{ name: 'exit-confirm', label: t.t('exit.confirm'), onTap: () => exit.exit() }] });
    } else if (kind === 'rules') {
      this.panel = new Panel(this, { ...common, body: t.t('rules.body') });
    } else {
      const services = getServices(this);
      // Each change is saved at once; the menu is redrawn (in the new language) with Settings still open.
      const change = (update: Parameters<typeof services.updateSettings>[0]) => {
        services.updateSettings(update);
        this.scene.restart({ panel: 'settings' } satisfies MenuStart);
      };
      const soundOn = services.getSettings().soundVolume > 0;
      this.panel = new Panel(this, {
        ...common,
        rows: [
          {
            label: t.t('settings.language'),
            choices: SUPPORTED_LOCALES.map((locale) => ({
              name: `language-${locale}`,
              label: t.t(`language.${locale}`),
              highlighted: locale === t.locale,
              onTap: () => {
                if (locale !== t.locale) change({ locale });
              },
            })),
          },
          {
            label: t.t('settings.sound'),
            choices: [
              { name: 'sound-on', label: t.t('settings.on'), highlighted: soundOn, onTap: () => {
                  if (!soundOn) change({ soundVolume: SOUND_ON_VOLUME });
                },
              },
              { name: 'sound-off', label: t.t('settings.off'), highlighted: !soundOn, onTap: () => {
                  if (soundOn) change({ soundVolume: 0 });
                },
              },
            ],
          },
          {
            // Left-handed players get the power bar and spin on the left; kept with the pool progress.
            label: t.t('settings.hand'),
            choices: HANDS.map((hand) => ({
              name: `hand-${hand}`,
              label: t.t(`hand.${hand}`),
              highlighted: hand === this.slots.progress.load().data.hand,
              onTap: () => {
                const progress = this.slots.progress.load().data;
                if (hand === progress.hand) return;
                this.slots.progress.save({ ...progress, hand });
                this.scene.restart({ panel: 'settings' } satisfies MenuStart);
              },
            })),
          },
          // Play reminders, only where the phone can show them (the Android app).
          ...(services.reminders.available ? [this.remindersRow()] : []),
        ],
      });
    }
    this.openPanel = kind;
  }

  /** Vikumbusho: on asks the phone for permission when it was not given; off removes the waiting reminder. */
  private remindersRow() {
    const t = this.t;
    const services = getServices(this);
    const on = this.slots.reminders.load().data.on;
    const set = (wanted: boolean) => {
      if (wanted === on) return;
      this.slots.reminders.save({ ...this.slots.reminders.load().data, on: wanted, asked: true });
      if (wanted) {
        void services.reminders.allowed().then((allowed) => (allowed ? undefined : services.reminders.ask()));
      } else {
        void services.reminders.replace(null);
      }
      this.scene.restart({ panel: 'settings' } satisfies MenuStart);
    };
    return {
      label: t.t('settings.reminders'),
      choices: [
        { name: 'reminders-on', label: t.t('settings.on'), highlighted: on, onTap: () => set(true) },
        { name: 'reminders-off', label: t.t('settings.off'), highlighted: !on, onTap: () => set(false) },
      ],
    };
  }

  private closePanel(): void {
    this.panel?.destroy();
    this.panel = null;
    this.openPanel = null;
  }
}

/** Where the table sits on the table screen (right hand, rails included), for the background previews. */
function previewTable(length: number): PreviewTable {
  const l = TABLE_LAYOUT;
  const playHeight = UK_7FT_TABLE.playWidth * l.scale;
  return { left: l.originX - l.railWidth, top: l.originY - l.railWidth, width: length * l.scale + 2 * l.railWidth, height: playHeight + 2 * l.railWidth };
}
