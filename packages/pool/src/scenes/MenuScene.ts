import * as Phaser from 'phaser';
import { SUPPORTED_LOCALES, type Translator } from '@tzg/core';
import { getServices, onBackButton, registerTestProbe } from '@tzg/shell';
import { AI_LEVEL_IDS } from '../config/ai';
import { COMPUTER_CHARACTERS } from '../config/characters';
import { BUTTON, COLORS, MENU, PANEL, TEXT_STYLE } from '../config/layout';
import type { PoolSlots } from '../progress/slots';
import { UK_7FT_TABLE } from '../config/table';
import { buildTableGeometry } from '../physics/geometry';
import { MatchSetup } from './MatchSetup';
import { TablePicker } from './TablePicker';
import { getPoolSlots } from './poolSlots';
import { SCENE_KEYS } from './sceneKeys';
import type { TableStart } from './TableScene';
import { Panel, addButton, textStyle } from './ui';

/** Which menu panel is open, if any. Settings reopens itself after a language change. */
/** Sound is on or off for now; a volume slider can come with real sounds. */
const SOUND_ON_VOLUME = 1;

type MenuPanel = 'stats' | 'rules' | 'settings' | 'exit';

export interface MenuStart {
  readonly panel?: MenuPanel;
}

/**
 * The first screen: Continue (only when a game is saved), Play (opponent, then characters), Stats, Rules and
 * Settings (language), and Exit in the Android app. Buttons are named `menu-<item>`.
 */
export class MenuScene extends Phaser.Scene {
  static readonly KEY = SCENE_KEYS.menu;

  private t!: Translator;
  private slots!: PoolSlots;
  private setup!: MatchSetup;
  private tables!: TablePicker;
  private panel: Panel | null = null;
  private openPanel: MenuPanel | null = null;
  private hasSavedGame = false;

  constructor() {
    super(MenuScene.KEY);
  }

  create(data: MenuStart = {}): void {
    const services = getServices(this);
    this.t = services.translator;
    this.slots = getPoolSlots(this);
    this.panel = null;
    this.openPanel = null;
    // Loading also checks the save: a damaged one is backed up and no Continue is offered.
    this.hasSavedGame = this.slots.match.load().data !== null;

    const t = this.t;
    this.add.text(MENU.x, MENU.titleY, t.t('menu.title'), textStyle(TEXT_STYLE.titleSize, COLORS.accent)).setOrigin(0.5).setName('menu-title');
    const items: { id: string; onTap: () => void }[] = [
      ...(this.hasSavedGame ? [{ id: 'continue', onTap: () => this.startTable({ resume: true }) }] : []),
      {
        id: 'play',
        onTap: () => {
          const progress = this.slots.progress.load().data;
          this.setup.show(progress.lastOpponent, progress.lastPicks, () => undefined);
        },
      },
      { id: 'tables', onTap: () => this.showTables() },
      { id: 'stats', onTap: () => this.showPanel('stats') },
      { id: 'rules', onTap: () => this.showPanel('rules') },
      { id: 'settings', onTap: () => this.showPanel('settings') },
      // A web page cannot close itself, so Exit is only offered in the app. A game in progress is
      // already saved, so the popup only reassures; with none, Exit closes at once.
      ...(services.exit.available ? [{ id: 'exit', onTap: () => (this.hasSavedGame ? this.showPanel('exit') : services.exit.exit()) }] : []),
    ];
    items.forEach((item, i) =>
      addButton(this, MENU.x, MENU.firstButtonY + i * MENU.buttonSpacing, { name: `menu-${item.id}`, label: t.t(`menu.${item.id}`), onTap: item.onTap }, { width: BUTTON.width }),
    );
    this.add
      .text(MENU.placeholder.right, MENU.placeholder.y, t.t('pool.placeholder'), textStyle(TEXT_STYLE.labelSize, COLORS.textDim))
      .setOrigin(1, 0.5)
      .setName('placeholderLabel');

    this.setup = new MatchSetup(this, t, PANEL.overMenu, (choice) => this.startTable(choice));
    this.tables = new TablePicker(this, t, PANEL.overMenu, buildTableGeometry(UK_7FT_TABLE), UK_7FT_TABLE);
    if (data.panel) this.showPanel(data.panel);
    // Back steps back through choosing a game or closes a panel; on the menu itself it leaves the app.
    onBackButton(this, () => {
      if (this.setup.goBack()) return true;
      if (this.tables.goBack()) return true;
      if (!this.panel) return false;
      this.closePanel();
      return true;
    });

    registerTestProbe('pool.menu', () => ({
      continueShown: this.hasSavedGame,
      panel: this.setup.step === 'opponent' ? 'picker' : this.setup.step === 'characters' ? 'characters' : this.tables.visible ? 'tables' : this.openPanel,
      selectedTable: this.tables.selected,
      table: this.slots.progress.load().data.table,
      selectedCharacter: this.setup.selectedCharacter,
      locale: this.t.locale,
    }));
  }

  /** Meza: the chosen table is saved at once and used from the next time the table opens. */
  private showTables(): void {
    const progress = this.slots.progress.load().data;
    this.tables.show(
      progress.table,
      (table) => {
        this.slots.progress.save({ ...this.slots.progress.load().data, table });
        this.tables.hide();
      },
      () => this.tables.hide(),
    );
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
        ],
      });
    }
    this.openPanel = kind;
  }

  private closePanel(): void {
    this.panel?.destroy();
    this.panel = null;
    this.openPanel = null;
  }
}
