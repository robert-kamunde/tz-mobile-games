import * as Phaser from 'phaser';
import type { Translator } from '@tzg/core';
import { COLORS, HUD, TEXT_STYLE } from '../config/layout';
import { countInRack } from '../physics/rack';
import type { Group, MatchState, PlayerId } from '../rules/blackball';

export interface PlayerPanelInfo {
  readonly group: Group | null;
  /** Own group balls left on the table (ignored while the table is open). */
  readonly remaining: number;
  /** Balls in the player's group at the start of the frame (0 while the table is open). */
  readonly total: number;
  readonly onBlack: boolean;
}

/** What a player's potted-ball tray shows: filled slots and visible slots. */
export interface TrayState {
  readonly potted: number;
  readonly slots: number;
}

const PLAYERS: readonly PlayerId[] = [0, 1];
const TRAY_SLOTS = Math.max(countInRack('red'), countInRack('yellow'));
const HUD_DEPTH = 10;

/**
 * Match heads-up display: a panel per player, the status line, the controls hint, the New game
 * button (with a confirming second tap mid-match) and the game-over panel. Text only comes from
 * the translator; the scene decides what to say.
 */
export class MatchHud {
  private readonly panels: { label: Phaser.GameObjects.Text; chip: Phaser.GameObjects.Arc; tray: Phaser.GameObjects.Arc[] }[];
  private readonly trays: [TrayState, TrayState] = [{ potted: 0, slots: 0 }, { potted: 0, slots: 0 }];
  private readonly status: Phaser.GameObjects.Text;
  private readonly hint: Phaser.GameObjects.Text;
  private readonly newGame: Phaser.GameObjects.Text;
  private readonly overPanel: Phaser.GameObjects.Rectangle;
  private readonly overTitle: Phaser.GameObjects.Text;
  private readonly overDetail: Phaser.GameObjects.Text;
  private confirmUntil = 0;
  private computerPlayer: PlayerId | null = null;
  private matchActive = true;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly t: Translator,
    onNewGame: () => void,
  ) {
    const text = (size: string, color: string = COLORS.text) => ({ fontFamily: TEXT_STYLE.fontFamily, fontSize: size, color });
    const p = HUD.players;
    this.panels = PLAYERS.map((player) => {
      const left = player === 0;
      const chip = scene.add.circle(left ? p.leftX + p.chipRadius : p.rightX - p.chipRadius, p.y, p.chipRadius, COLORS.ball.cue);
      chip.setStrokeStyle(1.5, COLORS.ballOutline, 0.6).setName(`playerChip-${player}`);
      const labelX = left ? p.leftX + 2 * p.chipRadius + p.gap : p.rightX - 2 * p.chipRadius - p.gap;
      const label = scene.add.text(labelX, p.y, '', text(TEXT_STYLE.playerSize)).setOrigin(left ? 0 : 1, 0.5).setName(`player-${player}`);
      // Slots run inwards from the outer edge, under the chip and name.
      const tr = HUD.tray;
      const firstX = left ? p.leftX + tr.ballRadius : p.rightX - tr.ballRadius;
      const step = left ? tr.spacing : -tr.spacing;
      const tray = Array.from({ length: TRAY_SLOTS }, (_, i) =>
        scene.add.circle(firstX + i * step, tr.y, tr.ballRadius).setName(`tray-${player}-${i}`).setVisible(false),
      );
      return { label, chip, tray };
    });

    this.status = scene.add
      .text(HUD.status.x, HUD.status.y, '', {
        ...text(TEXT_STYLE.statusSize),
        align: 'center',
        wordWrap: { width: HUD.status.wrapWidth },
        lineSpacing: HUD.status.lineSpacing,
      })
      .setOrigin(0.5)
      .setName('status');
    this.hint = scene.add.text(HUD.hint.x, HUD.hint.y, '', text(TEXT_STYLE.hintSize, COLORS.textDim)).setOrigin(0.5).setName('hint');
    scene.add
      .text(HUD.placeholder.x, HUD.placeholder.y, t.t('pool.placeholder'), text(TEXT_STYLE.labelSize, COLORS.textDim))
      .setOrigin(0, 0.5)
      .setName('placeholderLabel');

    const g = HUD.gameOver;
    this.overPanel = scene.add.rectangle(g.x, g.y, g.width, g.height, COLORS.overlay, g.alpha).setName('gameOverPanel').setVisible(false);
    this.overTitle = scene.add.text(g.x, g.y - 30, '', text(TEXT_STYLE.titleSize, COLORS.accent)).setOrigin(0.5).setName('gameOverTitle').setVisible(false);
    this.overDetail = scene.add.text(g.x, g.y + 34, '', text(TEXT_STYLE.playerSize)).setOrigin(0.5).setName('gameOverDetail').setVisible(false);

    this.newGame = scene.add
      .text(HUD.newGame.right, HUD.newGame.y, '', {
        ...text(TEXT_STYLE.buttonSize, COLORS.buttonText),
        backgroundColor: COLORS.buttonBackground,
        padding: HUD.newGame.padding,
      })
      .setOrigin(1, 0.5)
      .setName('newGameButton')
      .setInteractive({ useHandCursor: true });
    this.newGame.on('pointerup', (pointer: Phaser.Input.Pointer) => {
      if (pointer.wasCanceled) return;
      // Mid-match a restart needs a second tap, so a stray touch cannot throw a game away.
      const now = scene.time.now;
      if (this.matchActive && now > this.confirmUntil) {
        this.confirmUntil = now + HUD.confirmMs;
        this.newGame.setText(t.t('pool.confirmNewGame'));
        scene.time.delayedCall(HUD.confirmMs, () => this.resetNewGameLabel());
        return;
      }
      this.confirmUntil = 0;
      this.resetNewGameLabel();
      onNewGame();
    });
    this.resetNewGameLabel();

    // Above the table, balls and cue stick.
    const all = [...this.panels.flatMap((p) => [p.label, p.chip, ...p.tray]), this.status, this.hint, this.overPanel, this.overTitle, this.overDetail, this.newGame];
    for (const o of all) o.setDepth(HUD_DEPTH);
  }

  /** Marks which player is the computer (named "Kompyuta"), or none. */
  setComputerPlayer(player: PlayerId | null): void {
    this.computerPlayer = player;
  }

  playerName(player: PlayerId): string {
    return player === this.computerPlayer ? this.t.t('player.computer') : this.t.t('player.name', { n: player + 1 });
  }

  groupName(group: Group): string {
    return this.t.t(`group.${group}`);
  }

  showPlayers(state: MatchState, info: readonly [PlayerPanelInfo, PlayerPanelInfo]): void {
    for (const player of PLAYERS) {
      const { label, chip } = this.panels[player]!;
      const { group, remaining, onBlack } = info[player];
      // The chip shows the colour (white while the table is open, black once on the black); the number is balls left.
      label.setText(group && !onBlack ? `${this.playerName(player)} · ${remaining}` : this.playerName(player));
      chip.setFillStyle(onBlack ? COLORS.ball.black : group ? COLORS.ball[group] : COLORS.ball.cue);
      const active = state.phase !== 'over' && state.current === player;
      const alpha = active ? 1 : HUD.players.inactiveAlpha;
      label.setAlpha(alpha).setFontStyle(active ? 'bold' : 'normal');
      chip.setAlpha(alpha);
      this.showTray(player, info[player]);
    }
  }

  /** Filled and visible tray slots per player, for tests. */
  get trayState(): readonly [TrayState, TrayState] {
    return this.trays;
  }

  /** Potted balls of the player's colour fill slots from the outer edge; the rest stay as faint outlines. Hidden while the table is open. */
  private showTray(player: PlayerId, { group, remaining, total }: PlayerPanelInfo): void {
    const slots = group ? total : 0;
    const potted = slots - (group ? remaining : 0);
    this.panels[player]!.tray.forEach((slot, i) => {
      slot.setVisible(i < slots);
      if (!group || i >= slots) return;
      const filled = i < potted;
      slot.setFillStyle(COLORS.ball[group], filled ? 1 : 0);
      slot.setStrokeStyle(HUD.tray.outlineWidth, filled ? COLORS.ballOutline : COLORS.ball[group], filled ? 1 : HUD.tray.emptyAlpha);
    });
    this.trays[player] = { potted, slots };
  }

  /** Bottom line: how to use the controls right now, or nothing when the player has nothing to do. */
  setHint(hint: 'aim' | 'ballInHand' | 'none'): void {
    this.hint.setText(hint === 'none' ? '' : this.t.t(hint === 'ballInHand' ? 'pool.hintBallInHand' : 'pool.hint'));
  }

  get statusText(): string {
    return this.status.text;
  }

  get gameOverVisible(): boolean {
    return this.overPanel.visible;
  }

  setStatus(message: string): void {
    this.status.setText(message);
  }

  showGameOver(title: string, detail: string): void {
    this.matchActive = false;
    this.resetNewGameLabel();
    for (const o of [this.overPanel, this.overTitle, this.overDetail]) o.setVisible(true);
    this.overTitle.setText(title);
    this.overDetail.setText(detail);
  }

  hideGameOver(): void {
    this.matchActive = true;
    for (const o of [this.overPanel, this.overTitle, this.overDetail]) o.setVisible(false);
  }

  private resetNewGameLabel(): void {
    if (this.scene.time.now >= this.confirmUntil) this.newGame.setText(this.t.t('pool.newGame'));
  }
}
