import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const PHYSICS_DIR = join(dirname(fileURLToPath(import.meta.url)), '../src/physics');

/**
 * The simulation must stay deterministic and engine-independent. These are the rules from
 * src/physics/types.ts, checked so a later change cannot quietly break them.
 */
describe('physics source rules', () => {
  const files = readdirSync(PHYSICS_DIR).filter((f) => f.endsWith('.ts'));

  it('finds the physics sources', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)('%s imports no Phaser or DOM code and uses no engine-dependent maths', (file) => {
    const source = readFileSync(join(PHYSICS_DIR, file), 'utf8');
    expect(source).not.toMatch(/from ['"]phaser['"]/);
    expect(source).not.toMatch(/@tzg\/shell/);
    expect(source).not.toMatch(/\b(window|document)\./);
    expect(source).not.toMatch(/Math\.(sin|cos|tan|atan2?|asin|acos|hypot|exp|log|pow|random)\b/);
    expect(source).not.toMatch(/\bDate\.now\b|performance\.now/);
  });
});
