import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { poolStrings } from '../src/strings';

/** Every source file except the string tables themselves. */
function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? sourceFiles(join(dir, e.name)) : e.name.endsWith('.ts') && e.name !== 'strings.ts' ? [join(dir, e.name)] : [],
  );
}

describe('string keys', () => {
  it('every fixed key the code translates exists in both languages', () => {
    // A missing key shows on screen as the key itself ("ui.ok"), so it is caught here instead.
    const used = new Set<string>();
    for (const file of sourceFiles(join(__dirname, '../src'))) {
      for (const line of readFileSync(file, 'utf8').split('\n')) {
        if (!line.includes('t.t(')) continue;
        for (const m of line.matchAll(/'([a-z][\w-]*\.[\w.-]+)'/g)) used.add(m[1]!);
      }
    }
    expect(used.size).toBeGreaterThan(50);
    for (const locale of ['sw', 'en'] as const) {
      expect([...used].filter((key) => !(key in poolStrings[locale]!)), locale).toEqual([]);
    }
  });
});
