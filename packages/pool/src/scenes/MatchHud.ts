import * as Phaser from 'phaser';
import type { Translator } from '@tzg/core';
import { COLORS, HUD, TEXT_STYLE } from '../config/layout';
import { countInRack } from '../physics/rack';
import { DEFAULT_PICKS } from '../config/characters';
import { QUIPS } from '../config/quips';
import { seatCharacter, type CharacterPicks } from '../progress/characters';
import type { Opponent } from '../progress/opponent';
import type { Group, MatchState, PlayerId } from '../rules/blackball';
import { Face } from './Face';
import { addButton, textStyle } from './ui';

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

/**
 * Match heads-up display: a panel per player, the status line, the controls hint, the New game
 * button (with a confirming second tap mid-match) and the game-over panel. Text only comes from
 * the translator; the scene decides what to say.
 */
export class MatchHud {
  private readonly panels: { label: Phaser.GameObjects.Text; chip: Phaser.GameObjects.Arc; face: Face; tray: Phaser.GameObjects.Arc[] }[];
  private readonly trays: [TrayState, TrayState] = [{ potted: 0, slots: 0 }, { potted: 0, slots: 0 }];
  private readonly status: Phaser.GameObjects.Text;
  private readonly hint: Phaser.GameObjects.Text;
  private readonly newGame: Phaser.GameObjects.Text;
  private readonly overPanel: Phaser.GameObjects.Rectangle;
  private readonly overTitle: Phaser.GameObjects.Text;
  private readonly overDetail: Phaser.GameObjects.Text;
  private readonly quipBox: Phaser.GameObjects.Graphics;
  private readonly quipLabel: Phaser.GameObjects.Text;
  private quipTimer: Phaser.Time.TimerEvent | null = null;
  private quipSpeaker: PlayerId | null = null;
  private confirmUntil = 0;
  private opponent: Opponent = { kind: 'human' };
  private picks: CharacterPicks = DEFAULT_PICKS;
  private matchActive = true;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly t: Translator,
    onNewGame: () => void,
  ) {
    const text = textStyle;
    const p = HUD.players;
    this.panels = PLAYERS.map((player) => {
      const left = player === 0;
      const chipX = left ? p.leftX + p.chipRadius : p.rightX - p.chipRadius;
      const chip = scene.add.circle(chipX, p.y, p.chipRadius, COLORS.ball.cue);
      chip.setStrokeStyle(1.5, COLORS.ballOutline, 0.6).setName(`playerChip-${player}`);
      // The face covers the chip's middle; the chip shows round it as a ring in the player's ball colour.
      const face = new Face(scene, chipX, p.y, HUD.face.radius, `playerFace-${player}`);
      const labelX = left ? p.leftX + 2 * p.chipRadius + p.gap : p.rightX - 2 * p.chipRadius - p.gap;
      const label = scene.add.text(labelX, p.y, '', text(TEXT_STYLE.playerSize)).setOrigin(left ? 0 : 1, 0.5).setName(`player-${player}`);
      // Slots run inwards from the outer edge, under the chip and name.
      const tr = HUD.tray;
      const firstX = left ? p.leftX + tr.ballRadius : p.rightX - tr.ballRadius;
      const step = left ? tr.spacing : -tr.spacing;
      const tray = Array.from({ length: TRAY_SLOTS }, (_, i) =>
        scene.add.circle(firstX + i * step, tr.y, tr.ballRadius).setName(`tray-${player}-${i}`).setVisible(false),
      );
      return { label, chip, face, tray };
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
      .text(HUD.placeholder.x, HUD.placeholder.y, t.t('pool.placeholder'), {
        ...text(TEXT_STYLE.labelSize, COLORS.textDim),
        align: 'center',
        wordWrap: { width: HUD.placeholder.wrapWidth },
      })
      .setOrigin(0.5)
      .setName('placeholderLabel');

    const g = HUD.gameOver;
    this.overPanel = scene.add.rectangle(g.x, g.y, g.width, g.height, COLORS.overlay, g.alpha).setName('gameOverPanel').setVisible(false);
    this.overTitle = scene.add.text(g.x, g.y - 30, '', text(TEXT_STYLE.titleSize, COLORS.accent)).setOrigin(0.5).setName('gameOverTitle').setVisible(false);
    this.overDetail = scene.add.text(g.x, g.y + 34, '', text(TEXT_STYLE.playerSize)).setOrigin(0.5).setName('gameOverDetail').setVisible(false);

    const q = HUD.quip;
    this.quipBox = scene.add.graphics().setName('quipBubble').setVisible(false);
    this.quipLabel = scene.add
      .text(0, q.top + q.padY, '', textStyle(q.textSize, q.textColor))
      .setName('quipText')
      .setVisible(false);

    this.newGame = addButton(
      scene,
      HUD.newGame.right,
      HUD.newGame.y,
      {
        name: 'newGameButton',
        label: '',
        onTap: () => {
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
        },
      },
      { originX: 1 },
    );
    this.resetNewGameLabel();

    // Above the table, balls and cue stick.
    const all = [...this.panels.flatMap((p) => [p.label, p.chip, ...p.face.objects, ...p.tray]), this.status, this.hint, this.overPanel, this.overTitle, this.overDetail, this.quipBox, this.quipLabel, this.newGame];
    for (const o of all) o.setDepth(HUD.depth);
    this.setCast(this.opponent, this.picks);
  }

  /** Who plays: the opponent decides whether player 2 is the computer's character or a pick. */
  setCast(opponent: Opponent, picks: CharacterPicks): void {
    this.opponent = opponent;
    this.picks = picks;
    for (const player of PLAYERS) this.panels[player]!.face.show(seatCharacter(player, opponent, picks));
  }

  playerName(player: PlayerId): string {
    return seatCharacter(player, this.opponent, this.picks).name;
  }

  /** Id of the character in a seat, for their catchphrases. */
  characterId(player: PlayerId): string {
    return seatCharacter(player, this.opponent, this.picks).id;
  }

    groupName(group: Group): string {
    return this.t.t(`group.${group}`);
  }

  showPlayers(state: MatchState, info: readonly [PlayerPanelInfo, PlayerPanelInfo]): void {
    for (const player of PLAYERS) {
      const { label, chip, face } = this.panels[player]!;
      const { group, onBlack } = info[player];
      // The chip shows the colour (white while the table is open, black once on the black); the tray shows balls left (Robert: no number, 2026-10-11).
      label.setText(this.playerName(player));
      chip.setFillStyle(onBlack ? COLORS.ball.black : group ? COLORS.ball[group] : COLORS.ball.cue);
      const active = state.phase !== 'over' && state.current === player;
      const alpha = active ? 1 : HUD.players.inactiveAlpha;
      label.setAlpha(alpha).setFontStyle(active ? 'bold' : 'normal');
      chip.setAlpha(alpha);
      face.setAlpha(alpha);
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

  /**
   * A catchphrase in a bubble under the speaker's panel, pointing at their face. A new line replaces
   * the one showing; it goes by itself after a moment.
   */
  say(player: PlayerId, line: string): void {
    const q = HUD.quip;
    const p = HUD.players;
    const left = player === 0;
    const label = this.quipLabel.setText(line).setVisible(true);
    const width = label.width + 2 * q.padX;
    const height = label.height + 2 * q.padY;
    const x = left ? p.leftX : p.rightX - width;
    label.setX(x + q.padX);
    const faceX = left ? p.leftX + p.chipRadius : p.rightX - p.chipRadius;
    this.quipBox
      .clear()
      .fillStyle(q.fill, q.alpha)
      .fillRoundedRect(x, q.top, width, height, q.radius)
      .fillTriangle(faceX - q.tailWidth / 2, q.top, faceX + q.tailWidth / 2, q.top, faceX, q.top - q.tailHeight)
      .setVisible(true);
    this.quipSpeaker = player;
    this.quipTimer?.remove();
    this.quipTimer = this.scene.time.delayedCall(QUIPS.showMs, () => this.hideQuip());
  }

  hideQuip(): void {
    this.quipTimer?.remove();
    this.quipTimer = null;
    this.quipSpeaker = null;
    this.quipBox.setVisible(false);
    this.quipLabel.setVisible(false);
  }

  /** The line showing and who says it, for tests. */
  get quip(): { speaker: PlayerId; text: string } | null {
    return this.quipSpeaker === null ? null : { speaker: this.quipSpeaker, text: this.quipLabel.text };
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
