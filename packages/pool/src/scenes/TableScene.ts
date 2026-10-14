import * as Phaser from 'phaser';
import { FixedStepper, createRandom, type Logger, type Translator } from '@tzg/core';
import type { SoundBoard } from '@tzg/shell';
import { getServices, onBackButton, registerTestProbe } from '@tzg/shell';
import { ShotPlanner } from '../ai/planner';
import { ShotSoundMixer, cueGain } from '../audio/shotSounds';
import { AI_LEVELS } from '../config/ai';
import { AIM_GUIDE, BALL_IN_HAND, HUD, PANEL, SIMULATION_LOOP, screenSides, type ScreenSides } from '../config/layout';
import { DEFAULT_PHYSICS } from '../config/physics';
import { UK_7FT_TABLE } from '../config/table';
import { tableTheme } from '../config/tables';
import { CUE_STYLES } from '../config/cues';
import { QUIPS, quipKey } from '../config/quips';
import { BACKGROUNDS } from '../config/backgrounds';
import { QuipChooser } from '../rules/quips';
import { rotateAim } from '../controls/fineAim';
import { computeAimGuide } from '../physics/aim';
import { buildTableGeometry } from '../physics/geometry';
import { respawnCueBall } from '../physics/placement';
import { countInRack, rackBalls } from '../physics/rack';
import { PoolSimulation } from '../physics/simulation';
import type { Shot, TableGeometry, Vec2 } from '../physics/types';
import type { TipOffset } from '../controls/spin';
import { DEFAULT_PICKS } from '../config/characters';
import { DEFAULT_BACKGROUND } from '../config/backgrounds';
import { DEFAULT_CUE } from '../config/cues';
import { DEFAULT_TABLE } from '../config/tables';
import { firstOtherThan } from '../progress/characters';
import {
  chapterOf,
  characterById,
  isBackgroundLocked,
  isCueLocked,
  isTableLocked,
  nextStop,
  recordStop,
  earnedCharacters,
  earnedRewards,
  starsFor,
  stopRival,
  storyStop,
  titleFor,
  type Played,
  type StoryGame,
} from '../progress/story';
import type { CharacterPicks } from '../progress/characters';
import type { StoryTwist } from '../config/story';
import { STORY } from '../config/story';
import { lockedCharacters } from './storyText';
import { askForRemindersOnce } from './reminderSetup';
import { opponentId, type Opponent } from '../progress/opponent';
import { computerWins, recordGame } from '../progress/progress';
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
  type ShotVerdict,
} from '../rules/blackball';
import { summarizeShot } from '../rules/shotSummary';
import { AimView } from './AimView';
import { ComputerTurn } from './ComputerTurn';
import { FineAim } from './FineAim';
import { MatchHud } from './MatchHud';
import type { EndSpec } from './EndPanel';
import type { StoryStart } from './StoryScene';
import { MatchSetup, type MatchChoice } from './MatchSetup';
import { getPoolSlots } from './poolSlots';
import { loadPoolSounds } from './poolSounds';
import type { MenuStart } from './MenuScene';
import { SCENE_KEYS } from './sceneKeys';
import { Panel, addButton, type PanelSpec } from './ui';
import { PowerBar } from './PowerBar';
import { SpinControl } from './SpinControl';
import { TableView } from './TableView';
import { loadPortraitFiles } from './art/portraitFiles';

/** Straight at the rack: the default aim for a fresh rack. */
const BREAK_AIM: Vec2 = { x: 1, y: 0 };

/** Against the computer, the computer is player 2 and the person always breaks the first game. */
const COMPUTER_PLAYER: PlayerId = 1;
const PERSON: PlayerId = 0;

