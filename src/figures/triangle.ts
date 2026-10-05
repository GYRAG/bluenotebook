import { add, angleAt, area, dist, near, scale, sub, triangleSAS, unit, type V } from './engine/geom';
import { figure } from './engine/spec';

const angles = (A: V, B: V, C: V) => [angleAt(B, A, C), angleAt(A, B, C), angleAt(A, C, B)] as const;

export default figure({
  kind: 'სამკუთხედი',
  label: 'სამკუთხედი ABC',
  params: {
    c: { label: 'გვერდი', sym: 'c', min: 3, max: 7, step: 0.1, value: 6 },
    b: { label: 'გვერდი', sym: 'b', min: 2, max: 6, step: 0.1, value: 4 },
    alpha: { label: 'კუთხე', sym: 'α', min: 25, max: 130, step: 1, value: 55, unit: '°' },
  },
  points: ({ c, b, alpha }) => {
    const { A, B, C } = triangleSAS(c, b, alpha), u = unit(sub(B, A));
    return {
      A, B, C,
      E: sub(C, scale(u, 2)), F: add(C, scale(u, 2)),        // line through C parallel to AB (angle sum)
      X: add(C, scale(unit(sub(C, A)), 1.6)),                 // on AC beyond C (exterior angle)
      D: add(C, scale(unit(sub(C, A)), dist(C, B))),          // on AC beyond C with CD = CB (triangle inequality)
      K: add(A, scale(u, b)),                                  // on AB with AK = AC (larger side ↔ larger angle)
    };
  },
  drag: { B: ['c'], C: ['b', 'alpha'] },
  base: 'ABC',
  boundsOf: ['A', 'B', 'C', 'E', 'F', 'X'], // D and K only appear in proofs that set a fitting triangle
  dims: '|AB|c |AC|b |BC|a <A <B <C',
  toggles: { 'გარე კუთხე': 'CX <BCX' },
  classify: 'triangle',
  readouts: ({ A, B, C }) => {
    const [x, y, z] = angles(A, B, C);
    return [['a', dist(B, C)], ['∑', x + y + z, '°'], ['P', dist(A, B) + dist(B, C) + dist(C, A)], ['S', area([A, B, C])]];
  },
  checks: {
    'angle-sum': ({ A, B, C }) => near(angles(A, B, C).reduce((s, x) => s + x, 0), 180),
    'angle-sum-proof': ({ A, B, C, E, F }) => near(angleAt(E, C, A), angleAt(C, A, B)) && near(angleAt(F, C, B), angleAt(C, B, A)),
    'exterior-angle': ({ A, B, C, X }) => near(angleAt(B, C, X), angleAt(C, A, B) + angleAt(A, B, C)),
    'larger-side-larger-angle': ({ A, B, C }) => {
      const s = [dist(B, C), dist(C, A), dist(A, B)], a = angles(A, B, C);
      return [0, 1, 2].every(i => [0, 1, 2].every(j => s[i]! <= s[j]! + 1e-9 || a[i]! > a[j]!));
    },
    'larger-angle-larger-side': ({ A, B, C }) => {
      const s = [dist(B, C), dist(C, A), dist(A, B)], a = angles(A, B, C);
      return [0, 1, 2].every(i => [0, 1, 2].every(j => a[i]! <= a[j]! + 1e-9 || s[i]! > s[j]!));
    },
    'triangle-inequality': ({ A, B, C, D }) => {
      const a = dist(B, C), b = dist(C, A), c = dist(A, B);
      return a < b + c && b < c + a && c < a + b && near(dist(A, D), b + a);
    },
    'at-most-one-obtuse': ({ A, B, C }) => angles(A, B, C).filter(x => x >= 90 - 1e-9).length <= 1,
  },
});
