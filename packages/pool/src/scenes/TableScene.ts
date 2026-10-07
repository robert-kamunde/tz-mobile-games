import * as Phaser from 'phaser';
import { FixedStepper, type Logger } from '@tzg/core';
import { getServices, registerTestProbe } from '@tzg/shell';
import { AIM_GUIDE, COLORS, HUD, SIMULATION_LOOP, TEXT_STYLE } from '../config/layout';
import { DEFAULT_PHYSICS } from '../config/physics';
import { UK_7FT_TABLE } from '../config/table';
import { computeAimGuide } from '../physics/aim';
import { buildTableGeometry } from '../physics/geometry';
import { respawnCueBall } from '../physics/placement';
import { rackBalls } from '../physics/rack';
import { PoolSimulation } from '../physics/simulation';
import type { Vec2 } from '../physics/types';
import { AimView } from './AimView';
import { PowerBar } from './PowerBar';
import { TableView } from './TableView';

/** Straight at the rack: the default aim for a fresh rack. */
const BREAK_AIM: Vec2 = { x: 1, y: 0 };

/**
 * Milestone 1 practice table: aim by dragging on the table, shoot with the power bar, re-rack.
 * No rules, turns or AI yet. Phaser is used only for drawing and input; the simulation is
 * src/physics/simulation.ts.
 */
export class TableScene extends Phaser.Scene {
  static readonly KEY = 'Table';

  private sim!: PoolSimulation;
  private view!: TableView;
  private aimView!: AimView;
  private powerBar!: PowerBar;
  private stepper!: FixedStepper;
  private logger!: Logger;
  private aim: Vec2 = BREAK_AIM;
  private aimPointerId: number | null = null;
  private powerPointerId: number | null = null;
  private shots = 0;

  constructor() {
    super(TableScene.KEY);
  }

