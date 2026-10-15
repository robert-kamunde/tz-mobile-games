import * as Phaser from 'phaser';
import { SUPPORTED_LOCALES, type Translator } from '@tzg/core';
import { getServices, onBackButton, registerTestProbe } from '@tzg/shell';
import { BUTTON, HANDS, LANGUAGE_PANEL, LOOK_PICKER, MENU, PANEL } from '../config/layout';
import { moveStoryGame, type PoolSlots } from '../progress/slots';
import { BACKGROUND_IDS, isBackgroundId } from '../config/backgrounds';
import { CUE_IDS, isCueId } from '../config/cues';
import { TABLE_IDS, isTableId } from '../config/tables';
import { MatchSetup } from './MatchSetup';
import { LookPicker } from './LookPicker';
import { MENU_PICTURE_KEY, logoTexture, menuBackgroundTexture } from './art/menuArt';
import { lookTexture } from './art/lookArt';
import { getPoolSlots } from './poolSlots';
import { SCENE_KEYS } from './sceneKeys';
import type { StoryStart } from './StoryScene';
import { computerWins } from '../progress/progress';
import { lockedBy } from '../progress/story';
import { lockedCharacters, needText } from './storyText';
import { setUpReminders } from './reminderSetup';
import type { TableStart } from './TableScene';
import { Panel, addButton } from './ui';
import { StatsPanel } from './StatsPanel';
import { UnlockPopup } from './UnlockPopup';
import { announceUnlocks, takeFresh } from './unlockFlow';
import { hasFresh, type UnlockKind } from '../progress/unlocks';
import { loadPortraitFiles } from './art/portraitFiles';
import { loadArtFiles } from './art/artFiles';

const LOOK_KINDS: readonly UnlockKind[] = ['table', 'cue', 'background'];

/** Which menu panel is open, if any. Settings reopens itself after a language change. */
/** Sound is on or off for now; a volume slider can come with real sounds. */
const SOUND_ON_VOLUME = 1;

type MenuPanel = 'stats' | 'rules' | 'settings' | 'exit' | 'language';
/** The main page, CHEZA (ways to play) or Mapambo (tables, cues, scenery). */
export type MenuPage = 'main' | 'play' | 'looks';

export interface MenuStart {
  readonly panel?: MenuPanel;
  readonly page?: MenuPage;
}

