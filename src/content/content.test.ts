// Content ↔ figure consistency (the full linter is `pnpm check`, M6). For every topic with a
// figure: each <Property> has a numeric check on the figure its proof plays on, and every
// point a proof step mentions exists on that figure.
import { describe, expect, it } from 'vitest';
import { parseRefs, refPoints } from '@/figures/engine/refs';
import type { FigureSpec } from '@/figures/engine/spec';

const files = import.meta.glob<string>('./topics/**/*.mdx', { query: '?raw', import: 'default', eager: true });
const specs = import.meta.glob<{ default: FigureSpec }>(['../figures/*.ts', '!../figures/registry.ts'], { eager: true });
const spec = (name: string) => specs[`../figures/${name}.ts`]?.default;
const pointsOf = (s: FigureSpec) => Object.keys(s.points(Object.fromEntries(Object.entries(s.params).map(([k, d]) => [k, d.value]))));

for (const [path, src] of Object.entries(files)) {
  const main = src.match(/^figure:\s*(\S+)/m)?.[1];
  const extras = src.match(/^figures:\s*\[([^\]]*)\]/m)?.[1]?.split(',').map(s => s.trim()).filter(Boolean) ?? [];
  const props = [...src.matchAll(/<Property\s+id="([^"]+)"[\s\S]*?<\/Property>/g)].map(m => ({
    id: m[1]!, body: m[0], figure: m[0].match(/<Proof\b[^>]*\bfigure="([^"]+)"/)?.[1] ?? main,
  }));

  describe(path, () => {
    it('declared figures exist', () => {
      for (const n of [main, ...extras].filter((x): x is string => !!x)) expect(spec(n), n).toBeDefined();
    });

    it('proof figures are declared in frontmatter', () => {
      const used = props.map(p => p.figure).filter(f => f && f !== main);
      expect(used.filter(f => !extras.includes(f!))).toEqual([]);
    });

    it('every property has a numeric check on its figure', () => {
      const missing = props.filter(p => p.figure && !spec(p.figure)?.checks?.[p.id]).map(p => `${p.id} @ ${p.figure}`);
      expect(missing).toEqual([]);
    });

    it('ids are unique on the page', () => {
      const ids = [...src.matchAll(/<(?:Property|Formula)\s+id="([^"]+)"/g)].map(m => m[1]!);
      expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([]);
    });

    it('proof steps only use points of their figure', () => {
      const bad: string[] = [];
      for (const p of props) {
        const s = p.figure ? spec(p.figure) : undefined;
        if (!s) continue;
        const pts = pointsOf(s);
        for (const m of p.body.matchAll(/<Step\b[^>]*>/g)) {
          for (const attr of m[0].matchAll(/\b(?:show|hl)="([^"]*)"/g)) {
            for (const n of parseRefs(attr[1]).flatMap(refPoints)) if (!pts.includes(n)) bad.push(`${p.id}: ${n}`);
          }
        }
      }
      expect([...new Set(bad)]).toEqual([]);
    });

    it('formula proof links point to properties on the page', () => {
      const ids = new Set(props.map(p => p.id));
      const links = [...src.matchAll(/<Formula\b[^>]*\bproof="([^"]+)"/g)].map(m => m[1]!);
      expect(links.filter(l => !ids.has(l))).toEqual([]);
    });
  });
}
