import { renderSound } from '@tzg/core';
import { describe, expect, it } from 'vitest';
import { ShotSoundMixer, cueGain, loudness } from '../src/audio/shotSounds';
import { SOUND_LOUDNESS, SOUND_MIX, SOUND_RECIPES, SOUND_SEED, type PoolSound } from '../src/config/sound';
import type { ShotEvent } from '../src/physics/types';
import { TABLE, cueAt, objectBall, rackedSim, simWith } from './helpers';

const ball = (step: number, speed: number): ShotEvent => ({ type: 'ball', step, a: 0, b: 1, speed });
const cushion = (step: number, speed: number): ShotEvent => ({ type: 'cushion', step, ball: 1, speed });

describe('placeholder sounds', () => {
  it.each(Object.keys(SOUND_RECIPES) as PoolSound[])('%s is short, audible, never clips and is the same every time', (name) => {
    const s = renderSound(SOUND_RECIPES[name], 44_100, SOUND_SEED);
    expect(s.length / 44_100).toBeLessThanOrEqual(0.3);
    const peak = s.reduce((m, v) => Math.max(m, Math.abs(v)), 0);
    expect(peak).toBeGreaterThan(0.5);
    expect(peak).toBeLessThanOrEqual(1);
    expect(renderSound(SOUND_RECIPES[name], 44_100, SOUND_SEED)).toEqual(s);
  });
});

describe('loudness', () => {
  it('is silent for a touch, full for a hard hit, and grows in between', () => {
    const l = SOUND_LOUDNESS.ball;
    expect(loudness(l.silentBelow, l)).toBe(0);
    expect(loudness(l.fullAt, l)).toBe(1);
    expect(loudness(l.fullAt * 3, l)).toBe(1);
    expect(loudness(1, l)).toBeGreaterThan(loudness(0.5, l));
    expect(loudness(Number.NaN, l)).toBe(0);
  });

  it('the cue strike runs from its softest to its loudest with power', () => {
    expect(cueGain(0)).toBe(SOUND_MIX.cueMin);
    expect(cueGain(1)).toBe(SOUND_MIX.cueMax);
    expect(cueGain(5)).toBe(SOUND_MIX.cueMax);
    expect(cueGain(Number.NaN)).toBe(SOUND_MIX.cueMin);
  });
});

describe('shot sound mixer', () => {
  it('plays each kind of contact, with the pocket at its fixed level', () => {
    const cues = new ShotSoundMixer().frame([ball(1, 2), cushion(2, 1), { type: 'pocket', step: 3, ball: 1, pocket: 0 }]);
    expect(cues.map((c) => c.sound).sort()).toEqual(['ball', 'cushion', 'pocket']);
    expect(cues.find((c) => c.sound === 'pocket')!.gain).toBe(SOUND_MIX.pocket);
  });

  it('drops close repeats unless clearly louder, and allows them again after the gap', () => {
    const m = new ShotSoundMixer();
    expect(m.frame([ball(100, 2)])).toHaveLength(1);
    expect(m.frame([ball(110, 2)])).toHaveLength(0);
    expect(m.frame([ball(115, 4)])).toHaveLength(1);
    expect(m.frame([ball(115 + SOUND_MIX.minGapSteps, 1)])).toHaveLength(1);
  });

  it('starts at most a few sounds per frame, loudest first, and ignores silent touches', () => {
    const events = [ball(1, 0.5), cushion(1, 0.2), { type: 'pocket', step: 1, ball: 2, pocket: 1 } as const, ball(200, 3), cushion(300, 2), ball(400, 0.01)];
    const cues = new ShotSoundMixer().frame(events);
    expect(cues).toHaveLength(SOUND_MIX.maxPerFrame);
    expect(cues.map((c) => c.gain)).toEqual([...cues.map((c) => c.gain)].sort((a, b) => b - a));
  });

  it('a real break gives a handful of sounds, not dozens', () => {
    const sim = rackedSim();
    sim.strike({ direction: { x: 1, y: 0.01 }, power: 1, side: 0, height: 0 });
    const m = new ShotSoundMixer();
    let played = 0;
    let seen = 0;
    // About 16 ms of physics per frame at 60 fps.
    while (sim.isMoving) {
      for (let i = 0; i < 16 && sim.isMoving; i++) sim.step();
      const events = sim.shotEvents();
      played += m.frame(events.slice(seen)).length;
      seen = events.length;
    }
    expect(played).toBeGreaterThan(5);
    expect(played).toBeLessThan(seen);
  });
});

describe('contact speeds in the physics events', () => {
  it('a straight hit reports the closing speed, and a cushion the speed into it', () => {
    const W = TABLE.playWidth;
    const sim = simWith([cueAt(0.5, W / 2), objectBall(1, 0.9, W / 2)]);
    sim.strike({ direction: { x: 1, y: 0 }, power: 0.3, side: 0, height: 0 });
    let speedBefore = 0;
    while (!sim.shotEvents().some((e) => e.type === 'ball')) {
      speedBefore = sim.cueBall.vx;
      sim.step();
    }
    const hit = sim.shotEvents().find((e) => e.type === 'ball')!;
    expect(hit.type === 'ball' && hit.speed).toBeCloseTo(speedBefore, 1);
    while (!sim.shotEvents().some((e) => e.type === 'cushion')) sim.step();
    const c = sim.shotEvents().find((e) => e.type === 'cushion')!;
    expect(c.type === 'cushion' && c.speed).toBeGreaterThan(0);
  });
});
