import { circleIntersection, dist, foot, near, perpendicular, type V } from './engine/geom';
import { figure } from './engine/spec';

// Segment AB on the x-axis, M its midpoint; the perpendicular bisector is the y-axis (N only gives
// the line its direction). P is a point of the bisector, X another point of line AB.
export default figure({
  kind: 'შუამართობი',
  label: 'მონაკვეთი AB და მისი შუამართობი',
  params: {
    c: { label: 'მონაკვეთი', sym: 'AB', min: 3, max: 7, step: 0.1, value: 5 },
    t: { label: 'P', sym: 'P', min: 0.8, max: 3.5, step: 0.1, value: 2.4, hidden: true },
    x: { label: 'X', sym: 'X', min: -3.5, max: 3.5, step: 0.1, value: -1.6, hidden: true },
  },
  points: ({ c, t, x }) => ({ A: [-c / 2, 0] as V, B: [c / 2, 0] as V, M: [0, 0] as V, N: [0, -1] as V, P: [0, t] as V, X: [x, 0] as V }),
  drag: { B: ['c'], P: ['t'], X: ['x'] },
  base: 'AB line:MN PA PB M P',
  unlabeled: ['N'],
  dims: '|PA| |PB|',
  toggles: { 'მართობი და დახრილი': 'PM PX X <PMB' },
  readouts: ({ P, A, B, M, X }) => [['PA', dist(P, A)], ['PB', dist(P, B)], ['PM', dist(P, M)], ['PX', dist(P, X)]],
  checks: {
    'perpendicular-shortest': ({ P, M, X }) => near(dist(P, X) ** 2, dist(P, M) ** 2 + dist(M, X) ** 2) && dist(P, X) >= dist(P, M),
    'perp-bisector': ({ P, A, B, M }) => near(dist(P, A), dist(P, B)) && perpendicular(P, M, A, B),
    'perp-bisector-converse': (_, { c, t }) => { // a point at equal distances from A and B lands on the y-axis
      const A: V = [-c / 2, 0], B: V = [c / 2, 0], Q = circleIntersection(A, c / 2 + t, B, c / 2 + t, [0, -1]);
      return near(Q[0], 0) && near(dist(Q, foot(Q, A, B)), Math.abs(Q[1]));
    },
  },
});
