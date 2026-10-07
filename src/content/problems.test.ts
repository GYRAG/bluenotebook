// Every <Problem> is checked on its figure: the figure is built from the problem's `set`, every
// `given` must hold there and every answer must equal what is measured — so a problem can
// neither contradict itself nor carry a wrong answer. Units: k problem units per figure unit
// (an attribute, or from the first given length).
import { describe, expect, it } from 'vitest';
import { evaluate, type Atom } from '@/lib/expr';
import { area, angleAt, dist, near, type V } from '@/figures/engine/geom';
import { angle3, area3, dist3, tetra, type V3 } from '@/figures/engine/solid';
import { names, parseRefs, refPoints } from '@/figures/engine/refs';
import type { FigureSpec, Params } from '@/figures/engine/spec';

const files = import.meta.glob<string>(['./topics/**/*.mdx', './topics-en/**/*.mdx'], { query: '?raw', import: 'default', eager: true });
const specs = import.meta.glob<{ default: FigureSpec }>(['../figures/*.ts', '!../figures/registry.ts'], { eager: true });

// the opening tag's attributes: "strings", {{ objects }} and {numbers} (a quoted value may hold ">")
const OPEN = /<Problem\s((?:[^>"{]|"[^"]*"|\{\{[^}]*\}\}|\{[^}]*\})*)>([\s\S]*?)<\/Problem>/g;
const attrs = (s: string) => Object.fromEntries([...s.matchAll(/(\w+)="([^"]*)"/g)].map(m => [m[1]!, m[2]!]));
const obj = (s = '') => Object.fromEntries(s.split(',').filter(x => x.trim()).map(kv => { const [k, v] = kv.split(':'); return [k!.trim(), +v!]; }));

/** Measuring on a flat figure or (solids) in space. */
interface Metric<P> { dist(a: P, b: P): number; angle(a: P, v: P, b: P): number; area(ps: P[]): number; coord(p: P, i: number): number }
const flat: Metric<V> = { dist, angle: angleAt, area, coord: (p, i) => p[i] ?? 0 };
const space: Metric<V3> = { dist: dist3, angle: angle3, area: area3, coord: (p, i) => p[i]! };

/**
 * Lengths (AB), angles (<ABC, <A in the base polygon), areas S(…), perimeters P(…), volumes V(S…) of
 * the pyramid with apex S over the rest (a tetrahedron when three follow), and coordinates x(A),
 * y(A), z(A) — all in problem units.
 */
function measurer<P>(pts: Record<string, P>, m: Metric<P>, poly: string[], k: number): Atom {
  const P = (n: string) => pts[n] ?? (() => { throw new Error(`no point ${n} on the figure`); })();
  return (s, at) => {
    const rest = s.slice(at);
    let r: RegExpExecArray | null;
    if ((r = /^([xyz])\(([A-Z][0-9']*)\)/.exec(rest))) return { value: m.coord(P(r[2]!), 'xyz'.indexOf(r[1]!)) * k, end: at + r[0].length };
    if ((r = /^([SPV])\(((?:[A-Z][0-9']*)+)\)/.exec(rest))) {
      const ps = names(r[2]!).map(P), end = at + r[0].length;
      if (r[1] === 'S') return { value: m.area(ps) * k * k, end };
      if (r[1] === 'P') return { value: ps.reduce((sum, q, i) => sum + m.dist(q, ps[(i + 1) % ps.length]!), 0) * k, end };
      const [apex, ...b] = ps as unknown as V3[]; // a fan of tetrahedra over a convex base
      let v = 0;
      for (let i = 1; i + 1 < b.length; i++) v += tetra(apex!, b[0]!, b[i]!, b[i + 1]!);
      return { value: v * k ** 3, end };
    }
    if ((r = /^<((?:[A-Z][0-9']*)+)/.exec(rest))) {
      let n = names(r[1]!);
      if (n.length === 1) { const i = poly.indexOf(n[0]!); if (i < 0) throw new Error(`<${n[0]}: not a vertex of the base polygon`); n = [poly.at(i - 1)!, n[0]!, poly[(i + 1) % poly.length]!]; }
      if (n.length !== 3) throw new Error(`"<${r[1]}": an angle is <A or <ABC`);
      return { value: m.angle(P(n[0]!), P(n[1]!), P(n[2]!)), end: at + r[0].length };
    }
    if ((r = /^(?:[A-Z][0-9']*)+/.exec(rest))) {
      const n = names(r[0]);
      if (n.length !== 2) throw new Error(`"${r[0]}": write a length as two points; areas as S(${r[0]})`);
      return { value: m.dist(P(n[0]!), P(n[1]!)) * k, end: at + r[0].length };
    }
    return null;
  };
}

for (const [path, src] of Object.entries(files)) {
  const main = src.match(/^figure:\s*(\S+)/m)?.[1];
  const extras = src.match(/^figures:\s*\[([^\]]*)\]/m)?.[1]?.split(',').map(s => s.trim()) ?? [];
  const problems = [...src.matchAll(OPEN)].map(m => ({ a: attrs(m[1]!), set: obj(m[1]!.match(/set=\{\{([^}]*)\}\}/)?.[1]), k: m[1]!.match(/\bk=\{([^}]+)\}/)?.[1], body: m[2]! }));
  if (!problems.length) continue;

  describe(path, () => {
    for (const { a, set, k: kAttr, body } of problems) {
      it(`problem ${a.id}: consistent, and the answer is right`, () => {
        const spec = specs[`../figures/${a.figure ?? main}.ts`]?.default;
        expect(spec, `figure ${a.figure ?? main}`).toBeDefined();
        if (a.figure) expect(extras, `figure ${a.figure}: list it under figures: in the frontmatter`).toContain(a.figure);
        const s = spec!, p: Params = { ...Object.fromEntries(Object.entries(s.params).map(([key, d]) => [key, d.value])) };
        for (const [key, v] of Object.entries(set)) {
          const d = s.params[key];
          expect(d, `param ${key}`).toBeDefined();
          expect(v >= d!.min - 1e-9 && v <= d!.max + 1e-9, `${key} = ${v} is outside the slider range ${d!.min}…${d!.max}`).toBe(true);
          p[key] = v;
        }
        const pts = s.points(p), base = typeof s.base === 'function' ? s.base(p) : s.base;
        const poly = (parseRefs(base).find(r => r.k === 'poly') as { ps: string[] } | undefined)?.ps ?? [];
        const given = (a.given ?? '').split(/\s+/).filter(Boolean).map(g => g.split('=') as [string, string]);
        const firstLen = given.find(([l, r]) => /^(?:[A-Z][0-9']*){2}$/.test(l) && names(l).length === 2 && !/[A-Z]/.test(r));
        const P3 = s.space?.(p) as Record<string, V3> | undefined;
        const at1 = P3 ? measurer(P3, space, poly, 1) : measurer(pts, flat, poly, 1);
        const k = kAttr ? +kAttr : firstLen ? evaluate(firstLen[1]) / evaluate(firstLen[0], at1) : 1;
        const at = P3 ? measurer(P3, space, poly, k) : measurer(pts, flat, poly, k);
        for (const [l, r] of given) expect(near(evaluate(l, at), evaluate(r, at)), `given ${l}=${r}: the figure has ${evaluate(l, at)}`).toBe(true);
        const finds = (a.find ?? '').split(/\s+/).filter(Boolean), answers = (a.answer ?? '').split(/\s+/).filter(Boolean);
        expect(answers.length).toBe(finds.length);
        finds.forEach((f, i) => expect(near(evaluate(f, at), evaluate(answers[i]!)), `${f} = ${answers[i]}: the figure has ${evaluate(f, at)}`).toBe(true));
        for (const [l, r] of (a.prove ?? '').split(/\s+/).filter(Boolean).map(g => g.split('=') as [string, string])) {
          expect(near(evaluate(l, at), evaluate(r, at)), `claim ${l}=${r}: the figure has ${evaluate(l, at)} and ${evaluate(r, at)}`).toBe(true);
        }
        expect(finds.length > 0 || !!a.prove, 'find + answer, or prove').toBe(true);
        // the solution: at least one step, and every point it draws exists
        expect(body.match(/<Step\b/g)?.length ?? 0, 'a solution with steps').toBeGreaterThan(0);
        const drawn = [a.show ?? '', ...[...body.matchAll(/\b(?:show|hl)="([^"]*)"/g)].map(m => m[1]!)].join(' ');
        expect(parseRefs(drawn).flatMap(refPoints).filter(n => !pts[n])).toEqual([]);
      });
    }
  });
}
