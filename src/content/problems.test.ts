// Every <Problem> is checked on its figure: the figure is built from the problem's `set`, every
// `given` must hold there and every answer must equal what is measured — so a problem can
// neither contradict itself nor carry a wrong answer. Units: k problem units per figure unit
// (an attribute, or from the first given length).
import { describe, expect, it } from 'vitest';
import { evaluate, type Atom } from '@/lib/expr';
import { area, angleAt, dist, near, perimeter, type V } from '@/figures/engine/geom';
import { names, parseRefs, refPoints } from '@/figures/engine/refs';
import type { FigureSpec, Params } from '@/figures/engine/spec';

const files = import.meta.glob<string>('./topics/**/*.mdx', { query: '?raw', import: 'default', eager: true });
const specs = import.meta.glob<{ default: FigureSpec }>(['../figures/*.ts', '!../figures/registry.ts'], { eager: true });

// the opening tag's attributes: "strings", {{ objects }} and {numbers} (a quoted value may hold ">")
const OPEN = /<Problem\s((?:[^>"{]|"[^"]*"|\{\{[^}]*\}\}|\{[^}]*\})*)>([\s\S]*?)<\/Problem>/g;
const attrs = (s: string) => Object.fromEntries([...s.matchAll(/(\w+)="([^"]*)"/g)].map(m => [m[1]!, m[2]!]));
const obj = (s = '') => Object.fromEntries(s.split(',').filter(x => x.trim()).map(kv => { const [k, v] = kv.split(':'); return [k!.trim(), +v!]; }));

/** Lengths (AB), angles (<ABC, <A in the base polygon), areas S(…) and perimeters P(…), in problem units. */
function measurer(pts: Record<string, V>, poly: string[], k: number): Atom {
  const P = (n: string) => pts[n] ?? (() => { throw new Error(`no point ${n} on the figure`); })();
  return (s, at) => {
    const rest = s.slice(at);
    let m: RegExpExecArray | null;
    if ((m = /^([SP])\(((?:[A-Z][0-9']*)+)\)/.exec(rest))) {
      const ps = names(m[2]!).map(P);
      return { value: m[1] === 'S' ? area(ps) * k * k : perimeter(ps) * k, end: at + m[0].length };
    }
    if ((m = /^<((?:[A-Z][0-9']*)+)/.exec(rest))) {
      let n = names(m[1]!);
      if (n.length === 1) { const i = poly.indexOf(n[0]!); if (i < 0) throw new Error(`<${n[0]}: not a vertex of the base polygon`); n = [poly.at(i - 1)!, n[0]!, poly[(i + 1) % poly.length]!]; }
      if (n.length !== 3) throw new Error(`"<${m[1]}": an angle is <A or <ABC`);
      return { value: angleAt(P(n[0]!), P(n[1]!), P(n[2]!)), end: at + m[0].length };
    }
    if ((m = /^(?:[A-Z][0-9']*)+/.exec(rest))) {
      const n = names(m[0]);
      if (n.length !== 2) throw new Error(`"${m[0]}": write a length as two points; areas as S(${m[0]})`);
      return { value: dist(P(n[0]!), P(n[1]!)) * k, end: at + m[0].length };
    }
    return null;
  };
}

for (const [path, src] of Object.entries(files)) {
  const main = src.match(/^figure:\s*(\S+)/m)?.[1];
  const problems = [...src.matchAll(OPEN)].map(m => ({ a: attrs(m[1]!), set: obj(m[1]!.match(/set=\{\{([^}]*)\}\}/)?.[1]), k: m[1]!.match(/\bk=\{([^}]+)\}/)?.[1], body: m[2]! }));
  if (!problems.length) continue;

  describe(path, () => {
    for (const { a, set, k: kAttr, body } of problems) {
      it(`problem ${a.id}: consistent, and the answer is right`, () => {
        const spec = specs[`../figures/${a.figure ?? main}.ts`]?.default;
        expect(spec, `figure ${a.figure ?? main}`).toBeDefined();
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
        const k = kAttr ? +kAttr : firstLen ? evaluate(firstLen[1]) / evaluate(firstLen[0], measurer(pts, poly, 1)) : 1;
        const at = measurer(pts, poly, k);
        for (const [l, r] of given) expect(near(evaluate(l, at), evaluate(r, at)), `given ${l}=${r}: the figure has ${evaluate(l, at)}`).toBe(true);
        const finds = a.find!.split(/\s+/), answers = a.answer!.split(/\s+/);
        expect(answers.length).toBe(finds.length);
        finds.forEach((f, i) => expect(near(evaluate(f, at), evaluate(answers[i]!)), `${f} = ${answers[i]}: the figure has ${evaluate(f, at)}`).toBe(true));
        // the solution: at least one step, and every point it draws exists
        expect(body.match(/<Step\b/g)?.length ?? 0, 'a solution with steps').toBeGreaterThan(0);
        const drawn = [a.show ?? '', ...[...body.matchAll(/\b(?:show|hl)="([^"]*)"/g)].map(m => m[1]!)].join(' ');
        expect(parseRefs(drawn).flatMap(refPoints).filter(n => !pts[n])).toEqual([]);
      });
    }
  });
}
