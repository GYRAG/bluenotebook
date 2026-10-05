import { add, dist, foot, intersect, near, perp, polar, type V } from './engine/geom';
import { figure } from './engine/spec';

// A quadrilateral around a circle (centre I, radius r): its sides are the tangents at
// T1…T4 (placed by angle); each vertex is where two neighbouring tangents meet.
const tangent = (r: number, t: number): [V, V] => { const T = polar(r, t); return [T, add(T, perp(T))]; };
export default figure({
  kind: 'შემოხაზული ოთხკუთხედი',
  label: 'წრეწირზე შემოხაზული ოთხკუთხედი ABCD',
  params: {
    r: { label: 'რადიუსი', sym: 'r', min: 1.5, max: 2.2, step: 0.1, value: 1.8 },
    t1: { label: 'T1', sym: 'T1', min: 250, max: 290, step: 1, value: 270, unit: '°', hidden: true },
    t2: { label: 'T2', sym: 'T2', min: -30, max: 30, step: 1, value: 10, unit: '°', hidden: true },
    t3: { label: 'T3', sym: 'T3', min: 70, max: 110, step: 1, value: 95, unit: '°', hidden: true },
    t4: { label: 'T4', sym: 'T4', min: 160, max: 200, step: 1, value: 175, unit: '°', hidden: true },
  },
  points: ({ r, t1, t2, t3, t4 }) => {
    const [T1, u1] = tangent(r, t1), [T2, u2] = tangent(r, t2), [T3, u3] = tangent(r, t3), [T4, u4] = tangent(r, t4);
    return { A: intersect(T4, u4, T1, u1), B: intersect(T1, u1, T2, u2), C: intersect(T2, u2, T3, u3), D: intersect(T3, u3, T4, u4), I: [0, 0] as V, T1, T2, T3, T4 };
  },
  drag: { T1: ['t1'], T2: ['t2'], T3: ['t3'], T4: ['t4'] },
  base: 'ABCD (IT1) I',
  dims: '|AB| |BC| |CD| |DA|',
  classify: 'quad',
  checks: {
    pitot: ({ A, B, C, D }) => near(dist(A, B) + dist(C, D), dist(B, C) + dist(D, A)),
    'pitot-converse': ({ A, B, C, D }) => { // contrapositive: slide D along DA off the tangent position and the sums differ
      const D2: V = [D[0] + (A[0] - D[0]) * 0.15, D[1] + (A[1] - D[1]) * 0.15];
      return !near(dist(A, B) + dist(C, D2), dist(B, C) + dist(D2, A));
    },
    'tangent-segments': ({ A, B, C, D, T1, T2, T3, T4 }) =>
      near(dist(A, T1), dist(A, T4)) && near(dist(B, T1), dist(B, T2)) && near(dist(C, T2), dist(C, T3)) && near(dist(D, T3), dist(D, T4)),
    'center-on-bisectors': ({ A, B, C, D, I }) =>
      [[A, B], [B, C], [C, D], [D, A]].every(([p, q]) => near(dist(I, foot(I, p!, q!)), dist(I, foot(I, A, B)))),
  },
});
