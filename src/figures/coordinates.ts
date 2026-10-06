import { add, dist, lerp, mid, near, perp, perpendicular, scale, sub, unit, type V } from './engine/geom';
import { figure } from './engine/spec';

// A(x1; y1) and B(x2; y2) move on the half grid. C = (x2; y1) closes the right triangle for the
// distance formula; A0 M0 B0 are the feet on the x-axis (midpoint); D sets the perpendicular through A.
export default figure({
  kind: 'კოორდინატები',
  label: 'წერტილები A და B კოორდინატთა სისტემაში',
  params: {
    x1: { label: 'x₁', sym: 'x₁', min: -4.5, max: -0.5, step: 0.5, value: -3, hidden: true },
    y1: { label: 'y₁', sym: 'y₁', min: -2.5, max: 3, step: 0.5, value: -1.5, hidden: true },
    x2: { label: 'x₂', sym: 'x₂', min: 1, max: 4.5, step: 0.5, value: 3, hidden: true },
    y2: { label: 'y₂', sym: 'y₂', min: -2.5, max: 3, step: 0.5, value: 2, hidden: true },
  },
  points: ({ x1, y1, x2, y2 }) => {
    const A: V = [x1, y1], B: V = [x2, y2];
    return {
      O: [0, 0] as V, A, B, C: [x2, y1] as V, M: mid(A, B),
      A0: [x1, 0] as V, B0: [x2, 0] as V, M0: [(x1 + x2) / 2, 0] as V,
      D: add(A, scale(perp(unit(sub(B, A))), 2)),
    };
  },
  drag: { A: ['x1', 'y1'], B: ['x2', 'y2'] },
  base: 'AB A B O',
  axes: true,
  dims: '|AB|',
  toggles: {
    'მართკუთხა სამკუთხედი': 'AC BC C <ACB',
    'შუაწერტილი': 'M AA0 BB0 MM0 A0 B0 M0',
    'წრეწირი ცენტრით A': '(AB)',
    'წრფე AB და მისი მართობი': 'line:AB line:AD <BAD',
  },
  readouts: (_, { x1, y1, x2, y2 }) => [
    ['x₁', x1], ['y₁', y1], ['x₂', x2], ['y₂', y2], ['AB', Math.hypot(x2 - x1, y2 - y1)], ['k', (y2 - y1) / (x2 - x1)],
  ],
  checks: {
    'distance-formula': ({ A, B, C }, { x1, y1, x2, y2 }) =>
      near(dist(A, C), Math.abs(x2 - x1)) && near(dist(B, C), Math.abs(y2 - y1)) && near(dist(A, B) ** 2, dist(A, C) ** 2 + dist(B, C) ** 2),
    'midpoint-formula': ({ A, B, M, A0, B0, M0 }, { x1, y1, x2, y2 }) =>
      near(M[0], (x1 + x2) / 2) && near(M[1], (y1 + y2) / 2) && near(dist(A, M), dist(M, B)) && near(dist(A0, M0), dist(M0, B0)),
    'circle-equation': ({ A, B }) => {
      const R = dist(A, B), on = [0, 40, 135, 260].map(t => add(A, [R * Math.cos(t), R * Math.sin(t)] as V));
      const eq = (P: V) => (P[0] - A[0]) ** 2 + (P[1] - A[1]) ** 2;
      return on.every(P => near(eq(P), R * R)) && !near(eq(add(A, scale(sub(B, A), 1.2))), R * R);
    },
    'line-equation': ({ A, B }, { x1, y1, x2, y2 }) => {
      const k = (y2 - y1) / (x2 - x1), b = y1 - k * x1;
      return [0, 0.3, 0.7, 1, 1.6].every(t => { const P = lerp(A, B, t); return near(P[1], k * P[0] + b); })
        && near(Math.tan(Math.atan2(y2 - y1, x2 - x1)), k);
    },
    'perpendicular-slopes': ({ A, B, D }, { x1, y1, x2, y2 }) => {
      if (near(y1, y2)) return perpendicular(A, B, A, D); // horizontal: the perpendicular is vertical, no slope
      const k1 = (y2 - y1) / (x2 - x1), k2 = (D[1] - A[1]) / (D[0] - A[0]);
      return perpendicular(A, B, A, D) && near(k1 * k2, -1);
    },
  },
});
