import { add, angleAt, area, circleIntersection, dist, foot, intersect, mid, near, parallel, polar, rad, sub, unit, type V } from './engine/geom';
import { figure } from './engine/spec';

// The centre O stays fixed and the shape breathes around it, so the figure never drifts
// off the page while you change a, b or α.
export default figure({
  kind: 'პარალელოგრამი',
  label: 'პარალელოგრამი ABCD',
  params: {
    a: { label: 'გვერდი', sym: 'a', min: 2, max: 6, step: 0.1, value: 5 },
    b: { label: 'გვერდი', sym: 'b', min: 1.5, max: 4, step: 0.1, value: 3 },
    alpha: { label: 'კუთხე', sym: 'α', min: 40, max: 140, step: 1, value: 60, unit: '°' },
  },
  points: ({ a, b, alpha }) => {
    const d = polar(b, alpha), c: V = [(a + d[0]) / 2, d[1] / 2];
    const A: V = [-c[0], -c[1]], B: V = [a - c[0], -c[1]], D: V = [d[0] - c[0], d[1] - c[1]];
    const C: V = [B[0] + d[0], B[1] + d[1]];
    const H = foot(D, A, B);
    const bis = (P: V, Q: V, R: V) => add(P, add(unit(sub(Q, P)), unit(sub(R, P)))); // a second point on the bisector of ∠QPR
    return {
      A, B, C, D, O: [0, 0], H, K: add(H, sub(B, A)), // K: foot from C, for the area proof
      E: intersect(A, bis(A, B, D), B, C), // bisector of ∠A meets line BC
      F: intersect(A, bis(A, B, D), B, bis(B, A, C)), // bisectors of ∠A and ∠B meet
    };
  },
  drag: { B: ['a'], D: ['b', 'alpha'] },
  boundsOf: ['A', 'B', 'C', 'D'], // E and F are proof helpers; their proofs pick a shape where they fit
  base: 'ABCD',
  dims: '|AB|a |DA|b <A <B',
  toggles: {
    'დიაგონალები': 'AC BD O',
    'სიმაღლე': 'DH AH <DHB',
    'აღნიშვნები': 'AB=CD BC=DA <A=<C <B=<D',
  },
  classify: 'quad',
  readouts: ({ A, B, C, D, H }, { alpha }) => [
    ['β', 180 - alpha, '°'],
    ['hₐ', dist(D, H)],
    ['d₁', dist(A, C)],
    ['d₂', dist(B, D)],
    ['P', 2 * (dist(A, B) + dist(B, C))],
    ['S', area([A, B, C, D])],
  ],
  checks: {
    definition: ({ A, B, C, D }) => parallel(A, B, D, C) && parallel(A, D, B, C),
    'opposite-sides-equal': ({ A, B, C, D }) => near(dist(A, B), dist(C, D)) && near(dist(B, C), dist(D, A)),
    'opposite-angles-equal': ({ A, B, C, D }) => near(angleAt(D, A, B), angleAt(B, C, D)) && near(angleAt(A, B, C), angleAt(C, D, A)),
    'adjacent-angles-sum': ({ A, B, C, D }) => near(angleAt(D, A, B) + angleAt(A, B, C), 180),
    'diagonals-bisect': ({ A, B, C, D }) => {
      const O = intersect(A, C, B, D), m1 = mid(A, C), m2 = mid(B, D);
      return near(O[0], m1[0]) && near(O[1], m1[1]) && near(O[0], m2[0]) && near(O[1], m2[1]);
    },
    'diagonal-squares': ({ A, B, C, D }) => near(dist(A, C) ** 2 + dist(B, D) ** 2, 2 * (dist(A, B) ** 2 + dist(B, C) ** 2)),
    'area-base-height': ({ A, B, C, D, H }) => near(area([A, B, C, D]), dist(A, B) * dist(D, H)),
    'area-sine': ({ A, B, C, D }, { a, b, alpha }) => near(area([A, B, C, D]), a * b * Math.sin(rad(alpha))),
    'bisector-isosceles': ({ A, B, C, D, E }) =>
      near(angleAt(B, A, E), angleAt(E, A, D)) && near(dist(E, foot(E, B, C)), 0) && near(dist(B, E), dist(A, B)),
    'adjacent-bisectors': ({ A, B, F }) => near(angleAt(A, F, B), 90),
    'four-triangles': ({ A, B, C, D, O }) => {
      const s = [area([A, O, B]), area([B, O, C]), area([C, O, D]), area([D, O, A])];
      return s.every(x => near(x, area([A, B, C, D]) / 4));
    },
    'area-diagonals': ({ A, B, C, D, O }) => near(area([A, B, C, D]), 0.5 * dist(A, C) * dist(B, D) * Math.sin(rad(angleAt(A, O, B)))),
    // criteria: build a quadrilateral from the hypothesis only, then confirm it is a parallelogram
    'criterion-sides': (_, { a, b, alpha }) => {
      const A: V = [0, 0], B: V = [a, 0], C = add(B, polar(b, alpha));
      const D = circleIntersection(A, dist(B, C), C, dist(A, B), B); // AD = BC, CD = AB, D across AC from B
      return isParallelogram(A, B, C, D);
    },
    'criterion-equal-parallel': (_, { a, b, alpha }) => {
      const A: V = [0, 0], B: V = [a, 0], D = polar(b, alpha), C = add(D, sub(B, A)); // DC equal and parallel to AB
      return parallel(A, D, B, C);
    },
    'criterion-diagonals': (_, { a, b, alpha }) => {
      const u = polar(a / 2, 0), v = polar(b / 2, alpha); // halves of the diagonals around O = (0, 0)
      return isParallelogram([-u[0], -u[1]], [-v[0], -v[1]], u, v);
    },
    'criterion-angles': (_, { a, b, alpha }) => { // the proof's key step: a convex quadrilateral's angles sum to 360°
      const A: V = [0, 0], B: V = [a, 0], C = add(B, polar(b * 0.8, alpha * 0.9)), D = polar(b, alpha);
      return near(angleAt(D, A, B) + angleAt(A, B, C) + angleAt(B, C, D) + angleAt(C, D, A), 360);
    },
  },
});

const isParallelogram = (A: V, B: V, C: V, D: V) => parallel(A, B, D, C) && parallel(A, D, B, C);

