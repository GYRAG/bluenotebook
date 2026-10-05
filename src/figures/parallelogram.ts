import { angleAt, area, dist, foot, intersect, mid, near, parallel, polar, rad, type V } from './engine/geom';
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
    return { A, B, C, D, O: [0, 0], H: foot(D, A, B) };
  },
  drag: { B: ['a'], D: ['b', 'alpha'] },
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
  },
});
