import * as Phaser from 'phaser';
import { FixedStepper, createRandom, type Logger, type Translator } from '@tzg/core';
import { getServices, registerTestProbe } from '@tzg/shell';
import { ShotPlanner } from '../ai/planner';
import { AI_LEVELS } from '../config/ai';
import { AIM_GUIDE, BALL_IN_HAND, HUD, PANEL, SIMULATION_LOOP } from '../config/layout';
import { DEFAULT_PHYSICS } from '../config/physics';
import { UK_7FT_TABLE } from '../config/table';
import { rotateAim } from '../controls/fineAim';
import { computeAimGuide } from '../physics/aim';
import { buildTableGeometry } from '../physics/geometry';
import { respawnCueBall } from '../physics/placement';
import { countInRack, rackBalls } from '../physics/rack';
import { PoolSimulation } from '../physics/simulation';
import type { Shot, TableGeometry, Vec2 } from '../physics/types';
import type { TipOffset } from '../controls/spin';
import { opponentId, type Opponent } from '../progress/opponent';
import { recordGame } from '../progress/progress';
import { restoreBalls, toSavedBalls, type SavedMatch } from '../progress/savedMatch';
import type { PoolSlots } from '../progress/slots';
import {
  countGroups,
  isOnBlack,
  opponentOf,
  resolveShot,
  startMatch,
  type GroupCounts,
  type MatchState,
  type PlayerId,
  type ShotResult,
} from '../rules/blackball';
import { summarizeShot } from '../rules/shotSummary';
import { AimView } from './AimView';
import { ComputerTurn } from './ComputerTurn';
import { FineAim } from './FineAim';
import { MatchHud } from './MatchHud';
import { OpponentPicker } from './OpponentPicker';
import { getPoolSlots } from './poolSlots';
import { SCENE_KEYS } from './sceneKeys';
import { addButton } from './ui';
import { PowerBar } from './PowerBar';
import { SpinControl } from './SpinControl';
import { TableView } from './TableView';

/** Straight at the rack: the default aim for a fresh rack. */
const BREAK_AIM: Vec2 = { x: 1, y: 0 };

/** Against the computer, the computer is player 2 and the person always breaks the first game. */
const COMPUTER_PLAYER: PlayerId = 1;

/** How the table is opened from the menu: a new game against an opponent, or the saved game. */
export type TableStart = { readonly opponent: Opponent } | { readonly resume: true };

/**
 * A Blackball match on one table, against another person on the same phone or the computer.
 * Phaser is used only for drawing and input: the simulation is src/physics, the rules src/rules
 * and the computer's thinking src/ai.
 */
export class TableScene extends Phaser.Scene {
  static readonly KEY = SCENE_KEYS.table;

  private geometry!: TableGeometry;
  private sim!: PoolSimulation;
  private match!: MatchState;
  private view!: TableView;
  private aimView!: AimView;
  private powerBar!: PowerBar;
  private spin!: SpinControl;
  private fineAim!: FineAim;
  private hud!: MatchHud;
  private picker!: OpponentPicker;
  private computer!: ComputerTurn;
  private opponent: Opponent = { kind: 'human' };
  private opponentChosen = false;
  /** Varies the computer's aiming error between matches; each shot's seed adds the shot count. */
  private computerSeed = 0;
  private slots!: PoolSlots;
  /** The game as it was before the shot now rolling: what is saved if the app is closed mid-shot. */
  private beforeShot: SavedMatch | null = null;
  private stepper!: FixedStepper;
  private logger!: Logger;
  private t!: Translator;
  private aim: Vec2 = BREAK_AIM;
  private aimPointerId: number | null = null;
  private powerPointerId: number | null = null;
  private placePointerId: number | null = null;
  private spinPointerId: number | null = null;
  private fineAimPointerId: number | null = null;
  /** The last shot played, for tests and the log. */
  private lastShot: Shot | null = null;
  private countsBeforeShot: GroupCounts = { red: 0, yellow: 0 };
  private lastResult: ShotResult | null = null;
  private shots = 0;

  constructor() {
    super(TableScene.KEY);
  }

