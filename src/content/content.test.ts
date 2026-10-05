// Content ↔ figure consistency (the full linter is `pnpm check`, M6). For every topic with a
// figure: each <Property> has a numeric check, and every point a proof step or formula
// mentions exists on that figure.
import { describe, expect, it } from 'vitest';
import { parseRefs, refPoints } from '@/figures/engine/refs';
import type { FigureSpec } from '@/figures/engine/spec';

const files = import.meta.glob<string>('./topics/**/*.mdx', { query: '?raw', import: 'default', eager: true });
const specs = import.meta.glob<{ default: FigureSpec }>(['../figures/*.ts', '!../figures/registry.ts'], { eager: true });

for (const [path, src] of Object.entries(files)) {
  const figure = src.match(/^figure:\s*(\S+)/m)?.[1];
  if (!figure) continue;
  describe(path, () => {
    const spec = specs[`../figures/${figure}.ts`]?.default;
    it(`figure "${figure}" exists`, () => expect(spec).toBeDefined());
    if (!spec) return;
    const pts = Object.keys(spec.points(Object.fromEntries(Object.entries(spec.params).map(([k, d]) => [k, d.value]))));

    it('every property has a numeric check', () => {
      const ids = [...src.matchAll(/<Property\s+id="([^"]+)"/g)].map(m => m[1]!);
      expect(ids.length).toBeGreaterThan(0);
      expect(ids.filter(id => !spec.checks?.[id])).toEqual([]);
    });

    it('ids are unique on the page', () => {
      const ids = [...src.matchAll(/<(?:Property|Formula)\s+id="([^"]+)"/g)].map(m => m[1]!);
      expect(ids.length).toBe(new Set(ids).size);
    });

    it('proof steps only use points of the figure', () => {
      const refs = [...src.matchAll(/<Step\b[^>]*?\b(?:show|hl)="([^"]*)"/g), ...src.matchAll(/<Step\b[^>]*?\bhl="([^"]*)"/g)].map(m => m[1]!);
      const bad = refs.flatMap(r => parseRefs(r).flatMap(refPoints)).filter(p => !pts.includes(p));
      expect([...new Set(bad)]).toEqual([]);
    });

    it('formula proof links point to properties on the page', () => {
      const props = new Set([...src.matchAll(/<Property\s+id="([^"]+)"/g)].map(m => m[1]!));
      const links = [...src.matchAll(/<Formula\b[^>]*\bproof="([^"]+)"/g)].map(m => m[1]!);
      expect(links.filter(l => !props.has(l))).toEqual([]);
    });
  });
}

