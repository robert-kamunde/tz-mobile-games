import * as Phaser from 'phaser';
import { SUPPORTED_LOCALES, type Translator } from '@tzg/core';
import { getServices, registerTestProbe } from '@tzg/shell';
import { AI_LEVEL_IDS } from '../config/ai';
import { BUTTON, COLORS, MENU, PANEL, TEXT_STYLE } from '../config/layout';
import type { PoolSlots } from '../progress/slots';
import { OpponentPicker } from './OpponentPicker';
import { getPoolSlots } from './poolSlots';
import { SCENE_KEYS } from './sceneKeys';
import type { TableStart } from './TableScene';
import { Panel, addButton, textStyle } from './ui';

/** Which menu panel is open, if any. Settings reopens itself after a language change. */
type MenuPanel = 'stats' | 'rules' | 'settings';

export interface MenuStart {
  readonly panel?: MenuPanel;
}

/**
 * The first screen: Continue (only when a game is saved), Play (opponent picker), Stats, Rules and
 * Settings (language). Buttons are named `menu-<item>`.
 */
export class MenuScene extends Phaser.Scene {
  static readonly KEY = SCENE_KEYS.menu;

  private t!: Translator;
  private slots!: PoolSlots;
  private picker!: OpponentPicker;
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
      { id: 'play', onTap: () => this.picker.show(this.slots.progress.load().data.lastOpponent, () => undefined) },
      { id: 'stats', onTap: () => this.showPanel('stats') },
      { id: 'rules', onTap: () => this.showPanel('rules') },
      { id: 'settings', onTap: () => this.showPanel('settings') },
    ];
    items.forEach((item, i) =>
      addButton(this, MENU.x, MENU.firstButtonY + i * MENU.buttonSpacing, { name: `menu-${item.id}`, label: t.t(`menu.${item.id}`), onTap: item.onTap }, { width: BUTTON.width }),
    );
    this.add
      .text(MENU.placeholder.right, MENU.placeholder.y, t.t('pool.placeholder'), textStyle(TEXT_STYLE.labelSize, COLORS.textDim))
      .setOrigin(1, 0.5)
      .setName('placeholderLabel');

    this.picker = new OpponentPicker(this, t, PANEL.overMenu, (opponent) => this.startTable({ opponent }));
    if (data.panel) this.showPanel(data.panel);

    registerTestProbe('pool.menu', () => ({
      continueShown: this.hasSavedGame,
      panel: this.picker.visible ? 'picker' : this.openPanel,
      locale: this.t.locale,
    }));
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
      const lines = AI_LEVEL_IDS.map((level) => t.t('stats.vsComputer', { level: t.t(`level.${level}`), ...progress.vsComputer[level] }));
      lines.push(t.t('stats.twoPlayers', { n: progress.twoPlayerGames }));
      this.panel = new Panel(this, { ...common, body: lines.join('\n') });
    } else if (kind === 'rules') {
      this.panel = new Panel(this, { ...common, body: t.t('rules.body') });
    } else {
      const services = getServices(this);
      this.panel = new Panel(this, {
        ...common,
        body: t.t('settings.language'),
        buttons: SUPPORTED_LOCALES.map((locale) => ({
          name: `language-${locale}`,
          label: t.t(`language.${locale}`),
          highlighted: locale === t.locale,
          onTap: () => {
            if (locale === t.locale) return;
            services.updateSettings({ locale });
            // Redraw every label in the new language, with Settings still open.
            this.scene.restart({ panel: 'settings' } satisfies MenuStart);
          },
        })),
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
