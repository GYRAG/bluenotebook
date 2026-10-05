import { describe, expect, it } from 'vitest';
import { angleAt, area, foot, intersect, near, type V } from './geom';
import { parseRef, parseRefs, refPoints } from './refs';
import { solveDrag, snap } from './solve';
import { classifyQuad, classifyTriangle } from './classify';
import { boardBounds, randomParams, rng } from './bounds';
import type { FigureSpec } from './spec';

const figures = Object.entries(import.meta.glob<{ default: FigureSpec }>(['../*.ts', '!../registry.ts'], { eager: true }))
  .map(([path, m]) => [path.slice(3, -3), m.default] as const);

describe('geometry', () => {
  it('intersects, projects, measures', () => {
    expect(intersect([0, 0], [2, 2], [0, 2], [2, 0])).toEqual([1, 1]);
    expect(foot([1, 3], [0, 0], [4, 0])).toEqual([1, 0]);
    expect(near(angleAt([1, 0], [0, 0], [0, 1]), 90)).toBe(true);
    expect(area([[0, 0], [4, 0], [4, 3], [0, 3]])).toBe(12);
  });
});

describe('reference grammar', () => {
  it('parses every token kind', () => {
    expect(parseRef('A')).toEqual({ k: 'point', p: 'A' });
    expect(parseRef("A1B'")).toEqual({ k: 'seg', s: ['A1', "B'"] });
    expect(parseRef('ABCD')).toEqual({ k: 'poly', ps: ['A', 'B', 'C', 'D'] });
    expect(parseRef('<ABC')).toEqual({ k: 'angle', ang: { a: 'A', v: 'B', b: 'C' } });
    expect(parseRef('arc:O1AB')).toEqual({ k: 'arc', c: 'O1', a: 'A', b: 'B' });
    expect(() => parseRef('arc:OA')).toThrow();
    expect(parseRef('<A')).toEqual({ k: 'angle', ang: { v: 'A' } });
    expect(parseRef('AB=CD=EF')).toEqual({ k: 'eqseg', segs: [['A', 'B'], ['C', 'D'], ['E', 'F']] });
    expect(parseRef('<A=<C')).toEqual({ k: 'eqang', angs: [{ v: 'A' }, { v: 'C' }] });
    expect(parseRef('AB||CD')).toEqual({ k: 'par', segs: [['A', 'B'], ['C', 'D']] });
    expect(parseRef('(OA)')).toEqual({ k: 'circle', c: 'O', p: 'A' });
    expect(parseRef('|AB|a')).toEqual({ k: 'dim', s: ['A', 'B'], sym: 'a' });
    expect(parseRef('line:AB')).toEqual({ k: 'line', s: ['A', 'B'] });
  });
  it('rejects nonsense and lists points', () => {
    expect(() => parseRef('Ab')).toThrow();
    expect(() => parseRef('<AB')).toThrow();
    expect(parseRefs(' AC  BD O ').flatMap(refPoints)).toEqual(['A', 'C', 'B', 'D', 'O']);
  });
});

describe('classifier', () => {
  const q = (...p: V[]) => classifyQuad(p).name;
  it('names quadrilaterals by the Georgian convention', () => {
    expect(q([0, 0], [2, 0], [2, 2], [0, 2])).toBe('კვადრატი');
    expect(q([0, 0], [3, 0], [3, 2], [0, 2])).toBe('მართკუთხედი');
    expect(q([0, 0], [5, 0], [8, 4], [3, 4])).toBe('რომბი');
    expect(q([0, 0], [4, 0], [5, 2], [1, 2])).toBe('პარალელოგრამი');
    expect(q([0, 0], [6, 0], [5, 2], [1, 2])).toBe('ტოლფერდა ტრაპეცია');
    expect(q([0, 0], [6, 0], [3, 2], [0, 2])).toBe('მართკუთხა ტრაპეცია');
    expect(q([0, 0], [6, 0], [4, 2], [1, 2])).toBe('ტრაპეცია');
    expect(q([0, 0], [4, 0], [1, 1], [0, 4])).toBe('ჩაზნექილი ოთხკუთხედი');
    expect(q([0, 0], [4, 0], [5, 3], [0, 2])).toBe('ოთხკუთხედი');
  });
  it('names triangles by sides and angles', () => {
    expect(classifyTriangle([[0, 0], [2, 0], [1, Math.sqrt(3)]]).name).toBe('ტოლგვერდა მახვილკუთხა სამკუთხედი');
    expect(classifyTriangle([[0, 0], [3, 0], [0, 4]]).name).toBe('სხვადასხვაგვერდა მართკუთხა სამკუთხედი');
    expect(classifyTriangle([[0, 0], [4, 0], [2, 1]]).name).toBe('ტოლფერდა ბლაგვკუთხა სამკუთხედი');
  });
});

for (const [name, spec] of figures) {
  describe(`figure: ${name}`, () => {
    const r = rng(42);
    const samples = Array.from({ length: 500 }, () => randomParams(spec, r));

    for (const [id, check] of Object.entries(spec.checks ?? {})) {
      it(`property "${id}" holds on 500 random figures`, () => {
        for (const p of samples) expect(check(spec.points(p), p), JSON.stringify(p)).toBe(true);
      });
    }

    it('every point stays inside the fixed board and is finite', () => {
      const [x0, y0, x1, y1] = boardBounds(spec);
      for (const p of samples) for (const [n, [x, y]] of Object.entries(spec.points(snap(spec, p)))) {
        if (spec.boundsOf && !spec.boundsOf.includes(n)) continue;
        expect(Number.isFinite(x) && Number.isFinite(y)).toBe(true);
        expect(x >= x0 - 1e-9 && x <= x1 + 1e-9 && y >= y0 - 1e-9 && y <= y1 + 1e-9).toBe(true);
      }
    });

    it('refs only mention points the figure defines', () => {
      const pts = Object.keys(spec.points(samples[0]!));
      const refs = [spec.base, spec.dims, ...Object.values(spec.toggles ?? {})].flatMap(s => parseRefs(s)).flatMap(refPoints);
      expect(refs.filter(n => !pts.includes(n))).toEqual([]);
    });

    for (const [point, owned] of Object.entries(spec.drag ?? {})) {
      it(`dragging ${point} lands it under the pointer`, () => {
        for (const p of samples.slice(0, 100)) {
          const goal = { ...p };
          for (const k of owned) goal[k] = randomParams(spec, r)[k]!;
          const target = spec.points(goal)[point]!;
          const got = spec.points(solveDrag(spec, p, point, target, { snap: false }))[point]!;
          expect(Math.hypot(got[0] - target[0], got[1] - target[1])).toBeLessThan(1e-6);
        }
      });
    }
  });
}
