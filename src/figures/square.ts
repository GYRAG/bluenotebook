import { angleAt, area, dist, lerp, mid, near, perpendicular, polar, add, sub, type V } from './engine/geom';
import { figure } from './engine/spec';

export default figure({
  kind: 'კვადრატი',
  label: 'კვადრატი ABCD',
  params: { a: { label: 'გვერდი', sym: 'a', min: 2, max: 5, step: 0.1, value: 4 } },
  points: ({ a }) => {
    const A: V = [-a / 2, -a / 2], B: V = [a / 2, -a / 2];
    const C: V = [a / 2, a / 2], D: V = [-a / 2, a / 2];
    return {
      A, B, C, D, O: [0, 0] as V, T: mid(A, B),
      // for problems: EFGH, the square cut out by lines through the vertices parallel to the diagonals;
      // A1B1C1D1, points one third along each side
      E: [0, -a] as V, F: [a, 0] as V, G: [0, a] as V, H: [-a, 0] as V,
      A1: lerp(A, B, 1 / 3), B1: lerp(B, C, 1 / 3), C1: lerp(C, D, 1 / 3), D1: lerp(D, A, 1 / 3),
      M: [0, -a / 2 + (a * Math.sqrt(3)) / 2] as V, // ABM equilateral, inside the square
    };
  },
  drag: { C: ['a'] },
  base: 'ABCD',
  boundsOf: ['A', 'B', 'C', 'D'],
  dims: '|AB|a',
  toggles: {
    'დიაგონალები': 'AC BD O',
    'წრეწირები': '(OA) (OT) O T',
    'აღნიშვნები': 'AB=BC=CD=DA',
  },
  classify: 'quad',
  readouts: ({ A, B, C, D }) => [['d', dist(A, C)], ['R', dist(A, C) / 2], ['r', dist(A, B) / 2], ['P', 4 * dist(A, B)], ['S', area([A, B, C, D])]],
  checks: {
    'diagonals': ({ A, B, C, D }) => near(dist(A, C), dist(B, D)) && perpendicular(A, C, B, D),
    'diagonal-angle': ({ A, B, C }) => near(angleAt(B, A, C), 45),
    'diagonal-length': ({ A, C }, { a }) => near(dist(A, C), a * Math.SQRT2),
    area: ({ A, B, C, D }, { a }) => near(area([A, B, C, D]), a * a) && near(a * a, dist(A, C) ** 2 / 2),
    circles: ({ A, B, T }, { a }) => near(dist([0, 0], A), (a * Math.SQRT2) / 2) && near(dist([0, 0], T), a / 2) && near(dist(A, B), a),
    'criterion-rectangle': (_, { a }) => { // equal diagonals bisecting each other at right angles
      const u = polar(a / 2, 20), v = polar(a / 2, 110), pts = [sub([0, 0], u), sub([0, 0], v), u, v];
      return pts.every((p, i) => near(dist(p, pts[(i + 1) % 4]!), dist(pts[0]!, pts[1]!)) && near(angleAt(pts[(i + 3) % 4]!, p, pts[(i + 1) % 4]!), 90));
    },
    'criterion-rhombus': (_, { a }) => { // a rhombus with a right angle
      const A: V = [0, 0], B: V = [a, 0], D = polar(a, 90), C = add(B, D);
      return near(dist(A, C), dist(B, D)) && near(angleAt(B, C, D), 90);
    },
  },
});
