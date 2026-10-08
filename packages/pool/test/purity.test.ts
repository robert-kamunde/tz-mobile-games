import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '../src');
/** Folders that must stay engine-independent and deterministic. */
const PURE_DIRS = ['physics', 'rules', 'ai'];

/**
 * The simulation and rules must stay deterministic and engine-independent. These are the rules
 * from src/physics/types.ts, checked so a later change cannot quietly break them.
 */
describe('physics, rules and AI source rules', () => {
  const files = PURE_DIRS.flatMap((dir) => readdirSync(join(SRC, dir)).filter((f) => f.endsWith('.ts')).map((f) => join(dir, f)));

  it('finds the sources', () => {
    expect(files.length).toBeGreaterThan(PURE_DIRS.length);
  });

  it.each(files)('%s imports no Phaser or DOM code and uses no engine-dependent maths', (file) => {
    const source = readFileSync(join(SRC, file), 'utf8');
    expect(source).not.toMatch(/from ['"]phaser['"]/);
    expect(source).not.toMatch(/@tzg\/shell/);
    expect(source).not.toMatch(/\b(window|document)\./);
    expect(source).not.toMatch(/Math\.(sin|cos|tan|atan2?|asin|acos|hypot|exp|log|pow|random)\b/);
    expect(source).not.toMatch(/\bDate\.now\b|performance\.now/);
  });
});
