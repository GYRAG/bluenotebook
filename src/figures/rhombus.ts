import { add, angleAt, area, circleIntersection, dist, foot, near, parallel, perpendicular, polar, rad, sub, type V } from './engine/geom';
import { figure } from './engine/spec';

export default figure({
  kind: 'რომბი',
  label: 'რომბი ABCD',
  params: {
    a: { label: 'გვერდი', sym: 'a', min: 2, max: 5, step: 0.1, value: 4 },
    alpha: { label: 'კუთხე', sym: 'α', min: 40, max: 140, step: 1, value: 60, unit: '°' },
  },
  points: ({ a, alpha }) => {
    const d = polar(a, alpha), c: V = [(a + d[0]) / 2, d[1] / 2];
    const A: V = [-c[0], -c[1]], B: V = [a - c[0], -c[1]], D: V = [d[0] - c[0], d[1] - c[1]], C = add(B, d);
    return { A, B, C, D, O: [0, 0], T: foot([0, 0], A, B), H: foot(D, A, B) };
  },
  drag: { B: ['a'], D: ['a', 'alpha'] },
  base: 'ABCD',
  dims: '|AB|a <A <B',
  toggles: {
    'დიაგონალები': 'AC BD O',
    'ჩახაზული წრე': '(OT) O T',
    'აღნიშვნები': 'AB=BC=CD=DA <A=<C <B=<D',
  },
  classify: 'quad',
  readouts: ({ A, B, C, D, H }) => [['d₁', dist(A, C)], ['d₂', dist(B, D)], ['h', dist(D, H)], ['r', dist(D, H) / 2], ['P', 4 * dist(A, B)], ['S', area([A, B, C, D])]],
  checks: {
    'diagonals-perpendicular': ({ A, B, C, D }) => perpendicular(A, C, B, D),
    'diagonals-bisect-angles': ({ A, B, C, D }) => near(angleAt(B, A, C), angleAt(C, A, D)) && near(angleAt(A, B, D), angleAt(D, B, C)),
    'area-diagonals': ({ A, B, C, D }) => near(area([A, B, C, D]), (dist(A, C) * dist(B, D)) / 2),
    'side-from-diagonals': ({ A, B, C, D }) => near(dist(A, B) ** 2, (dist(A, C) / 2) ** 2 + (dist(B, D) / 2) ** 2),
    'area-sine': ({ A, B, C, D }, { a, alpha }) => near(area([A, B, C, D]), a * a * Math.sin(rad(alpha))),
    incircle: ({ A, B, C, D, H }) => {
      const O: V = [0, 0], r = dist(D, H) / 2;
      return [[A, B], [B, C], [C, D], [D, A]].every(([p, q]) => near(dist(O, foot(O, p!, q!)), r));
    },
    'criterion-perpendicular-diagonals': (_, { a, alpha }) => { // diagonals bisect each other and are perpendicular
      const u = polar(a / 2, alpha), v = polar(a / 3 + 0.5, alpha + 90), pts = [sub([0, 0], u), sub([0, 0], v), u, v];
      return pts.every((p, i) => near(dist(p, pts[(i + 1) % 4]!), dist(pts[0]!, pts[1]!)));
    },
    'criterion-diagonal-bisects-angle': ({ A, B, C }) => near(angleAt(B, A, C), angleAt(B, C, A)) && near(dist(A, B), dist(B, C)),
    'criterion-four-sides': (_, { a, alpha }) => { // four equal sides, built from circles only
      const A: V = [0, 0], B: V = [a, 0], D = polar(a, alpha), C = circleIntersection(B, a, D, a, A);
      return parallel(A, B, D, C) && parallel(A, D, B, C);
    },
  },
});