/** How the table is opened: a new game (opponent and characters), the saved game, or a story stop. */
/** A new game, a saved one (the Quick game or the story game), or a story stop. */
export type TableStart = MatchChoice | { readonly resume: 'quick' | 'story' } | { readonly story: string };

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
  private setup!: MatchSetup;
  /** The one-time "how to play" panel on the first game, while it shows. */
  private howToPlay: Panel | null = null;
  private computer!: ComputerTurn;
  private opponent: Opponent = { kind: 'human' };
  private picks: CharacterPicks = DEFAULT_PICKS;
  /** A story mode game: its stop and the person's fouls so far; null in Quick game. */
  private story: StoryGame | null = null;
  /** The table, cue and background this game is drawn with. */
  private looks: { table: string; cue: string; background: string } = { table: DEFAULT_TABLE, cue: DEFAULT_CUE, background: DEFAULT_BACKGROUND };
  /** Where the table and controls sit for the player's hand (Settings). */
  private sides!: ScreenSides;
  /** Panels over the table (opponent picker, how to play) follow it when it moves for left-handed players. */
  private overTable: PanelSpec['area'] = PANEL.overTable;
  private opponentChosen = false;
  /** Varies the computer's aiming error between matches; each shot's seed adds the shot count. */
  private computerSeed = 0;
  /** Decides when characters say a catchphrase; new for each match. */
  private quips = new QuipChooser(createRandom(0));
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
  private sfx!: SoundBoard;
  private soundMixer = new ShotSoundMixer();
  /** Shot events already turned into sounds. */
  private soundedEvents = 0;
  private countsBeforeShot: GroupCounts = { red: 0, yellow: 0 };
  private lastResult: ShotResult | null = null;
  private shots = 0;

  constructor() {
    super(TableScene.KEY);
  }

  preload(): void {
    loadPortraitFiles(this);
  }

  create(start: TableStart): void {
    const services = getServices(this);
    this.slots = getPoolSlots(this);
    this.beforeShot = null;
    this.opponentChosen = false;
    this.shots = 0;
    this.t = services.translator;
    this.logger = services.logger.child('table');
    this.sfx = services.sound;
    loadPoolSounds(this);

    this.geometry = buildTableGeometry(UK_7FT_TABLE);
    this.story = null;
    const looks = this.slots.progress.load().data;
    const played = this.played;
    const saved = 'resume' in start ? (start.resume === 'story' ? this.slots.storyMatch : this.slots.match).load().data : null;
    // A story stop is played on its own table and background; locked looks fall back to the defaults.
    const stop = storyStop('story' in start ? start.story : (saved?.story?.stop ?? ''));
    const table = stop?.table ?? (isTableLocked(looks.table, played) ? DEFAULT_TABLE : looks.table);
    const background = stop?.background ?? (isBackgroundLocked(looks.background, played) ? DEFAULT_BACKGROUND : looks.background);
    const cue = isCueLocked(looks.cue, played) ? DEFAULT_CUE : looks.cue;
    this.looks = { table, cue, background };
    const sides = screenSides(looks.hand, this.geometry.length);
    this.overTable = { ...PANEL.overTable, x: PANEL.overTable.x + sides.tableDx };
    this.view = new TableView(this, this.geometry, UK_7FT_TABLE, sides);
    this.view.drawTable(tableTheme(table), BACKGROUNDS[background]);
    this.sim = this.newSimulation();
    this.view.syncBalls(this.sim.balls);
    this.aimView = new AimView(this, this.view, CUE_STYLES[cue]);
    this.powerBar = new PowerBar(this, this.t.t('pool.power'), sides);
    this.spin = new SpinControl(this, this.t.t('pool.spin'), DEFAULT_PHYSICS.maxTipOffset, sides);
    this.fineAim = new FineAim(this, sides);
    this.hud = new MatchHud(this, this.t, () => this.askForOpponent(), sides, {
      next: () => this.playNextStop(),
      // Rudia: the same opponent and characters; the break alternates as for any rematch.
      rematch: () => this.rematch(),
      leave: () => (this.story ? this.openStoryMap() : this.goToMenu()),
    });
    this.sides = sides;
    this.setup = new MatchSetup(this, this.t, this.overTable, (choice) => this.onMatchChosen(choice), () => lockedCharacters(this.t, this.played));
    // The scene object is reused between starts; a panel from last time was destroyed with it.
    this.howToPlay = null;
    addButton(this, sides.controlX(HUD.menu.left), HUD.menu.y, { name: 'menuButton', label: this.t.t('pool.menu'), onTap: () => this.goToMenu() }, { originX: sides.controlOriginX(0) }).setDepth(HUD.depth);
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
    // Back closes the help or steps back through choosing a game, otherwise does what Menu does (nothing while balls roll),
    // or on a story game's end panel goes to the map.
    onBackButton(this, () => {
      if (this.howToPlay) this.closeHowToPlay();
      else if (this.setup.goBack()) return true;
      // On the end panel Back does what its last button does: the map in story mode.
      else if (this.story && this.hud.gameOverVisible) this.openStoryMap();
      else this.goToMenu();
      return true;
    });
    if ('opponent' in start) {
      this.onMatchChosen(start);
      return;
    }
    if ('story' in start) {
      if (stop) this.startStory(stop.id);
      else this.openStoryMap();
      return;
    }
    if (saved) {
      this.resumeMatch(saved);
      return;
    }
    // The menu offers Continue only when a game is saved, so this means the save went bad since.
    this.logger.warn('no saved game to continue; back to the menu');
    this.openMenu();
  }

  override update(_time: number, deltaMs: number): void {
    if (this.computer.active) this.computer.update(deltaMs);
    if (!this.sim.isMoving) return;
    this.stepper.advance(deltaMs, () => this.sim.step());
    this.playShotSounds();
    this.view.syncBalls(this.sim.balls, { live: true });
    if (!this.sim.isMoving) this.onShotSettled();
  }

  // ---- Match flow -------------------------------------------------------------------------

  /**
   * New game: choose the characters and opponent first. The current game stays behind the picker,
   * and is still the saved game, until a choice is made; Back returns to it.
   */
  private askForOpponent(): void {
    if (this.sim.isMoving) return;
    // In story mode New game replays the stop: the opponent is the stop's.
    if (this.story) {
      this.rematch();
      return;
    }
    this.computer.cancel();
    this.cancelGestures();
    const progress = this.slots.progress.load().data;
    this.setup.show(progress.lastOpponent, progress.lastPicks, () => {
      this.refresh();
      this.startComputerTurnIfDue();
    });
    this.refresh();
  }

  /** Rudia: the same game again, with the other player breaking. */
  private rematch(): void {
    if (this.story) {
      // A stop is always replayed as it is set: the person breaks unless the twist says otherwise.
      this.story = { stop: this.story.stop, fouls: 0, shots: 0 };
      this.startNewMatch(this.storyBreaker());
      return;
    }
    this.onMatchChosen({ opponent: this.opponent, picks: this.picks });
  }

  /** A story stop: the journey's character against the stop's rival, the person breaking. */
  private startStory(stopId: string): void {
    const stop = storyStop(stopId)!;
    const person = this.slots.story.load().data.character ?? DEFAULT_PICKS[0];
    this.opponentChosen = true;
    this.story = { stop: stop.id, fouls: 0, shots: 0 };
    this.setCast({ kind: 'computer', level: stop.level }, [person, firstOtherThan(person)]);
    this.startNewMatch(this.storyBreaker());
  }

  /** The current story stop's twist, if it has one. */
  private get twist(): StoryTwist | undefined {
    return this.story ? storyStop(this.story.stop)?.twist : undefined;
  }

  private storyBreaker(): PlayerId {
    return this.twist?.kind === 'rivalBreaks' ? COMPUTER_PLAYER : PERSON;
  }

  /** A story twist the person's last shot broke, as an `over.<reason>` key, or null. */
  private twistLoss(verdict: ShotVerdict): string | null {
    const twist = this.twist;
    if (twist?.kind === 'oneFoul' && verdict.kind === 'foul') return 'one-foul';
    if (twist?.kind === 'shotLimit' && this.story!.shots >= twist.shots) return 'out-of-shots';
    return null;
  }

  /** Endelea: the next stop, on its own table, so the scene starts again. */
  private playNextStop(): void {
    const next = this.story ? nextStop(this.story.stop) : undefined;
    if (!next || this.sim.isMoving) return;
    this.scene.start(SCENE_KEYS.table, { story: next.id } satisfies TableStart);
  }

  private openStoryMap(): void {
    if (this.sim.isMoving) return;
    this.computer.cancel();
    this.saveMatch();
    const chapter = this.story ? chapterOf(this.story.stop)?.id : undefined;
    this.scene.start(SCENE_KEYS.story, (chapter ? { chapter } : {}) satisfies StoryStart);
  }

  private onMatchChosen({ opponent, picks }: MatchChoice): void {
    // A first game or a new opponent starts with player 1 breaking; a rematch alternates the break as before.
    const rematch = this.opponentChosen && opponentId(opponent) === opponentId(this.opponent);
    this.opponentChosen = true;
    this.setCast(opponent, picks);
    const progress = this.slots.progress.load().data;
    this.slots.progress.save({ ...progress, lastOpponent: opponent, lastPicks: picks });
    this.startNewMatch(rematch ? opponentOf(this.match.breaker) : 0);
  }

  private startNewMatch(breaker: PlayerId): void {
    if (this.sim.isMoving) return;
    this.computer.cancel();
    this.computerSeed = Date.now() >>> 0;
    this.quips = new QuipChooser(createRandom((this.computerSeed ^ QUIPS.seedSalt) >>> 0));
    this.hud.hideQuip();
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
    this.showHowToPlayOnce();
    this.startComputerTurnIfDue();
  }

  /** Puts a saved game back on the table, as it was after its last finished shot. */
  private resumeMatch(saved: SavedMatch): void {
    this.story = saved.story ?? null;
    this.setCast(saved.opponent, saved.picks);
    this.opponentChosen = true;
    this.computerSeed = Date.now() >>> 0;
    this.quips = new QuipChooser(createRandom((this.computerSeed ^ QUIPS.seedSalt) >>> 0));
    this.hud.hideQuip();
    this.sim = new PoolSimulation(this.geometry, DEFAULT_PHYSICS, restoreBalls(saved.balls, UK_7FT_TABLE), this.logger.child('physics'));
    this.match = saved.match;
    this.shots = saved.shots;
    this.lastResult = null;
    this.aim = BREAK_AIM;
    this.view.syncBalls(this.sim.balls);
    this.hud.setStatus(this.turnMessage());
    this.refresh();
    this.logger.info(`resumed a saved match after ${saved.shots} shots`);
    this.showHowToPlayOnce();
    this.startComputerTurnIfDue();
  }

  /** Who plays this game: kept for saving and shown on the player panels. */
  private setCast(opponent: Opponent, picks: CharacterPicks): void {
    this.opponent = opponent;
    this.picks = picks;
    const stop = this.story ? storyStop(this.story.stop) : undefined;
    this.hud.setCast(opponent, picks, stop ? characterById(stopRival(stop, picks[0])) : undefined);
  }

  /** Back to the main menu. The game is saved and Continue brings it back. Ignored while balls roll. */
  private goToMenu(): void {
    if (this.sim.isMoving) return;
    this.computer.cancel();
    this.setup.hide();
    this.saveMatch();
    this.openMenu();
  }

  /**
   * Phaser keeps the data a scene was last started with when none is passed, so the menu would
   * reopen whatever panel it last restarted with (Settings after a language change). Always pass it.
   */
  private openMenu(): void {
    this.scene.start(SCENE_KEYS.menu, {} satisfies MenuStart);
  }

  private snapshot(): SavedMatch {
    return { opponent: this.opponent, picks: this.picks, match: this.match, balls: toSavedBalls(this.sim.balls), shots: this.shots, ...(this.story ? { story: this.story } : {}) };
  }

  /**
   * Saves the game in progress, or clears the save once the game is over. While balls roll, the
   * game from before the shot is saved: a shot cut off half way cannot be judged.
   */
  private saveMatch(): void {
    const slot = this.story ? this.slots.storyMatch : this.slots.match;
    if (this.match.phase === 'over') {
      slot.clear();
      return;
    }
    const game = this.sim.isMoving ? this.beforeShot : this.snapshot();
    if (game) slot.save(game);
  }

  /** A panel over the table (choosing a game or "how to play"): the table ignores the player meanwhile. */
  private get overlayOpen(): boolean {
    return this.setup.visible || this.howToPlay !== null;
  }

  /** Explains the controls on the player's first game; never again once dismissed. */
  private showHowToPlayOnce(): void {
    if (this.howToPlay || this.slots.tips.load().data.howToPlaySeen) return;
    this.cancelGestures();
    this.howToPlay = new Panel(this, {
      name: 'howToPlay',
      area: this.overTable,
      title: this.t.t('howTo.title'),
      body: this.t.t('howTo.body'),
      buttons: [{ name: 'howToPlay-ok', label: this.t.t('howTo.ok'), onTap: () => this.closeHowToPlay() }],
    });
    this.refresh();
  }

  private closeHowToPlay(): void {
    this.howToPlay?.destroy();
    this.howToPlay = null;
    this.slots.tips.save({ howToPlaySeen: true });
    this.refresh();
    this.startComputerTurnIfDue();
  }

  private isComputerTurn(): boolean {
    return this.opponent.kind === 'computer' && this.match.phase !== 'over' && this.match.current === COMPUTER_PLAYER;
  }

  private startComputerTurnIfDue(): void {
    if (this.opponent.kind !== 'computer' || !this.isComputerTurn() || this.overlayOpen || this.sim.isMoving || this.computer.active) return;
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
    this.soundMixer = new ShotSoundMixer();
    this.soundedEvents = 0;
    this.sfx.play('cue', cueGain(power));
    // Spin is chosen for one shot at a time, so a forgotten setting never spoils the next one.
    this.spin.reset();
    this.shots += 1;
    if (this.story && this.match.current === PERSON) this.story = { ...this.story, shots: this.story.shots + 1 };
    this.stepper.reset();
    this.aimView.hide();
    this.powerBar.setEnabled(false);
    this.logger.info(`shot ${this.shots}: player ${this.match.current + 1}, power ${power.toFixed(2)}, tip ${tip.side.toFixed(2)}/${tip.height.toFixed(2)}`);
  }

  /** Sounds for the contacts made since the last frame. */
  private playShotSounds(): void {
    const events = this.sim.shotEvents();
    if (events.length === this.soundedEvents) return;
    const fresh = events.slice(this.soundedEvents);
    this.soundedEvents = events.length;
    for (const cue of this.soundMixer.frame(fresh)) this.sfx.play(cue.sound, cue.gain);
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
    const shooter = this.match.current;
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

    if (this.story && verdict.kind === 'foul' && shooter === PERSON) this.story = { ...this.story, fouls: this.story.fouls + 1 };
    // A story twist can end the game on a shot the rules would let go on.
    const twistLoss = verdict.kind !== 'game-over' && shooter === PERSON ? this.twistLoss(verdict) : null;
    if (twistLoss) this.match = { ...this.match, phase: 'over', winner: COMPUTER_PLAYER };
    const ending = verdict.kind === 'game-over' ? { winner: verdict.winner, reason: verdict.reason } : twistLoss ? { winner: COMPUTER_PLAYER, reason: twistLoss } : null;
    if (ending) {
      const winner = this.hud.playerName(ending.winner);
      const loser = this.hud.playerName(opponentOf(ending.winner));
      const title = this.t.t('over.title', { player: winner });
      const detail = this.t.t(`over.${ending.reason}`, { loser });
      const before = this.played;
      const end = this.story ? this.finishStop(ending.winner === PERSON, title, detail) : { title, detail };
      this.recordResult(ending.winner);
      const notes = [...this.unlockNotes(before, this.played), ...(end.note ? [end.note] : [])];
      this.hud.showGameOver({ ...end, ...(notes.length ? { note: notes.join('\n') } : {}) });
      this.hud.setStatus('');
    } else {
      messages.push(this.turnMessage());
      this.hud.setStatus(messages.join('\n'));
    }
    const quip = this.quips.afterShot(shooter, verdict, (seat) => this.hud.characterId(seat));
    if (quip) this.hud.say(quip.speaker, this.t.t(quipKey(this.hud.characterId(quip.speaker), quip.moment, quip.index)));
    this.saveMatch();
    this.refresh();
    this.startComputerTurnIfDue();
  }

  /**
   * A story game ended: stars for it, the best kept, and what the end panel says, including a title
   * or reward earned just now.
   */
  private finishStop(won: boolean, title: string, detail: string): EndSpec {
    const stopId = this.story!.stop;
    const rivalGroup = this.match.groups[COMPUTER_PLAYER];
    const rivalLeft = rivalGroup ? countGroups(this.sim.balls)[rivalGroup] : 0;
    const stars = starsFor(won, this.story!.fouls, rivalLeft);
    const before = this.slots.story.load().data;
    const after = recordStop(before, stopId, stars);
    if (after !== before) this.slots.story.save(after);
    const notes: string[] = [];
    const titleNow = titleFor(after);
    if (titleNow && titleNow !== titleFor(before)) notes.push(this.t.t('story.newTitle', { title: this.t.t(`story.title.${titleNow}`) }));
    if (stars > 0 && stars <= (before.stars[stopId] ?? 0)) notes.push(this.t.t('story.bestKept', { stars: before.stars[stopId]! }));
    return { title, detail, stars, story: true, next: won && nextStop(stopId) !== undefined, ...(notes.length ? { note: notes.join('\n') } : {}) };
  }

  /** The journey and the wins so far, for what they unlock. */
  private get played(): Played {
    return { story: this.slots.story.load().data, wins: computerWins(this.slots.progress.load().data) };
  }

  /** Looks and characters this game just unlocked, for the end panel. */
  private unlockNotes(before: Played, after: Played): string[] {
    const t = this.t;
    const was = new Set([...earnedRewards(before), ...earnedCharacters(before)]);
    const looks = earnedRewards(after)
      .filter((key) => !was.has(key))
      .map((key) => {
        const [kind, id] = key.split(':');
        return t.t(`story.rewardNote.${kind}`, { name: t.t(`${kind}.${id}`) });
      });
    const characters = earnedCharacters(after)
      .filter((id) => !was.has(id))
      .map((id) => t.t('story.rewardNote.character', { name: characterById(id)!.name }));
    return [...looks, ...characters];
  }

  /** Counts a finished game in the stats. */
  private recordResult(winner: PlayerId): void {
    const progress = this.slots.progress.load().data;
    this.slots.progress.save(recordGame(progress, this.opponent, winner));
    if (this.opponent.kind === 'computer' && winner === PERSON) askForRemindersOnce(getServices(this), this.slots);
  }

  private turnMessage(): string {
    const message = this.plainTurnMessage();
    const twist = this.twist;
    if (twist?.kind !== 'shotLimit' || this.isComputerTurn()) return message;
    return this.t.t('status.withShotsLeft', { message, shots: Math.max(0, twist.shots - this.story!.shots) });
  }

  private plainTurnMessage(): string {
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
    if (this.sim.isMoving || over.length > 0 || this.match.phase === 'over' || this.overlayOpen || this.isComputerTurn()) return;
    if (this.powerPointerId === null && this.powerBar.hitTest(pointer.x, pointer.y)) {
      this.powerPointerId = pointer.id;
      this.powerBar.begin(pointer.y);
      this.refresh();
      return;
    }
    if (this.spinPointerId === null && this.twist?.kind !== 'noSpin' && this.spin.hitTest(pointer.x, pointer.y)) {
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
    // A new random rack every game (Math.random is fine here: nothing needs to repeat it).
    return new PoolSimulation(this.geometry, DEFAULT_PHYSICS, rackBalls(UK_7FT_TABLE, createRandom((Math.random() * 2 ** 32) >>> 0)), this.logger.child('physics'));
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
    const playerIdle = this.isComputerTurn() || this.overlayOpen;
    this.hud.setHint(playerIdle || over ? 'none' : this.match.ballInHand ? 'ballInHand' : 'aim');
    this.powerBar.setEnabled(!over && !playerIdle);
    this.spin.setEnabled(!over && !playerIdle && this.twist?.kind !== 'noSpin');
    this.fineAim.setEnabled(!over && !playerIdle);
    if (over || this.overlayOpen) {
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
      tube: this.view.tubeIds,
      tubeWaiting: this.view.tubeWaitingIds,
      tubeDelays: this.geometry.pockets.map((p) => Math.round(this.view.tubeDelayMs(p.center))),
      events: this.sim.shotEvents().map((e) => e.type),
      match: this.match,
      verdict: this.lastResult?.verdict ?? null,
      status: this.hud.statusText,
      gameOverShown: this.hud.gameOverVisible,
      autoMenuSeconds: this.hud.autoMenuSeconds,
      endButtons: this.hud.endButtons,
      trays: this.hud.trayState,
      quip: this.hud.quip,
      hand: this.sides.hand,
      controls: { spin: { x: this.spin.x, y: this.spin.y }, fineAim: { x: this.fineAim.x, y: this.fineAim.y }, tableLeft: this.view.toDesign(0, 0).x, tableRight: this.view.toDesign(this.geometry.length, 0).x },
      opponent: this.opponent,
      computer: this.computer.currentPhase,
      pickerShown: this.setup.visible,
      setupStep: this.setup.step,
      selectedCharacter: this.setup.selectedCharacter,
      players: [this.hud.playerName(0), this.hud.playerName(1)],
      picks: this.picks,
      howToPlayShown: this.howToPlay !== null,
      spin: this.spin.tip,
      lastShot: this.lastShot,
      story: this.story,
      looks: this.looks,
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