/** `dot`: something new inside (an unlocked look not yet looked at, 0.35.0). */
type Item = { id: string; label?: string; dot?: boolean; onTap: () => void };

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
  private panel: Panel | StatsPanel | null = null;
  private openPanel: MenuPanel | null = null;
  private hasSavedGame = false;
  private unlockPopup!: UnlockPopup;
  /** Menu buttons showing a new-unlock dot (tests). */
  private newDots = new Set<string>();
  private page: MenuPage = 'main';

  constructor() {
    super(MenuScene.KEY);
  }

  preload(): void {
    loadPortraitFiles(this);
    loadArtFiles(this);
  }

  create(data: MenuStart = {}): void {
    const services = getServices(this);
    this.t = services.translator;
    this.slots = getPoolSlots(this);
    this.panel = null;
    this.openPanel = null;
    this.page = data.page ?? 'main';
    this.newDots = new Set();
    // Loading also checks the saves: a damaged one is backed up and no Continue is offered.
    moveStoryGame(this.slots);
    setUpReminders(getServices(this), this.slots);
    const savedQuick = this.slots.match.load().data !== null;
    const savedStory = this.slots.storyMatch.load().data !== null;
    this.hasSavedGame = savedQuick || savedStory;

    const t = this.t;
    // `picture` tells tests whether Robert's pictures (art/) are showing rather than the drawn art.
    const background = menuBackgroundTexture(this);
    this.add.image(0, 0, background).setOrigin(0).setName('menu-background').setData('picture', background === MENU_PICTURE_KEY);
    const logo = logoTexture(this, t.t('menu.title'));
    this.add.image(MENU.x, MENU.titleY, logo.key).setDisplaySize(logo.width, logo.height).setName('menu-title').setData('picture', logo.picture);
    if (this.page === 'main') this.mainPage(services.exit, savedQuick || savedStory);
    else this.subPage(this.page === 'play' ? this.playItems(savedQuick, savedStory) : this.looksItems());

    this.setup = new MatchSetup(this, t, PANEL.overMenu, (choice) => this.startTable(choice), () =>
      lockedCharacters(t, { story: this.slots.story.load().data, wins: computerWins(this.slots.progress.load().data) }),
      () => this.slots.progress.load().data.vsComputer,
      () => takeFresh(this.slots, 'character'),
    );
    this.unlockPopup = new UnlockPopup(this, t);
    // A brand-new install asks for the language first (0.37.0); otherwise unlocks not shown yet
    // (the app closed before their popup) show here.
    if (!services.getSettings().languageChosen) this.askLanguage();
    else announceUnlocks(this.slots, this.unlockPopup);
    this.looks = new LookPicker(this, PANEL.overMenu);
    if (data.panel) this.showPanel(data.panel);
    // Back steps back through choosing a game or closes a panel; on the menu itself it leaves the app.
    onBackButton(this, () => {
      // The first-launch language choice waits for an answer.
      if (this.openPanel === 'language') return true;
      if (this.unlockPopup.goBack()) return true;
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
      newDots: [...this.newDots],
      unlockShown: this.unlockPopup.current,
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
      { name: 'menu-playMenu', label: t.t('menu.playMenu'), primary: true, onTap: () => this.showPage('play') },
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
        { id: 'looks', dot: hasFresh(this.slots.unlocks.load().data, LOOK_KINDS), onTap: () => this.showPage('looks') },
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
    const kinds = [
      { id: 'tables', kind: 'table', ids: TABLE_IDS },
      { id: 'cues', kind: 'cue', ids: CUE_IDS },
      { id: 'backgrounds', kind: 'background', ids: BACKGROUND_IDS },
    ] as const;
    const unlocks = this.slots.unlocks.load().data;
    return kinds.map(({ id, kind }) => [
      {
        id,
        dot: hasFresh(unlocks, [kind]),
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
        const y = firstY + i * spacing;
        const button = addButton(this, x, y, { name: `menu-${item.id}`, label: item.label ?? this.t.t(`menu.${item.id}`), onTap: item.onTap }, { width });
        if (item.dot) {
          const d = MENU.newDot;
          this.add
            .circle(x + width / 2 - d.inset, y - button.height / 2 + d.inset, d.radius, d.color)
            .setStrokeStyle(d.outlineWidth, d.outline)
            .setName(`menu-${item.id}-newDot`);
          this.newDots.add(item.id);
        }
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
    // Newly unlocked looks are marked MPYA this once; the dots on the menu go when it closes.
    const fresh = takeFresh(this.slots, kind);
    const close = () => {
      this.looks.hide();
      if (fresh.size > 0) this.showPage(this.page);
    };
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
            texture: lookTexture(this, 'table', id),
            fresh: fresh.has(id),
            ...locked('table', id),
          }))
        : kind === 'cue'
          ? CUE_IDS.map((id) => ({ id, label: t.t(`cue.${id}`), texture: lookTexture(this, 'cue', id), fresh: fresh.has(id), ...locked('cue', id) }))
          : BACKGROUND_IDS.map((id) => ({
              id,
              label: t.t(`background.${id}`),
              texture: lookTexture(this, 'background', id),
              fresh: fresh.has(id),
              ...locked('background', id),
            }));
    const open = items.filter((item) => !('locked' in item)).length;
    this.looks.show({
      prefix: kind,
      title: t.t(`${kind}s.title`),
      items,
      layout: LOOK_PICKER[kind],
      // How many are open shows here rather than on the Mapambo buttons (Robert, 2026-10-14).
      progress: { open, total: items.length, label: t.t('looks.open', { n: open, total: items.length }) },
      newLabel: t.t('unlock.new'),
      selected: kind === 'table' ? progress.table : kind === 'cue' ? progress.cue : progress.background,
      confirmLabel: t.t('looks.choose'),
      backLabel: t.t('ui.back'),
      onConfirm: (id) => {
        const latest = this.slots.progress.load().data;
        if (kind === 'table' && isTableId(id)) this.slots.progress.save({ ...latest, table: id });
        if (kind === 'cue' && isCueId(id)) this.slots.progress.save({ ...latest, cue: id });
        if (kind === 'background' && isBackgroundId(id)) this.slots.progress.save({ ...latest, background: id });
        close();
      },
      onBack: close,
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
      this.panel = new StatsPanel(this, t, PANEL.overMenu, this.slots.progress.load().data, this.slots.story.load().data, () => this.closePanel());
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

  /**
   * First launch only: "Chagua lugha / Choose language" with Kiswahili and English. The choice is
   * saved, never asked again, and the menu is drawn again in that language.
   */
  private askLanguage(): void {
    const services = getServices(this);
    const choose = (locale: 'sw' | 'en') => {
      services.updateSettings({ locale, languageChosen: true });
      this.scene.restart({} satisfies MenuStart);
    };
    this.openPanel = 'language';
    this.panel = new Panel(this, {
      name: 'languagePanel',
      area: LANGUAGE_PANEL.area,
      title: this.t.t('firstLanguage.title'),
      buttons: [
        { name: 'firstLanguage-sw', label: this.t.t('language.sw'), primary: true, onTap: () => choose('sw') },
        { name: 'firstLanguage-en', label: this.t.t('language.en'), primary: true, onTap: () => choose('en') },
      ],
      modal: true,
    });
  }

  private closePanel(): void {
    this.panel?.destroy();
    this.panel = null;
    this.openPanel = null;
  }
}