  create(): void {
    const services = getServices(this);
    const t = services.translator;
    this.logger = services.logger.child('table');

    const geometry = buildTableGeometry(UK_7FT_TABLE);
    this.view = new TableView(this, geometry, UK_7FT_TABLE);
    this.view.drawTable();
    this.sim = new PoolSimulation(geometry, DEFAULT_PHYSICS, rackBalls(UK_7FT_TABLE), this.logger.child('physics'));
    this.view.syncBalls(this.sim.balls);
    this.aimView = new AimView(this, this.view);
    this.powerBar = new PowerBar(this, t.t('pool.power'));
    this.stepper = new FixedStepper({ stepMs: DEFAULT_PHYSICS.stepSeconds * 1000, maxStepsPerFrame: SIMULATION_LOOP.maxStepsPerFrame });

    const hint = this.add
      .text(HUD.hint.x, HUD.hint.y, '', { fontFamily: TEXT_STYLE.fontFamily, fontSize: TEXT_STYLE.hintSize, color: COLORS.text })
      .setOrigin(0.5)
      .setName('hint');
    const placeholder = this.add
      .text(HUD.placeholder.x, HUD.placeholder.y, '', { fontFamily: TEXT_STYLE.fontFamily, fontSize: TEXT_STYLE.labelSize, color: COLORS.text })
      .setOrigin(0, 0.5)
      .setAlpha(0.7)
      .setName('placeholderLabel');
    const rerack = this.add
      .text(HUD.rerack.x, HUD.rerack.y, '', {
        fontFamily: TEXT_STYLE.fontFamily,
        fontSize: TEXT_STYLE.buttonSize,
        color: COLORS.buttonText,
        backgroundColor: COLORS.buttonBackground,
        padding: HUD.rerack.padding,
      })
      .setOrigin(0.5)
      .setName('rerackButton')
      .setInteractive({ useHandCursor: true });
    rerack.on('pointerup', () => this.rerack());

    hint.setText(t.t('pool.hint'));
    placeholder.setText(t.t('pool.placeholder'));
    rerack.setText(t.t('pool.rerack'));

    this.input.on('pointerdown', this.onPointerDown, this);
    this.input.on('pointermove', this.onPointerMove, this);
    this.input.on('pointerup', this.onPointerUp, this);
    this.input.on('pointerupoutside', this.onPointerUp, this);

    const offPause = services.lifecycle.on('pause', () => this.cancelGestures());
    // Throw away time that built up while hidden, so returning never causes a burst of steps.
    const offResume = services.lifecycle.on('resume', () => this.stepper.reset());
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      offPause();
      offResume();
    });

    this.registerProbes();
    this.refreshAim();
  }

  override update(_time: number, deltaMs: number): void {
    if (!this.sim.isMoving) return;
    this.stepper.advance(deltaMs, () => this.sim.step());
    this.view.syncBalls(this.sim.balls);
    if (!this.sim.isMoving) this.onShotSettled();
  }

  private onPointerDown(pointer: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]): void {
    if (this.sim.isMoving || over.length > 0) return; // buttons handle their own input
    if (this.powerPointerId === null && this.powerBar.hitTest(pointer.x, pointer.y)) {
      this.powerPointerId = pointer.id;
      this.powerBar.begin(pointer.y);
      this.refreshAim();
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
      this.refreshAim();
    } else if (pointer.id === this.aimPointerId) {
      this.aimAt(pointer.x, pointer.y);
    }
  }

  private onPointerUp(pointer: Phaser.Input.Pointer): void {
    if (pointer.id === this.aimPointerId) this.aimPointerId = null;
    if (pointer.id !== this.powerPointerId) return;
    this.powerPointerId = null;
    // A cancelled touch (system gesture, notification shade, incoming call) must never fire a shot.
    if (pointer.wasCanceled) {
      this.powerBar.cancel();
      this.refreshAim();
      return;
    }
    const power = this.powerBar.release();
    if (power === null) {
      this.refreshAim();
      return;
    }
    this.shoot(power);
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
    this.refreshAim();
  }

  private shoot(power: number): void {
    const result = this.sim.strike({ direction: this.aim, power, side: 0, height: 0 });
    if (result !== 'ok') {
      this.logger.warn(`shot refused: ${result}`);
      this.refreshAim();
      return;
    }
    this.shots += 1;
    this.stepper.reset();
    this.aimView.hide();
    this.powerBar.setEnabled(false);
    this.logger.info(`shot ${this.shots}: power ${power.toFixed(2)}`);
  }

  private onShotSettled(): void {
    const events = this.sim.shotEvents();
    const potted = events.filter((e) => e.type === 'pocket').map((e) => (e.type === 'pocket' ? e.ball : -1));
    this.logger.info(`shot ${this.shots} settled; potted [${potted.join(', ')}]`);
    if (this.sim.cueBall.pocketed) {
      // Practice-mode placeholder for ball in hand (Milestone 2).
      const placed = respawnCueBall(this.sim, UK_7FT_TABLE.cueStart, UK_7FT_TABLE.playWidth / 2, SIMULATION_LOOP.respawnSearchStep);
      if (placed) {
        this.view.syncBalls(this.sim.balls);
      } else {
        this.logger.error('no free spot for the cue ball; re-racking');
        this.rerack();
      }
    }
    this.powerBar.setEnabled(true);
    this.refreshAim();
  }

  private rerack(): void {
    if (this.sim.isMoving) return;
    this.cancelGestures();
    this.sim = new PoolSimulation(this.sim.table, this.sim.physics, rackBalls(UK_7FT_TABLE), this.logger.child('physics'));
    this.aim = BREAK_AIM;
    this.view.syncBalls(this.sim.balls);
    this.refreshAim();
    this.logger.info('re-racked');
  }

  private cancelGestures(): void {
    this.aimPointerId = null;
    this.powerPointerId = null;
    this.powerBar.cancel();
    if (!this.sim.isMoving) this.refreshAim();
  }

  private refreshAim(): void {
    if (this.sim.isMoving) return;
    const cue = this.sim.cueBall;
    const guide = computeAimGuide(cue, this.aim, this.sim.balls, this.sim.table.cushions, AIM_GUIDE.maxDistance);
    this.aimView.draw(cue, this.aim, guide, this.powerBar.power);
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
    }));
    registerTestProbe('pool.tableToDesign', (x, y) => this.view.toDesign(Number(x), Number(y)));
  }
}
