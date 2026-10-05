// The content linter (`pnpm check` = Zod frontmatter via `astro sync` + this file).
// Per topic: each <Property> has a numeric check on the figure its proof plays on, and every
// point a proof step mentions exists on that figure. Site-wide: slugs, links, prerequisites,
// glossary terms.
import { describe, expect, it } from 'vitest';
import { parseRefs, refPoints } from '@/figures/engine/refs';
import type { FigureSpec } from '@/figures/engine/spec';
import { stemKa } from '@/lib/ka-search';
import glossary from './glossary.json';

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

    it('every <Property> sits inside <Properties> (otherwise both tabs render it)', () => {
      const outside = src.replace(/<Properties\b[\s\S]*?<\/Properties>/g, '');
      expect([...outside.matchAll(/<Property\s+id="([^"]+)"/g)].map(m => m[1])).toEqual([]);
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

const field = (src: string, k: string) => src.match(new RegExp(`^${k}:\\s*(.+)$`, 'm'))?.[1]?.trim();
const list = (v?: string) => v?.replace(/^\[|\]$/g, '').split(',').map(x => x.trim()).filter(Boolean) ?? [];
const topics = Object.entries(files).map(([path, src]) => ({
  path, src, slug: field(src, 'slug')!, subject: field(src, 'subject')!, file: path.split('/').pop()!.replace(/\.mdx$/, ''),
}));
const slugs = new Set(topics.map(t => t.slug));
const urls = new Set(topics.map(t => `/${t.subject}/${t.slug}/`));

describe('site', () => {
  it('slug matches the file name and is unique', () => {
    expect(topics.filter(t => t.slug !== t.file).map(t => t.path)).toEqual([]);
    expect(topics.length).toBe(slugs.size);
  });

  it('prerequisites and parent name existing topics', () => {
    const bad = topics.flatMap(t => [...list(field(t.src, 'prerequisites')), ...list(field(t.src, 'parent'))]
      .filter(s => !slugs.has(s)).map(s => `${t.slug} → ${s}`));
    expect(bad).toEqual([]);
  });

  it('internal links resolve', () => {
    const extra = new Set(['/', '/cheatsheet/', '/geometry/relationships/']);
    const bad = topics.flatMap(t => [...t.src.matchAll(/\]\((\/[^)#\s]*)(?:#[^)]*)?\)|href="(\/[^"#]*)/g)]
      .map(m => m[1] ?? m[2]!).filter(u => !urls.has(u) && !extra.has(u)).map(u => `${t.slug} → ${u}`));
    expect(bad).toEqual([]);
  });

  it('no glossary "avoid" variant appears', () => {
    // an avoided prefix may still start the right term („ჩახაზული წრ“ → „ჩახაზული წრეწირი“): those hits don't count
    const wrong = (src: string, a: string, ka: string) =>
      [...src.matchAll(new RegExp(a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'))].some(m => !src.startsWith(ka.slice(0, -1), m.index));
    const bad = topics.flatMap(t => glossary.terms.flatMap(g => ('avoid' in g ? (g.avoid as string[]) : [])
      .filter(a => wrong(t.src, a, g.ka)).map(a => `${t.slug}: „${a}“ → „${g.ka}“`)));
    expect(bad).toEqual([]);
  });

  it('terms defined in bold are in the glossary', () => {
    // Compare head words stemmed to a fixed point: „ტოლია“, „ტოლი“ → „ტოლ“. Loose on purpose —
    // it catches a new term or a misspelling, not which of two related terms was meant.
    const head = (s: string) => { let w = s.split(/\s+/)[0]!, v; while ((v = stemKa(w)) !== w) w = v; return w; };
    const known = new Set(glossary.terms.map(g => head(g.ka)));
    const bad = topics.flatMap(t => [...t.src.matchAll(/<Definition>([\s\S]*?)<\/Definition>/g)]
      .flatMap(d => [...d[1]!.matchAll(/\*\*([^*]+)\*\*/g)].map(b => b[1]!.trim()))
      .filter(b => !known.has(head(b)))
      .map(b => `${t.slug}: ${b}`));
    expect(bad).toEqual([]);
  });
});