  create(start: TableStart): void {
    const services = getServices(this);
    this.slots = getPoolSlots(this);
    this.beforeShot = null;
    this.opponentChosen = false;
    this.shots = 0;
    this.t = services.translator;
    this.logger = services.logger.child('table');

    this.geometry = buildTableGeometry(UK_7FT_TABLE);
    this.view = new TableView(this, this.geometry, UK_7FT_TABLE);
    this.view.drawTable();
    this.sim = this.newSimulation();
    this.view.syncBalls(this.sim.balls);
    this.aimView = new AimView(this, this.view);
    this.powerBar = new PowerBar(this, this.t.t('pool.power'));
    this.spin = new SpinControl(this, this.t.t('pool.spin'), DEFAULT_PHYSICS.maxTipOffset);
    this.fineAim = new FineAim(this);
    this.hud = new MatchHud(this, this.t, () => this.askForOpponent());
    this.picker = new OpponentPicker(this, this.t, PANEL.overTable, (opponent) => this.onOpponentPicked(opponent));
    addButton(this, HUD.menu.left, HUD.menu.y, { name: 'menuButton', label: this.t.t('pool.menu'), onTap: () => this.goToMenu() }, { originX: 0 }).setDepth(HUD.depth);
    this.computer = new ComputerTurn(
      {
        place: (spot) => this.placeCueBallAt(spot),
        aim: () => this.aim,
        setAim: (direction) => {
          this.aim = direction;
          this.refresh();
        },
        showPower: (power) => {
          this.powerBar.showValue(power);
          this.refresh();
        },
        shoot: (shot) => this.shootComputer(shot),
      },
      () => performance.now(),
    );
    this.stepper = new FixedStepper({ stepMs: DEFAULT_PHYSICS.stepSeconds * 1000, maxStepsPerFrame: SIMULATION_LOOP.maxStepsPerFrame });

    this.input.on('pointerdown', this.onPointerDown, this);
    this.input.on('pointermove', this.onPointerMove, this);
    this.input.on('pointerup', this.onPointerUp, this);
    this.input.on('pointerupoutside', this.onPointerUp, this);

    // Android may kill a backgrounded app without warning, so the game is saved on every pause.
    const offPause = services.lifecycle.on('pause', () => {
      this.cancelGestures();
      this.saveMatch();
    });
    // Throw away time that built up while hidden, so returning never causes a burst of steps.
    const offResume = services.lifecycle.on('resume', () => this.stepper.reset());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      offPause();
      offResume();
    });

    this.registerProbes();
    if ('opponent' in start) {
      this.onOpponentPicked(start.opponent);
      return;
    }
    const saved = this.slots.match.load().data;
    if (saved) {
      this.resumeMatch(saved);
      return;
    }
    // The menu offers Continue only when a game is saved, so this means the save went bad since.
    this.logger.warn('no saved game to continue; back to the menu');
    this.scene.start(SCENE_KEYS.menu);
  }

  override update(_time: number, deltaMs: number): void {
    if (this.computer.active) this.computer.update(deltaMs);
    if (!this.sim.isMoving) return;
    this.stepper.advance(deltaMs, () => this.sim.step());
    this.view.syncBalls(this.sim.balls);
    if (!this.sim.isMoving) this.onShotSettled();
  }

  // ---- Match flow -------------------------------------------------------------------------

  /**
   * New game: choose the opponent first. The current game stays behind the picker, and is still
   * the saved game, until a choice is made; Back returns to it.
   */
  private askForOpponent(): void {
    if (this.sim.isMoving) return;
    this.computer.cancel();
    this.cancelGestures();
    const last = this.slots.progress.load().data.lastOpponent;
    this.picker.show(last, () => {
      this.refresh();
      this.startComputerTurnIfDue();
    });
    this.refresh();
  }

  private onOpponentPicked(opponent: Opponent): void {
    // A first game or a new opponent starts with player 1 breaking; a rematch alternates the break as before.
    const rematch = this.opponentChosen && opponentId(opponent) === opponentId(this.opponent);
    this.opponentChosen = true;
    this.opponent = opponent;
    const progress = this.slots.progress.load().data;
    this.slots.progress.save({ ...progress, lastOpponent: opponent });
    this.hud.setComputerPlayer(opponent.kind === 'computer' ? COMPUTER_PLAYER : null);
    this.startNewMatch(rematch ? opponentOf(this.match.breaker) : 0);
  }

  private startNewMatch(breaker: PlayerId): void {
    if (this.sim.isMoving) return;
    this.computer.cancel();
    this.computerSeed = Date.now() >>> 0;
    this.cancelGestures();
    this.sim = this.newSimulation();
    this.match = startMatch(breaker);
    this.lastResult = null;
    this.shots = 0;
    this.aim = BREAK_AIM;
    this.hud.hideGameOver();
    this.view.syncBalls(this.sim.balls);
    this.hud.setStatus(this.turnMessage());
    this.refresh();
    this.logger.info(`new match against ${this.opponent.kind === 'computer' ? `the computer (${this.opponent.level})` : 'a person'}, player ${breaker + 1} breaks`);
    this.saveMatch();
    this.startComputerTurnIfDue();
  }

  /** Puts a saved game back on the table, as it was after its last finished shot. */
  private resumeMatch(saved: SavedMatch): void {
    this.opponent = saved.opponent;
    this.opponentChosen = true;
    this.hud.setComputerPlayer(saved.opponent.kind === 'computer' ? COMPUTER_PLAYER : null);
    this.computerSeed = Date.now() >>> 0;
    this.sim = new PoolSimulation(this.geometry, DEFAULT_PHYSICS, restoreBalls(saved.balls, UK_7FT_TABLE), this.logger.child('physics'));
    this.match = saved.match;
    this.shots = saved.shots;
    this.lastResult = null;
    this.aim = BREAK_AIM;
    this.view.syncBalls(this.sim.balls);
    this.hud.setStatus(this.turnMessage());
    this.refresh();
    this.logger.info(`resumed a saved match after ${saved.shots} shots`);
    this.startComputerTurnIfDue();
  }

  /** Back to the main menu. The game is saved and Continue brings it back. Ignored while balls roll. */
  private goToMenu(): void {
    if (this.sim.isMoving) return;
    this.computer.cancel();
    this.picker.hide();
    this.saveMatch();
    this.scene.start(SCENE_KEYS.menu);
  }

  private snapshot(): SavedMatch {
    return { opponent: this.opponent, match: this.match, balls: toSavedBalls(this.sim.balls), shots: this.shots };
  }

  /**
   * Saves the game in progress, or clears the save once the game is over. While balls roll, the
   * game from before the shot is saved: a shot cut off half way cannot be judged.
   */
  private saveMatch(): void {
    if (this.match.phase === 'over') {
      this.slots.match.clear();
      return;
    }
    const game = this.sim.isMoving ? this.beforeShot : this.snapshot();
    if (game) this.slots.match.save(game);
  }

  private isComputerTurn(): boolean {
    return this.opponent.kind === 'computer' && this.match.phase !== 'over' && this.match.current === COMPUTER_PLAYER;
  }

  private startComputerTurnIfDue(): void {
    if (this.opponent.kind !== 'computer' || !this.isComputerTurn() || this.picker.visible || this.sim.isMoving || this.computer.active) return;
    const planner = new ShotPlanner(
      { balls: this.sim.balls, table: this.geometry, tableConfig: UK_7FT_TABLE, physics: DEFAULT_PHYSICS, match: this.match },
      AI_LEVELS[this.opponent.level],
      createRandom(this.computerSeed + this.shots),
    );
    // A finger still down from the player's last shot must not steer the computer's cue.
    this.cancelGestures();
    this.computer.start(planner);
  }

  private shootComputer(shot: Shot): void {
    this.aim = shot.direction;
    this.powerBar.cancel();
    this.shoot(shot.power, { side: shot.side, height: shot.height });
  }

  private shoot(power: number, tip: TipOffset): void {
    if (this.match.phase === 'over') return;
    this.countsBeforeShot = countGroups(this.sim.balls);
    const before = this.snapshot();
    const shot: Shot = { direction: this.aim, power, side: tip.side, height: tip.height };
    const result = this.sim.strike(shot);
    if (result !== 'ok') {
      this.logger.warn(`shot refused: ${result}`);
      this.refresh();
      return;
    }
    this.beforeShot = before;
    this.lastShot = shot;
    // Spin is chosen for one shot at a time, so a forgotten setting never spoils the next one.
    this.spin.reset();
    this.shots += 1;
    this.stepper.reset();
    this.aimView.hide();
    this.powerBar.setEnabled(false);
    this.logger.info(`shot ${this.shots}: player ${this.match.current + 1}, power ${power.toFixed(2)}, tip ${tip.side.toFixed(2)}/${tip.height.toFixed(2)}`);
  }

  private onShotSettled(): void {
    let result: ShotResult;
    try {
      result = resolveShot(this.match, summarizeShot(this.sim.shotEvents(), this.sim.balls), this.countsBeforeShot);
    } catch (error) {
      // Should be impossible; keep the game playable by passing the turn with no penalty.
      this.logger.error('could not judge the shot; passing the turn', error);
      result = { state: { ...this.match, phase: 'play', current: opponentOf(this.match.current), ballInHand: null }, verdict: { kind: 'turn-over' }, groupsAssigned: false };
    }
    this.lastResult = result;
    this.match = result.state;
    this.beforeShot = null;
    this.logger.info(`shot ${this.shots}: ${JSON.stringify(result.verdict)}`);

    const messages: string[] = [];
    const verdict = result.verdict;
    if (verdict.kind === 'rerack') {
      this.sim = this.newSimulation();
      this.aim = BREAK_AIM;
      messages.push(this.t.t('status.rerack'));
    } else if (verdict.kind === 'foul') {
      messages.push(this.t.t(`foul.${verdict.reason}`));
    }
    if (result.groupsAssigned) {
      const shooter = this.match.current;
      const group = this.match.groups[shooter];
      if (group) messages.push(this.t.t('status.groups', { player: this.hud.playerName(shooter), group: this.hud.groupName(group) }));
    }

    if (this.sim.cueBall.pocketed && this.match.phase !== 'over') {
      // Put it somewhere legal first; with ball in hand the player then drags it where they want.
      const placed = respawnCueBall(this.sim, UK_7FT_TABLE.cueStart, UK_7FT_TABLE.playWidth / 2, SIMULATION_LOOP.respawnSearchStep);
      if (!placed) this.logger.error('no free spot for the cue ball');
    }
    this.view.syncBalls(this.sim.balls);

    if (verdict.kind === 'game-over') {
      const winner = this.hud.playerName(verdict.winner);
      const loser = this.hud.playerName(opponentOf(verdict.winner));
      this.hud.showGameOver(this.t.t('over.title', { player: winner }), this.t.t(`over.${verdict.reason}`, { loser }));
      this.hud.setStatus('');
      this.recordResult(verdict.winner);
    } else {
      messages.push(this.turnMessage());
      this.hud.setStatus(messages.join('\n'));
    }
    this.saveMatch();
    this.refresh();
    this.startComputerTurnIfDue();
  }

  /** Counts a finished game in the stats. */
  private recordResult(winner: PlayerId): void {
    const progress = this.slots.progress.load().data;
    this.slots.progress.save(recordGame(progress, this.opponent, winner));
  }

  private turnMessage(): string {
    const player = this.hud.playerName(this.match.current);
    if (this.isComputerTurn()) return this.t.t('status.computer', { player });
    if (this.match.phase === 'break') return this.t.t('status.break', { player });
    if (this.match.ballInHand) return this.t.t('status.ballInHand', { player });
    if (this.lastResult?.verdict.kind === 'continue') return this.t.t('status.continue', { player });
    return this.t.t('status.turn', { player });
  }

  // ---- Input ------------------------------------------------------------------------------

  private onPointerDown(pointer: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]): void {
    // Buttons handle their own input; nothing on the table responds while the computer plays or the picker is open.
    if (this.sim.isMoving || over.length > 0 || this.match.phase === 'over' || this.picker.visible || this.isComputerTurn()) return;
    if (this.powerPointerId === null && this.powerBar.hitTest(pointer.x, pointer.y)) {
      this.powerPointerId = pointer.id;
      this.powerBar.begin(pointer.y);
      this.refresh();
      return;
    }
    if (this.spinPointerId === null && this.spin.hitTest(pointer.x, pointer.y)) {
      this.spinPointerId = pointer.id;
      this.spin.setFromPoint(pointer.x, pointer.y);
      this.refresh();
      return;
    }
    if (this.fineAimPointerId === null && this.fineAim.hitTest(pointer.x, pointer.y)) {
      this.fineAimPointerId = pointer.id;
      this.fineAim.begin(pointer.x);
      return;
    }
    if (this.match.ballInHand && this.placePointerId === null && this.isNearCueBall(pointer.x, pointer.y)) {
      this.placePointerId = pointer.id;
      return;
    }
    if (this.aimPointerId === null && this.view.containsDesignPoint(pointer.x, pointer.y)) {
      this.aimPointerId = pointer.id;
      this.aimAt(pointer.x, pointer.y);
    }
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (pointer.id === this.powerPointerId) {
      this.powerBar.move(pointer.y);
      this.refresh();
    } else if (pointer.id === this.spinPointerId) {
      this.spin.setFromPoint(pointer.x, pointer.y);
      this.refresh();
    } else if (pointer.id === this.fineAimPointerId) {
      this.aim = rotateAim(this.aim, this.fineAim.move(pointer.x));
      this.refresh();
    } else if (pointer.id === this.placePointerId) {
      this.placeCueBall(pointer.x, pointer.y);
    } else if (pointer.id === this.aimPointerId) {
      this.aimAt(pointer.x, pointer.y);
    }
  }

  private onPointerUp(pointer: Phaser.Input.Pointer): void {
    if (pointer.id === this.aimPointerId) this.aimPointerId = null;
    if (pointer.id === this.placePointerId) this.placePointerId = null;
    if (pointer.id === this.spinPointerId) this.spinPointerId = null;
    if (pointer.id === this.fineAimPointerId) {
      this.fineAimPointerId = null;
      this.fineAim.end();
    }
    if (pointer.id !== this.powerPointerId) return;
    this.powerPointerId = null;
    // A cancelled touch (system gesture, notification shade, incoming call) must never fire a shot.
    if (pointer.wasCanceled) {
      this.powerBar.cancel();
      this.refresh();
      return;
    }
    const power = this.powerBar.release();
    if (power === null) {
      this.refresh();
      return;
    }
    this.shoot(power, this.spin.tip);
  }

  private isNearCueBall(designX: number, designY: number): boolean {
    const cue = this.sim.cueBall;
    const c = this.view.toDesign(cue.x, cue.y);
    const dx = designX - c.x;
    const dy = designY - c.y;
    return dx * dx + dy * dy <= BALL_IN_HAND.grabRadius * BALL_IN_HAND.grabRadius;
  }

  /** Ball in hand: follow the finger wherever the spot is free; otherwise the ball stays at its last good spot. */
  private placeCueBall(designX: number, designY: number): void {
    const target = this.view.toTable(designX, designY);
    // Before the break the cue ball must stay behind the baulk line; it slides along the line instead of stopping.
    const x = this.match.ballInHand === 'baulk' ? Math.min(target.x, UK_7FT_TABLE.baulkLine) : target.x;
    this.placeCueBallAt({ x, y: target.y });
  }

  private placeCueBallAt(spot: Vec2): boolean {
    if (!this.match.ballInHand || (this.match.ballInHand === 'baulk' && spot.x > UK_7FT_TABLE.baulkLine)) return false;
    if (this.sim.placeCueBall(spot.x, spot.y) !== 'ok') return false;
    this.view.syncBalls(this.sim.balls);
    this.refresh();
    return true;
  }

  private aimAt(designX: number, designY: number): void {
    const target = this.view.toTable(designX, designY);
    const cue = this.sim.cueBall;
    const dx = target.x - cue.x;
    const dy = target.y - cue.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    // Touching the cue ball itself gives no direction; keep the previous aim.
    if (len < cue.radius) return;
    this.aim = { x: dx / len, y: dy / len };
    this.refresh();
  }

  private cancelGestures(): void {
    this.aimPointerId = null;
    this.powerPointerId = null;
    this.placePointerId = null;
    this.spinPointerId = null;
    this.fineAimPointerId = null;
    this.fineAim.end();
    this.powerBar.cancel();
    if (this.match && !this.sim.isMoving) this.refresh();
  }

  // ---- Helpers ----------------------------------------------------------------------------

  private newSimulation(): PoolSimulation {
    return new PoolSimulation(this.geometry, DEFAULT_PHYSICS, rackBalls(UK_7FT_TABLE), this.logger.child('physics'));
  }

  /** Redraws everything that depends on the match state while the table is still. */
  private refresh(): void {
    if (this.sim.isMoving) return;
    const counts = countGroups(this.sim.balls);
    const panel = (player: PlayerId) => {
      const group = this.match.groups[player];
      return {
        group,
        remaining: group ? counts[group] : 0,
        total: group ? countInRack(group) : 0,
        onBlack: isOnBlack(this.match, player, counts),
      };
    };
    this.hud.showPlayers(this.match, [panel(0), panel(1)]);
    const over = this.match.phase === 'over';
    // While the computer plays or the picker is open, the player has no controls to explain.
    const playerIdle = this.isComputerTurn() || this.picker.visible;
    this.hud.setHint(playerIdle || over ? 'none' : this.match.ballInHand ? 'ballInHand' : 'aim');
    this.powerBar.setEnabled(!over && !playerIdle);
    this.spin.setEnabled(!over && !playerIdle);
    this.fineAim.setEnabled(!over && !playerIdle);
    if (over || this.picker.visible) {
      this.aimView.hide();
      return;
    }
    const cue = this.sim.cueBall;
    const guide = computeAimGuide(cue, this.aim, this.sim.balls, this.sim.table.cushions, this.sim.table.pockets, AIM_GUIDE.maxDistance);
    // The guide's cue-ball line after contact is right only without top or back spin; with it, the line is left out rather than drawn wrong.
    const showCuePath = this.spin.tip.height === 0;
    this.aimView.draw(cue, this.aim, guide, this.powerBar.power, this.match.ballInHand !== null, showCuePath);
  }

  private registerProbes(): void {
    registerTestProbe('pool.state', () => ({
      moving: this.sim.isMoving,
      shots: this.shots,
      steps: this.sim.steps,
      aim: this.aim,
      power: this.powerBar.power,
      balls: this.sim.balls.map((b) => ({ id: b.id, kind: b.kind, x: b.x, y: b.y, r: b.radius, pocketed: b.pocketed })),
      events: this.sim.shotEvents().map((e) => e.type),
      match: this.match,
      verdict: this.lastResult?.verdict ?? null,
      status: this.hud.statusText,
      gameOverShown: this.hud.gameOverVisible,
      trays: this.hud.trayState,
      opponent: this.opponent,
      computer: this.computer.currentPhase,
      pickerShown: this.picker.visible,
      spin: this.spin.tip,
      lastShot: this.lastShot,
    }));
    registerTestProbe('pool.tableToDesign', (x, y) => this.view.toDesign(Number(x), Number(y)));
    // Test-only: sets up a position (ball spots and match state) so browser tests can reach late-game
    // situations without playing a whole frame. Registered only in e2e builds.
    registerTestProbe('pool.testLayout', (layout, match) => {
      if (this.sim.isMoving) throw new Error('cannot lay out the table while balls move');
      const spots = layout as { id: number; x?: number; y?: number; pocketed?: boolean }[];
      for (const spot of spots) {
        const ball = this.sim.balls.find((b) => b.id === spot.id);
        if (!ball) throw new Error(`no ball ${spot.id}`);
        if (spot.x !== undefined) ball.x = spot.x;
        if (spot.y !== undefined) ball.y = spot.y;
        if (spot.pocketed !== undefined) ball.pocketed = spot.pocketed;
      }
      this.match = { ...this.match, ...(match as Partial<MatchState>) };
      this.lastResult = null;
      this.view.syncBalls(this.sim.balls);
      this.computer.cancel();
      this.hud.setStatus(this.turnMessage());
      this.saveMatch();
      this.refresh();
      this.startComputerTurnIfDue();
      return true;
    });
  }
}
